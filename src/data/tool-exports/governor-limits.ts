/** Markdown export and sitemap date for /tools/governor-limits/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { ERROR_HINTS, LIMITS_META, LIMIT_SECTIONS } from '../governor-limits';
import type { ToolExport } from '../../lib/tool-exports';

const cell = (s: string) => s.replace(/\|/g, '\\|');

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'governor-limits')!;
	const lines = [
		`# ${tool.name}`,
		'',
		`> Apex governor limits for Salesforce ${LIMITS_META.release} (API ${LIMITS_META.apiVersion}). Checked against the official docs on ${LIMITS_META.verified}.`,
		'',
		`Source: [${LIMITS_META.sourceName}](${LIMITS_META.source})`,
		`Page: ${abs(toolUrl(tool))}`,
		'',
		'## Which limit did I hit?',
		'',
		'| Error message | Limit exceeded |',
		'| --- | --- |',
		...ERROR_HINTS.map((e) => `| \`${e.message}\` | ${cell(e.limit)} |`),
		'',
	];
	for (const s of LIMIT_SECTIONS) {
		lines.push(`## ${s.title}`, '', s.intro, '');
		if (s.columns === 'sync-async') {
			lines.push('| Limit | Synchronous | Asynchronous |', '| --- | --- | --- |');
			for (const r of s.rows) lines.push(`| ${cell(r.name)} | ${cell(r.sync)} | ${cell(r.async ?? r.sync)} |`);
		} else {
			lines.push('| Limit | Value |', '| --- | --- |');
			for (const r of s.rows) lines.push(`| ${cell(r.name)} | ${cell(r.sync)} |`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

export default { slug: 'governor-limits', markdown, lastmod: new Date(`${LIMITS_META.verified}T00:00:00Z`) } satisfies ToolExport;
