/** Markdown export and sitemap date for /tools/salesforce-error-decoder/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { CATEGORY_LABELS, CATEGORY_ORDER, ERRORS, ERRORS_META } from '../salesforce-errors';
import type { ToolExport } from '../../lib/tool-exports';

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'salesforce-error-decoder')!;
	const lines = [
		`# ${tool.name}`,
		'',
		`> A curated reference of ${ERRORS.length} common Salesforce errors with the cause and fix steps for each. Status codes were checked against the official StatusCode list on ${ERRORS_META.verified}; causes and fixes are SFDX Talk's own advice.`,
		'',
		`Source: [${ERRORS_META.sourceName}](${ERRORS_META.source})`,
		`Interactive decoder: ${abs(toolUrl(tool))}`,
		'',
		'An error has a code (such as REQUIRED_FIELD_MISSING or System.NullPointerException) and a message. Look up the code first. Wrapper errors such as System.DmlException and CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY name the real cause later in the text.',
	];
	for (const cat of CATEGORY_ORDER) {
		lines.push('', `## ${CATEGORY_LABELS[cat].label}`);
		for (const e of ERRORS.filter((x) => x.category === cat)) {
			lines.push('', `### ${e.code}`, '');
			if (e.typicalMessage) lines.push(`Typical message: \`${e.typicalMessage}\``, '');
			lines.push(`Cause: ${e.cause}`, '', 'Fix:', ...e.fixSteps.map((s, i) => `${i + 1}. ${s}`));
			if (e.example) lines.push('', '```' + e.example.lang, e.example.code, '```');
			if (e.internal) lines.push('', `See also: [${e.internal.label}](${abs(e.internal.href)})`);
		}
	}
	lines.push('');
	return lines.join('\n');
}

export default { slug: 'salesforce-error-decoder', markdown, lastmod: new Date(`${ERRORS_META.verified}T00:00:00Z`) } satisfies ToolExport;
