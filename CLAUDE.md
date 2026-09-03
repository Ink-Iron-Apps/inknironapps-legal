# inknironapps-legal

Astro site → `inknironapps.com` (GH Pages via Actions, repo name retains "legal"
for history). Pages source is `src/pages/*.astro`; static assets live in
`public/`. There are no hand-written `.html` files any more — the migration
completed 2026-09-02.

Two brands, one site:
- **Riley E. Antrobus** — author identity (books, author email, Facebook)
- **Ink & Iron Apps** — software brand (apps, workshop email `info@inknironapps.com`)

## Page tree

```
/                                                          → home (hero, books, apps, about)
/books/                                                    → all-books index
/books/warborn-protocols/                                  → series landing
/books/warborn-protocols/fleet-school-dropout.html         → book detail
/books/warborn-protocols/network-recruit.html              → book detail (bk2)
/books/echoes-of-yggdrasil/                                → series landing
/books/echoes-of-yggdrasil/the-nine-bridges.html           → book detail (bk1)
/books/the-recursion-engine.html                           → standalone book detail
/books/weaving-eternal-tapestry.html                       → standalone book detail
/apps/                                                     → all-apps index
/apps/libraryiq.html                                       → app detail
/apps/matcalc.html                                         → app detail
/apps/simmer.html                                          → app detail
/about/                                                    → about the author (Riley E. Antrobus)
/about/ink-iron-apps.html                                  → about the maker (Ink & Iron Apps)
/privacy-policy.html                                       → legal (used by app store listings)
/terms.html                                                → legal (used by app store listings)
/sitemap.xml · /robots.txt                                 → SEO
```

## Book source of truth (publishing registry)

`/home/riley/writing/PUBLISHING_REGISTRY.md` = canonical index of every published book. User updates it on each KDP publish → always current. **Drive all new book pages from it.**

Per row: title · status (`LIVE` = has ASIN, build page; `—` = skip, not published) · ASIN · clean Amazon URL (`https://www.amazon.com/dp/<ASIN>`) · path to `<book>/marketing/LISTING_DATA.md`.

`LISTING_DATA.md` (in the writing vault) holds the canonical body copy: blurb (§2), tagline, page count, audience/reading age, series position. Pull page text from there — NOT from Amazon HTML.

Covers: `<book>/cover/front_cover_ebook.jpg` (series) or `<book>/cover-gen/front_cover_ebook.jpg` (standalone), 1600×2560. Resize → 1024×1536-capped, q82, strip; drop in `/images/books/<slug>.jpg`.

Workflow when user says "registry updated, add new books":
1. Diff registry `LIVE` rows vs pages already in `/books/`.
2. For each new LIVE book: copy+resize cover, build detail page (+ series landing if new series), wire related-cards, add to `/books/` index (cards + both JSON-LD blocks + count), add to home `#books` cards + keywords, register in `sitemap.xml` + this page tree, bump `lastmod`.
3. Editions: registry main tables = Kindle ASIN. If the book has a row in the registry's **Print (paperback) editions** section, also wire a Paperback button (`btn btn-s` on detail, plain `edition-btn` on cards) + a `Paperback` `workExample` in the Book JSON-LD (`workExample` becomes an array). No print row → Kindle only.

URL patterns:
- Books: `/books/<series-slug>/<book-slug>.html` for series, `/books/<book-slug>.html` for standalone. Don't shorten slugs → SEO match titles. New book in existing series → drop in series folder. New series → new folder under `/books/`.
- Apps: `/apps/<app-slug>.html` flat. No series concept. Icons live `/images/apps/<app-slug>.png` (square 512+ source).

App copy must match the official listing exactly (taglines, feature lists, pricing). Pull from each app repo's `store-assets/store-listing.txt` or equivalent; for web apps, from the repo's `README.md`, in-app copy (`HowItWorks`), and the real tier table in code. Don't paraphrase — Safe Browsing classifiers flag mismatched promises.

Apps in alpha → mark "Closed alpha" in meta + body. CTAs = the contact form (`/contact.html?topic=alpha-<app>`). NO fake Play Store links until app actually published.

### LibraryIQ is a web app, not an Android app

LibraryIQ ships as a SaaS PWA at **`https://libraryiq.inknironapps.com`** (repo `/home/riley/coding/libraryiqv3` — Vite + React PWA on a Cloudflare Worker + D1). The Android alpha is **retired**; nothing on this site should describe LibraryIQ as an Android app or an alpha.

