// /prompt/{slug}.md — a Markdown version of the prompt page for AI assistants.
import type { APIRoute } from 'astro';
import { promptMarkdown } from '../../lib/library-exports';
import { getPrompts } from '../../lib/prompts';

export const getStaticPaths = () => getPrompts().map((p) => ({ params: { slug: p.slug }, props: { prompt: p } }));

export const GET: APIRoute = ({ props }) =>
	new Response(promptMarkdown(props.prompt as ReturnType<typeof getPrompts>[number]), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
