/** Markdown export and sitemap date for /tools/ai-context-file-generator/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { ALL_TOPIC_IDS, TARGETS, generate } from '../../lib/tools/ai-context';
import { AI_RULES_META, AI_TOPICS } from '../ai-rules';
import type { ToolExport } from '../../lib/tool-exports';

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'ai-context-file-generator')!;
	const example = generate({ target: 'claude', topics: ALL_TOPIC_IDS, facts: { projectName: 'Acme Sales', apiVersion: AI_RULES_META.apiVersion, coverageTarget: 85 } });
	return [
		`# ${tool.name}`,
		'',
		`> Generate project instruction files (CLAUDE.md, AGENTS.md, Cursor rules, GitHub Copilot instructions) so AI coding assistants write better Salesforce code. Formats checked against vendor docs on ${AI_RULES_META.verified}. Instructions improve results but do not guarantee correct code: review everything and run tests.`,
		'',
		`Source: [${AI_RULES_META.sourceName}](${AI_RULES_META.source})`,
		`Interactive generator: ${abs(toolUrl(tool))}`,
		'',
		'## Where each file goes',
		'',
		'| Assistant | File | Notes |',
		'| --- | --- | --- |',
		...TARGETS.map((t) => `| ${t.label} | \`${t.path}\` | ${t.note} |`),
		'',
		'## Rules by topic',
		'',
		...AI_TOPICS.flatMap((t) => [`### ${t.title}`, '', t.summary, '', ...t.rules.map((r) => `- ${r.text.replaceAll('{apiVersion}', AI_RULES_META.apiVersion)}${r.why ? ` ${r.why}` : ''}`), '']),
		'## Example CLAUDE.md',
		'',
		'~~~markdown',
		example.trimEnd(),
		'~~~',
		'',
	].join('\n');
}

export default { slug: 'ai-context-file-generator', markdown, lastmod: new Date(`${AI_RULES_META.verified}T00:00:00Z`) } satisfies ToolExport;
