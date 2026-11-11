// /llms.txt — a Markdown index of the site for LLMs (https://llmstxt.org/).
import type { APIRoute } from 'astro';
import { getDocs } from '../lib/docs';
import { byCategory, docMarkdownUrl } from '../lib/export';
import { DOCS_INDEX_URL, RELEASES_INDEX_URL, articleCount, byRelease, releaseUrl } from '../lib/hubs';
import { SITE, abs } from '../lib/site';
import { CATEGORIES } from '../lib/taxonomy';

export const GET: APIRoute = async () => {
	const docs = await getDocs();
	const lines = [
		`# ${SITE.name}`,
		'',
		`> ${SITE.description}`,
		'',
		`Every article states the Salesforce release and API version it was verified against, opens with a short direct answer, and links to the official Salesforce documentation it is based on. Articles are written by ${SITE.editorial}. Each link below points to the Markdown version of an article; remove the ".md" suffix and add a trailing slash for the HTML page.`,
		'',
	];
	for (const group of byCategory(docs)) {
		lines.push(`## ${CATEGORIES[group.category].label}`, '');
		for (const doc of group.docs) {
			lines.push(`- [${doc.data.title}](${abs(docMarkdownUrl(doc))}): ${doc.data.description}`);
		}
		lines.push('');
	}
	// HTML hub pages, for agents that browse rather than read this file.
	lines.push(
		'## Browse',
		'',
		`- [Docs by category](${abs(DOCS_INDEX_URL)}): every category with its article count`,
		`- [Docs by Salesforce release](${abs(RELEASES_INDEX_URL)}): articles grouped by the release they were verified against`,
		...byRelease(docs).map(
			(g) => `- [Salesforce ${g.release}](${abs(releaseUrl(g.release))}): API version ${g.apiVersion}, ${articleCount(g.docs.length)}`,
		),
		'',
	);
	lines.push(
		'## Optional',
		'',
		`- [Full text of all articles](${abs('/llms-full.txt')}): every article in one Markdown file`,
		`- [Sitemap](${abs('/sitemap.xml')}): all HTML pages with last-modified dates`,
		`- [Atom feed](${abs('/feed.xml')}): most recently updated articles`,
		'',
	);
	return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
