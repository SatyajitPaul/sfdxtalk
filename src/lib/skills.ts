/**
 * Skills library (/skills/): downloadable Agent Skills for working with Salesforce
 * through an MCP connection or the Salesforce CLI.
 *
 * One skill = one folder, src/skills/{slug}/:
 *   SKILL.md   the real skill file (YAML frontmatter + instructions); shipped as is
 *   meta.ts    default export: SkillMeta, the page content (never shipped in the zip)
 *   ...        optional extra files shipped in the zip (references/*.md, scripts/*)
 *
 * Everything is discovered with import.meta.glob, so adding a skill never means
 * editing a shared file. validateSkills() fails the build on contract violations.
 */
import type { Category } from './taxonomy';

export interface FaqItem {
	q: string;
	a: string;
}

export const SKILL_CATEGORIES = {
	apex: 'Apex and code review',
	data: 'Data and queries',
	metadata: 'Org and metadata',
	flow: 'Flow and automation',
	devops: 'Deployment and DevOps',
	security: 'Security',
	agentforce: 'Agentforce and MCP',
} as const;
export type SkillCategory = keyof typeof SKILL_CATEGORIES;

export interface SkillMeta {
	/** URL slug and skill folder name; must equal `name` in SKILL.md. Never rename once live. */
	slug: string;
	/** Display title, e.g. "SOQL Query Assistant". */
	title: string;
	/** One sentence, plain text. */
	tagline: string;
	/** Meta description (110 to 160 characters). Include the Salesforce task and "skill". */
	description: string;
	category: SkillCategory;
	tags: string[];
	/** 2 to 3 sentence answer-first summary: what it is, what it does, what it needs. */
	summary: string;
	/** What the skill does, as concrete capabilities. */
	does: string[];
	/** Situations where a developer would reach for it. */
	whenToUse: string[];
	/** The skill's workflow, as ordered steps. */
	howItWorks: string[];
	/** What connection and permissions it needs. */
	needs: { connection: string; permissions: string };
	/** What it refuses or guards against. Required: every skill that can change data must say how. */
	safety: string[];
	/** Example requests to give an assistant that has the skill. */
	tryAsking: string[];
	faq: FaqItem[];
	related: { tools?: string[]; prompts?: string[]; docs?: string[] };
	/** Official pages the skill's guidance was checked against. */
	refs: string[];
	version: string;
	/** ISO dates (YYYY-MM-DD). `updated` drives sitemap lastmod. */
	published: string;
	updated: string;
}

export interface Skill extends SkillMeta {
	/** Full text of SKILL.md. */
	skillMd: string;
	/** All shipped files by path relative to the skill folder, including SKILL.md. */
	files: Record<string, string>;
}

const metaModules = import.meta.glob<{ default: SkillMeta }>('../skills/*/meta.ts', { eager: true });
const fileModules = import.meta.glob<string>('../skills/*/**/*.{md,txt,json,yaml,yml,py,sh,js,mjs,ts,csv}', {
	eager: true,
	query: '?raw',
	import: 'default',
});

/** Parse the two frontmatter fields we validate (single-line values). */
function frontmatter(text: string): { name?: string; description?: string } {
	const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
	const field = (key: string) => {
		const m = new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(block);
		return m?.[1].trim().replace(/^(["'])(.*)\1$/, '$2');
	};
	return { name: field('name'), description: field('description') };
}

function load(): Skill[] {
	const skills: Skill[] = [];
	const problems: string[] = [];
	for (const [path, mod] of Object.entries(metaModules)) {
		const meta = mod.default;
		const folder = path.split('/')[2];
		const where = `src/skills/${folder}`;
		const files: Record<string, string> = {};
		for (const [file, text] of Object.entries(fileModules)) {
			const parts = file.split('/');
			if (parts[2] !== folder) continue;
			const rel = parts.slice(3).join('/');
			if (rel === 'meta.ts') continue;
			files[rel] = text;
		}
		const skillMd = files['SKILL.md'];
		if (!skillMd) {
			problems.push(`${where}: missing SKILL.md`);
			continue;
		}
		const fm = frontmatter(skillMd);
		if (meta.slug !== folder) problems.push(`${where}: meta.slug "${meta.slug}" must equal the folder name`);
		if (fm.name !== folder) problems.push(`${where}/SKILL.md: frontmatter name "${fm.name}" must equal the folder name`);
		if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(folder) || folder.length > 64) problems.push(`${where}: slug must be lowercase-hyphenated, at most 64 characters`);
		if (!fm.description || fm.description.length > 1024) problems.push(`${where}/SKILL.md: description is required and at most 1024 characters`);
		if (meta.description.length < 90 || meta.description.length > 170) problems.push(`${where}/meta.ts: description should be 90 to 170 characters (is ${meta.description.length})`);
		if (meta.safety.length === 0) problems.push(`${where}/meta.ts: safety must not be empty`);
		if (meta.faq.length < 4) problems.push(`${where}/meta.ts: needs at least 4 FAQ items`);
		if (meta.refs.length === 0) problems.push(`${where}/meta.ts: refs must not be empty`);
		if (new Date(meta.updated) < new Date(meta.published)) problems.push(`${where}/meta.ts: updated is before published`);
		skills.push({ ...meta, skillMd, files });
	}
	if (problems.length) throw new Error(`Skills validation failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	return skills.sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}

let cache: Skill[] | undefined;
export const getSkills = (): Skill[] => (cache ??= load());
export const skillUrl = (s: Pick<Skill, 'slug'>): string => `/skills/${s.slug}/`;
export const SKILLS_INDEX_URL = '/skills/';

/** The hub is indexable (and in the sitemap) only when it lists a real skill. */
export const skillsHubIndexable = (): boolean => getSkills().length > 0;

/** Docs articles a skill points at must exist. */
export type RelatedDocId = string;
export type { Category };
