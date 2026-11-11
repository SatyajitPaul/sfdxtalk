# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SFDX Talk (sfdxtalk.com) is an unofficial Salesforce developer documentation site: an Astro static build served by Cloudflare Workers static assets (no Worker script, no bindings). See also `AGENTS.md` — always fetch current Cloudflare docs before touching Workers/Wrangler config.

## Commands

Package manager is pnpm (`pnpm-lock.yaml`).

| Command | Purpose |
|---|---|
| `pnpm dev` | Astro dev server |
| `pnpm build` | Static build to `dist/` — this is also the content validator |
| `pnpm preview` | Build, then serve `dist/` through `wrangler dev` (real Cloudflare asset handling + `_headers`) |
| `pnpm deploy` | Build, `wrangler deploy`, then ping IndexNow with recently updated URLs |
| `pnpm indexnow --dry-run` | Show what the IndexNow ping would send, without sending |
| `pnpm check:budget` | Fail if a built page exceeds 40KB gzipped or `_astro` JS exceeds its limit |
| `pnpm check:lighthouse` | Lighthouse CI against `dist/` (needs Chrome); also runs in `.github/workflows/ci.yml` |

There is no unit test suite or linter. `pnpm build` is the content check: frontmatter schema violations and cross-article rule violations fail the build.

## Key documents

- `docs/PLAN.md` — the approved site plan (goals: SEO > AI-readiness > speed > reader comfort), design tokens, performance budget, and implementation phases. `astro.config.mjs` defers to it for the reasoning behind settings. Phases 1–3 and the SEO/AI layer (phase 5) are done; all plan phases are built. The manual launch steps are in `docs/LAUNCH-CHECKLIST.md`.
- `docs/CONTENT-SPEC.md` — the contract for article authors (frontmatter fields, body section order, callout/code-fence syntax, FAQ rules). Read it before writing or editing anything in `src/content/docs/`.

## Architecture

**Content pipeline.** Articles live at `src/content/docs/{category}/{slug}.md` and become `/docs/{category}/{slug}/`. Validation is split in two places:
- `src/content.config.ts` — strict Zod schema per article (unknown fields rejected, length limits, `apiVersion` must match `release`, no future dates, plain-text FAQ).
- `src/lib/docs.ts` `getDocs()` — whole-collection checks (folder must equal `category`, unique titles/descriptions, `related` must point to existing non-draft articles). Pages must get articles through `getDocs()`, not `getCollection()` directly, or these checks and draft filtering are skipped.

**SEO/AI layer.** `src/lib/site.ts` holds site identity; `src/lib/schema.ts` builds one JSON-LD `@graph` per page (Organization, WebSite, WebPage, BreadcrumbList, plus TechArticle + FAQPage on articles); `BaseLayout.astro` emits it with canonical, Open Graph and Twitter tags. `src/lib/export.ts` feeds the machine endpoints: `/sitemap.xml`, `/feed.xml`, `/llms.txt`, `/llms-full.txt` and `/docs/{category}/{slug}.md`. All of it derives from frontmatter — never hand-write structured data that the page does not show. `noindex` pages get no JSON-LD or Open Graph tags.

**Taxonomy single source of truth.** `src/lib/taxonomy.ts` holds categories, Salesforce releases ↔ API versions, and levels. The schema derives its enums from it. When adding a category or release, update `taxonomy.ts` *and* the matching tables in `docs/CONTENT-SPEC.md` §3/§4.

**Markdown rendering.** Uses the Sätteri processor (`@astrojs/markdown-satteri`), not remark/rehype. Custom plugins in `src/markdown/`:
- `callouts.ts` — HAST plugin: `> [!NOTE|TIP|WARNING|RELEASE]` callouts, scrollable table wrappers, heading anchor links. It must run after `satteriHeadingIdsPlugin()` (order set in `astro.config.mjs`).
- `code-blocks.ts` — Shiki transformer wrapping fences in a `<figure>` with title/language caption and copy button (button enabled by `src/scripts/site.ts`).
- `mermaid.ts` — HAST plugin rendering ` ```mermaid ` fences to inline SVG at build time with `beautiful-mermaid` (no browser, no client JS); `mermaid` is in `syntaxHighlight.excludeLangs` so Shiki leaves those fences alone. After changing a Markdown plugin, delete `.astro/data-store.json` and `node_modules/.astro/data-store.json`, or Astro serves cached renders.
- `shiki-themes.ts` — light/dark themes; Shiki emits CSS variables only (`defaultColor: false`) and `src/styles/global.css` selects the theme via `data-theme`. `soql`/`sosl` alias to `sql`.

**URLs.** `trailingSlash: 'always'` + `build.format: 'directory'` in Astro matches `html_handling: "auto-trailing-slash"` in `wrangler.jsonc`. Keep these in agreement; internal links use root-relative paths with a trailing slash. Never rename a published slug.

**Pages.** Articles use the three-column template in `src/pages/docs/[...slug].astro` with `src/components/article/*`. Hubs: `/docs/`, `/docs/{category}/`, `/tags/{tag}/` (noindex below 3 articles), `/releases/{release}/`; URL helpers in `src/lib/hubs.ts`. Per-article share images are rendered at build time by `src/lib/og-image.ts` to `/og/{category}/{slug}.png`.

**Search.** `src/integrations/pagefind.ts` writes the Pagefind index to `dist/pagefind/` on `astro:build:done`, and `pnpm dev` serves that folder, so dev search needs one prior `pnpm build` and is only as fresh as it. Only elements marked `data-pagefind-body` (articles) are indexed. `src/components/Search.astro` (home box and header dialog) and `src/scripts/search.ts` load the index on the first keystroke.

**Service worker.** `src/integrations/service-worker.ts` is an Astro integration that, on `astro:build:done`, fills placeholders in `src/service-worker/sw.template.js` and writes `dist/sw.js`. Edit the template, never `dist/sw.js`. The SW version hash covers the template, pre-cached `/_astro/*` files, and inlined CSS from the shell pages — deliberately *not* article text, so content-only deploys keep readers' page caches warm.

**Caching/headers.** `public/_headers` defines cache policy (immutable `/_astro/*`, `no-cache` for `/sw.js`, revalidated HTML) plus security headers. CSS is inlined into every page (`inlineStylesheets: 'always'`) to keep LCP free of render-blocking requests.

## Content rules worth remembering

- No author field or personal bylines — everything is credited to "SFDX Talk Editorial".
- The page template renders title, TL;DR, FAQ (also emitted as `FAQPage` JSON-LD), and related links from frontmatter; don't repeat them or add an H1 in the body.
- Never imply Salesforce endorsement, use Salesforce logos, or copy official docs beyond short attributed quotes. Avoid Salesforce brand blue (`#0176D3`) in the UI.
- CLI examples use the modern `sf` CLI; legacy `sfdx` only in a note.
- `lastUpdated` changes only for meaningful edits (it drives sitemap `lastmod`).

<!-- claude-reflect: learned rules (saved from the band; edit freely) -->
## Learned rules
- Use pnpm instead of npm for installing packages and running package scripts.
<!-- end claude-reflect -->
