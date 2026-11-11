# SFDX Talk — Site Plan

> Unofficial Salesforce documentation for developers. Not affiliated with or endorsed by Salesforce.
> Domain: **sfdxtalk.com** · Host: Cloudflare Workers static assets (free tier) · Framework: Astro (static output)

Status: **Plan approved for saving — not yet implemented.** Items marked *(pending decision)* use the recommended default until decided otherwise.

## Goals (in priority order)

1. **SEO** — rank top in classic search for Salesforce developer queries.
2. **AI-ready** — be retrievable and citable by AI search (ChatGPT Search, Perplexity, Claude, Gemini, Copilot).
3. **Speed** — best-in-class Core Web Vitals.
4. **Reader comfort** — low cognitive load, calm dark UI that's comfortable for long sessions.

Content writing is done by other agents following [CONTENT-SPEC.md](CONTENT-SPEC.md). This plan covers UI, architecture, SEO and performance.

---

## 1. Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Astro, `output: 'static'` | Ships zero JS by default; HTML-first is optimal for CWV and crawlers. |
| Content | Markdown in Astro content collections (`glob` loader) + strict Zod schema | Build fails if an article is missing required metadata. Writer agents cannot skip fields. |
| Highlighting | Shiki at build time | Zero runtime JS. Apex, JS, HTML, XML, Bash supported; verify SOQL grammar, fall back to `sql`. |
| Search | Pagefind | See §6. |
| Hosting | Cloudflare Workers static assets + `_headers` | Static asset requests are free and unlimited (verified 2026-11-11). |

### Cloudflare limits (verified 2026-11-11, free plan)

- 20,000 files per Worker version
- 25 MiB per file
- Static asset requests: free, unlimited; only Worker-script invocations are billed

---

## 2. Color & theme

### Evidence

- **Polarity:** dark-on-light (positive polarity) gives better reading accuracy in general — Piepenbrock, Mayr, Mund & Buchner (2013), *Ergonomics*. Light-on-dark helps in low ambient light — Dobres et al. (2017).
- **Avoid pure black / pure white:** maximal contrast produces halation (letters blur/glow), worst for people with astigmatism. Material Design dark-theme guidance recommends dark gray surfaces and desaturated accents; saturated colors on dark backgrounds visually "vibrate".
- **Hue & saturation:** blue/green hues rate most pleasant and least arousing; saturation raises arousal — Valdez & Mehrabian (1994). Blue is associated with trust/competence — Elliot & Maier (2014).
- **Brand separation:** avoid Salesforce brand blue (`#0176D3`) to prevent confusion with official docs.

### Decision *(decided 2026-11-11)*

**Dark by default**, follow `prefers-color-scheme` when the reader has set one, manual toggle persisted in `localStorage`. Inline `<head>` script sets `data-theme` before first paint (no flash).

Body-text contrast target ≈ **11–13:1** — above WCAG AAA (7:1), well below the harsh 21:1. All pairs validated with WCAG 2 ratio and APCA.

### Tokens

| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | `#181C20` | `#F6F4EF` |
| `--surface` (cards, code) | `#1F2429` | `#ECE9E2` |
| `--border` | `#2C333A` | `#D9D5CC` |
| `--text` | `#D6D3CC` (≈11.3:1) | `#2A2F35` (≈12:1) |
| `--text-muted` | `#9AA3AB` (≈6.7:1) | `#5A6169` |
| `--link` | `#82B4D6` (≈7.7:1) | `#2F6690` |
| `--accent` | `#6FB7A8` | `#2E7D6E` |
| `--note` | `#8FB3D9` | `#2F5F8A` |
| `--warning` | `#D2A86A` | `#8A5A12` |
| `--danger` | `#D48A8A` | `#9A3A3A` |

Light-theme callout colors are starting values; finalize after APCA check.

---

## 3. Typography

