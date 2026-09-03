#!/usr/bin/env python3
"""export_books.py — build src/data/books.json from the writing vault's registry.

The vault at PUBLISHING_REGISTRY.md is the source of truth for a book's hard
identifiers: title, series position, status, ASINs and Amazon URLs. Those are
what this script exports. It deliberately does NOT export display copy —
page counts, publication dates, reading ages, taglines and body text live in
the site repo, because the vault's figures are pre-publish estimates that have
been checked against Amazon and found wrong in places. See the phase 01 notes.

The split, in one line: this file owns identifiers, the site owns copy, and
nothing here can ever overwrite a word you wrote.

Output is deterministic — no timestamps — so `--check` is meaningful in CI and
re-running on unchanged input rewrites nothing.

Usage:
    python3 scripts/export_books.py                 # write src/data/books.json
    python3 scripts/export_books.py --check         # exit 1 if out of date
    python3 scripts/export_books.py --report        # what's live but not built
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
DEFAULT_VAULT = Path("/home/riley/writing")
OUT = SITE / "src" / "data" / "books.json"

# Site slugs are URLs and must never move — a derived slug that disagrees with
# a page already published would silently change its address and bin its
# ranking. Anything whose slugified title differs from its live URL is pinned
# here; everything else derives.
SLUG_OVERRIDES = {
    "The Weaving of Eternal Tapestry": "weaving-eternal-tapestry",
}

# Sections of the registry that aren't series tables of books.
NON_SERIES_SECTIONS = {"Print (paperback) editions", "Audiobook editions"}

ROW = re.compile(r"^\|(?!\s*(?:Book|-))(.+)\|\s*$", re.M)


def slugify(text: str) -> str:
    text = text.lower().replace("&", "and")
    text = re.sub(r"[''’]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def cells(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def unwrap(cell: str) -> str | None:
    """Registry cells carry `code`, [links](path) and em-dash for 'none'."""
    cell = cell.strip()
    if cell in {"—", "-", ""}:
        return None
    m = re.match(r"\[.*?\]\((.+?)\)", cell)
    if m:
        return m.group(1)
    return cell.strip("`").strip()


def parse_registry(text: str) -> tuple[list[dict], dict[str, dict], dict[str, dict]]:
    """Return (book rows, paperback rows by title, audiobook rows by title)."""
    books: list[dict] = []
    paperbacks: dict[str, dict] = {}
    audiobooks: dict[str, dict] = {}
    section = None

    for line in text.splitlines():
        heading = re.match(r"^##\s+(.+?)\s*$", line)
        if heading:
            section = heading.group(1)
            continue
        if not line.startswith("|") or section is None:
            continue
        c = cells(line)
        if not c or c[0] in {"Book", ""} or set(c[0]) <= {"-", ":"}:
            continue

        if section == "Print (paperback) editions":
            if len(c) >= 3:
                paperbacks[c[0]] = {"asin": unwrap(c[1]), "url": unwrap(c[2])}
            continue

        if section == "Audiobook editions":
            # Book | Audible ASIN | Audible URL | Narrator
            if len(c) >= 4:
                audiobooks[c[0]] = {"asin": unwrap(c[1]), "url": unwrap(c[2]),
                                    "narrator": unwrap(c[3])}
            continue

        if len(c) < 6:
            continue
        listing = unwrap(c[5])
        # "(missing)" trails the path when no LISTING_DATA.md exists yet
        vault_dir = None
        if listing:
            listing = listing.split()[0]
            vault_dir = listing.rsplit("/marketing/", 1)[0] if "/marketing/" in listing else None
        books.append({
            "title": c[0],
            "series": section if section != "Standalone" else None,
            "live": c[1].strip() == "LIVE",
            "words": int(c[2].replace(",", "")) if c[2].replace(",", "").isdigit() else None,
            "asin": unwrap(c[3]),
            "url": unwrap(c[4]),
            "vault_dir": vault_dir,
        })
    return books, paperbacks, audiobooks


def position(vault_dir: str | None) -> int | None:
    if not vault_dir:
        return None
    m = re.search(r"/book-(\d+)-", vault_dir)
    return int(m.group(1)) if m else None


def cover_source(vault: Path, vault_dir: str | None) -> str | None:
    """Covers live under cover/ or cover-gen/ depending on the book's vintage."""
    if not vault_dir:
        return None
    for sub in ("cover", "cover-gen"):
        p = Path(vault_dir) / sub / "front_cover_ebook.jpg"
        if (vault / p).is_file():
            return str(p)
    return None


