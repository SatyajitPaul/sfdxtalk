/** Markdown export and sitemap date for /tools/salesforce-id-converter/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { toId18 } from '../../lib/tools/sf-id';
import { ID_PREFIXES, PREFIX_META } from '../sf-id-prefixes';
import type { ToolExport } from '../../lib/tool-exports';

export const ID_CONVERTER_META = {
	source: 'https://developer.salesforce.com/docs/platform/object-reference/guide/field-types.html',
	sourceName: 'Object Reference for the Salesforce Platform: Field Types (ID)',
	release: "Winter '27",
	apiVersion: '68.0',
	verified: '2026-11-17',
} as const;

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'salesforce-id-converter')!;
	const ex = ['001D000000IqhSL', '000000000000Abc', '000000000000aBC'];
	return [
		`# ${tool.name}`,
		'',
		`> Convert Salesforce record IDs between 15 and 18 characters. The 18-character ID is the 15-character ID plus a 3-character suffix that encodes the case of the first 15 characters. Checked against the official docs on ${ID_CONVERTER_META.verified}.`,
		'',
		`Source: [${ID_CONVERTER_META.sourceName}](${ID_CONVERTER_META.source})`,
		`Interactive converter: ${abs(toolUrl(tool))}`,
		'',
		'## Algorithm (15 to 18 characters)',
		'',
		'1. Split the 15 characters into three groups of five.',
		'2. For each group, add 1, 2, 4, 8 or 16 for an uppercase letter (A-Z) at position 0, 1, 2, 3 or 4.',
		'3. Map each total (0-31) to a character: 0-25 become A-Z and 26-31 become 0-5.',
		'4. Append the three characters to the 15-character ID.',
		'',
		'To get 15 characters from an 18-character ID, remove the last three characters.',
		'',
		'## Examples',
		'',
		'| 15-character | 18-character |',
		'| --- | --- |',
		...ex.map((id) => `| \`${id}\` | \`${toId18(id)}\` |`),
		'',
		'## Key prefixes of common standard objects',
		'',
		`Prefixes are case-sensitive and can differ between orgs. Confirm in your org with \`${PREFIX_META.howToCheck}\`.`,
		'',
		'| Prefix | Object | API name |',
		'| --- | --- | --- |',
		...ID_PREFIXES.map((p) => `| \`${p.prefix}\` | ${p.object} | ${p.apiName ?? p.object} |`),
		'',
	].join('\n');
}

export default { slug: 'salesforce-id-converter', markdown, lastmod: new Date(`${ID_CONVERTER_META.verified}T00:00:00Z`) } satisfies ToolExport;
