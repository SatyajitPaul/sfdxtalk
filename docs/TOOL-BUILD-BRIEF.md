# Tool build brief (read this first)

You are building ONE tool for `/tools/{slug}/` on SFDX Talk (Astro static site, deployed on Cloudflare static assets). Several other agents are building other tools **in the same checkout at the same time**, so follow the file rules exactly.

Read first: `CLAUDE.md`, `docs/TOOLS-PLAN.md` (§10 is the SEO/GEO definition of done), and the two finished tools as your reference implementation:

- Governor limits: `src/pages/tools/governor-limits.astro`, `src/data/governor-limits.ts`, `src/data/tool-exports/governor-limits.ts`
- ID converter (interactive): `src/pages/tools/salesforce-id-converter.astro`, `src/lib/tools/sf-id.ts` (+ `.test.ts`), `src/scripts/id-converter.ts`, `src/data/sf-id-prefixes.ts`, `src/data/tool-exports/salesforce-id-converter.ts`

Also read `src/components/tools/ToolLayout.astro`, `src/lib/tools.ts`, `src/styles/tools.css`, `src/scripts/table-filter.ts`.

## Files: what you may and may not touch

You MAY create (use your tool's slug/name; never overwrite another tool's files):

- `src/pages/tools/{slug}.astro` (the page; it must use `ToolLayout`)
- `src/data/{your-data}.ts` (typed reference data, with source URL and verified date)
- `src/data/tool-exports/{slug}.ts` (auto-discovered; default export is a `ToolExport`, see `src/lib/tool-exports.ts`. Gives the `/tools/{slug}.md` export and sitemap lastmod)
- `src/lib/tools/{name}.ts` and `{name}.test.ts` (pure logic, no DOM; run with `node --test src/lib/tools/{name}.test.ts`; import siblings with the `.ts` extension in tests)
- `src/scripts/{name}.ts` (client script for the page)
- `src/styles/tool-{slug}.css` (your own CSS file, imported in your page frontmatter)

You MUST NOT edit any other existing file. In particular do not edit: `src/lib/tools.ts` (the lead flips `status` to `live`), `src/lib/schema.ts`, `src/components/tools/ToolLayout.astro`, `src/styles/tools.css`, `sitemap.xml.ts`, `llms*.ts`, `package.json`, `docs/*`, or any article. If you need a change in a shared file, do not make it. Describe it in your final report.

Do NOT commit, push, branch or stash. Do NOT run `pnpm build` or `pnpm dev` (concurrent builds corrupt each other). Do not run `pnpm check:budget`.

## How to verify your work

- Run the logic tests: `node --test src/lib/tools/{name}.test.ts`
- Start your own dev server on your assigned port and fetch the page: `pnpm exec astro dev --port <PORT> --host 127.0.0.1 &` then `curl -s http://127.0.0.1:<PORT>/tools/{slug}/`. Check: HTTP 200, exactly one `<h1>`, the `<title>`, the JSON-LD parses (`WebApplication`, `FAQPage`, `BreadcrumbList`), the server-rendered tables/text are present, and `curl http://127.0.0.1:<PORT>/tools/{slug}.md` once the hub marks your tool live is not possible (status is flipped later), so call your export's `markdown()` logic by reasoning/reading, not via the route. Kill your dev server when done.
- Do not use the shared Browser pane (other agents and the lead use it), unless your task says you may. You cannot test client scripts interactively, so keep scripts small and simple, put all non-trivial logic in the tested pure module, and re-read your script for mistakes. Use `node` to exercise the pure logic.

## Conventions (learned the hard way)

- `ToolLayout` props: `slug`, `title` (includes primary query and "| SFDX Talk"), `h1`, `description`, `tldr`, `faq`, `modified`, `source {name,url,release,apiVersion,verified}`. It renders breadcrumbs, H1, "Quick answer", source line, FAQ, related guides, other tools and the disclaimer. Put your content in its default slot. The FAQ you pass is also emitted as FAQPage JSON-LD, so every answer must be true and match what the page shows.
- Today is 2026-11-17. Current Salesforce release: Winter '27, API 68.0. CLI examples use the modern `sf` CLI.
- Server-render everything that matters (explanations, reference tables, examples) so the page works without JS and is quotable by crawlers and AI. The interactive widget is progressive enhancement: wrap it in `<div class="tool-js">` (shown only when `html.js`) and add `<p class="tool-nojs">…</p>` saying it needs JavaScript.
- Filtering a table: reuse `src/scripts/table-filter.ts` with these attributes: wrapper `data-tf data-noun="things"` containing the input and `data-tf-status`; table wrapper `data-tf-section`; rows `data-tf-row` (rows with an `id` are counted). Do NOT use `data-filter` (the site search already uses it).
- Build DOM from user input with `textContent`, never `innerHTML`. Nothing the user pastes may leave the browser. No network calls with user input.
- Keep client JS tiny: no libraries, hand-written code, target under ~6 KB gzipped for your script. The page HTML must stay under 40 KB gzipped, so do not render hundreds of rows into the HTML.
- Accessibility: labels for inputs, `role="status" aria-live="polite"` for result summaries, keyboard operable, dark/light via existing tokens (`var(--surface)`, `var(--border)`, `var(--text-muted)`, `var(--link)`, etc.; see `src/styles/global.css`).
- Style: concise, plain language, no hype. Do not use em dashes. Never imply Salesforce endorsement. No author bylines.

## Data accuracy rules (important)

- Do not invent facts, limits, error codes, method names or URLs. Include a fact only if you are certain or have verified it from an official source. When unsure, leave it out.
- `developer.salesforce.com` returns HTTP 403 to curl and WebFetch. Search with `WebSearch` to confirm facts. Official `atlas.en-us...` doc URLs redirect to the current docs and are acceptable as `source` URLs and `officialRefs`.
- Every data module states its `source` URL, release, API version and `verified` date (`2026-11-17` for what you checked today).
- Advice text (fixes, recommendations) is our own writing. Keep it conservative and correct; label heuristics as heuristics.

## Definition of done

Meet every item in `docs/TOOLS-PLAN.md` §10 that applies: primary query in title/H1, answer-first intro and "Quick answer", at least 400 words of useful unique text beyond the widget, a 5 to 7 question FAQ, worked examples generated from the same code the tool runs, links to related guides and to our other tools (e.g. `/tools/governor-limits/`), markdown export file, tested pure logic.

## Final report (your last message)

Keep it under 250 words: files created, what the tool does, how you verified it, anything you were unsure about or left out, and any change needed in a shared file (the lead applies it). Do not paste code.
