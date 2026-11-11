import { getCollection, type CollectionEntry } from 'astro:content';

export type Doc = CollectionEntry<'docs'>;

/** Public URL of an article, e.g. /docs/apex/trigger-handler-pattern/ */
export const docUrl = (doc: Pick<Doc, 'id'>): string => `/docs/${doc.id}/`;

/**
 * Checks that need the whole collection, so they can't live in the Zod schema.
 * Returns a list of human-readable problems.
 */
function validate(docs: Doc[], publishedIds: Set<string>): string[] {
	const problems: string[] = [];
	const titles = new Map<string, string>();
	const descriptions = new Map<string, string>();

	for (const doc of docs) {
		const where = `src/content/docs/${doc.id}.md`;
		const parts = doc.id.split('/');

		if (parts.length !== 2) {
			problems.push(`${where}: must be exactly one folder deep (src/content/docs/{category}/{slug}.md)`);
			continue;
		}
		const [folder, slug] = parts;
		if (folder !== doc.data.category) {
			problems.push(`${where}: folder "${folder}" does not match category "${doc.data.category}"`);
		}
		if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
			problems.push(`${where}: slug "${slug}" must be lowercase-hyphenated`);
		}

		const seenTitle = titles.get(doc.data.title.toLowerCase());
		if (seenTitle) problems.push(`${where}: duplicate title (also used by ${seenTitle})`);
		titles.set(doc.data.title.toLowerCase(), doc.id);

		const seenDesc = descriptions.get(doc.data.description);
		if (seenDesc) problems.push(`${where}: duplicate description (also used by ${seenDesc})`);
		descriptions.set(doc.data.description, doc.id);

		if (doc.data.draft) continue;
		for (const rel of doc.data.related) {
			if (rel === doc.id) problems.push(`${where}: related links to itself`);
			else if (!publishedIds.has(rel)) problems.push(`${where}: related "${rel}" does not exist or is a draft`);
		}
	}
	return problems;
}

let cache: Promise<Doc[]> | undefined;

/**
 * All published (non-draft) articles, newest update first.
 * Throws — failing the build — if any cross-article rule is broken.
 */
export function getDocs(): Promise<Doc[]> {
	cache ??= (async () => {
		const all = await getCollection('docs');
		const published = all.filter((d) => !d.data.draft);
		const problems = validate(all, new Set(published.map((d) => d.id)));
		if (problems.length) {
			throw new Error(`Content validation failed:\n  - ${problems.join('\n  - ')}`);
		}
		return published.sort((a, b) => b.data.lastUpdated.getTime() - a.data.lastUpdated.getTime());
	})();
	return cache;
}
