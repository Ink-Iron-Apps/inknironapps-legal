# HELD — visit reports, Google Analytics wording

**Not published. Do not apply until multiclass-holdings says the agreement is updated.**

Riley approved a visit reports add-on on 2026-10-24 and it went live the same day
(commit 8c71d4b). Later that day Riley moved visit reports from Cloudflare Web Analytics
to Google Analytics, which made the live line wrong on two counts — it named Cloudflare,
and it said "cookie-free" — so the entry was taken down immediately (see the commit that
added this file).

The page currently offers no visit reports add-on at all. That is the correct state until
the agreement is updated.

## The approved replacement, to publish on the word from multiclass-holdings

Riley's approved line:

> Visit reports, care-plan clients: $25 one-time setup (labor). Monthly visit figures
> included in your care report. Uses Google Analytics, an invisible visit counter, with
> Google's advertising features turned off.

Split for the page the way the other add-ons are written, and the way the Cloudflare
version was:

```html
<details>
  <summary>Visit reports, care-plan clients — $25 one-time setup</summary>
  <p>$25 of labor to set it up, once. Monthly visit figures are then included in your care report. It uses Google Analytics, an invisible visit counter, with Google's advertising features turned off.</p>
</details>
```

It goes directly under the care plan entry, where the Cloudflare version sat, because it is
offered only to care-plan clients.

Rules carried over from both rounds:
- Keep the labor framing. The charge is one-time setup labor, never software, a licence or
  a subscription.
- **Never write "cookie-free".** Google Analytics sets cookies; that was the specific error
  in the Cloudflare line once the tool changed.
- No mention of AI.
- "(labor)" stays out of the summary heading and lives in the body — client-sites agreed on
  2026-10-24 that the kit keeps it in the price, where the line is invoice-shaped, while the
  page reads better with a plain heading.

## The removed Cloudflare wording, for the record

```html
<details>
  <summary>Visit reports, care-plan clients — $25 one-time setup</summary>
  <p>$25 of labor to set it up, once. Monthly visit figures are then included in your care report. It uses Cloudflare Web Analytics, an invisible, cookie-free visit counter in your own Cloudflare account.</p>
</details>
```

## Worth settling before this goes back up

Google Analytics sets cookies and processes visitor data, which Cloudflare Web Analytics
did not. That is a question for HQ or the research session, not for this page's copy:

- Each client site running GA needs its own privacy disclosure, and under the Colorado
  Privacy Act a visitor-facing notice and opt-out may be required. The site agreement's
  analytics section should say who is responsible for that.
- "Advertising features turned off" is a setting in the client's GA property, so someone has
  to keep it off. Worth naming in the agreement rather than only on this page.

This file is not published: Astro builds only `src/pages` and copies `public/`.
