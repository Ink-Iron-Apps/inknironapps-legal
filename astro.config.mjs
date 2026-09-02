// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://inknironapps.com",

  build: {
    // CRITICAL: the live site publishes /books/<series>/<slug>.html — file
    // extensions, not directory URLs. Astro's default ("directory") would
    // emit /books/<series>/<slug>/index.html and silently move every book
    // and app page to a new address, throwing away its ranking. Do not
    // change this without redirects in place.
    format: "file",
  },

  // No adapter: output is static, which is what GitHub Pages and Cloudflare
  // Pages both serve directly. The Cloudflare adapter goes in when server
  // routes actually arrive (newsletter, accounts) — adding it now would
  // pull in a runtime nothing uses.
  output: "static",
});
