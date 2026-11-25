# Skills and prompts library

Two content libraries sit beside the docs and tools: **/skills/** (downloadable Agent Skills for working with Salesforce through an MCP connection or the `sf` CLI) and **/prompt/** (tested prompts with a known-good output and caveats). Both are data-driven: adding an item means adding files, never editing a shared file.

| URL | Source |
|---|---|
| `/skills/` | hub (`src/pages/skills/index.astro`) |
| `/skills/{slug}/` | page, from `src/skills/{slug}/meta.ts` + `SKILL.md` |
| `/skills/{slug}.zip` | zip of the skill folder (`{slug}/SKILL.md`, `references/*`), built by `src/lib/zip.ts` |
| `/skills/{slug}/SKILL.md` | raw skill file |
| `/skills/{slug}.md` | Markdown page for AI assistants |
| `/prompt/` | hub |
| `/prompt/{slug}/` | page, from `src/prompts/{slug}.ts` |
| `/prompt/{slug}.md` | Markdown page for AI assistants |

Hubs are `noindex` until they list an item. Items appear automatically in the footer links, `sitemap.xml` (lastmod = `updated`), `llms.txt` and `llms-full.txt`.

## Add a skill

Create `src/skills/{slug}/SKILL.md` (frontmatter `name` = folder, single-line `description` saying what it does and when to use it, `license: MIT`), `src/skills/{slug}/meta.ts` (the human-facing page, see `src/lib/skills.ts`), and optional `references/*.md`. Read `docs/LIBRARY-BUILD-BRIEF.md` for the writing and accuracy rules, then run:

```bash
pnpm check:library
```

## Add a prompt

Create `src/prompts/{slug}.ts` (default export `PromptMeta`, see `src/lib/prompts.ts`). Run the prompt with the example values and paste the real result into `output`. Be literal in `tested.method` and `tested.notVerified`. Then `pnpm check:library`.

## Rules that matter

- Never rename a published slug.
- Skills that touch an org are read-only by default; anything that can change data requires explicit confirmation per change and says so in `safety`.
- Do not invent MCP tool names, CLI flags, limits or URLs. MCP tools used are those documented in `src/content/docs/agentforce/`.
- Limits quoted anywhere must come from `src/data/governor-limits.ts`.
- Prompts are CC BY 4.0; skills are MIT.
- `pnpm build` also validates the library (same rules) and fails on a bad item.
