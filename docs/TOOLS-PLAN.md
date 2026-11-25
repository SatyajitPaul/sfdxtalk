# SFDX Talk — `/tools/` Plan

> Companion to [GROWTH-PLAN.md](GROWTH-PLAN.md) §4B. Scope: free, client-side, no-backend, no-sign-in tools under `/tools/{slug}/`.
> Evidence caveat: demand signals come from web search of tool directories, extension listings and dev blogs, not from direct Reddit/Quora reads. Rank tools by Search Console data after launch.

## 1. Market reality (read this first)

Free Salesforce tool sites already exist: sfdcdevelopers.com/tools (SOQL builder, Apex debug log analyzer with flame graph), salesforcedictionary.com/tools (Apex/SOQL formatter, ID converter), sfdctools.pages.dev (SOQL formatter), DevCodex, plus several Chrome extensions. Salesforce Inspector Reloaded, Certinia Apex Log Analyzer and Salesforce's own Code Builder/Vibes cover the logged-in-to-an-org workflow.

So "a SOQL formatter" alone will not win. We win on:

1. **Tool ↔ docs integration.** Every result links to the exact article that explains it (error code → fix guide, limit → limits page, metadata type → type reference). Competitors have tools *or* docs; we have 588 articles to link into.
2. **AI-era angle.** Tools that produce context for AI assistants, check AI-generated Apex, or explain it. Nobody owns this yet.
3. **Trust.** 100% in-browser, no org login, no data leaves the page, no sign-in, stated plainly on each tool. Open source, so claims are verifiable.
4. **Speed and quality.** Static pages, instant load, accessible, works offline (we already have a service worker).

Out of scope for `/tools/`: anything needing an org connection (OAuth) or a backend. Those belong to the MCP server or the extensions people already use.

## 2. What developers look for (job-to-be-done)

| Job | Typical need | Existing alternative |
|---|---|---|
| Write/format queries | Build SOQL with relationships, format ugly one-liners | Inspector, builder sites |
| Debug | Understand a huge debug log, find the SOQL-in-loop | Certinia ALA, log analyzer sites |
| Deploy | Build `package.xml`, figure out what's in a deployment, read a deploy error | Hand-written, `sf project generate manifest` |
| Fix errors | Decode `FIELD_CUSTOM_VALIDATION_EXCEPTION`, `UNABLE_TO_LOCK_ROW`, "Too many SOQL queries: 101" | Google → forum threads |
| Know the limits | Governor limits by API version, which async to pick | Scattered across official docs |
| Data hygiene | 15↔18 char IDs, ID prefix → object, CSV cleanup | Small standalone sites |
| Org migration | Process Builder → Flow, legacy automation audit | Consultants, manual |
| Work with AI | Prompts, rules files, review AI output | Ad hoc |
| Learn / certify | Practice, flashcards, formula help | Trailhead, third-party quiz sites |

## 3. Tool catalog

Priority: **P0** build first, **P1** next, **P2** later/optional. Effort: S ≈ 1–2 days, M ≈ 3–5, L ≈ 1–2 weeks.

### A. Query & code

| # | Tool | What it does | Why it's valuable / our edge | Effort | Pri |
|---|---|---|---|---|---|
| T1 | **SOQL formatter & linter** | Pretty-print SOQL; flag non-selective patterns (leading `%`, `!=`, `NOT IN`, formula fields in WHERE, missing LIMIT, SOQL in loop hints) | Lint hints link to our SOQL articles; teaches, not just formats | M | P0 |
| T2 | **SOQL builder** | Pick object/fields/filters visually from a bundled schema of *standard* objects, output SOQL + Apex-bind version | Offline, no org login; link out to object metadata pages. Custom objects: paste a describe JSON | L | P1 |
| T3 | **SOQL ↔ Apex converter** | Turn SOQL into `Database.queryWithBinds`, `WITH USER_MODE` Apex snippet, or a REST URL; escape strings safely | Promotes injection-safe, user-mode code | S | P1 |
| T4 | **Apex formatter / beautifier** | Re-indent Apex | Commodity, low differentiation. Only build if cheap | M | P2 |
| T5 | **Apex bulk-safety checker** | Paste Apex; static heuristics for SOQL/DML in loops, missing `with sharing`, hard-coded IDs, no bulk handling in triggers, one-trigger-per-object issues | Links each finding to the fix guide; "review AI-generated Apex" positioning | L | P0 |
| T6 | **Test class skeleton generator** | Paste a class/trigger signature → skeleton test with data factory pattern, `Test.startTest`, assertions placeholders | High demand, pairs with Testing content | M | P1 |
| T7 | **Regex/formula helper for Salesforce** | Validation-rule/formula tester with common function reference, including `REGEX`, `TEXT`, `ISPICKVAL` | Formula help is perennial; needs a careful evaluator; limit scope to syntax check and examples first | L | P2 |

