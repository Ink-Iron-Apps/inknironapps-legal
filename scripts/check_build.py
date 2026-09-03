#!/usr/bin/env python3
"""check_build.py — assert the build produced a file for every page.

The deploy workflow used to assert a literal page count (`-eq 18`). That
catches a dropped page, but it fails the deploy the first time a page is
legitimately added, which turns "publish a new book" into a two-step change
and trains you to edit the guard rather than trust it.

This derives the expectation from the source instead: every .astro under
src/pages must have produced its .html in dist, plus the routes that emit
something other than HTML. Adding a page raises the bar automatically;
dropping one still fails.

Usage:
    python3 scripts/check_build.py           # after `astro build`
    python3 scripts/check_build.py --dist X  # non-default output dir
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "pages"

# Routes that deliberately emit something other than <name>.html.
NON_HTML_ROUTES = {"sitemap.xml.ts": "sitemap.xml"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", type=Path, default=ROOT / "dist")
    args = ap.parse_args()
    dist: Path = args.dist

    if not dist.is_dir():
        print(f"error: no build output at {dist}")
        return 1

    expected: list[Path] = []
    for src in sorted(PAGES.rglob("*")):
        if not src.is_file():
            continue
        rel = src.relative_to(PAGES)
        if src.suffix == ".astro":
            expected.append(dist / rel.with_suffix(".html"))
        elif rel.name in NON_HTML_ROUTES:
            expected.append(dist / rel.parent / NON_HTML_ROUTES[rel.name])
        else:
            print(f"warning: {rel} is not a recognised route — not checked")

    missing = [p for p in expected if not p.is_file()]
    empty = [p for p in expected if p.is_file() and p.stat().st_size == 0]

    for p in missing:
        print(f"  MISSING: {p.relative_to(dist)}")
    for p in empty:
        print(f"  EMPTY:   {p.relative_to(dist)}")

    built_html = len(list(dist.rglob("*.html")))
    print(f"{len(expected)} routes expected · {built_html} html files in {dist.name}")

    if missing or empty:
        print("build is incomplete — not deploying")
        return 1

    # A route producing more files than expected is fine (a dynamic route would),
    # but fewer .html than .astro means something did not render.
    astro_count = sum(1 for p in PAGES.rglob("*.astro"))
    if built_html < astro_count:
        print(f"only {built_html} html files for {astro_count} page sources")
        return 1

    print("every page source produced output ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
