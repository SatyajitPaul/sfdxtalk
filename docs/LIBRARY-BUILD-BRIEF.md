# Skills and prompts build brief (read this first)

You are writing CONTENT for the SFDX Talk skills library (`/skills/`) or prompt library (`/prompt/`). The pages, routes, zip download, JSON-LD, sitemap and llms exports already exist and are driven entirely by the files you create. Other agents write other items **in the same checkout at the same time**, so follow the file rules exactly.

Read first: `CLAUDE.md`, `src/lib/skills.ts` (SkillMeta), `src/lib/prompts.ts` (PromptMeta), and the finished reference items you must imitate in structure, depth and tone:

- Skill: `src/skills/soql-query-assistant/` (`SKILL.md`, `references/soql-checklist.md`, `meta.ts`)
- Prompt: `src/prompts/generate-apex-trigger-handler.ts`

Also read the existing site articles you will rely on and link to (they document the Salesforce MCP tool names): `src/content/docs/agentforce/sobject-and-headless-mcp-servers.md`, `hosted-mcp-servers-setup.md`, `analytics-and-data-cloud-mcp-servers.md`, and `src/content/docs/sf-cli/salesforce-cli-reference-guide.md`.

## Files: what you may and may not touch

You MAY create only the files for the items assigned to you:

- Skill `{slug}`: `src/skills/{slug}/SKILL.md`, `src/skills/{slug}/meta.ts`, and optional `src/skills/{slug}/references/*.md` (and `scripts/*` only if truly needed and tested). Everything except `meta.ts` ships in the downloadable zip.
- Prompt `{slug}`: `src/prompts/{slug}.ts` (default export `PromptMeta`).

Do NOT edit any other file (no shared lib, pages, styles, `package.json`, docs, other items). Do not commit, push or branch. Do NOT run `pnpm build` or `pnpm dev` (other agents share the checkout). Do not use the Browser pane.

## Validate your work

Run `pnpm check:library` until it passes (it validates all items and all `related` ids, without a build). Run it again at the end. Fix every problem it reports for YOUR items; if it reports a problem in someone else's item, ignore it.

`related` rules: `tools` must be live tool slugs: `governor-limits`, `salesforce-id-converter`, `soql-formatter`, `salesforce-error-decoder`, `package-xml-generator`, `async-apex-chooser`, `ai-context-file-generator`. `docs` must be real article ids: `agentforce/analytics-and-data-cloud-mcp-servers`, `agentforce/custom-mcp-servers-and-tools`, `agentforce/hosted-mcp-servers-setup`, `agentforce/models-api-and-genai`, `agentforce/sobject-and-headless-mcp-servers`, `apex/cpq-api-servicerouter`, `apex/trigger-handler-pattern`, `apis/pubsub-api-eventbus`, `devops/salesforce-code-analyzer`, `integration/named-credentials-callouts`, `lwc/call-apex-from-lwc`, `sf-cli/create-scratch-org`, `sf-cli/salesforce-cli-reference-guide`. Related skills and prompts must use only these agreed slugs (they will all exist): skills `soql-query-assistant`, `salesforce-org-explorer`, `apex-code-reviewer`, `flow-explainer`, `process-builder-to-flow-migration`; prompts `generate-apex-trigger-handler`, `write-apex-test-class`, `review-apex-governor-limit-risks`, `convert-process-builder-to-flow`, `explain-a-salesforce-flow`. Link only where it genuinely helps the reader (2 to 4 links per group is plenty).

## Accuracy rules (important)

- Do not invent facts, Salesforce features, limits, tool names, CLI flags, API names, metadata fields or URLs. Include something only if you are certain or verified it with `WebSearch`. If unsure, leave it out or say the skill should check (for example `sf <command> --help`).
- MCP tool names: use only those documented in the site articles above (`getObjectSchema`, `soqlQuery`, `find`, `getUserInfo`, `listRecentSobjectRecords`, `getRelatedRecords`, `createSobjectRecord`, `updateSobjectRecord`, `deleteSobjectRecord`, Headless 360 `discover`/`describe`/`dispatch_readonly`, etc.). Describe tools by what they do so the skill still works with a differently named tool.
- `developer.salesforce.com` returns 403 to curl and WebFetch. Official `atlas.en-us...` URLs are fine as `refs`. Use `WebSearch` to confirm facts.
- Current release: Winter '27, API 68.0. CLI examples use the modern `sf` CLI. Today is 2026-11-17 (`published` and `updated`).
- Every skill that touches an org must be read-only by default. Anything that can change data or metadata must require explicit user confirmation for each change and be described as such in `safety`. Prefer skills that never write.

## Writing rules

- Plain, direct language. No hype. No em dashes. Never imply Salesforce endorsement. No bylines.
- Skills: `SKILL.md` frontmatter has `name` (= folder), a SINGLE-LINE `description` of 80 to 1024 characters saying WHAT it does AND WHEN to use it (this is what the assistant matches on), `license: MIT`, and `metadata` with `version` and `publisher`. Body under 500 lines: connection (MCP first, `sf` CLI second, no connection last), a numbered workflow, hard rules, output format. Put long checklists in `references/*.md` and refer to them from SKILL.md. The skill must be genuinely useful to an assistant, with concrete steps and real commands, not generic advice.
- `meta.ts` (skill) is the human-facing page: `summary` is an answer-first 2 to 3 sentences; `does`/`whenToUse`/`howItWorks`/`tryAsking` each at least 3 concrete items; `safety` lists the guards actually in SKILL.md; 5 FAQ items with true answers; `description` 90 to 170 characters. The FAQ and page copy must match what SKILL.md really says.
- Prompts: the `prompt` text must be a strong, reusable prompt with `{{placeholders}}`; every placeholder declared in `variables` and every variable used. Examples must be realistic Salesforce scenarios.

## Prompts: the known-good output must be real

For each prompt, actually carry out the task yourself with the prompt filled with the example values, exactly as an assistant would, and put the result in `output.body`. Then review that output line by line against your own `checklist` and fix mistakes in the output (or the prompt) until it passes. Code and metadata must be correct and realistic. Never paste placeholder or hand-wavy output. In `tested`: `model` is `Claude Sonnet 5.5`, `date` is `2026-11-17`, `method` states literally what was done (ran with the example values, reviewed against the checklist), and `notVerified` states honestly what was NOT verified (for example: not compiled or deployed in an org). Do not claim testing that did not happen. `caveats` must be real limits, not filler.

## Final report (your last message)

Under 200 words: files created, what each item does, how you verified it (`pnpm check:library` result), facts you were unsure about or left out. No code.