- **Base size 18px** — Rello, Pielot & Marcos (CHI 2016): ≥18px improves comprehension on the web.
- **Line height 1.6**, paragraph spacing ≥ 2× font size — satisfies WCAG 1.4.12.
- **Measure ~65–70ch** — Dyson & Haselgrove (2001); Bringhurst: 50–75 cpl optimal. Code blocks may extend wider.
- **Fonts** *(decided 2026-11-11)*: **system stack** — zero bytes, zero font-swap CLS.
  - Text: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - Code: `ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

---

## 4. Cognitive load & UX

- **Scanning, not reading:** users read ~20–28% of words on a page (Nielsen, 2008); concise + scannable + objective text improved usability 124% (Nielsen, 1997). → TL;DR box first, descriptive H2/H3s, short paragraphs, lists, tables.
- **Hick's law:** fewer choices = faster decisions. → One left sidebar category tree, no mega-menus; progressive disclosure (collapsible categories, "On this page" TOC).
- **Information scent:** breadcrumbs everywhere, descriptive link text, prev/next + related at the end.
- **No distractions:** no carousels, popups, autoplay, ads, or cookie banner (site sets no cookies).
- **Motion:** honor `prefers-reduced-motion`; transitions ≤150ms.
- **Accessibility:** WCAG 2.2 AA — skip link, visible focus rings, landmarks, keyboard search (`/` and `Ctrl/Cmd+K`).

---

## 5. Page templates

### Home (`/`)

- Logo + large search box (autofocus) + one-line tagline.
- Compact row of category links (for browsers, not searchers).
- **Random article card** at bottom: build-time article rendered into HTML (crawlable, no-JS safe); tiny inline script swaps in a random one from an embedded list. Fixed card height → zero CLS.

### Article (`/docs/{category}/{slug}/`)

Layout: 3 columns ≥1200px (category tree · content · TOC); single column + nav drawer on mobile.

Order on page:

1. Breadcrumbs
2. H1
3. Meta line: release badge · API version · **Last updated** (`<time datetime>`) · reading time · category · tags
4. TL;DR / Quick answer box (from frontmatter `tldr`)
5. Body (details first)
6. FAQ (from frontmatter `faq`, rendered visibly)
7. Related articles · prev/next
8. "View as Markdown" · "Copy page for AI"
9. Footer disclaimer: *Unofficial. Not affiliated with or endorsed by Salesforce.*

JS budget on article pages: **<3KB** total (theme toggle, code copy buttons, TOC active-section highlight).

### Hubs

- `/docs/{category}/` — category index.
- `/tags/{tag}/` — tag index; `noindex` when the tag has <3 articles (avoid thin pages).
- `/releases/{release}/` — articles per release.

---

## 6. Search — Pagefind *(decided 2026-11-11)*

- Build-time, chunked index; a query downloads only a few KB; works on pure static hosting.
- Google Programmable Search rejected: ~100KB+ third-party JS (hurts CWV), ads on free tier, privacy cost.
- Load Pagefind **only on search focus** — pages stay zero-JS until interaction.
- Filters: category, release, tags, level (via `data-pagefind-filter`).
- Index only article body (`data-pagefind-body`), exclude nav/footer.

---

## 7. SEO & structured data

JSON-LD and visible content are generated from the **same frontmatter**, so they never disagree (Google requires structured data to match visible content).

| Page | JSON-LD |
|---|---|
| All | `WebSite`, `Organization` (publisher, `sameAs` socials), `BreadcrumbList` |
| Article | `TechArticle`: `headline`, `description`, `datePublished`, `dateModified`, `author` (Organization "SFDX Talk Editorial"), `publisher`, `keywords`, `articleSection`, `about`, `proficiencyLevel`, `isPartOf`, `inLanguage` |
| Article FAQ | `FAQPage` → `Question` / `acceptedAnswer` |

Note: since Aug 2023 Google only shows FAQ rich results for authoritative government/health sites. The markup is still valid and is parsed by Bing and AI engines, so we keep it — but don't expect FAQ snippets in Google.

Metadata:

- Unique `<title>` ≤60 chars, meta description ≤160 chars.
- `<link rel="canonical">`, Open Graph, Twitter cards, `article:modified_time`, `article:section`, `article:tag`.
- Default OG image first; build-time per-article OG images later.
- `sitemap.xml` with **accurate `lastmod`** from `lastUpdated` (Google uses `lastmod` only when consistently accurate).
- URLs: lowercase, `/docs/{category}/{slug}/`, consistent trailing slash.
- **IndexNow** ping on each deploy (Bing/Yandex; ChatGPT Search relies heavily on Bing's index).

---

## 8. AI-readiness (GEO)

- **Evidence:** Aggarwal et al., "GEO: Generative Engine Optimization" (KDD 2024) — adding citations, quotations and statistics raised source visibility in generative engine answers by up to ~40%. → CONTENT-SPEC requires concrete numbers, official-doc quotes, and links to official sources.
- **Self-contained, answer-first sections** — AI retrieval works on chunks; each H2 must stand alone.
- **`/llms.txt`** (site map for LLMs) and **`/llms-full.txt`** (full text), per the 2024 llms.txt proposal.
- **Raw Markdown per article** at `/docs/{category}/{slug}.md`, linked via `<link rel="alternate" type="text/markdown">`.
- **All content server-rendered** — most AI crawlers don't execute JS.
- **`robots.txt`** allows: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Bingbot, Applebot-Extended.
- ⚠️ **Cloudflare dashboard action required:** disable AI-crawler blocking ("AI Crawl Control" / "Block AI bots") and Cloudflare's managed robots.txt for sfdxtalk.com. Cloudflare blocks AI crawlers by default on new domains.

---

## 9. Performance budget

| Metric | Target | Google "good" |
|---|---|---|
| LCP | <1.0s (4G) | ≤2.5s |
| CLS | 0 | ≤0.1 |
| INP | <100ms | ≤200ms |
| Lighthouse | 100 ×4 | — |

- HTML + CSS <40KB gzipped per page; CSS inlined (no render-blocking requests).
- Home page: zero JS until interaction.
- Astro prefetch with Speculation Rules (prefetch on hover/viewport) → near-instant navigation.
- Images via `astro:assets`: AVIF/WebP, explicit `width`/`height`, lazy below the fold.
- `_headers`: `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`; HTML → short cache + revalidate.
- CI check: Lighthouse CI + size budget fail the build on regression.

### File-count risk

~3 files per article (HTML, `.md`, Pagefind fragment) + index chunks → ceiling ≈ **5,500 articles** on the free plan's 20,000-file limit. Mitigations when approaching: paid plan (100k files), or move per-article `.md` into per-category `llms-full` bundles.

---

## 10. Implementation phases

1. **Scaffold** — add Astro to the existing Wrangler project; point `assets.directory` at `./dist`; `_headers`, `robots.txt`.
2. **Content layer** — Zod schema from CONTENT-SPEC; 3 sample articles to exercise every field.
3. **Design system** — tokens, typography, theme toggle, base layout, callouts, code blocks.
4. **Templates** — home, article, category/tag/release hubs, 404.
5. **SEO/AI layer** — JSON-LD components, meta, sitemap, `llms.txt`, `.md` endpoints, IndexNow.
6. **Search** — Pagefind integration with lazy loading and filters.
7. **Verification** — Lighthouse CI, Rich Results Test, Schema validator, axe accessibility, APCA contrast audit.
8. **Launch checklist** — Cloudflare AI-crawler setting off, Search Console + Bing Webmaster verified, sitemap submitted.

---

## Open decisions

1. ~~Theme~~ — **decided 2026-11-11:** dark default + respect OS `prefers-color-scheme` + manual toggle.
2. ~~Search~~ — **decided 2026-11-11:** Pagefind, lazy-loaded on search focus.
3. ~~Fonts~~ — **decided 2026-11-11:** system font stack, no web fonts.
4. ~~Author model~~ — **decided 2026-11-11:** single "SFDX Talk Editorial" byline. JSON-LD `author` = the `Organization`. An optional `reviewedBy` field can be added later if real human reviewers join.

All open decisions are resolved.
