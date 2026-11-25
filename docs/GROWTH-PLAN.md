# SFDX Talk — 3-Month Organic Growth Plan

> Written Nov 2026 from a product-manager view. Window: **Dec 2026 – Feb 2027** (covers the Spring '27 release, expected Feb 2027).
> Evidence caveat: the forum research behind this was secondhand (aggregator digests, SalesforceBen, community threads); Reddit/Quora/Stack Exchange could not be read directly. Validate every theme with a real keyword tool and Search Console before committing big content spend.

## 1. Where we are

- ~588 articles, but **573 are auto-style Metadata API type references** and only ~13 are hand-written guides (Agentforce 5, Apex 2, APIs 2, SF CLI 2, LWC 1, Data Cloud 1, DevOps 1, Integration 1).
- Categories declared in `taxonomy.ts` with **zero articles**: aura, soql-sosl, testing, flow, security.
- Strong technical base: static/fast, JSON-LD, `llms.txt`, `llms-full.txt`, per-article `.md`, Pagefind search, offline SW, GTM just added, Giscus ready.
- Strong asset: the Agentforce/MCP set is early and few competitors cover it well.

**Diagnosis:** we are a reference library. Developers go to Google/AI with a *problem* ("why does my trigger hit CPU limit", "Agentforce topic not routing"), not a metadata type name. Reference pages rank for long-tail only; they will not make us the go-to site. We need to own **problem-solving and AI-era workflows**, and use the metadata corpus as the moat that links them together.

## 2. What developers are struggling with (themes)

| Theme | Signal | Our angle |
|---|---|---|
| Agentforce is confusing: setup convoluted, docs weak, cost/TCO unclear | r/Salesforce digest, "Agentforce Confusion" thread, Register piece on Agentforce replacing help search | Plain-English Agentforce developer guides, debugging, cost explainers |
| Official help search replaced by AI results, people can't find precise answers | The Register (Oct 2025) | Fast, exact, cited reference with search that works |
| Governor limits, bulk-safety, trigger recursion, async choice | Perennial top dev pain point across blogs/forums | Decision guides, "why did I hit X" troubleshooters |
| Legacy automation (Process Builder, tangled Flows) blocks AI adoption | r/Salesforce digest | Migration and "AI-readiness" playbooks |
| Sandbox/prod mistakes, undocumented inherited orgs, deployment pain | r/Salesforce digest | Org-audit and safe-deploy checklists, metadata dependency explainers |
| Senior devs already use Claude Code/Cursor/Copilot; Salesforce's own Vibes is one option among many | r/Salesforce analysis (Mar 2026) | Tested prompts, rules files, MCP setups for Salesforce work |
| Junior market crowded; cert path unclear (PD1/PD2, Agentforce certs now in job posts) | Job posts, Trailblazer threads | Honest career/cert roadmaps and practice-grade explainers |
| Storage overage bills, Data Cloud ingestion errors | r/Salesforce digest | Troubleshooting guides (lower priority) |

## 3. Strategy: four pillars

1. **Fix-it content** — problem-first guides and error-message pages. Highest SEO yield.
2. **AI-era toolkit** — things developers paste into Claude/Cursor/Copilot. Highest differentiation and link magnet.
3. **Interactive tools** — small, free, client-side utilities. Highest repeat usage.
4. **Community loop** — contributions, answers on forums, release coverage. Highest compounding.

Guardrails unchanged: no Salesforce endorsement implied, no copying official docs, no author bylines, `pnpm build` must pass.

## 4. Feature backlog (what to build)

### A. AI-era features (our differentiator)

| # | Feature | What it is | Effort | Why |
|---|---|---|---|---|
| A1 | **Salesforce docs MCP server** | Remote/read-only MCP exposing our articles + metadata types so Claude/Cursor/Copilot can look up accurate, versioned answers. Static JSON index first, thin Worker later. | M | Devs already use AI IDEs and MCP; being the grounding source = distribution via every AI tool |
| A2 | **Copy for AI** button on every article | One click: copy clean markdown + frontmatter + source URL. Already have `.md` endpoints, so this is mostly UI. | S | Cheap, immediately useful, shareable |
| A3 | **Rules/skills pack** | Downloadable `CLAUDE.md`, `.cursorrules`, Copilot instructions for Apex, LWC, SOQL, bulkification, security (user mode, FLS). Versioned in-repo. | S | Evergreen, linkable, people bookmark and share |
| A4 | **Prompt library** | Tested prompts: generate trigger handler, write test class, review for governor risks, convert PB→Flow, explain a Flow. Each with a known-good output and caveats. | M | High search + social interest |
| A5 | **Hallucination guard pages** | "AI gets this wrong" notes: deprecated APIs, non-existent methods, wrong limits, with the correct answer. | S | Unique, honest, builds trust with AI users |
| A6 | **Agentforce debugging hub** | Topic routing failures, action errors, Prompt Builder grounding, testing agents, cost model. | M | Most-confused area, thin competition |

### B. Interactive tools (client-side, no backend, small JS)

Respect the 40KB page budget by lazy-loading each tool on its own page.

| # | Tool | Notes |
|---|---|---|
| B1 | **package.xml generator / metadata type picker** | Built on our 573 type pages; strongest use of the existing corpus |
| B2 | **Governor limits cheat sheet + "which async should I use" decision tree** | Limits sourced from official docs with citations and API version |
| B3 | **SOQL formatter / validator / query-plan hints** | Paste-and-format; links to relevant guides |
| B4 | **Apex log/stack-trace explainer** | Paste a debug log, highlight limit usage, DML in loops. Client-side only; warn not to paste secrets |
| B5 | **Salesforce error-message decoder** | Search "FIELD_CUSTOM_VALIDATION_EXCEPTION" etc. → cause + fix. Doubles as an SEO page set |
| B6 | **Release diff for devs** | Spring '27 vs Winter '27 developer-relevant changes by category, API-version aware |
| B7 | **Flow/PB migration checklist generator** | Questionnaire → tailored plan |

### C. Site/product improvements

- **Metadata type enrichment**: add a "Real-world example", "Common deployment errors" and "Used by" backlinks to the top ~50 types by traffic. Auto-style pages alone are thin.
- **Problem-first navigation**: homepage "I want to…" paths (fix an error, learn Agentforce, deploy safely, prepare for cert) alongside the category list.
- **Version-aware content**: show "Verified for Winter '27 / API 68.0" badge and a stale-content flag after 2 releases.
- **Better related-content**: link metadata types ↔ guides ↔ errors ↔ tools.
- **Newsletter** (weekly, plain-text): one fix, one tool, one release note. Needed for owned audience.
- **Content health**: automated link checker and freshness report in CI.
- Turn on **Giscus** moderation and an "Ask / suggest an article" form.

## 5. Content plan

Target **~60 new hand-written pieces in 12 weeks** (5/week), prioritising empty categories. Every piece: answer in first 2 sentences, TL;DR, working code, FAQ matching real question phrasing.

| Cluster | Examples (working titles) | Count |
|---|---|---|
| Apex fixes | Too many SOQL queries: 101, CPU time limit, mixed DML, trigger recursion, choosing Queueable/Batch/Future, bulkification patterns | 12 |
| Testing (empty category) | Test data factory, mocking callouts, `Test.startTest` pitfalls, coverage myths, Jest for LWC | 8 |
| SOQL/SOSL (empty) | Selective queries, indexes, relationship queries, aggregate, SOQL in Apex vs `Database.query` safety | 6 |
| Flow dev view (empty) | Invocable Apex, Flow vs Apex decision, PB→Flow migration, Flow error debugging | 6 |
| Security (empty) | `WITH USER_MODE`, CRUD/FLS, sharing keywords, secure callouts | 5 |
| Agentforce/AI | Agentforce setup walkthrough, topic/action design, debugging, Prompt Builder grounding, cost model, testing agents, MCP+Claude/Cursor setup | 12 |
| DevOps/CLI | Safe deploy checklist, delta deploys, scratch vs sandbox, CI with GitHub Actions, `sf` command cookbook | 8 |
| Career/cert | PD1/PD2 roadmap, Agentforce cert path, portfolio for junior devs | 3 |

Plus: **error-message pages** (target 100 common errors, templated, reviewed) and a **release-notes dev digest** per release.

## 6. 12-week roadmap

### Month 1 (Dec) — Foundation and quick wins
- Week 1: Check Search Console after the SEO fixes (indexing, noindex, soft 404). Set baseline: impressions, clicks, indexed pages, top queries. Decide KPIs.
- Week 1–2: **A2 Copy for AI**, **A3 rules pack v1**, homepage "I want to…" paths.
- Week 2–4: Publish 20 articles (Apex fixes, Testing, Agentforce debugging first).
- Week 3–4: **B2 governor limits cheat sheet + async decision tree** (tool #1).
- Week 4: Start answering questions on r/SalesforceDeveloper, Salesforce Stack Exchange and Trailblazer, linking only when it genuinely answers. No spam. Disclose affiliation.
- Ship the newsletter signup (even if only a form + weekly manual send).

### Month 2 (Jan) — AI differentiation
- **A1 MCP server v1** (static index, read-only) + guide "Use SFDX Talk as context in Claude/Cursor".
- **B1 package.xml generator**, **B5 error decoder** with first 40 errors.
- Publish 25 more articles (SOQL, Flow, Security, Agentforce).
- **A4 prompt library** with 15 tested prompts; **A5 hallucination guard** series.
- Enrich top 50 metadata type pages.
- Launch publicly: Show on Hacker News/Reddit only if tool/MCP is genuinely good; post on LinkedIn; submit to MCP registries/lists and AI-tool directories.

### Month 3 (Feb) — Scale and compound
- **Spring '27 release coverage**: dev digest within 48h of release notes, `releases/spring-27` hub, release diff (B6).
- B3 SOQL tool, B4 log explainer, B7 migration checklist.
- Publish 20 more articles and error pages up to 100.
- Add contributor program: "good first article" issues, recognise contributors, quarterly contributor list.
- Review what ranks; double down on the top 3 clusters, prune or merge the rest.
- Decide on month 4+: video/YouTube, partnerships with Salesforce community creators, a real search-grade backend for the MCP server.

## 7. Distribution (organic only)

1. **Answer, don't advertise**: forum answers that fully solve the problem, with the link as optional depth.
2. **AI search presence**: keep `llms.txt` current, cite sources in articles, structured FAQs; test queries in ChatGPT/Perplexity/Claude monthly and log whether we're cited.
3. **MCP + rules pack** listed in community MCP directories and GitHub topics (`salesforce`, `mcp`, `apex`).
4. **Release moments**: Salesforce releases (Spring '27) and TDX/Dreamforce are traffic spikes; be first with developer-focused digests.
5. **Open-source flywheel**: repo is public, CC BY content. Make contributing trivial; credits show on pages.
6. **Social**: LinkedIn and X posts built from each tool/article, one insight per post.

## 8. Metrics

| Metric | Baseline (Dec wk1) | Month 1 | Month 2 | Month 3 |
|---|---|---|---|---|
| Indexed pages | measure | +all new | | |
| Organic clicks/week | measure | 2x | 4x | 8x |
| Non-metadata page share of traffic | measure | 30% | 50% | 60% |
| Tool uses/week | 0 | 100 | 500 | 2,000 |
| Newsletter subs | 0 | 50 | 250 | 750 |
| AI citations (manual monthly check) | measure | track | track | +3 queries |
| MCP installs/GitHub stars | 0 | — | 50 | 200 |
| External contributors (merged PRs) | measure | 2 | 6 | 12 |

Targets are starting guesses; reset after the baseline.

## 9. Risks

- **Thin or inaccurate content** harms trust and rankings. Every code sample must be tested; label API version.
- **AI-generated bulk pages** can trigger quality filters. Keep human review; prefer fewer, deeper pages.
- **Salesforce docs changes** make content stale. Version badges and a freshness report are required.
- **Overbuilding tools** before demand is proven. Ship each tool as one page, measure, then invest.
- **Scope creep on MCP**: start as static, read-only.
- **Forum self-promotion** backfires. Value first, disclose, follow each community's rules.

## 10. Decisions needed

1. Is Search Console set up and verified so we can baseline now?
2. Who writes/reviews content (you, agents, community) and what's the review bar?
3. MCP server: static JSON first (recommended) or Worker from the start?
4. Newsletter provider (Buttondown/Resend/Substack) and privacy stance.
5. Appetite for a small paid/ad-free sponsor model later, which affects trust positioning.
