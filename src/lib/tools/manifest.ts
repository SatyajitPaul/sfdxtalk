/**
 * Pure logic for the package.xml viewer, diff and merge tool: no DOM, no Astro.
 * Parses a Metadata API manifest with a small hand-written reader (so it also
 * runs under node for tests), compares two manifests and merges several.
 */
import { buildPackageXml, normalizeTypes, normalizeVersion, type PackageType } from './package-xml.ts';

export interface Manifest {
	types: PackageType[];
	/** Normalised "68.0", or undefined when the file has no valid version. */
	version?: string;
	warnings: string[];
}

const unescapeXml = (s: string): string =>
	s
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, '&');

const stripNoise = (xml: string): string => xml.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c: string) => c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

const textOf = (block: string, tag: string): string[] => {
	const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
	return [...block.matchAll(re)].map((m) => unescapeXml(m[1].trim()));
};

/** Parse a package.xml. Never throws: problems are returned as warnings. */
export function parseManifest(text: string): Manifest {
	const warnings: string[] = [];
	const xml = stripNoise(text);
	if (!/<Package[\s>]/.test(xml)) {
		return { types: [], warnings: ['No <Package> element found. Is this a package.xml?'] };
	}
	const raw: PackageType[] = [];
	for (const m of xml.matchAll(/<types>([\s\S]*?)<\/types>/g)) {
		const names = textOf(m[1], 'name');
		const members = textOf(m[1], 'members').filter(Boolean);
		if (names.length !== 1 || !names[0]) {
			warnings.push('A <types> block without exactly one <name> was skipped.');
			continue;
		}
		raw.push({ name: names[0], members });
	}
	let types: PackageType[] = [];
	try {
		types = normalizeTypes(raw);
	} catch (e) {
		warnings.push(e instanceof Error ? e.message : 'Invalid metadata type name.');
		types = normalizeTypes(raw.filter((t) => /^[A-Za-z][A-Za-z0-9_]*$/.test(t.name.trim())));
	}
	if (raw.some((t) => t.members.length === 0)) warnings.push('Types with no <members> were dropped.');
	const versions = textOf(xml.replace(/<types>[\s\S]*?<\/types>/g, ''), 'version');
	const version = versions[0] ? normalizeVersion(versions[0]) : undefined;
	if (!versions.length) warnings.push('No <version> element found.');
	else if (!version) warnings.push(`Version "${versions[0]}" is not a valid API version.`);
	return { types, version, warnings };
}

export interface TypeDiff {
	name: string;
	added: string[];
	removed: string[];
	same: string[];
	/** One side uses the * wildcard and the other names members. */
	wildcardChange: boolean;
}

export interface ManifestDiff {
	/** Types only in B / only in A. */
	typesAdded: PackageType[];
	typesRemoved: PackageType[];
	/** Types in both with at least one member difference. */
	changed: TypeDiff[];
	/** Types in both with identical members. */
	unchanged: string[];
	version: { a?: string; b?: string; differs: boolean };
	identical: boolean;
}

/** Compare manifest A (before) with manifest B (after). */
export function diffManifests(a: Manifest, b: Manifest): ManifestDiff {
	const am = new Map(a.types.map((t) => [t.name, t.members]));
	const bm = new Map(b.types.map((t) => [t.name, t.members]));
	const typesAdded = b.types.filter((t) => !am.has(t.name));
	const typesRemoved = a.types.filter((t) => !bm.has(t.name));
	const changed: TypeDiff[] = [];
	const unchanged: string[] = [];
	for (const [name, aMembers] of am) {
		const bMembers = bm.get(name);
		if (!bMembers) continue;
		const aSet = new Set(aMembers);
		const bSet = new Set(bMembers);
		const added = bMembers.filter((x) => !aSet.has(x));
		const removed = aMembers.filter((x) => !bSet.has(x));
		const same = aMembers.filter((x) => bSet.has(x));
		if (!added.length && !removed.length) unchanged.push(name);
		else changed.push({ name, added, removed, same, wildcardChange: aSet.has('*') !== bSet.has('*') });
	}
	const versionDiffers = a.version !== b.version;
	return {
		typesAdded,
		typesRemoved,
		changed,
		unchanged,
		version: { a: a.version, b: b.version, differs: versionDiffers },
		identical: !typesAdded.length && !typesRemoved.length && !changed.length && !versionDiffers,
	};
}

export interface MergeResult {
	xml: string;
	types: PackageType[];
	version: string;
	typeCount: number;
	memberCount: number;
	/** Members that appeared in more than one input and were de-duplicated. */
	duplicatesRemoved: number;
}

/**
 * Merge manifests: union of members per type, sorted and de-duplicated; a type
 * with a * member collapses to just *. The version is the highest valid one in
 * the inputs, or `fallbackVersion`.
 */
export function mergeManifests(inputs: Manifest[], fallbackVersion: string): MergeResult {
	const all = inputs.flatMap((m) => m.types);
	const before = all.reduce((n, t) => n + t.members.length, 0);
	const types = normalizeTypes(all);
	const after = types.reduce((n, t) => n + t.members.length, 0);
	const versions = inputs.map((m) => m.version).filter((v): v is string => !!v);
	const version = versions.length ? versions.reduce((hi, v) => (parseFloat(v) > parseFloat(hi) ? v : hi)) : (normalizeVersion(fallbackVersion) ?? fallbackVersion);
	return {
		xml: buildPackageXml({ types, version }),
		types,
		version,
		typeCount: types.length,
		memberCount: after,
		duplicatesRemoved: before - after,
	};
}

/** Plain-text diff report that can be copied or pasted into a pull request. */
export function diffReport(d: ManifestDiff): string {
	if (d.identical) return 'The manifests are identical.';
	const lines: string[] = [];
	if (d.version.differs) lines.push(`Version: ${d.version.a ?? '(none)'} -> ${d.version.b ?? '(none)'}`);
	for (const t of d.typesAdded) lines.push(`+ ${t.name}: ${t.members.join(', ')}`);
	for (const t of d.typesRemoved) lines.push(`- ${t.name}: ${t.members.join(', ')}`);
	for (const t of d.changed) {
		lines.push(`~ ${t.name}`);
		for (const m of t.added) lines.push(`    + ${m}`);
		for (const m of t.removed) lines.push(`    - ${m}`);
	}
	return lines.join('\n');
}
