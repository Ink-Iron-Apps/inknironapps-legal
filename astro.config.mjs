// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://inknironapps.com",

  build: {
    // CRITICAL, and neither of the obvious options is right. The live site
    // uses a mixed convention:
    //   detail pages  ->  /terms.html, /books/<series>/<slug>.html
    //   index pages   ->  /about/, /books/, /apps/, /books/<series>/
    // "directory" would move every detail page; "file" flattens
    // about/index.astro to /about.html and moves every index page. Only
    // "preserve" keeps the source structure as authored, so index.astro
    // stays an index.html inside its directory and everything else keeps
    // its .html. Changing this moves published URLs — don't, without
    // redirects in place.
    format: "preserve",
  },

  // No adapter: output is static, which is what GitHub Pages and Cloudflare
  // Pages both serve directly. The Cloudflare adapter goes in when server
  // routes actually arrive (newsletter, accounts) — adding it now would
  // pull in a runtime nothing uses.
  output: "static",
});