def build(vault: Path) -> dict:
    registry = vault / "PUBLISHING_REGISTRY.md"
    if not registry.is_file():
        sys.exit(f"error: no registry at {registry}")
    rows, paperbacks, audiobooks = parse_registry(registry.read_text(encoding="utf-8"))

    books = []
    for r in rows:
        slug = SLUG_OVERRIDES.get(r["title"]) or slugify(r["title"])
        series = None
        if r["series"]:
            series = {
                "name": r["series"],
                "slug": slugify(r["series"]),
                "position": position(r["vault_dir"]),
            }
        path = (f"/books/{series['slug']}/{slug}.html" if series
                else f"/books/{slug}.html")

        editions = {}
        if r["asin"]:
            editions["kindle"] = {"asin": r["asin"], "url": r["url"]}
        pb = paperbacks.get(r["title"])
        if pb and pb.get("asin"):
            editions["paperback"] = pb
        ab = audiobooks.get(r["title"])
        if ab and ab.get("asin"):
            editions["audiobook"] = ab

        books.append({
            "slug": slug,
            "title": r["title"],
            "status": "live" if r["live"] else "unpublished",
            "series": series,
            "words": r["words"],
            "editions": editions,
            "path": path,
            "image": f"/images/books/{slug}.jpg",
            "coverSource": cover_source(vault, r["vault_dir"]),
            "vaultDir": r["vault_dir"],
        })

    books.sort(key=lambda b: (b["series"]["slug"] if b["series"] else "",
                              b["series"]["position"] or 0 if b["series"] else 0,
                              b["slug"]))

    series_index = {}
    for b in books:
        if b["series"]:
            s = series_index.setdefault(b["series"]["slug"], {
                "slug": b["series"]["slug"], "name": b["series"]["name"],
                "books": 0, "live": 0,
            })
            s["books"] += 1
            s["live"] += b["status"] == "live"

    return {
        "source": "PUBLISHING_REGISTRY.md",
        "note": "Generated by scripts/export_books.py — do not hand-edit. "
                "Identifiers only; page counts, dates and copy live in the site repo.",
        "series": sorted(series_index.values(), key=lambda s: s["slug"]),
        "books": books,
    }


def render(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def report(data: dict) -> int:
    live = [b for b in data["books"] if b["status"] == "live"]
    print(f"{len(data['books'])} books tracked · {len(live)} live · "
          f"{len(data['series'])} series")
    problems = 0
    for b in live:
        missing = []
        if not (SITE / b["path"].lstrip("/")).is_file():
            missing.append("page")
        if not (SITE / b["image"].lstrip("/")).is_file():
            missing.append("cover")
        if not b["coverSource"]:
            missing.append("cover source in vault")
        if "paperback" not in b["editions"]:
            pass  # Kindle-only is legitimate, not a problem
        if missing:
            problems += 1
            print(f"  LIVE but missing {' + '.join(missing)}: {b['title']} -> {b['path']}")
    if not problems:
        print("  every live book has a page and a cover ✅")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--vault", type=Path, default=DEFAULT_VAULT)
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if the output file is missing or out of date")
    ap.add_argument("--report", action="store_true",
                    help="list live books that have no page or cover on the site")
    args = ap.parse_args()

    data = build(args.vault)
    text = render(data)

    if args.check:
        if not args.out.is_file():
            print(f"{args.out} does not exist — run scripts/export_books.py")
            return 1
        if args.out.read_text(encoding="utf-8") != text:
            print(f"{args.out} is out of date — run scripts/export_books.py")
            return 1
        print(f"{args.out} is up to date")
        if args.report:
            report(data)
        return 0

    if args.report:
        return 0 if report(data) == 0 else 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text, encoding="utf-8")
    live = sum(b["status"] == "live" for b in data["books"])
    print(f"wrote {args.out.relative_to(SITE)} — {len(data['books'])} books, {live} live")
    return 0


if __name__ == "__main__":
    sys.exit(main())
