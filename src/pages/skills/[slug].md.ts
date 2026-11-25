// /skills/{slug}.md — a Markdown version of the skill page for AI assistants.
import type { APIRoute } from 'astro';
import { skillMarkdown } from '../../lib/library-exports';
import { getSkills } from '../../lib/skills';

export const getStaticPaths = () => getSkills().map((s) => ({ params: { slug: s.slug }, props: { skill: s } }));

export const GET: APIRoute = ({ props }) =>
	new Response(skillMarkdown(props.skill as ReturnType<typeof getSkills>[number]), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
