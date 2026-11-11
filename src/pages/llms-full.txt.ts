// /llms-full.txt — the full text of every article in one Markdown file.
import type { APIRoute } from 'astro';
import { getDocs } from '../lib/docs';
import { byCategory, docMarkdown } from '../lib/export';
import { SITE } from '../lib/site';

export const GET: APIRoute = async () => {
	const docs = await getDocs();
	const articles = byCategory(docs).flatMap((group) => group.docs.map(docMarkdown));
	const head = `# ${SITE.name}\n\n> ${SITE.description}\n`;
	return new Response([head, ...articles].join('\n---\n\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
