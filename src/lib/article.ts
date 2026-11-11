/**
 * Build-time helpers for the article template (docs/PLAN.md §5 "Article"):
 * the "On this page" outline and the previous/next links.
 */
import type { MarkdownHeading } from 'astro';
import type { Doc } from './docs';

export interface TocItem {
	id: string;
	text: string;
	/** h3 headings under this h2. */
	children: { id: string; text: string }[];
}

/** Sections the template itself adds after the Markdown body. */
export const FAQ_SECTION = { id: 'faq', text: 'Frequently asked questions' } as const;

/**
 * Two-level outline from the body's h2/h3 headings, plus the FAQ section the
 * template appends. Deeper headings are left out to keep the list scannable.
 */
export function buildToc(headings: MarkdownHeading[]): TocItem[] {
	const items: TocItem[] = [];
	for (const h of headings) {
		if (!h.slug) continue;
		// The heading text includes the "#" anchor link that src/markdown/callouts.ts appends.
		const entry = { id: h.slug, text: h.text.replace(/#$/, '').trim() };
		if (h.depth === 2) items.push({ ...entry, children: [] });
		// An h3 before the first h2 has no parent; show it at the top level.
		else if (h.depth === 3) {
			const parent = items.at(-1);
			if (parent) parent.children.push(entry);
			else items.push({ ...entry, children: [] });
		}
	}
	items.push({ ...FAQ_SECTION, children: [] });
	return items;
}

/** Articles before and after `doc` in its category list (already sorted by title). */
export function neighbours(group: Doc[], doc: Doc): { prev?: Doc; next?: Doc } {
	const i = group.findIndex((d) => d.id === doc.id);
	return { prev: i > 0 ? group[i - 1] : undefined, next: i >= 0 ? group[i + 1] : undefined };
}
