/**
 * sitemap.xml, generated.
 *
 * It was a static file in public/, which meant a new book needed a hand-added
 * <url> and a hand-bumped <lastmod> — and lastmod is exactly the field that
 * goes stale without anyone noticing. Book and series URLs now come from
 * books.json, so a book that exists is a book that is listed.
 *
 * lastmod comes from git: the last commit touching the page's own source, and
 * for pages that render book data, also books.json and copy.ts. Adding a book
 * therefore freshens every page that shows it, and nothing else.
 *
 * CI must check out full history (fetch-depth: 0) or git reports nothing and
 * every page falls back to FALLBACK_DATE.
 *
 * changefreq and priority are editorial judgements, not data — they stay
 * declared here. /about/ is a directory URL but deliberately monthly/0.7,
 * so index pages cannot simply be inferred.
 */
import type { APIRoute } from "astro";
import { execFileSync } from "node:child_process";
import data from "../data/books.json";

const SITE = "https://inknironapps.com";
/** Only used if git history is unavailable — see fetch-depth above. */
const FALLBACK_DATE = "2026-09-02";

/**
 * The Astro migration rewrote every source file on 2026-09-02, so a naive git
 * lastmod would tell crawlers all 18 pages changed that day. Most did not —
 * MatCalc's content is untouched since May, only its markup was re-rendered.
 * So: a commit AFTER the cutoff is a real edit and wins; otherwise the page
 * keeps the date the hand-maintained sitemap carried. Every page whose content
 * genuinely changed during the migration already has 2026-09-02 below.
 * This table stops mattering as pages are edited after the cutoff.
 */
const MIGRATION_CUTOFF = "2026-09-02";
const BASELINE: Record<string, string> = {
  "/": "2026-08-30",
  "/books/": "2026-06-10",
  "/books/warborn-protocols/": "2026-06-10",
  "/books/warborn-protocols/fleet-school-dropout.html": "2026-09-02",
  "/books/warborn-protocols/network-recruit.html": "2026-09-02",
  "/books/echoes-of-yggdrasil/": "2026-06-10",
  "/books/echoes-of-yggdrasil/the-nine-bridges.html": "2026-09-02",
  "/books/the-recursion-engine.html": "2026-09-02",
  "/books/weaving-eternal-tapestry.html": "2026-09-02",
  "/apps/": "2026-08-30",
  "/apps/libraryiq.html": "2026-08-30",
  "/apps/matcalc.html": "2026-05-27",
  "/apps/simmer.html": "2026-05-27",
  "/about/": "2026-06-10",
  "/about/ink-iron-apps.html": "2026-08-30",
  "/contact.html": "2026-09-02",
  "/privacy-policy.html": "2026-09-02",
  "/terms.html": "2026-09-02"
};
/** Pages whose output depends on book data, not just their own source. */
const BOOK_DATA = ["src/data/books.json", "src/data/copy.ts"];

function lastCommit(paths: string[]): string {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...paths], {
      encoding: "utf8",
    }).trim();
    return out || FALLBACK_DATE;
  } catch {
    return FALLBACK_DATE;
  }
}

function dateFor(path: string, src: string, rendersBooks = false): string {
  const git = lastCommit(rendersBooks ? [src, ...BOOK_DATA] : [src]);
  if (git > MIGRATION_CUTOFF) return git;      // a real edit since the migration
  return BASELINE[path] ?? git;                // otherwise the pre-migration truth
}

interface Entry {
  path: string;
  src: string;
  changefreq: string;
  priority: string;
  books?: boolean;
}

const live = data.books.filter((b) => b.status === "live");
const seriesSlugs = [...new Set(live.map((b) => b.series?.slug).filter(Boolean))];

/** Series landing, then its books, then standalones — the published order. */
const bookEntries: Entry[] = [
  ...seriesSlugs.flatMap((slug): Entry[] => {
    const inSeries = live
      .filter((b) => b.series?.slug === slug)
      .sort((a, b) => a.series!.position - b.series!.position);
    return [
      { path: `/books/${slug}/`, src: `src/pages/books/${slug}/index.astro`,
        changefreq: "weekly", priority: "0.9", books: true },
      ...inSeries.map((b) => ({
        path: b.path,
        src: `src/pages${b.path.replace(/\.html$/, ".astro")}`,
        changefreq: "monthly", priority: "0.8", books: true,
      })),
    ];
  }),
  ...live.filter((b) => !b.series).map((b) => ({
    path: b.path,
    src: `src/pages${b.path.replace(/\.html$/, ".astro")}`,
    changefreq: "monthly", priority: "0.8", books: true,
  })),
];

const entries: Entry[] = [
  { path: "/", src: "src/pages/index.astro", changefreq: "weekly", priority: "1.0", books: true },
  { path: "/books/", src: "src/pages/books/index.astro", changefreq: "weekly", priority: "0.9", books: true },
  ...bookEntries,
  { path: "/apps/", src: "src/pages/apps/index.astro", changefreq: "weekly", priority: "0.9" },
  { path: "/apps/libraryiq.html", src: "src/pages/apps/libraryiq.astro", changefreq: "monthly", priority: "0.8" },
  { path: "/apps/matcalc.html", src: "src/pages/apps/matcalc.astro", changefreq: "monthly", priority: "0.8" },
  { path: "/apps/simmer.html", src: "src/pages/apps/simmer.astro", changefreq: "monthly", priority: "0.8" },
  { path: "/about/", src: "src/pages/about/index.astro", changefreq: "monthly", priority: "0.7" },
  { path: "/about/ink-iron-apps.html", src: "src/pages/about/ink-iron-apps.astro", changefreq: "monthly", priority: "0.6" },
  { path: "/contact.html", src: "src/pages/contact.astro", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy-policy.html", src: "src/pages/privacy-policy.astro", changefreq: "yearly", priority: "0.3" },
  { path: "/terms.html", src: "src/pages/terms.astro", changefreq: "yearly", priority: "0.3" },
];

export const GET: APIRoute = () => {
  const urls = entries
    .map((e) => [
      "  <url>",
      `    <loc>${SITE}${e.path}</loc>`,
      `    <lastmod>${dateFor(e.path, e.src, e.books)}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n"))
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
