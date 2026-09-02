#!/usr/bin/env python3
"""convert_page.py — turn a hand-written page into an Astro page.

Mechanical transcription, not interpretation: head values are read out of the
existing tags, the body is everything between </nav> and <footer>, and both go
into Base.astro unchanged. Hand-copying five pages would be fine; hand-copying
the eleven that phases 04 and 05 add would not, and every manual copy is a
chance to drop a tag the parity check then has to catch.

Head values are unescaped on the way out. Head.astro takes plain text and
escapes on output, so passing `Ink &amp; Iron Apps` would double-encode.

Usage:
    python3 scripts/convert_page.py terms.html
    python3 scripts/convert_page.py about/index.html --out src/pages/about/index.astro
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
SITE = "https://inknironapps.com"
STANDARD_PRECONNECT = {"https://fonts.googleapis.com", "https://fonts.gstatic.com"}


def meta(doc: str, attr: str, name: str) -> str | None:
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="(.*?)">', doc)
    return html.unescape(m.group(1)) if m else None


def extract(path: Path) -> tuple[dict, str]:
    doc = path.read_text(encoding="utf-8")

    title = re.search(r"<title>(.*?)</title>", doc, re.S)
    canonical = re.search(r'<link rel="canonical" href="(.*?)">', doc)
    if not title or not canonical:
        sys.exit(f"{path}: missing <title> or canonical")

    image = meta(doc, "property", "og:image") or ""
    props: dict = {
        "title": html.unescape(title.group(1)).strip(),
        "description": meta(doc, "name", "description"),
        "keywords": meta(doc, "name", "keywords"),
        "path": canonical.group(1).replace(SITE, "") or "/",
        "ogType": meta(doc, "property", "og:type"),
        "ogSiteName": meta(doc, "property", "og:site_name"),
        "ogTitle": meta(doc, "property", "og:title"),
        "ogDescription": meta(doc, "property", "og:description"),
        "image": image.replace(SITE, ""),
    }
    # Social cards are trimmed shorter than the OG text on several pages, so
    # only carry these when they actually differ.
    tw_title = meta(doc, "name", "twitter:title")
    tw_desc = meta(doc, "name", "twitter:description")
    if tw_title and tw_title != props["ogTitle"]:
        props["twitterTitle"] = tw_title
    if tw_desc and tw_desc != props["ogDescription"]:
        props["twitterDescription"] = tw_desc
    alt = meta(doc, "property", "og:image:alt")
    tw_alt = meta(doc, "name", "twitter:image:alt")
    if alt:
        props["imageAlt"] = alt
    if tw_alt and tw_alt != alt:
        props["twitterImageAlt"] = tw_alt

    for part in ("first_name", "last_name"):
        v = meta(doc, "property", f"profile:{part}")
        if v:
            key = "profileFirstName" if part == "first_name" else "profileLastName"
            props[key] = v
    w = meta(doc, "property", "og:image:width")
    h = meta(doc, "property", "og:image:height")
    if w and h:
        props["imageWidth"], props["imageHeight"] = int(w), int(h)

    extra = [u for u in re.findall(r'<link rel="preconnect" href="(.*?)"', doc)
             if u not in STANDARD_PRECONNECT]
    if extra:
        props["preconnect"] = extra

    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S)
    props["jsonld"] = [json.loads(b) for b in blocks]

    body = re.search(r"</nav>(.*?)<footer", doc, re.S)
    if not body:
        sys.exit(f"{path}: no </nav> ... <footer> boundary")

    # Astro bundles bare <script> tags into modules; is:inline keeps them
    # emitted verbatim, which is what parity requires.
    inner = re.sub(r"<script(?![^>]*(?:ld\+json|is:inline))([^>]*)>",
                   r"<script is:inline\1>", body.group(1))
    return props, inner.strip("\n")


def render(props: dict, body: str, depth: int) -> str:
    up = "../" * depth
    lines = [f'const head = {json.dumps(props, indent=2, ensure_ascii=False)};']
    return (
        "---\n"
        "// Transcribed from the hand-written page by scripts/convert_page.py.\n"
        "// Body is verbatim; head values come from the original tags.\n"
        f'import Base from "{up}layouts/Base.astro";\n'
        + "\n".join(lines) + "\n"
        "---\n"
        "<Base {...head}>\n"
        f"{body}\n"
        "</Base>\n"
    )


def target_for(src: Path) -> Path:
    rel = src.with_suffix(".astro")
    return SITE_ROOT / "src" / "pages" / rel


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pages", type=Path, nargs="+")
    ap.add_argument("--out", type=Path, help="explicit output path (single page only)")
    args = ap.parse_args()
    if args.out and len(args.pages) > 1:
        ap.error("--out takes a single page")

    for src in args.pages:
        props, body = extract(SITE_ROOT / src)
        out = args.out or target_for(src)
        depth = len(out.relative_to(SITE_ROOT / "src" / "pages").parts) - 1 + 1
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(props, body, depth), encoding="utf-8")
        print(f"  {src} -> {out.relative_to(SITE_ROOT)} "
              f"({len(body)}b body, {len(props['jsonld'])} JSON-LD)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
