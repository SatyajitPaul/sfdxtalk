#!/usr/bin/env node
// Validates the skills (src/skills/*) and prompts (src/prompts/*) without a full build.
// Mirrors the checks in src/lib/skills.ts and src/lib/prompts.ts, plus related ids.
//
//   node scripts/check-library.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname;
const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

const { TOOLS } = await import(pathToFileURL(join(root, 'src/lib/tools.ts')).href);
const { placeholders } = await import(pathToFileURL(join(root, 'src/lib/prompt-fill.ts')).href);
const liveTools = new Set(TOOLS.filter((t) => t.status === 'live').map((t) => t.slug));

const skillDirs = existsSync(join(root, 'src/skills')) ? readdirSync(join(root, 'src/skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
const promptFiles = existsSync(join(root, 'src/prompts')) ? readdirSync(join(root, 'src/prompts')).filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, '')) : [];

const skills = new Map();
for (const dir of skillDirs) {
	const where = `src/skills/${dir}`;
	const metaPath = join(root, where, 'meta.ts');
	const mdPath = join(root, where, 'SKILL.md');
	if (!existsSync(metaPath)) { fail(where, 'missing meta.ts'); continue; }
	if (!existsSync(mdPath)) { fail(where, 'missing SKILL.md'); continue; }
	const meta = (await import(pathToFileURL(metaPath).href)).default;
	const md = readFileSync(mdPath, 'utf8');
	const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md)?.[1] ?? '';
	const field = (k) => new RegExp(`^${k}:\\s*(.*)$`, 'm').exec(block)?.[1].trim().replace(/^(["'])(.*)\1$/, '$2');
	if (meta.slug !== dir) fail(where, `meta.slug "${meta.slug}" must equal the folder name`);
	if (field('name') !== dir) fail(`${where}/SKILL.md`, `frontmatter name "${field('name')}" must equal the folder name`);
	if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dir) || dir.length > 64) fail(where, 'slug must be lowercase-hyphenated, at most 64 chars');
	const d = field('description');
	if (!d || d.length > 1024) fail(`${where}/SKILL.md`, 'description required, at most 1024 chars');
	else if (d.length < 80) fail(`${where}/SKILL.md`, 'description should say what the skill does AND when to use it (80+ chars)');
	if (/^\s*description:\s*[>|]/m.test(block)) fail(`${where}/SKILL.md`, 'description must be a single-line value');
	if (md.split('\n').length > 500) fail(`${where}/SKILL.md`, 'keep SKILL.md under 500 lines; move detail to references/');
	if (meta.description.length < 90 || meta.description.length > 170) fail(`${where}/meta.ts`, `description should be 90-170 chars (is ${meta.description.length})`);
	if (!meta.safety?.length) fail(`${where}/meta.ts`, 'safety must not be empty');
	if ((meta.faq?.length ?? 0) < 4) fail(`${where}/meta.ts`, 'needs at least 4 FAQ items');
	if (!meta.refs?.length) fail(`${where}/meta.ts`, 'refs must not be empty');
	for (const k of ['does', 'whenToUse', 'howItWorks', 'tryAsking']) if ((meta[k]?.length ?? 0) < 3) fail(`${where}/meta.ts`, `${k} needs at least 3 items`);
	for (const t of meta.related?.tools ?? []) if (!liveTools.has(t)) fail(`${where}/meta.ts`, `related tool "${t}" is not a live tool`);
	for (const doc of meta.related?.docs ?? []) if (!existsSync(join(root, 'src/content/docs', `${doc}.md`))) fail(`${where}/meta.ts`, `related doc "${doc}" does not exist`);
	skills.set(dir, meta);
}

const prompts = new Map();
for (const slug of promptFiles) {
	const where = `src/prompts/${slug}.ts`;
	const p = (await import(pathToFileURL(join(root, where)).href)).default;
	if (p.slug !== slug) fail(where, `slug "${p.slug}" must equal the file name`);
	if (p.description.length < 90 || p.description.length > 170) fail(where, `description should be 90-170 chars (is ${p.description.length})`);
	const used = placeholders(p.prompt);
	const declared = new Set(p.variables.map((v) => v.name));
	for (const u of used) if (!declared.has(u)) fail(where, `prompt uses {{${u}}} but it is not declared`);
	for (const dd of declared) if (!used.has(dd)) fail(where, `variable "${dd}" is declared but unused`);
	if (p.caveats.length < 2) fail(where, 'needs at least 2 caveats');
	if (p.checklist.length < 3) fail(where, 'needs at least 3 checklist items');
	if (p.faq.length < 4) fail(where, 'needs at least 4 FAQ items');
	if (!p.tested?.method || !p.tested?.notVerified) fail(where, 'tested.method and tested.notVerified are required');
	if (!p.refs?.length) fail(where, 'refs must not be empty');
	if (!p.output?.body?.trim()) fail(where, 'output.body is empty');
	for (const t of p.related?.tools ?? []) if (!liveTools.has(t)) fail(where, `related tool "${t}" is not a live tool`);
	for (const doc of p.related?.docs ?? []) if (!existsSync(join(root, 'src/content/docs', `${doc}.md`))) fail(where, `related doc "${doc}" does not exist`);
	prompts.set(slug, p);
}

// Cross references are checked against what exists now AND the agreed slugs still being written.
const PLANNED_SKILLS = new Set(['soql-query-assistant', 'salesforce-org-explorer', 'apex-code-reviewer', 'flow-explainer', 'process-builder-to-flow-migration']);
const PLANNED_PROMPTS = new Set(['generate-apex-trigger-handler', 'write-apex-test-class', 'review-apex-governor-limit-risks', 'convert-process-builder-to-flow', 'explain-a-salesforce-flow']);
for (const [slug, m] of skills) {
	for (const s of m.related?.skills ?? []) if (!PLANNED_SKILLS.has(s)) fail(`src/skills/${slug}/meta.ts`, `related skill "${s}" is not an agreed slug`);
	for (const s of m.related?.prompts ?? []) if (!PLANNED_PROMPTS.has(s)) fail(`src/skills/${slug}/meta.ts`, `related prompt "${s}" is not an agreed slug`);
}
for (const [slug, p] of prompts) {
	for (const s of p.related?.skills ?? []) if (!PLANNED_SKILLS.has(s)) fail(`src/prompts/${slug}.ts`, `related skill "${s}" is not an agreed slug`);
	for (const s of p.related?.prompts ?? []) if (!PLANNED_PROMPTS.has(s)) fail(`src/prompts/${slug}.ts`, `related prompt "${s}" is not an agreed slug`);
}

console.log(`skills: ${skills.size} (${[...skills.keys()].join(', ') || 'none'})`);
console.log(`prompts: ${prompts.size} (${[...prompts.keys()].join(', ') || 'none'})`);
if (problems.length) {
	console.error(`\ncheck-library: FAILED\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	process.exit(1);
}
console.log('check-library: passed');