### B. Debugging

| # | Tool | What it does | Edge | Effort | Pri |
|---|---|---|---|---|---|
| T8 | **Debug log analyzer** | Paste/drag a `.log`; show limit usage gauges, SOQL/DML counts, slowest methods, exceptions, flame/timeline | Crowded space. Differentiate with "explain this limit hit" links and a plain-English summary block; strictly in-browser; large-file handling via streaming/Web Worker | L | P0 |
| T9 | **Error message decoder** | Search/paste an error → cause, fix, example, related docs. Also the SEO page set (`/tools/errors/{code}/`) | Doubles as a content engine and highest search-intent tool | M (tool) + content | P0 |
| T10 | **Stack trace / exception explainer** | Paste `System.QueryException` / `LimitException` stack trace → what it means and where to look | Natural extension of T9; share the error dataset | S | P1 |
| T11 | **Deploy error decoder** | Paste `sf project deploy` output → group failures by cause (missing dependency, test coverage, FLS, API version) | Deploy pain is universal; pair with DevOps content | M | P1 |

### C. Metadata & deployment

| # | Tool | What it does | Edge | Effort | Pri |
|---|---|---|---|---|---|
| T12 | **package.xml builder** | Choose metadata types (from our 573 pages), members or `*`, API version → download `package.xml`; also the `sf project retrieve` command | Our corpus is the moat; each type links to its page. Warn about wildcard gotchas per type | M | P0 |
| T13 | **package.xml / manifest viewer & merger** | Paste XML → tree view, diff two manifests, merge, dedupe, sort | Cheap, frequent need; no one links types to docs | S | P1 |
| T14 | **Metadata type finder** | "I want to deploy X" → which type/folder/file suffix | Answers a real question people Google; uses frontmatter | S | P1 |
| T15 | **`sf` command builder / cookbook** | Pick task → get exact modern `sf` command with flags; legacy `sfdx` mapping | Helps the sfdx→sf transition; ties to CLI guides | M | P1 |
| T16 | **Metadata XML ↔ JSON/YAML viewer** | Readable view of a profile/permission-set/flow XML | Nice-to-have, mostly viewing | M | P2 |
| T17 | **Permission set / profile diff** | Diff two XML files, highlight added/removed perms | High value for admins and devs; accuracy matters | L | P2 |

### D. Limits & decisions

| # | Tool | What it does | Edge | Effort | Pri |
|---|---|---|---|---|---|
| T18 | **Governor limits reference** | Searchable table of per-transaction and org limits, sync vs async, by API version; each row cited and dated | Authoritative, versioned, quick. Direct SEO target ("salesforce governor limits") | M | P0 |
| T19 | **Which async Apex?** | Decision wizard: Future / Queueable / Batch / Scheduled / Platform Events / CDC → recommendation with trade-offs and code link | Strong shareable, evergreen | S | P0 |
| T20 | **Flow vs Apex vs Process Builder (legacy) chooser** | Questionnaire → recommendation | Fits PB→Flow migration wave | S | P1 |
| T21 | **API chooser** | REST vs SOAP vs Bulk 2.0 vs Composite vs GraphQL vs Pub/Sub; volume/latency inputs | Integration architects ask this constantly | S | P1 |
| T22 | **Callout & API-limits calculator** | Estimate daily API calls, Bulk batches, async jobs from volume | Useful for sizing integrations | M | P2 |

### E. Data & IDs

