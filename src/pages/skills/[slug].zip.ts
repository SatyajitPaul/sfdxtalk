// /skills/{slug}.zip — the skill folder as a zip (skill-name/SKILL.md plus any other files).
import type { APIRoute } from 'astro';
import { getSkills } from '../../lib/skills';
import { zipStore } from '../../lib/zip';

export const getStaticPaths = () => getSkills().map((s) => ({ params: { slug: s.slug }, props: { files: s.files } }));

export const GET: APIRoute = ({ params, props }) => {
	const enc = new TextEncoder();
	const entries = Object.entries(props.files as Record<string, string>)
		.sort(([a], [b]) => (a === 'SKILL.md' ? -1 : b === 'SKILL.md' ? 1 : a.localeCompare(b)))
		.map(([path, text]) => ({ path: `${params.slug}/${path}`, data: enc.encode(text) }));
	return new Response(zipStore(entries), { headers: { 'Content-Type': 'application/zip' } });
};