- `/apps/libraryiq.html` JSON-LD is `WebApplication` (`operatingSystem: "Any"`, `browserRequirements`, `installUrl`), not `SoftwareApplication`/Android. `url` points at the SaaS; `sameAs` points back at this page.
- Card + detail CTA = `Open LibraryIQ →` linking `https://libraryiq.inknironapps.com` (`edition-btn primary` on cards, `btn btn-p` on detail).
- Status badges read `Live · Web app`.
- Pricing is sourced from `worker/src/billing.ts` (`TIERS`) and `FREE_AI_CALLS_PER_MONTH` in `worker/src/index.ts` — app free, only AI requests metered. Re-check both when the tier table changes; the `offers` array in the page JSON-LD mirrors them.
- Contact-form topic is `libraryiq` ("LibraryIQ support"). The old `alpha-libraryiq` key is kept as a legacy alias in `worker/contact-worker.js` only — **redeploy that worker** after changing its topic maps (`wrangler deploy -c worker/wrangler.toml` — always with the config; a config-less deploy overrides the remote settings); GH Pages does not deploy it.

### Book data export (Astro migration, phase 01)

`scripts/export_books.py` builds `src/data/books.json` from the writing vault's
`PUBLISHING_REGISTRY.md`. Run it after the registry changes:

```
python3 scripts/export_books.py            # regenerate
python3 scripts/export_books.py --report   # live books with no page or cover
python3 scripts/export_books.py --check    # exit 1 if stale (for CI)
```

**It exports identifiers only** — title, series position, status, ASINs, Amazon
URLs, cover source. Page counts, publication dates, reading ages, taglines and
body copy stay hand-authored in this repo, because the vault's figures are
pre-publish estimates and were found wrong against Amazon on three of five
books. Amazon is definitive for page counts and dates. The exporter can never
overwrite copy.

Output is deterministic (no timestamps), so `--check` is meaningful and
re-running on unchanged input rewrites nothing. `books.json` is committed —
Cloudflare's build container can't see the vault.

Site slugs are URLs and must not move. Where a slugified title disagrees with
the live URL it is pinned in `SLUG_OVERRIDES` (currently just *The Weaving of
Eternal Tapestry* → `weaving-eternal-tapestry`). Add an override rather than
letting a derived slug change a published address.

Covers live at `<book>/cover/front_cover_ebook.jpg` for both series and
standalone books; `cover-gen/` is legacy and still probed as a fallback.

### Astro shell (phase 02)

`astro.config.mjs` + `src/layouts/Base.astro` + `src/components/{Head,Nav,Footer}.astro`.
The live hand-written `.html` pages are untouched and still what GitHub Pages
serves — Astro coexists until the phase 06 cutover.

```
npm run build     # astro build -> dist/
npm run check     # exporter --check + build
```

**`build.format: "preserve"` is load-bearing, and neither obvious option works.**
The site uses a mixed convention: detail pages publish as `<slug>.html`, index
pages as directory URLs (`/about/`, `/books/`, `/apps/`, `/books/<series>/`).
`"directory"` moves every detail page; `"file"` flattens `about/index.astro` to
`/about.html` and moves every index page. Only `"preserve"` keeps both. Verified:
all five phase 03 pages build to the exact paths their live files occupy.

No adapter — output is static, which Pages serves directly. Add
`@astrojs/cloudflare` only when server routes actually arrive.

**Byte-parity with the hand-written HTML is impossible.** Astro re-encodes
entities (`&amp;` → `&#38;`) and collapses whitespace between head tags. Both
parse identically, so compare *meaning*, not bytes:

```
python3 scripts/parity_check.py terms.html dist/terms.html
python3 scripts/parity_check.py --all dist/
```

It compares resolved head tags in order, title, JSON-LD as parsed objects, and
visible text. Phase 06 cuts over when `--all` is clean. Verified at phase 02:
a shell-rendered page matched `terms.html` on all 30 head tags and the title.

Pass plain text to `Head.astro` (`Ink & Iron Apps`, not `Ink &amp; Iron Apps`) —
Astro escapes on output, so pre-escaped input double-encodes.

### Converting a page (phases 03-05)

```
python3 scripts/convert_page.py terms.html about/index.html
npx astro build && python3 scripts/parity_check.py --all dist/
```

`convert_page.py` reads head values out of the existing tags, takes the body
verbatim from between `</nav>` and `<footer>`, and writes `src/pages/<path>.astro`.
Re-running is safe and idempotent — reconvert rather than hand-editing a
generated page, or the next conversion silently drops the edit.

Two things it handles that hand-copying would miss:
- Bare `<script>` gets `is:inline`, or Astro bundles it into a module and the
  markup stops matching.
- `twitter:title` / `twitter:description` are trimmed shorter than the OG text
  on five pages (both about pages, matcalc, simmer, the Yggdrasil series
  landing). They only emit when they actually differ.

- `og:image:alt` / `twitter:image:alt` appear only on the three app detail
  pages, and the Twitter alt is written shorter on matcalc and simmer.

- `book:author` / `book:release_date` on book detail pages.

