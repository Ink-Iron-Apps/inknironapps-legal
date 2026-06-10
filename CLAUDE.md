# inknironapps-legal

Static creator-hub site → `inknironapps.com` (CNAME → GH Pages, repo name retains "legal" for history).

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
3. Print = ebook-only until ISBN owned (registry/LISTING_DATA §7 flags it) → Kindle button only, no Paperback.

URL patterns:
- Books: `/books/<series-slug>/<book-slug>.html` for series, `/books/<book-slug>.html` for standalone. Don't shorten slugs → SEO match titles. New book in existing series → drop in series folder. New series → new folder under `/books/`.
- Apps: `/apps/<app-slug>.html` flat. No series concept. Icons live `/images/apps/<app-slug>.png` (square 512+ source).

App copy must match official Play Store listings exactly (taglines, feature lists, pricing). Pull from each app repo's `store-assets/store-listing.txt` or equivalent. Don't paraphrase — Safe Browsing classifiers flag mismatched promises.

Apps in alpha → mark "Closed alpha" in meta + body. CTAs = `mailto:info@inknironapps.com?subject=<app>%20alpha%20tester`. NO fake Play Store links until app actually published.

## Branch strategy (overrides global)

Push direct `main`. No `claude/dev`. No CI gate. Pages deploys main on push.

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

New page → register in `sitemap.xml`. Update `lastmod` on changed pages.

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
- Voice quirks (e.g. "(oops, spoiler)") are intentional. Keep them.

## Site rebuild from Pages-default

GitHub Pages defaults to Jekyll which strips `.`-prefixed paths. `/.nojekyll` (empty file at repo root) disables Jekyll so `/.well-known/security.txt` is served. Don't delete `.nojekyll`.

## SEO indexing checklist (post-deploy)

Site has full SEO metadata (canonical, OG, Twitter cards, JSON-LD per page type, sitemap, robots, security.txt, `.nojekyll`). Hostinger / generic-advice agents that say "GitHub Pages = no SEO" are running boilerplate scripts and should be ignored unless they cite a specific missing tag verified against the live URL.

For real ranking gains:
- Google Search Console → Sitemaps → submit `https://inknironapps.com/sitemap.xml`
- Bing Webmaster Tools → submit same sitemap
- Resolve any Search Console "Security Issues" / "Deceptive pages" flag → Request Review once site content is honest (alpha apps marked as alpha, no fake store links)
- Real backlinks (Goodreads Website field, Facebook Website field, KDP back-matter URL) move the needle far more than any extra meta tag.