| # | Tool | What it does | Edge | Effort | Pri |
|---|---|---|---|---|---|
| T23 | **Salesforce ID tools** | 15→18 checksum, 18→15, bulk list, ID prefix → object key (e.g. `001` = Account), validate | Small, high-frequency utility. Quick win; many sites have it, so ship it as part of the suite, not a headline | S | P0 |
| T24 | **CSV cleaner for Data Loader** | Trim, dedupe, fix encoding/dates for import; map columns | Pain point for admins/devs; keep strictly in-browser | M | P2 |
| T25 | **Date/time & timezone helper** | SOQL date literals, DateTime formats, timezone gotchas | Frequent confusion; static examples plus calculator | S | P2 |
| T26 | **JSON ↔ Apex class generator** | Paste JSON → Apex wrapper class with `JSON.deserialize` boilerplate | Very commonly searched | M | P1 |

### F. AI-era tools (our differentiator)

| # | Tool | What it does | Edge | Effort | Pri |
|---|---|---|---|---|---|
| T27 | **AI context pack builder** | Choose topics (Apex, LWC, SOQL, security, API version) → download a tailored `CLAUDE.md` / `.cursorrules` / Copilot instructions file | Directly useful, linkable, evergreen; pairs with rules pack in GROWTH-PLAN A3 | M | P0 |
| T28 | **Prompt library & builder** | Pick a task (write trigger, test, review, migrate PB→Flow) → ready-to-paste, tested prompt with variables | Ties to prompt library A4 | M | P1 |
| T29 | **"Check AI-generated Apex"** | Paste AI output; checks for known hallucinations (non-existent methods, deprecated APIs, wrong limits) plus T5 heuristics | Unique. Needs a curated hallucination list (GROWTH-PLAN A5) | L | P1 |
| T30 | **Agentforce prompt/action checker** | Lint topic instructions and action descriptions for ambiguity/length/overlap | Early niche; high interest given Agentforce confusion. Hard to validate rules | L | P2 |
| T31 | **Token & context estimator** | Approx tokens for a pasted file/log, to know what fits in an AI context window | Cheap, useful with big debug logs | S | P2 |

### G. Learning & careers

| # | Tool | What it does | Effort | Pri |
|---|---|---|---|---|
| T32 | **Cert exam planner** | PD1/PD2/Agentforce cert: topics weights, readiness checklist, linked guides. No dumps, no copied exam content | M | P2 |
| T33 | **Release notes dev diff** | Pick two releases → developer-relevant changes by category (API version aware). Needs maintained data | L | P1 (Feb, Spring '27) |

## 4. Recommended launch order

**Wave 1 (Dec — 6 tools, mostly S/M):**
T18 governor limits reference, T19 async chooser, T23 ID tools, T1 SOQL formatter/linter, T12 package.xml builder, T9 error decoder (first 40 errors).

**Wave 2 (Jan):**
T27 AI context pack builder, T5 Apex bulk-safety checker, T8 debug log analyzer, T13 manifest viewer/merger, T14 metadata type finder, T20/T21 choosers.

**Wave 3 (Feb):**
T29 AI-Apex checker, T33 release diff, T11 deploy error decoder, T26 JSON→Apex, T6 test skeleton, T15 `sf` command builder.

Decide P2s after measuring wave 1–2 usage.

## 5. Technical approach

**Routing and structure**
- `src/pages/tools/index.astro` (hub) and `src/pages/tools/{slug}.astro` per tool. Keep `trailingSlash: 'always'`.
- Shared `src/components/tools/*` (ToolShell, CopyButton, FileDrop, ResultCard) and pure-logic modules in `src/lib/tools/*` (parsers, linters) so logic is unit-testable and reusable by the MCP server.
- Tool data (limits table, error dataset, ID prefixes, hallucination list) lives in typed files or Markdown/JSON under `src/data/tools/` with source URL, API version and `lastVerified` on every record. Build fails if a record lacks them.
- Error decoder and limits pages should be statically rendered per entry for SEO, with the interactive search layered on top.

**Performance budget** (important: the current check is wrong for tools)
- `scripts/check-budget.mjs` limits total `_astro` JS to 6 KB, which tool bundles will break. Split the budget: **content pages keep today's limits; `/tools/*` pages get a separate per-tool cap** (suggest ≤ 60 KB gzipped JS, loaded only on that tool's page, never on article pages). Update `docs/PLAN.md` §9 when this lands.
- Lazy-load heavy parts (log parsing in a Web Worker; no big libraries — hand-roll parsers).
- Lighthouse CI should include at least the hub and two tool pages.