`parity_check.py` compares head tags (resolved, in order), title, JSON-LD as
parsed objects, visible text, and body link hrefs. It does **not** compare body
markup structure or non-href attributes — a class or heading-level change would
pass. Read a converted page once before trusting it.

Phases 03-05 complete. 13/18 at parity; the 5 book detail pages differ only by
deliberate, recorded changes (see below).

### Book detail pages are data-driven (phase 05)

`src/layouts/BookDetail.astro` + a thin per-book page holding only copy. The
layout derives cover, buy buttons, series row, breadcrumbs, page title,
`alternateName` and the whole Book JSON-LD from `books.json`. Adding a book is a
registry row plus one copy file — not eight edits across five files.

Listing pages too: `BookCard.astro` renders the card used on `/books/`, the
series landings and the home page; `/books/`'s `ItemList` JSON-LD —
`numberOfItems` included — and both series landings' `BookSeries` / `hasPart`
generate from the data.

`SERIES` in `copy.ts` carries each series' genre list and its `announced`
books. The registry only knows LIVE vs not and tracks 57 titles, so which
forthcoming books get a card is a site decision, not a vault fact — Echoes of
Yggdrasil has six books in the registry and announces one.

`src/data/copy.ts` holds the words. `tagline` really is shared across all four
places a book appears. The blurbs are not: `cardBlurb` runs on `/books/` and the
series landings, `homeBlurb` overrides it where the home page trims shorter (two
books), and the detail page's Book JSON-LD description is different again. Same
pattern as the twitter: descriptions — tighter contexts get shorter copy. Store
an override only where the text actually differs.

Four deliberate deviations from the old hand-written output, all verified:
- Amazon URLs normalised to the clean `/dp/<ASIN>` the registry mandates.
  Only Fleet School Dropout (2 links) and Weaving (1) used long slug URLs.
- `book:release_date` now emitted on all five books. Three previously lacked it.
- `workExample` is always an array. Weaving, being Kindle-only, had a bare
  object; an array of one is equally valid and removes the special case.
- Every `datePublished` in `/books/`'s ItemList is now correct. All five were
  wrong or imprecise there — that block was a fourth copy of a date already
  fixed in three other places.

Visible text and page titles are byte-identical on all five.

## Branch strategy (overrides global)

Push direct `main`. No `claude/dev`.

**There is now a CI gate.** `.github/workflows/deploy.yml` runs `npm ci` +
`astro build` and publishes `dist/` to Pages. A broken build means no deploy —
it no longer means a broken page, it means the site does not update. The
workflow runs `scripts/check_build.py`, which asserts every `.astro` under
`src/pages` produced its `.html` (plus the sitemap route). It derives the
expectation from the source, so adding a page needs no CI edit — publishing a
book stays a one-step change — while a dropped or empty page still blocks the
deploy.

Pages is set to **Source: GitHub Actions** (`build_type: workflow`), not a
branch. Rollback is `gh api -X PUT repos/Ink-Iron-Apps/inknironapps-legal/pages
-f build_type=legacy`, but the root `.html` it used to serve is gone, so a
rollback needs a revert too.

The workflow does NOT run `scripts/export_books.py` — that reads the writing
vault, which no runner has. Regenerate `books.json` locally and commit it.

## Design system

Visual basis = `D:/Coding/inkironapps/brand/landing.html`. Palette/type/monogram/hero/sections lifted from there. No invent styling.

Web assets copied from `D:/Coding/inkironapps/brand/web/` + `D:/Coding/inkironapps/brand/` → repo root: favicons, OG image, manifest, `icon.svg`, `logo.svg`.

## SEO scaffolding (in place — keep parity on new pages)

Every page must have:
- `<link rel="canonical" href="https://inknironapps.com/...">`
- `<meta name="author">` + `keywords`
- OG: `og:url`, `og:site_name`, `og:locale`, `og:image` (absolute), `og:image:width/height`
- Twitter card full set
- JSON-LD blocks:
  - Home → `Person` (Riley) + `WebSite` + `Organization` (Ink & Iron Apps)
  - `/books/` → `CollectionPage` + `BreadcrumbList`
  - Series page → `BookSeries` + `BreadcrumbList`
  - Book detail → `Book` (with `workExample` per edition, ASIN as isbn) + `BreadcrumbList`
  - `/apps/` → `CollectionPage` (hasPart = `SoftwareApplication[]`) + `BreadcrumbList`
  - App detail → `SoftwareApplication` (operatingSystem, applicationCategory, publisher, author) + `BreadcrumbList`
  - Legal → canonical only

`sitemap.xml` is generated by `src/pages/sitemap.xml.ts` — book and series URLs
come from `books.json`, so a book that exists is a book that is listed. Static
pages are declared in that file; add a new non-book page there.

