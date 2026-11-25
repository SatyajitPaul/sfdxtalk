/**
 * Derive Metadata API type names from metadata articles. An article qualifies
 * only when the first word of its title is a bare identifier that equals its
 * slug (minus "-metadata-type" and hyphens) case-insensitively, so the API name
 * is never guessed. Other articles are skipped.
 */
export interface PackageXmlType {
	name: string;
	title: string;
	doc: string;
}

export function apiNameFor(id: string, title: string): string | undefined {
	const m = id.match(/^metadata\/(.+)-metadata-type$/);
	if (!m) return undefined;
	const first = title.trim().split(/\s+/)[0] ?? '';
	if (!/^[A-Z][A-Za-z0-9]*$/.test(first)) return undefined;
	return first.toLowerCase() === m[1].replace(/-/g, '') ? first : undefined;
}
