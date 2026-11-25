/**
 * Prompt library (/prompt/): tested prompts for Salesforce work, each with a known-good
 * output and caveats. One prompt = one file, src/prompts/{slug}.ts, whose default export
 * is a PromptMeta. Files are discovered with import.meta.glob, so adding a prompt never
 * means editing a shared file. validatePrompts() fails the build on contract violations.
 */
import { fillPrompt, placeholders } from './prompt-fill';
import type { FaqItem } from './skills';

export const PROMPT_CATEGORIES = {
	apex: 'Apex',
	testing: 'Testing',
	review: 'Code review',
	flow: 'Flow and automation',
	data: 'Data and SOQL',
	devops: 'Deployment',
} as const;
export type PromptCategory = keyof typeof PROMPT_CATEGORIES;

export interface PromptVariable {
	/** Placeholder name used as {{name}} in the prompt: lowercase letters, digits, underscore. */
	name: string;
	label: string;
	/** Hint under the field. */
	help?: string;
	/** The value used in the worked example. */
	example: string;
	/** Render as a multi-line field (code, XML, long text). */
	multiline?: boolean;
}

export interface CodeBlock {
	/** Fence/language label: apex, xml, json, markdown, text, soql, bash. */
	language: string;
	body: string;
}

export interface PromptMeta {
	/** URL slug. Never rename once live. */
	slug: string;
	title: string;
	/** One sentence, plain text. */
	tagline: string;
	/** Meta description (110 to 160 characters). */
	description: string;
	category: PromptCategory;
	tags: string[];
	/** 2 to 3 sentence answer-first summary: what the prompt does and what you get. */
	summary: string;
	useWhen: string[];
	variables: PromptVariable[];
	/** The prompt text. Reference variables as {{name}}. Every variable must be used. */
	prompt: string;
	/** Real input for the worked example when a variable is long (optional extra context). */
	inputNote?: string;
	/** The known-good output produced by running the prompt with the example values. */
	output: CodeBlock;
	/** What to check before trusting the output. */
	checklist: string[];
	/** Honest limits of the prompt and of this example. */
	caveats: string[];
	/** Tips to adapt the prompt. */
	tips?: string[];
	/** How the prompt was tested. Be literal: what was run, on what, and what was not verified. */
	tested: { model: string; date: string; method: string; notVerified: string };
	faq: FaqItem[];
	related: { tools?: string[]; skills?: string[]; prompts?: string[]; docs?: string[] };
	refs: string[];
	published: string;
	updated: string;
}

const modules = import.meta.glob<{ default: PromptMeta }>('../prompts/*.ts', { eager: true });

function load(): PromptMeta[] {
	const prompts: PromptMeta[] = [];
	const problems: string[] = [];
	for (const [path, mod] of Object.entries(modules)) {
		const p = mod.default;
		const file = path.replace('../', 'src/');
		const expected = path.split('/').pop()!.replace(/\.ts$/, '');
		if (p.slug !== expected) problems.push(`${file}: slug "${p.slug}" must equal the file name`);
		if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) problems.push(`${file}: slug must be lowercase-hyphenated`);
		if (p.description.length < 90 || p.description.length > 170) problems.push(`${file}: description should be 90 to 170 characters (is ${p.description.length})`);
		const used = placeholders(p.prompt);
		const declared = new Set(p.variables.map((v) => v.name));
		for (const u of used) if (!declared.has(u)) problems.push(`${file}: prompt uses {{${u}}} but it is not declared in variables`);
		for (const d of declared) if (!used.has(d)) problems.push(`${file}: variable "${d}" is declared but never used in the prompt`);
		if (p.caveats.length < 2) problems.push(`${file}: needs at least 2 caveats`);
		if (p.checklist.length < 3) problems.push(`${file}: needs at least 3 checklist items`);
		if (p.faq.length < 4) problems.push(`${file}: needs at least 4 FAQ items`);
		if (!p.tested.method || !p.tested.notVerified) problems.push(`${file}: tested.method and tested.notVerified are required`);
		if (p.refs.length === 0) problems.push(`${file}: refs must not be empty`);
		prompts.push(p);
	}
	if (problems.length) throw new Error(`Prompt validation failed:\n${problems.map((x) => `  - ${x}`).join('\n')}`);
	return prompts.sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}

let cache: PromptMeta[] | undefined;
export const getPrompts = (): PromptMeta[] => (cache ??= load());
export const promptUrl = (p: Pick<PromptMeta, 'slug'>): string => `/prompt/${p.slug}/`;
export const PROMPTS_INDEX_URL = '/prompt/';

/** The worked-example prompt: the template filled with each variable's example value. */
export const examplePrompt = (p: PromptMeta): string =>
	fillPrompt(p.prompt, Object.fromEntries(p.variables.map((v) => [v.name, v.example])));

export const promptsHubIndexable = (): boolean => getPrompts().length > 0;
