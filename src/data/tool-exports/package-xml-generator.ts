/** Markdown export and sitemap date for /tools/package-xml-generator/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { buildPackageXml, sfCommands } from '../../lib/tools/package-xml';
import { COMMON_TYPES, PACKAGE_XML_META } from '../package-xml-common-types';
import type { ToolExport } from '../../lib/tool-exports';

export const PACKAGE_XML_EXAMPLE = {
	version: PACKAGE_XML_META.apiVersion,
	types: [
		{ name: 'ApexClass', members: ['AccountService', 'AccountServiceTest'] },
		{ name: 'LightningComponentBundle', members: ['*'] },
		{ name: 'CustomField', members: ['Account.Region__c'] },
	],
};

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'package-xml-generator')!;
	const cmd = sfCommands();
	return [
		`# ${tool.name}`,
		'',
		`> A package.xml is the manifest that tells Metadata API which components to retrieve or deploy: a list of metadata types, the members of each, and an API version. Checked against the official docs on ${PACKAGE_XML_META.verified}.`,
		'',
		`Source: [${PACKAGE_XML_META.sourceName}](${PACKAGE_XML_META.source})`,
		`Interactive generator: ${abs(toolUrl(tool))}`,
		'',
		'## Example',
		'',
		'```xml',
		buildPackageXml(PACKAGE_XML_EXAMPLE).trimEnd(),
		'```',
		'',
		'Types and members are sorted, `*` means all members of the type (not every type supports it), and `<version>` comes last.',
		'',
		'## Commands',
		'',
		'```bash',
		cmd.retrieve,
		cmd.deploy,
		cmd.generate,
		'```',
		'',
		'## Common metadata types',
		'',
		'| API name | Metadata |',
		'| --- | --- |',
		...COMMON_TYPES.map((t) => `| [\`${t.name}\`](${abs(`/docs/metadata/${t.slug}-metadata-type/`)}) | ${t.what} |`),
		'',
	].join('\n');
}

export default { slug: 'package-xml-generator', markdown, lastmod: new Date(`${PACKAGE_XML_META.verified}T00:00:00Z`) } satisfies ToolExport;