`lastmod` comes from git history, which is why the deploy workflow checks out
with `fetch-depth: 0`. The Astro migration rewrote every source file on
2026-09-02, so a naive git date would claim all 18 pages changed that day —
`BASELINE` in that file holds the pre-migration dates and a commit after the
cutoff wins over it. That table stops mattering as pages are genuinely edited.
`changefreq` and `priority` are editorial and stay declared: `/about/` is a
directory URL but deliberately monthly/0.7, so index pages can't be inferred.

## Contacts on site

All addresses are Hostinger Business Starter aliases → forward to single `info@` mailbox.

- `info@inknironapps.com` — general / brand (nav Contact + every footer)
- `support@inknironapps.com` — app users (alpha CTAs, app detail sidebar, app Settings deep links)
- `privacy@inknironapps.com` — privacy policy contact section only
- `riley@inknironapps.com` — author direct (home About + book detail author-contact cards + JSON-LD `Person.email`)
- `noreply@inknironapps.com` — app outbound transactional only (not on site)
- `postmaster@inknironapps.com` — RFC 2142 mail delivery (no site placement)
- `abuse@inknironapps.com` — RFC 2142 spam complaints (no site placement)
- `security@inknironapps.com` — RFC 9116 vulnerability reports → exposed via `/.well-known/security.txt`

Social links (footer icons + book author-contact cards + home About + Person JSON-LD `sameAs`):
- Facebook → `https://www.facebook.com/people/Riley-E-Antrobus/61580037872318/`
- Goodreads → `https://www.goodreads.com/author/show/58136422.Riley_E_Antrobus`
- Amazon author → `https://www.amazon.com/author/rileyeantrobus`

Footer icons render as inline SVG (Simple Icons CC0 paths) inside `.footer-socials` — circular, `currentColor` fill, hover → teal-bright. Add new socials by appending to the `<span class="footer-socials">` block in every page footer + the JSON-LD `sameAs` array on home.

`/.well-known/security.txt` must be kept current. Bump `Expires:` annually before it lapses (current expiry 2027-05-06).

## Footer pattern (every page)

```
Ink & Iron Apps · inknironapps.com · info@inknironapps.com · Facebook
Privacy · Terms · © 2026
```

## Domain

CNAME = `inknironapps.com`. Don't replace with apex/www variant unless DNS confirmed.

Brand-name domain `inkniron.com` is **taken** (active Ink-N-Iron landing). "Apps" suffix on current domain disambiguates from established Ink-N-Iron festival/magazine/tattoo cluster — keep it.

## Email aliases (LIVE — Hostinger Business Starter)

8 aliases, all forward to single `info@` mailbox. See "Contacts on site" above for site placement.

## Author copy (sourced from writing vault)

Author bios, book back-matter, and any other Riley-E.-Antrobus marketing copy is **canonically owned by the writing vault** at `D:\Obsidian Vault\My Vault\Author Marketing\`. This site reuses snippets from those files but the vault is the source of truth.

- **`Author Marketing/Author Bio.md`** — long bio, short bio, one-liner, full channel placement table
- **`Author Marketing/About the Author Page.md`** — KDP back-matter template

When updating author-facing site copy (home About paragraph, book detail descriptions, meta `description`/og copy):
1. Update vault first if voice/wording is changing.
2. Mirror the change here.
3. Don't drift — vault is canonical.

**Channel rules to remember when copying to/from the site:**
- The site can use the URL `inknironapps.com` and full email addresses freely (it's our own domain).
- The vault's `Author Bio.md` documents which Amazon channels strip URLs — that constraint applies to KDP/Author Central, not to this site.
- Voice quirks in the bio (wry asides, sly humor) are intentional — keep them unless the vault drops them. The "(oops, spoiler)" aside was removed once Echoes of Yggdrasil Book 1 published (naming the series stopped being a spoiler); the vault `Author Bio.md` is the source of truth for current bio copy.

## Site rebuild from Pages-default

GitHub Pages defaults to Jekyll which strips `.`-prefixed paths. `/.nojekyll` (empty file at repo root) disables Jekyll so `/.well-known/security.txt` is served. Don't delete `.nojekyll`.

## SEO indexing checklist (post-deploy)

Site has full SEO metadata (canonical, OG, Twitter cards, JSON-LD per page type, sitemap, robots, security.txt, `.nojekyll`). Hostinger / generic-advice agents that say "GitHub Pages = no SEO" are running boilerplate scripts and should be ignored unless they cite a specific missing tag verified against the live URL.

For real ranking gains:
- Google Search Console → Sitemaps → submit `https://inknironapps.com/sitemap.xml`
- Bing Webmaster Tools → submit same sitemap
- Resolve any Search Console "Security Issues" / "Deceptive pages" flag → Request Review once site content is honest (alpha apps marked as alpha, no fake store links)
- Real backlinks (Goodreads Website field, Facebook Website field, KDP back-matter URL) move the needle far more than any extra meta tag.
