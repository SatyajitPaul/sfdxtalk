/**
 * Pure logic for the package.xml generator: no DOM, no Astro.
 * Builds a Metadata API manifest, parses pasted member lists and produces the
 * matching sf CLI commands.
 */

export const PACKAGE_XML_NS = 'http://soap.sforce.com/2006/04/metadata';

export interface PackageType {
	name: string;
	members: string[];
}

export interface PackageInput {
	types: PackageType[];
	/** API version such as "68.0". */
	version: string;
}

const NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const VERSION_RE = /^\d{1,3}\.0$/;

export const xmlEscape = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Normalise a version such as "68", "68.0" or " v68.0 " to "68.0". Returns undefined if invalid. */
export function normalizeVersion(raw: string): string | undefined {
	const s = raw.trim().replace(/^v/i, '');
	const v = /^\d{1,3}$/.test(s) ? `${s}.0` : s;
	return VERSION_RE.test(v) ? v : undefined;
}

/** Split pasted text into members: one per line, commas also split, blanks and duplicates removed. */
export function parseMembers(text: string): string[] {
	const seen = new Set<string>();
	for (const part of text.split(/[\r\n,]+/)) {
		const m = part.trim();
		if (m) seen.add(m);
	}
	return [...seen];
}

/** Sort and de-duplicate members. A "*" makes every other member redundant, so it wins. */
export function cleanMembers(members: string[]): string[] {
	const set = new Set(members.map((m) => m.trim()).filter(Boolean));
	if (set.has('*')) return ['*'];
	return [...set].sort(byCodePoint);
}

/** Merge entries with the same type name, drop types with no members, sort by name. */
export function normalizeTypes(types: PackageType[]): PackageType[] {
	const byName = new Map<string, string[]>();
	for (const t of types) {
		const name = t.name.trim();
		if (!NAME_RE.test(name)) throw new Error(`Invalid metadata type name: "${t.name}"`);
		byName.set(name, [...(byName.get(name) ?? []), ...t.members]);
	}
	return [...byName.entries()]
		.map(([name, members]) => ({ name, members: cleanMembers(members) }))
		.filter((t) => t.members.length > 0)
		.sort((a, b) => byCodePoint(a.name, b.name));
}

/** Build package.xml. Throws on an empty/invalid type name or invalid version. */
export function buildPackageXml(input: PackageInput): string {
	const version = normalizeVersion(input.version);
	if (!version) throw new Error(`Invalid API version: "${input.version}"`);
	const lines = ['<?xml version="1.0" encoding="UTF-8"?>', `<Package xmlns="${PACKAGE_XML_NS}">`];
	for (const t of normalizeTypes(input.types)) {
		lines.push('    <types>');
		for (const m of t.members) lines.push(`        <members>${xmlEscape(m)}</members>`);
		lines.push(`        <name>${xmlEscape(t.name)}</name>`, '    </types>');
	}
	lines.push(`    <version>${version}</version>`, '</Package>', '');
	return lines.join('\n');
}

export interface SfCommands {
	retrieve: string;
	deploy: string;
	generate: string;
}

/** sf CLI commands that use a manifest. `path` defaults to package.xml. */
export function sfCommands(path = 'package.xml'): SfCommands {
	return {
		retrieve: `sf project retrieve start --manifest ${path} --target-org <alias-or-username>`,
		deploy: `sf project deploy start --manifest ${path} --target-org <alias-or-username>`,
		generate: 'sf project generate manifest --source-dir force-app --name package',
	};
}
