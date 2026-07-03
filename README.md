# status.rjmlaird.co.uk

A live status console for the rjmlaird network: main site, docs, CV, dev, and
the API health endpoint. Built in Astro 4 (SSR) + Tailwind, matching the
brand tokens from your other rjmlaird sites (navy base, teal/amber accents,
Space Grotesk + Inter).

## What it checks

Defined in one place, `src/lib/services.ts`:

| Service | URL checked | Method |
|---|---|---|
| Main site | `https://rjmlaird.co.uk` | `GET`, pass = 2xx/3xx |
| Docs | `https://docs.rjmlaird.co.uk` | `GET`, pass = 2xx/3xx |
| CV | `https://cv.rjmlaird.co.uk` | `GET`, pass = 2xx/3xx |
| Dev | `https://dev.rjmlaird.co.uk` | `GET`, pass = 2xx/3xx |
| API | `https://api.rjmlaird.co.uk/health` | `GET`, pass = `res.ok && body.status === "ok"` |

Each check has an 8s timeout. A service is **operational** (teal), **degraded**
(amber — e.g. the API responds but `status !== "ok"`), or **down** (red — no
response, timeout, or non-2xx).

To add a new subdomain, add one object to the `services` array — the page
and the JSON feed both read from it, nothing else to touch.

## Design notes

- The page never pre-renders a static snapshot (`export const prerender = false`
  on both `index.astro` and `api/status.json.ts`) — a status page that can
  report stale "all clear" is worse than none.
- The signature element is the **signal-strength bars** on each card: they're
  not decorative, the bar count is derived directly from that check's
  latency (`src/lib/services.ts` → `signalFromLatency`).
- Colors reuse your existing tokens (`#0B0F1A` navy, `#00C2A8` teal,
  `#F5A623` amber) plus one addition — `#FF5C6C` for the "down" state, since
  the existing palette has nothing for failure.
- Client-side JS repolls `/api/status.json` every 45s and patches the DOM in
  place, so the console stays live without a page reload.

## Local development

```bash
npm install
npm run dev
```

## Deploy

This ships with the **Cloudflare** adapter (`@astrojs/cloudflare`), since
your API's response headers indicate you're already behind Cloudflare. Two
options:

1. **Cloudflare Pages** (recommended, matches your other subdomains): connect
   this repo, build command `npm run build`, output directory `dist`. Point
   `status.rjmlaird.co.uk` at the Pages project via a CNAME/proxy record.
2. **Different host**: swap the adapter in `astro.config.mjs` for
   `@astrojs/vercel` or `@astrojs/netlify` and update the `import`/`adapter()`
   call — everything else is unaffected.

## Machine-readable feed

`GET /api/status.json` returns the same data the page shows, for external
uptime monitors or scripts:

```json
{
  "state": "operational",
  "checkedAt": "2026-07-03T17:40:49.673Z",
  "services": [
    { "id": "api", "name": "api.rjmlaird.co.uk", "state": "operational", "httpStatus": 200, "latencyMs": 96, "signal": 4, "detail": "2026-07-03T17:40:49.673Z" }
  ]
}
```

## Optional follow-ups

- Point an external monitor (UptimeRobot, Better Stack, etc.) at
  `/api/status.json` so the status page itself is checked independently of
  the sites it reports on.
- Add an incident log / maintenance notices section once you need history,
  not just live state.
