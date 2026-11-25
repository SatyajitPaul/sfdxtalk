/** Markdown export and sitemap date for /tools/manifest-merge/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { diffManifests, diffReport, mergeManifests, parseManifest } from '../../lib/tools/manifest';
import { buildPackageXml } from '../../lib/tools/package-xml';
import { PACKAGE_XML_META } from '../package-xml-common-types';
import type { ToolExport } from '../../lib/tool-exports';

export const MANIFEST_EXAMPLE_A = buildPackageXml({
	version: '67.0',
	types: [
		{ name: 'ApexClass', members: ['AccountService', 'AccountServiceTest'] },
		{ name: 'Flow', members: ['Lead_Assignment'] },
	],
});
export const MANIFEST_EXAMPLE_B = buildPackageXml({
	version: PACKAGE_XML_META.apiVersion,
	types: [
		{ name: 'ApexClass', members: ['AccountService', 'ContactService'] },
		{ name: 'CustomField', members: ['Account.Region__c'] },
	],
});

export const MANIFEST_META = { ...PACKAGE_XML_META } as const;

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'manifest-merge')!;
	const a = parseManifest(MANIFEST_EXAMPLE_A);
	const b = parseManifest(MANIFEST_EXAMPLE_B);
	return [
		`# ${tool.name}`,
		'',
		`> Compare two package.xml manifests, merge several into one, or view one as a type tree. It runs in the browser; nothing is uploaded. Checked against the official docs on ${PACKAGE_XML_META.verified}.`,
		'',
		`Source: [${PACKAGE_XML_META.sourceName}](${PACKAGE_XML_META.source})`,
		`Interactive tool: ${abs(toolUrl(tool))}`,
		'',
		'## Example diff (A to B)',
		'',
		'```text',
		diffReport(diffManifests(a, b)),
		'```',
		'',
		'## Example merge',
		'',
		'```xml',
		mergeManifests([a, b], PACKAGE_XML_META.apiVersion).xml.trimEnd(),
		'```',
		'',
		'Merging takes the union of members per type, removes duplicates, sorts types and members, collapses a type that has a `*` member to just `*`, and uses the highest API version found.',
		'',
	].join('\n');
}

export default { slug: 'manifest-merge', markdown, lastmod: new Date(`${PACKAGE_XML_META.verified}T00:00:00Z`) } satisfies ToolExport;
