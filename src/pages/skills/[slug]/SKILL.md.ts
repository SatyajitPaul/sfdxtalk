// /skills/{slug}/SKILL.md — the raw skill file, exactly as shipped in the zip.
import type { APIRoute } from 'astro';
import { getSkills } from '../../../lib/skills';

export const getStaticPaths = () => getSkills().map((s) => ({ params: { slug: s.slug }, props: { text: s.skillMd } }));

export const GET: APIRoute = ({ props }) => new Response(props.text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
