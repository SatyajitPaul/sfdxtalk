// /llms.txt — a Markdown index of the site for LLMs (https://llmstxt.org/).
import type { APIRoute } from 'astro';
import { getDocs } from '../lib/docs';
import { byCategory, docMarkdownUrl } from '../lib/export';
import { DOCS_INDEX_URL, RELEASES_INDEX_URL, articleCount, byRelease, releaseUrl } from '../lib/hubs';
import { SITE, abs } from '../lib/site';
import { PROMPTS_INDEX_URL, getPrompts } from '../lib/prompts';
import { SKILLS_INDEX_URL, getSkills } from '../lib/skills';
import { toolMarkdown } from '../lib/tool-exports';
import { TOOLS_INDEX_URL, liveTools, toolUrl } from '../lib/tools';
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
	const tools = liveTools();
	if (tools.length) {
		lines.push(
			'## Tools',
			'',
			`- [All tools](${abs(TOOLS_INDEX_URL)}): free Salesforce developer tools that run in the browser`,
			...tools.map((t) => `- [${t.name}](${abs(toolMarkdown(t.slug) ? `/tools/${t.slug}.md` : toolUrl(t))}): ${t.tagline}`),
			'',
		);
	}
	const skills = getSkills();
	if (skills.length) {
		lines.push(
			'## Skills',
			'',
			`- [All skills](${abs(SKILLS_INDEX_URL)}): downloadable Agent Skills for working with Salesforce through MCP or the Salesforce CLI`,
			...skills.map((s) => `- [${s.title}](${abs(`/skills/${s.slug}.md`)}): ${s.tagline}`),
			'',
		);
	}
	const prompts = getPrompts();
	if (prompts.length) {
		lines.push(
			'## Prompts',
			'',
			`- [All prompts](${abs(PROMPTS_INDEX_URL)}): tested prompts for Salesforce work, each with a known-good output`,
			...prompts.map((p) => `- [${p.title}](${abs(`/prompt/${p.slug}.md`)}): ${p.tagline}`),
			'',
		);
	}
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
