/**
 * Markdown versions of skill and prompt pages, for AI assistants (/skills/{slug}.md,
 * /prompt/{slug}.md) and /llms-full.txt. Built from the same data the pages render.
 */
import { PROMPT_CATEGORIES, examplePrompt, promptUrl, type PromptMeta } from './prompts';
import { abs } from './site';
import { SKILL_CATEGORIES, skillUrl, type Skill } from './skills';

const list = (items: string[]) => items.map((i) => `- ${i}`);
const fence = (body: string, lang = '') => {
	const ticks = '`'.repeat(Math.max(3, ...[...body.matchAll(/`+/g)].map((m) => m[0].length + 1)));
	return [`${ticks}${lang}`, body.trimEnd(), ticks];
};

export function skillMarkdown(s: Skill): string {
	const lines = [
		`# ${s.title}`,
		'',
		`> ${s.summary}`,
		'',
		`Category: ${SKILL_CATEGORIES[s.category]} · Version ${s.version} · Updated ${s.updated} · MIT license`,
		`Page: ${abs(skillUrl(s))}`,
		`Download: ${abs(`/skills/${s.slug}.zip`)}`,
		`Raw skill file: ${abs(`/skills/${s.slug}/SKILL.md`)}`,
		'',
		'## What this skill does',
		'',
		...list(s.does),
		'',
		'## When to use it',
		'',
		...list(s.whenToUse),
		'',
		'## What you need',
		'',
		`- Connection: ${s.needs.connection}`,
		`- Permissions: ${s.needs.permissions}`,
		'',
		'## How it works',
		'',
		...s.howItWorks.map((h, i) => `${i + 1}. ${h}`),
		'',
		'## Safety rules built into the skill',
		'',
		...list(s.safety),
		'',
		'## Try asking',
		'',
		...list(s.tryAsking),
		'',
		'## SKILL.md',
		'',
		'````markdown',
		s.skillMd.trimEnd(),
		'````',
		'',
		'## Frequently asked questions',
		'',
		...s.faq.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
		'## Official sources',
		'',
		...list(s.refs),
		'',
	];
	return lines.join('\n');
}

export function promptMarkdown(p: PromptMeta): string {
	const lines = [
		`# ${p.title}`,
		'',
		`> ${p.summary}`,
		'',
		`Category: ${PROMPT_CATEGORIES[p.category]} · Tested with ${p.tested.model} on ${p.tested.date} · Updated ${p.updated} · CC BY 4.0`,
		`Page: ${abs(promptUrl(p))}`,
		'',
		'## When to use this prompt',
		'',
		...list(p.useWhen),
		'',
		'## The prompt',
		'',
		...fence(p.prompt),
		'',
		'Placeholders:',
		'',
		...p.variables.map((v) => `- \`{{${v.name}}}\`: ${v.label}${v.help ? `. ${v.help}` : ''}`),
		'',
		'## Worked example',
		'',
		'Prompt with the example values filled in:',
		'',
		...fence(examplePrompt(p)),
		'',
		`Known-good output (${p.output.language}):`,
		'',
		...fence(p.output.body, p.output.language),
		'',
		'## Check the output before you use it',
		'',
		...list(p.checklist),
		'',
		'## Caveats',
		'',
		...list(p.caveats),
		'',
		...(p.tips?.length ? ['## Adapting the prompt', '', ...list(p.tips), ''] : []),
		'## How we tested it',
		'',
		`- Model: ${p.tested.model}`,
		`- Date: ${p.tested.date}`,
		`- What we did: ${p.tested.method}`,
		`- What we did not verify: ${p.tested.notVerified}`,
		'',
		'## Frequently asked questions',
		'',
		...p.faq.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
		'## Official sources',
		'',
		...list(p.refs),
		'',
	];
	return lines.join('\n');
}
