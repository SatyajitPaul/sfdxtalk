/**
 * Helpers for the hub pages that group articles by tag and by Salesforce
 * release (/tags/, /releases/, /docs/). See docs/PLAN.md §5 "Hubs".
 * The sitemap and llms.txt use the same helpers, so they list exactly the
 * hubs that are built and indexable.
 */
import type { Doc } from './docs';
import { RELEASES, releaseSlug, type Release } from './taxonomy';

export const DOCS_INDEX_URL = '/docs/';
export const TAGS_INDEX_URL = '/tags/';
export const RELEASES_INDEX_URL = '/releases/';

/** Tag pages with fewer articles than this are `noindex` (thin pages hurt SEO). */
export const MIN_INDEXABLE_TAG_DOCS = 3;

/** Tags are already lowercase-hyphenated slugs (enforced by the content schema). */
export const tagUrl = (tag: string): string => `/tags/${tag}/`;

export const releaseUrl = (release: Release): string => `/releases/${releaseSlug(release)}/`;

/** "1 article" / "3 articles" */
export const articleCount = (n: number): string => `${n} ${n === 1 ? 'article' : 'articles'}`;

const byTitle = (a: Doc, b: Doc) => a.data.title.localeCompare(b.data.title);

export interface TagGroup {
	tag: string;
	docs: Doc[];
	/** False when the tag page is too thin to be indexed. */
	indexable: boolean;
}

/** Published articles grouped by tag, tags in alphabetical order. */
export function byTag(docs: Doc[]): TagGroup[] {
	const groups = new Map<string, Doc[]>();
	for (const doc of docs) {
		for (const tag of doc.data.tags) {
			const list = groups.get(tag);
			if (list) list.push(doc);
			else groups.set(tag, [doc]);
		}
	}
	return [...groups]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([tag, list]) => ({
			tag,
			docs: list.sort(byTitle),
			indexable: list.length >= MIN_INDEXABLE_TAG_DOCS,
		}));
}

/** The tag index is only worth indexing once it links to an indexable tag page. */
export const tagsIndexable = (groups: TagGroup[]): boolean => groups.some((g) => g.indexable);

export interface ReleaseGroup {
	release: Release;
	apiVersion: string;
	docs: Doc[];
}

/** Published articles grouped by release, newest release first; empty releases left out. */
export function byRelease(docs: Doc[]): ReleaseGroup[] {
	return [...RELEASES]
		.reverse()
		.map((r) => ({
			release: r.name,
			apiVersion: r.apiVersion,
			docs: docs.filter((d) => d.data.release === r.name).sort(byTitle),
		}))
		.filter((group) => group.docs.length > 0);
}
