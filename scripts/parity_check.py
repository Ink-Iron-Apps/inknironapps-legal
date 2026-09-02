#!/usr/bin/env python3
"""parity_check.py — compare a built Astro page against the hand-written one.

Byte comparison does not work and never will: Astro re-encodes entities
(`&amp;` becomes `&#38;`) and collapses whitespace between head tags. Both
forms parse to the same thing, so the only meaningful question is whether the
two documents *mean* the same — same head tags with the same resolved values
in the same order, same title, same JSON-LD, same visible text.

That is what this compares. Phase 06 cuts over on this returning clean.

Usage:
    python3 scripts/parity_check.py terms.html dist/terms.html
    python3 scripts/parity_check.py --all dist/      # every page with a pair
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent

# Attributes whose ordering within a tag is irrelevant, and tags we compare by
# resolved value rather than raw source.
IGNORED_WHITESPACE = re.compile(r"\s+")


class Doc(HTMLParser):
    """Collect the parts of a page that carry meaning."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.head: list[tuple[str, tuple]] = []
        self.title = ""
        self.jsonld: list[str] = []
        self.text: list[str] = []
        self._in = {"head": False, "title": False, "ld": False, "body": False}

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self._in["head"] = True
        elif tag == "body":
            self._in["body"] = True
        elif tag == "title":
            self._in["title"] = True
        elif tag == "script" and dict(attrs).get("type") == "application/ld+json":
            self._in["ld"] = True
            return
        if self._in["head"] and tag in {"meta", "link"}:
            self.head.append((tag, tuple(sorted((k, v or "") for k, v in attrs))))

    def handle_endtag(self, tag):
        if tag in self._in:
            self._in[tag] = False
        if tag == "title":
            self._in["title"] = False
        if tag == "script":
            self._in["ld"] = False

    def handle_data(self, data):
        if self._in["title"]:
            self.title += data
        elif self._in["ld"]:
            self.jsonld.append(data)
        elif self._in["body"]:
            t = IGNORED_WHITESPACE.sub(" ", data).strip()
            if t:
                self.text.append(t)


def parse(path: Path) -> Doc:
    d = Doc()
    d.feed(path.read_text(encoding="utf-8"))
    d.title = IGNORED_WHITESPACE.sub(" ", d.title).strip()
    return d


def compare(live: Path, built: Path) -> list[str]:
    a, b = parse(live), parse(built)
    problems: list[str] = []

    if a.title != b.title:
        problems.append(f"title: {a.title!r} -> {b.title!r}")

    if a.head != b.head:
        sa, sb = set(a.head), set(b.head)
        for tag, attrs in a.head:
            if (tag, attrs) not in sb:
                problems.append(f"head tag missing/changed: <{tag} {dict(attrs)}>")
        for tag, attrs in b.head:
            if (tag, attrs) not in sa:
                problems.append(f"head tag added: <{tag} {dict(attrs)}>")
        if not problems and a.head != b.head:
            problems.append("head tags identical but in a different order")

    ja = [json.loads(x) for x in a.jsonld]
    jb = [json.loads(x) for x in b.jsonld]
    if ja != jb:
        if len(ja) != len(jb):
            problems.append(f"JSON-LD blocks: {len(ja)} -> {len(jb)}")
        else:
            for i, (x, y) in enumerate(zip(ja, jb)):
                if x != y:
                    problems.append(f"JSON-LD block {i} differs "
                                    f"({x.get('@type')} vs {y.get('@type')})")

    if a.text != b.text:
        only_live = [t for t in a.text if t not in b.text]
        only_built = [t for t in b.text if t not in a.text]
        for t in only_live[:5]:
            problems.append(f"text only on live page: {t[:70]!r}")
        for t in only_built[:5]:
            problems.append(f"text only on built page: {t[:70]!r}")
        if not only_live and not only_built:
            problems.append("same text, different order")

    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("live", type=Path, nargs="?")
    ap.add_argument("built", type=Path, nargs="?")
    ap.add_argument("--all", type=Path, metavar="DIST",
                    help="compare every built page against its live counterpart")
    args = ap.parse_args()

    pairs: list[tuple[Path, Path]] = []
    if args.all:
        for built in sorted(args.all.rglob("*.html")):
            live = SITE / built.relative_to(args.all)
            if live.is_file():
                pairs.append((live, built))
        if not pairs:
            print("no built page has a live counterpart yet")
            return 0
    elif args.live and args.built:
        pairs.append((args.live, args.built))
    else:
        ap.error("give a live and built path, or --all DIST")

    failed = 0
    for live, built in pairs:
        problems = compare(live, built)
        rel = live.relative_to(SITE) if live.is_relative_to(SITE) else live
        if problems:
            failed += 1
            print(f"✗ {rel}")
            for p in problems:
                print(f"    {p}")
        else:
            print(f"✓ {rel}")
    print(f"\n{len(pairs) - failed}/{len(pairs)} pages at parity")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
