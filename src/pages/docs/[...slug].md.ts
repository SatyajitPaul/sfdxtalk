// Raw Markdown version of every article at /docs/{category}/{slug}.md
// (docs/PLAN.md §8). The HTML page links here with rel="alternate".
import type { APIRoute } from 'astro';
import { getDocs, type Doc } from '../../lib/docs';
import { docMarkdown } from '../../lib/export';

export async function getStaticPaths() {
	const docs = await getDocs();
	return docs.map((doc) => ({ params: { slug: doc.id }, props: { doc } }));
}

export const GET: APIRoute = ({ props }) =>
	new Response(docMarkdown((props as { doc: Doc }).doc), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