**Privacy & safety**
- No network calls with user input. State "runs in your browser; nothing is uploaded" and make it true: no analytics events containing pasted content (GTM must not capture input values).
- Warn on log/analyzer tools not to paste secrets/PII; process in memory only; no `localStorage` of pasted data unless the user opts in.
- Don't invent limits or errors. Every data row cites the official source and date; mark unverified rows or leave them out.

**SEO/AI**
- Each tool page: unique title/description, a short "how to use" and FAQ (matches `FAQPage` convention), `SoftwareApplication`/`WebApplication` JSON-LD (free, browser) built from page metadata, and 2–3 related articles.
- Add tools to sitemap, `llms.txt` and the hub; make the data behind tools available as JSON/markdown so AI assistants can cite the reference (limits, IDs, errors).
- Reuse tool logic in the MCP server later (`lookup_limit`, `decode_error`, `convert_id`, `build_package_xml`).

**Quality bar per tool (definition of done)**
1. Works offline, keyboard accessible, mobile-friendly, dark/light.
2. Has sample input button and "copy result" button.
3. Links its output to relevant articles.
4. Has unit tests or fixture-based checks for the parsing/linting logic (the repo has no test suite today; add a minimal one for `src/lib/tools`).
5. Passes `pnpm build`, `check:budget`, Lighthouse.
6. No data leaves the browser.

## 6. Metrics

| Metric | Target by end of month 3 |
|---|---|
| Tools live | 15+ (wave 1–2 complete) |
| Tool page organic clicks | 30% of total organic |
| Tool "success" events (result copied/downloaded) | 3,000/week |
| Tool → article click-through | ≥ 15% of tool sessions |
| Inbound links to tools | 20+ referring domains |
| Returning visitors on tool pages | ≥ 25% |

Track only anonymous aggregate events (tool name, action) — never inputs.

## 7. Risks

- **Crowded category.** Many free tools exist; low-effort clones won't rank. Focus on integrated, trustworthy, AI-era tools and the error/limits data sets.
- **Wrong output damages trust** (bad lint rule, outdated limit). Cite sources, date everything, keep rule sets small and conservative, label "heuristic".
- **Bundle bloat** violates the performance goal. Enforce the per-tool budget in CI.
- **Maintenance burden** (limits and errors change each release). Add `lastVerified` checks and a release-time review step.
- **Privacy claims.** Never log pasted content; review GTM config.
- **Scope creep into org-connected features.** Keep those out of `/tools/`.

## 8. Open questions

1. Are you comfortable adding a small automated test setup for `src/lib/tools`, since there is none today?
2. Should the metadata corpus be exposed as structured data (JSON) to power T12/T14, or derive at build from frontmatter?
3. Which 6 tools do you want in wave 1? The proposed set is T18, T19, T23, T1, T12, T9.
4. Do you want a shared, branded look for tools (distinct from articles), or the same components?

## 9. Build queue (one tool at a time)

Registered in `src/lib/tools.ts` (`order`). The hub at `/tools/` is built and stays `noindex` until the first tool's status is set to `live`; it then joins the sitemap, `llms.txt`, footer and JSON-LD automatically.

| Order | Tool | Primary query (title/H1) | Why this order |
|---|---|---|---|
| 1 | Governor Limits Reference | salesforce governor limits | Highest search volume, pure static data, proves the tool template |
| 2 | ID Converter (15↔18) | salesforce 15 to 18 digit id converter | Tiny logic, steady daily demand, quick second win |
| 3 | SOQL Formatter & Checker | soql formatter | High volume; checker hints differentiate from clones |
| 4 | Error Message Decoder | salesforce error message meaning and fix | Highest intent; also spawns per-error pages |
| 5 | package.xml Generator | salesforce package.xml generator | Uses our 573 metadata pages, the strongest moat |
| 6 | Async Apex Chooser | future vs queueable vs batch apex | Evergreen, shareable, cheap |
| 7 | AI Context File Generator | claude.md for salesforce development | AI-era differentiator, linkable |
| 8 | Apex Bulk-Safety Checker | apex code review checker governor limits | Needs careful rules, so after the data tools |
| 9 | Debug Log Analyzer | salesforce debug log analyzer | Largest build, crowded space; after we have traction |
| 10 | package.xml Viewer/Diff/Merge | merge package.xml files | Reuses tool #5 code |

## 10. Per-tool SEO and GEO contract (definition of done)

Every tool page must have all of these before its status becomes `live`:

**Search (SEO)**
1. Title and H1 built around the tool's primary query; unique meta description; self-referencing canonical; trailing-slash URL `/tools/{slug}/`.
2. A server-rendered answer-first intro (2–3 sentences) and a "How to use" section in plain HTML, so the page is useful and indexable with JS off.
3. At least 400 words of unique, useful text beyond the widget: explanation, worked examples, common mistakes.
4. Visible FAQ of 4–6 real questions, mirrored as `FAQPage` JSON-LD.
5. JSON-LD `WebApplication` (free, browser, `applicationCategory: DeveloperApplication`) plus `BreadcrumbList`, linked into the site `@graph`. Never claim ratings or features the page does not show.
6. 3+ contextual links to related guides and 2+ to other tools; the tool is linked from the related guides.
7. Static 1200×630 share image per tool; listed in sitemap with an honest `lastmod`.

**AI answers (GEO)**
8. Reference-data tools (limits, error decoder, ID prefixes) also ship the data as static server-rendered text and a `.md`/JSON export, so assistants can quote it without running JS.
9. Every data row states its source URL, Salesforce release and API version; the page shows "Last verified".
10. A `.tldr` quick-answer block (the site's speakable selector) at the top.
11. Listed in `llms.txt` under Tools; `llms-full.txt` includes the tool's text and data.
12. Entity-clear wording: "Salesforce", the exact feature names, and the unofficial disclaimer.

**Quality and trust**
13. Works with JS disabled for the explanatory content; widget loads lazily and stays within the per-tool JS budget.
14. No network call carries user input; GTM never receives input values.
15. Tested logic fixtures, accessible, mobile-friendly, dark and light.

## 11. Known issue: HTML budget is already failing

`pnpm check:budget` currently fails on three existing pages (`/releases/winter-27/` 53.7 KB, `/docs/metadata/` 51.5 KB, `/tags/metadata/` 43.2 KB gzipped, limit 40 KB). They list the 573 metadata types on one page. This was not caused by the tools hub, but CI will flag it. Fix by paginating or collapsing those hub lists, or by raising the limit for hub pages only.

## 12. Status

| # | Tool | Status |
|---|---|---|
| 1 | Governor Limits Reference | **Live** (Winter '27 data, checked 2026-11-17). Data in `src/data/governor-limits.ts`; re-verify each release |
| 2 | Salesforce ID Converter | **Live**. Logic in `src/lib/tools/sf-id.ts` (tested with `pnpm test`), prefixes in `src/data/sf-id-prefixes.ts` |
| 3 | SOQL Formatter & Checker | **Live** (`src/lib/tools/soql.ts`, 23 tests) |
| 4 | Error Message Decoder | **Live** (45 curated errors, `src/data/salesforce-errors.ts`) |
| 5 | package.xml Generator | **Live** (571 metadata types via `/tools/package-xml-types.json`) |
| 6 | Async Apex Chooser | **Live** (limits read from `governor-limits.ts`) |
| 7 | AI Context File Generator | **Live** (49 rules, 4 targets) |
| 8–10 | Apex Bulk-Safety Checker, Debug Log Analyzer, Manifest Diff/Merge | Planned |

Open items from the §10 contract for tool #1: per-tool share image (uses the default site image for now) and a link to the tool from related articles (needs article `related` support for tools).

Data-source note: developer.salesforce.com blocks plain HTTP fetches (403). Re-verify limits by opening the page in a real browser and comparing the tables. The current URL is `/docs/platform/apex-dev/references/apex-dev/apex-gov-limits.html`.

Tool #2 note: the key-prefix table is compiled from commonly published lists cross-checked against Salesforce Help, not from one official table. The page tells readers to confirm in their own org. Add a prefix only when certain.

Tools #3 to #7 were built by parallel agents following `docs/TOOL-BUILD-BRIEF.md` (each tool adds only its own files; the markdown export is auto-discovered from `src/data/tool-exports/`). Lead review checked: all source URLs resolve to the intended official pages, client scripts exercised in a browser, 68 logic tests pass.

Budget: `check:budget` now measures JS per page (6 KB normal, 24 KB for `/tools/`). The three oversized metadata hub pages still fail the HTML limit.

Needs a human decision/check: error-decoder Apex and deployment message wording comes from well-known wording, not an opened official page; the SOQL linter's 50-field threshold is our own heuristic.
