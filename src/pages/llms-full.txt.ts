// /llms-full.txt — the full text of every article in one Markdown file.
import type { APIRoute } from 'astro';
import { getDocs } from '../lib/docs';
import { byCategory, docMarkdown } from '../lib/export';
import { SITE } from '../lib/site';
import { promptMarkdown, skillMarkdown } from '../lib/library-exports';
import { getPrompts } from '../lib/prompts';
import { getSkills } from '../lib/skills';
import { toolMarkdown } from '../lib/tool-exports';
import { liveTools } from '../lib/tools';

export const GET: APIRoute = async () => {
	const docs = await getDocs();
	const articles = byCategory(docs).flatMap((group) => group.docs.map(docMarkdown));
	const tools = liveTools().flatMap((t) => toolMarkdown(t.slug) ?? []);
	const head = `# ${SITE.name}\n\n> ${SITE.description}\n`;
	return new Response([head, ...articles, ...tools, ...getSkills().map(skillMarkdown), ...getPrompts().map(promptMarkdown)].join('\n---\n\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
