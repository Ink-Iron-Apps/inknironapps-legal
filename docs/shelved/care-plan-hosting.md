# SHELVED — the $75 hosted care plan and hosted Online booking

**Never published. Do not apply any of this.** Riley shelved hosting on 2026-10-24: Ink &
Iron Apps will not host client sites, because the E&O plus cyber insurance hosting needs
(about $810 a year and up) is not affordable yet. There is no go-live and no later switch
to wait for.

What that means for this site, all of it already true on the live page:

- The care plan stays **$60/month**.
- Step 03 has no hosting choice; clients host the files themselves in their own account.
- The booking add-on stays "Booking button — $50, or $75 set up for you", not split, not
  renamed.

The other sides are shelved too: `host/SHELVED.md` in `~/coding/client-sites` with
`HOSTING_OFFERED` false in `kit/offer.mjs`, and
`brands/ink-and-iron-apps/legal/drafts/Hosting-Terms-Draft.md` in the HQ folder marked
SHELVED. Lead Autopilot was shelved separately on 2026-10-15 — see
[lead-autopilot.md](lead-autopilot.md).

This file is not published. Astro builds only `src/pages` and copies `public/`, so nothing
under `docs/` reaches the site.

## Why it is kept

The copy was written and reviewed with client-sites over 2026-10-10 and settled several
wording questions that would otherwise be re-litigated if hosting is ever revisited:
Riley chose a 30-day deletion window, chose not to name Cloudflare as the host in care-plan
copy, kept the seasonal refresh in the plan, and confirmed the "$100 a month all in"
arithmetic.

## The copy, as it was drafted

### Care plan entry (would have replaced the $60 entry)

```html
<details>
  <summary>Care plan — $75/month</summary>
  <p>I host the site on my own account, your contact form emails you and sends the customer an instant reply, and you get up to an hour of edits a month, a seasonal refresh, uptime monitoring and a monthly report. Hosting it yourself instead stays free. Cancel any time: the site stays yours, you get your files, and your copy of the data is deleted after 30 days.</p>
  <p>Add online booking for $25 more a month ($100 a month all in).</p>
</details>
```

### How it works, step 03 (would have replaced the single hosting paragraph)

```html
<p>Plain files go live on your own domain, and you own them outright. Host them free in your own account by default, or have me host them on the care plan — either way, not a $20–40/month Wix plan. A paid host like Hostinger works too, at its price.</p>
<p>Your domain stays yours whoever hosts it. If I host, you point it at me with one DNS record; if you leave, you get your files and point it somewhere else.</p>
```

### Online booking entry (would have replaced the Booking button entry)

```html
<details>
  <summary>Online booking — $50–75 once, or +$25/month on the care plan</summary>
  <p><strong>Hosting it yourself: $50</strong> to connect a booking tool you already use; $75 if I set the tool up for you.</p>
  <p><strong>On the care plan: +$25/month.</strong> Customers book online in your site's own colors, and every booking shows up in your phone's calendar. They get a confirmation and a reminder the day before, and can cancel online. You block off busy times and move or cancel bookings from your phone. No monthly booking-app fee.</p>
</details>
```

## What was deliberately left alone, and would be again

- All three package prices and contents, and the JSON-LD `offers` block, which lists only
  those three tiers.
- Standard's "set up on a free host in your account".
- The head `description` and `ogDescription`, which say "on a free host in your own account"
  — correct as things stand.
- Every other add-on, including the visit reports entry added on 2026-10-24 (commit
  8c71d4b). That entry does name Cloudflare Web Analytics, which is a separate, separately
  approved thing, not the host.
