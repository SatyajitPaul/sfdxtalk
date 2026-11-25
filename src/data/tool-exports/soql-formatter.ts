/** Markdown export and sitemap date for /tools/soql-formatter/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { EXAMPLES, MANY_FIELDS_THRESHOLD, RULES, formatSoql } from '../../lib/tools/soql';
import type { ToolExport } from '../../lib/tool-exports';

export const SOQL_FORMATTER_META = {
	source: 'https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql.htm',
	sourceName: 'SOQL and SOSL Reference: SOQL',
	release: "Winter '27",
	apiVersion: '68.0',
	verified: '2026-11-17',
} as const;

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'soql-formatter')!;
	return [
		`# ${tool.name}`,
		'',
		`> Formats SOQL queries into a readable layout (keywords uppercased, one clause per line, subqueries indented) without changing their meaning, and flags patterns that may be non-selective. The checker uses heuristics: real selectivity depends on your org's data and indexes. Checked on ${SOQL_FORMATTER_META.verified}.`,
		'',
		`Source: [${SOQL_FORMATTER_META.sourceName}](${SOQL_FORMATTER_META.source})`,
		`Interactive formatter: ${abs(toolUrl(tool))}`,
		'',
		'## Checker rules',
		'',
		...RULES.flatMap((r) => [`### ${r.rule}`, '', `Severity: ${r.severity}. Flags: ${r.flags}`, '', r.why, '']),
		`The ${MANY_FIELDS_THRESHOLD}-field threshold is our own choice, not a Salesforce limit.`,
		'',
		'## Formatting examples',
		'',
		...EXAMPLES.flatMap((e) => [`### ${e.title}`, '', e.note, '', 'Before:', '', '```soql', e.query, '```', '', 'After:', '', '```soql', formatSoql(e.query), '```', '']),
	].join('\n');
}

export default { slug: 'soql-formatter', markdown, lastmod: new Date(`${SOQL_FORMATTER_META.verified}T00:00:00Z`) } satisfies ToolExport;
