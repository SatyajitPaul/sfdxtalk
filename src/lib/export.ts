/**
 * Plain-text exports of the content for machines: per-article Markdown,
 * llms.txt, llms-full.txt, sitemap and feed. See docs/PLAN.md §8.
 */
import { docUrl, type Doc } from './docs';
import { SITE, abs } from './site';
import { CATEGORIES, CATEGORY_KEYS, type Category } from './taxonomy';

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** Raw Markdown URL of an article, e.g. /docs/apex/trigger-handler-pattern.md */
export const docMarkdownUrl = (doc: Pick<Doc, 'id'>): string => `/docs/${doc.id}.md`;

export const xmlEscape = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Published articles grouped by category, in taxonomy order; empty categories left out. */
export function byCategory(docs: Doc[]): { category: Category; docs: Doc[] }[] {
	return CATEGORY_KEYS.map((category) => ({
		category,
		docs: docs
			.filter((d) => d.data.category === category)
			.sort((a, b) => a.data.title.localeCompare(b.data.title)),
	})).filter((group) => group.docs.length > 0);
}

/** Most recent `lastUpdated` in a list of articles. */
export const latestUpdate = (docs: Doc[]): Date | undefined =>
	docs.length ? new Date(Math.max(...docs.map((d) => d.data.lastUpdated.getTime()))) : undefined;

/**
 * One article as self-contained Markdown: the same title, quick answer, body
 * and FAQ the HTML page shows, plus the source URL so a quote can be attributed.
 */
export function docMarkdown(doc: Doc): string {
	const d = doc.data;
	const lines = [
		`# ${d.title}`,
		'',
		`> ${d.tldr}`,
		'',
		`- Source: ${abs(docUrl(doc))}`,
		`- Category: ${CATEGORIES[d.category].label}`,
		`- Applies to: Salesforce ${d.release} (API version ${d.apiVersion})`,
		`- Level: ${d.level}`,
		`- Published: ${isoDate(d.published)}`,
		`- Last updated: ${isoDate(d.lastUpdated)}`,
		`- Publisher: ${SITE.editorial} (unofficial; not affiliated with or endorsed by Salesforce)`,
		'',
		(doc.body ?? '').trim(),
		'',
		'## Frequently Asked Questions',
		'',
		...d.faq.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
		'## Official References',
		'',
		...d.officialRefs.map((href) => `- ${href}`),
		'',
	];
	return lines.join('\n');
}
