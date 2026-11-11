# Launch checklist

Manual steps that only the site owner can do (docs/PLAN.md §10, phase 8). Everything else is checked by CI (`.github/workflows/ci.yml`).

## Before the first deploy

- [ ] `pnpm build && pnpm check:budget && pnpm check:lighthouse` pass locally.
- [ ] Add the real social profile URLs to `sameAs` in `src/lib/site.ts` (it is an empty list now). Add only profiles that exist; they go into the Organization JSON-LD.

## Cloudflare dashboard (sfdxtalk.com zone)

Cloudflare blocks AI crawlers by default on new domains, which defeats `public/robots.txt`.

- [ ] Turn **off** AI-crawler blocking ("Block AI bots" / AI Crawl Control → allow all crawlers).
- [ ] Turn **off** the managed `robots.txt` ("Instruct AI bot traffic with robots.txt").
- [ ] After deploy, open `https://sfdxtalk.com/robots.txt` and confirm it is the file from this repo, with no lines added by Cloudflare.

## Deploy

- [ ] `pnpm deploy` — builds, deploys, then submits recently changed URLs to IndexNow.
- [ ] Confirm the IndexNow key file is reachable: `https://sfdxtalk.com/62da024fca63ae42bd577ce7ea53e2fd.txt` must return the key as plain text. If it does not, IndexNow answers 403.
- [ ] First deploy only: run `pnpm indexnow --all` once to submit every URL. HTTP 200 or 202 means it was received (202 = key check pending, normal the first time).

## Search engines

- [ ] **Google Search Console**: add the `sfdxtalk.com` domain property (DNS TXT record in Cloudflare), then submit `https://sfdxtalk.com/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: add the site (import from Search Console or verify by DNS), then submit `https://sfdxtalk.com/sitemap.xml`. Check that the IndexNow page there lists the submitted URLs.

## Structured data

Test one live article URL, for example `https://sfdxtalk.com/docs/apex/trigger-handler-pattern/`:

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — no errors; breadcrumb and article data detected.
- [ ] [Schema Markup Validator](https://validator.schema.org/) — no errors or warnings.

## After launch

- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/) on the home page and one article. Lighthouse CI tests a local server without the CDN or `_headers`, so this is the first real-network measurement.
- [ ] One week later: check Search Console → Pages for indexing problems and Sitemaps for a "Success" status.
