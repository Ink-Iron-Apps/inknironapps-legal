# Lead Autopilot — shelved 2026-10-15, kept for later

Riley decided on 2026-10-15 to drop Lead Autopilot from everything Ink & Iron Apps
offers, for now, and to keep it ready to bring back.

Reason: from 2027-01-01 Colorado HB 26-1223 taxes software. Lead Autopilot is one
template script configured per client, plus a planned hosted option, so it may count
as taxable prewritten software or a software subscription. It is shelved until the
Colorado Department of Revenue answers.

This file is not published. Astro only builds `src/pages` and copies `public/`, so
nothing under `docs/` reaches the site.

## What was removed from the live page

`src/pages/web-design/index.astro`, the Add-ons list. Removed verbatim:

```html
<details>
  <summary>Lead Autopilot — $400 ($150 for Founding clients)</summary>
  <p>Website requests land in a Google Sheet you own, with an instant reply, quote follow-ups and review requests — all running in your own Google account.</p>
</details>
```

Nothing else on the site mentioned it. There is no agreement, privacy or fee-table text
for it in this repo: the published site carries no section-numbered documents, so no
section needed renumbering or a "Reserved" marker here. The agreement's Section 8, the
hosted-email Section 7.7 and the price sheet live in the HQ folder
(`brands/ink-and-iron-apps/legal/`), which the ink-and-iron-apps session owns.

## What was never published

The held care-plan hosting draft (see the session scratchpad note, or recreate from this
file) had split the add-on into two priced paths. That hosted copy never went live and is
kept here with it:

```html
<details>
  <summary>Lead Autopilot — $400 once, or +$25/month on the care plan</summary>
  <p><strong>Hosting it yourself: $400 one-time</strong> ($150 for Founding clients). Website requests land in a Google Sheet you own, with an instant reply, quote follow-ups and review requests — all running in your own Google account.</p>
  <p><strong>On the care plan: +$25/month</strong> on top of the $75, so $100 a month all in. A leads page on your own domain, one-tap status buttons in the new-lead email, a quote follow-up, a review request once the job is done, a seasonal email to the customers who asked for one, and a monthly summary.</p>
</details>
```

The care plan's cross-link line in that draft read "Add Lead Autopilot for $25 more a
month. Add online booking for $25 more a month ($125 a month with both)." With Lead
Autopilot shelved it becomes online booking only, and the total drops to $100 a month.

## To bring it back

1. Wait for the Department of Revenue answer, and for Riley to say so.
2. Restore the block above into the Add-ons list in `src/pages/web-design/index.astro`,
   between the care plan and the online booking entries.
3. Flip `AUTOPILOT_OFFERED` back to `true` in `~/coding/client-sites/kit/offer.mjs`
   first — that file is canonical for prices and add-ons, and the client-sites session owns
   it. As of their commit 56cc21d the flag is `false` and `ADDONS` filters the entry out,
   the 19 pitch emails are rebuilt without it, and the Autopilot preview demos are gone.
   Their restore steps are in `kit/autopilot/SHELVED.md`, which points back at this file.
   The price sheet and agreement in the HQ folder move in the same change.
4. Restore the care plan cross-link line and its combined total.
