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

## Settled by research's GA section, relayed 2026-10-24

Both questions this file raised are answered, so publish on the word without reopening them:

- **Privacy and opt-out.** The Colorado Privacy Act does not apply to these clients — they
  are under its thresholds — so no visitor opt-out is required. Agreement 7.5(f) and 4.5
  make the privacy-page line the client's own statement, which the client keeps on their
  site with a prominent link to Google's page.
- **Advertising features.** The GA property lives in Ink & Iron's own GA account, not the
  client's. Agreement 7.5(b) commits Ink & Iron to turning off advertising features, Google
  signals and data sharing.

Note the account ownership, because it is the one real difference from the Cloudflare
version: that line said the counter sat "in your own Cloudflare account", and GA does not.
The held wording claims no account owner, so it stays correct as written — don't add one.

client-sites switched its kit wording to Google Analytics in their commit 8901cc1, and their
ALL_ADDONS entry now matches this line. ANALYTICS_OFFERED stays false there until
multiclass-holdings confirms the agreement and the printed price sheet are committed.

This file is not published: Astro builds only `src/pages` and copies `public/`.
