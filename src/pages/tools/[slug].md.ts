// /tools/{slug}.md — Markdown version of a live tool page, for AI assistants.
import type { APIRoute, GetStaticPaths } from 'astro';
import { toolMarkdown } from '../../lib/tool-exports';
import { liveTools } from '../../lib/tools';

export const getStaticPaths: GetStaticPaths = () =>
	liveTools()
		.filter((t) => toolMarkdown(t.slug))
		.map((t) => ({ params: { slug: t.slug } }));

export const GET: APIRoute = ({ params }) =>
	new Response(toolMarkdown(params.slug!)!, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
