# Contact form Worker

Cloudflare Worker backend for `inknironapps.com/contact.html`. Receives form POST, validates, sends via Resend, redirects user back with status flag.

## Deploy

`wrangler.toml` in this folder is the source of truth for the Worker's config. From the repo root:

```bash
wrangler deploy -c worker/wrangler.toml
```

Deploy **with** the config, always. A config-less `wrangler deploy --name inknironapps-contact` overrides the remote settings with wrangler's own defaults — that silently disabled observability logging once. Secrets (`RESEND_API_KEY`) are preserved across deploys either way; plain-text vars set in the dashboard are not.

Check a config change before shipping it:

```bash
wrangler deploy -c worker/wrangler.toml --dry-run
```

Set or rotate the API key:

```bash
wrangler secret put RESEND_API_KEY -c worker/wrangler.toml
```

Note this Worker is **not** deployed by GitHub Pages — pushing `main` updates the site but leaves the Worker on its last deploy. After changing `ROUTES` or `TOPIC_LABELS`, redeploy or the new topic values fall through the route map.

## First-time setup (dashboard)

1. Cloudflare dashboard → Workers & Pages → Create → Worker
2. Name: `inknironapps-contact`
3. Edit code → paste contents of `contact-worker.js`
4. Deploy
5. Settings → Variables → Encrypted → add `RESEND_API_KEY` = (key from Resend dashboard)
6. Optional: Settings → Variables → Plain → `ALLOWED_ORIGIN` = `https://inknironapps.com` (defaults to that anyway)
7. Note your Worker URL: `https://inknironapps-contact.<account>.workers.dev`
8. Update `contact.html` form `action="..."` with that URL (or bind a custom subdomain — see below)

## Optional: custom subdomain

Bind to `forms.inknironapps.com` so the form action stays on-brand:

1. Cloudflare dashboard → Workers → `inknironapps-contact` → Settings → Triggers → Add Custom Domain
2. Enter `forms.inknironapps.com`
3. CF auto-creates the DNS record (only works if `inknironapps.com` is on Cloudflare nameservers — currently it's on Hostinger DNS, so this requires moving DNS to Cloudflare first; the workers.dev URL works fine without this)

## Resend setup

1. resend.com → sign up (free)
2. Domains → Add Domain → `inknironapps.com`
3. Resend shows 3 DNS TXT records (SPF, DKIM with selector like `resend._domainkey`, optional DMARC)
4. Add those to wherever DNS lives (Hostinger DNS panel)
5. Wait for verification (Resend dashboard shows green when ready, usually <30 min)
6. API Keys → Create API Key → "Full access" → copy the key (starts with `re_...`)
7. Paste as Worker secret `RESEND_API_KEY`

## SPF coexistence

Existing SPF on `inknironapps.com`:
```
v=spf1 include:_spf.mail.hostinger.com ~all
```
Update to include Resend:
```
v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
```
Resend uses AWS SES under the hood. Both DKIM signatures coexist (different selectors).

## Test

```bash
curl -i -X POST https://inknironapps-contact.<account>.workers.dev \
  -H "Origin: https://inknironapps.com" \
  -F "topic=general" \
  -F "name=Test" \
  -F "email=test@example.com" \
  -F "message=Hello world"
```
Expected: 303 redirect to `https://inknironapps.com/contact.html?sent=1` and an email in the `info@` inbox.
