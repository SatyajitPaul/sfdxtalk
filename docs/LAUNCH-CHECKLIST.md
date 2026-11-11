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

## Going public (community repo)

Do these in order. Merging to `master` deploys, so the protection must be on before outside pull requests arrive.

**Before switching to public**

- [ ] Merge the `community` branch (licenses, CONTRIBUTING, templates, CODEOWNERS, Dependabot, edit links, comments code).
- [ ] Optional: in GitHub → Settings → Emails, turn on **Keep my email addresses private** and **Block command line pushes that expose my email**, then `git config --global user.email <id>+<username>@users.noreply.github.com`. Existing commits keep the address they were made with.

**Switch visibility**

- [ ] Settings → General → Danger Zone → **Change visibility → Public**.

**Protect `master`** (Settings → Rules → Rulesets → New branch ruleset)

- [ ] Name `master`, enforcement **Active**, target **Default branch**.
- [ ] **Restrict deletions** and **Block force pushes**.
- [ ] **Require a pull request before merging**: required approvals 0 (you are the only maintainer; your own PRs can't be approved by you), **Require review from Code Owners** off for now, **Dismiss stale approvals** on.
- [ ] **Require status checks to pass**: add `check` (the CI job), and **Require branches to be up to date**.
- [ ] Bypass list: add yourself (Repository admin) only if you want to push hotfixes directly. Leaving it empty is safer.

**Actions** (Settings → Actions → General)

- [ ] **Require approval for all external contributors** (fork pull request workflows).
- [ ] Workflow permissions: **Read repository contents and packages permissions**; leave "Allow GitHub Actions to create and approve pull requests" off.

**Security** (Settings → Advanced Security / Code security)

- [ ] **Private vulnerability reporting**: on (SECURITY.md points to it).
- [ ] **Dependabot alerts** and **Dependabot security updates**: on (version updates come from `.github/dependabot.yml`).
- [ ] **Secret scanning** and **Push protection**: on.

**Discussions and comments**

- [ ] Settings → General → Features → **Discussions**: on.
- [ ] Discussions → categories → new category **Comments**, format **Announcement** (only maintainers and giscus create threads; anyone can reply).
- [ ] Install the giscus app on this repository only: https://github.com/apps/giscus.
- [ ] On https://giscus.app enter `SatyajitPaul/sfdxtalk`, choose mapping "specific term" and category **Comments**, then copy `data-repo-id` and `data-category-id` into `SITE.giscus` in `src/lib/site.ts`. Comments appear on the next deploy.
- [ ] Discussions → **Moderation**: consider limiting interactions for new accounts if spam appears (Settings → Moderation options → Interaction limits).

**Labels** used by the issue forms (Issues → Labels): `content`, `new-article`, `site`, `triage`.

**Cloudflare** (Workers & Pages → sfdxtalk → Settings → Build)

- [ ] Production branch is `master` (confirmed).
- [ ] **Enable Preview Builds**: off unless you want preview URLs for your own branches.
- [ ] Build variables: none needed. Never add secrets here; merged code can read them during a build.

**After going public**

- [ ] From a second GitHub account (or ask a friend), open a test pull request from a fork: CI should wait for approval, no Cloudflare deploy should happen, and **Merge** should stay blocked until CI passes.
