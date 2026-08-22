# Deploy — desklessconsulting.com

A static, single-page site. No build step, no dependencies. Just `index.html`,
`styles.css`, and `.nojekyll`. Pick either path below.

> Do not deploy until the placeholders in the next section are filled.

---

## Placeholders to fill before going live

Every spot is marked in the source with `TODO[PLACEHOLDER...]`. Search the repo for
`PLACEHOLDER` to find them all.

| Placeholder | Where | Action needed |
|---|---|---|
| `BOOKING_LINK` | every `[data-book]` CTA | Resolved 2026-08-21: `BOOKING_URL = https://cal.com/deskless/30min` (profile also has `/15min`). The `mailto:` hrefs remain in markup as no-JS fallback. |
| `EMAIL` | header CTA, all CTAs, footer | Resolved: all CTAs use `dan@desklessconsulting.com` consistently (matches approved copy). |
| `PHONE` | footer | Optional. No phone is shown yet. Add one if desired. |
| `og:url` / canonical | `<head>` | Confirm `https://desklessconsulting.com` once the domain is pointed. |

Quick find:
```
grep -rn "PLACEHOLDER" .
```

### Getting the BOOKING_LINK (Cal.com free tier) — needs Dan, ~2 minutes

Cal.com's free tier doesn't need a card or phone number, but it does need an account
under Dan's identity (email/password or Google OAuth) — creating a new third-party
account in Dan's name isn't something an agent should do unattended, so this step is
staged for Dan to click through himself:

1. Go to https://cal.com/signup and sign up (Google OAuth is fastest, or email/password).
2. Pick a username, e.g. `deskless` or `dbonomo` — this becomes part of your booking URL
   (`https://cal.com/<username>/<event-type>`).
3. Create one event type, e.g. "Discovery Call" — 30 min, free plan default settings are
   fine to start.
4. Copy the event's public booking link, e.g. `https://cal.com/deskless/discovery-call`.
5. Open `index.html`, find the line near the bottom (search for `BOOKING_URL`):
   ```js
   const BOOKING_URL = "mailto:dan@desklessconsulting.com?subject=Discovery%20Call";
   ```
   Replace the mailto string with your real Cal.com URL, e.g.:
   ```js
   const BOOKING_URL = "https://cal.com/deskless/discovery-call";
   ```
   This is the only line that needs to change — every CTA on the site (`nav`, hero,
   offer cards, footer band) reads from this one constant via `[data-book]`.
6. Commit and push to `deploy-origin` (GitHub Pages redeploys automatically):
   ```bash
   git add index.html
   git commit -m "Swap mailto CTA for Cal.com booking link"
   git push deploy-origin main
   ```

---

## Option A — GitHub Pages (free)

1. Create a repo and push these files:
   ```bash
   cd deskless-site
   git init
   git add .
   git commit -m "Deskless landing page"
   git branch -M main
   git remote add origin https://github.com/<you>/deskless-site.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   branch `main`, folder `/ (root)`. Save.
3. Wait ~1 minute. Site goes live at `https://<you>.github.io/deskless-site/`.
   (`.nojekyll` is included so Pages serves the files verbatim without Jekyll processing.)

### Custom domain (desklessconsulting.com) on GitHub Pages
1. Settings → Pages → **Custom domain** → enter `desklessconsulting.com` → Save.
   This creates a `CNAME` file in the repo.
2. At your DNS provider (Namecheap), add:
   - **A records** for the apex `@` pointing to GitHub's IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - A **CNAME** for `www` → `<you>.github.io`
3. Back in Settings → Pages, tick **Enforce HTTPS** once the cert provisions.

---

## Option B — Vercel (free)

**Drag-and-drop (no Git):**
1. Go to vercel.com → **Add New → Project → deploy a static folder** (or use the CLI below).
2. Drop the `deskless-site` folder. Vercel auto-detects a static site (no framework).
   Output directory is the root. Deploy.

**CLI:**
```bash
npm i -g vercel
cd deskless-site
vercel          # follow prompts; accept defaults (no build command, root output)
vercel --prod   # promote to production
```

### Custom domain on Vercel
1. Project → **Settings → Domains → Add** `desklessconsulting.com`.
2. Vercel shows the exact DNS records (usually an A record `76.76.21.21` for the apex
   and a CNAME `cname.vercel-dns.com` for `www`). Add them at Namecheap.
3. HTTPS is automatic.

---

## Local preview

No server strictly needed — open `index.html` in a browser. For a closer-to-prod check:
```bash
cd deskless-site
python3 -m http.server 8080
# visit http://localhost:8080
```

---

## Notes
- The mountain artwork is inline SVG / CSS — no external image or paid asset dependencies.
- No JavaScript framework. The only script is a one-liner that keeps the footer year current.
- Copy is taken verbatim from the approved final landing-page doc; only sectioning/markup was added.
