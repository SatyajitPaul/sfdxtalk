/**
 * Resolves the `related` ids on a skill or prompt to links, and fails the build on an
 * unknown id so a typo never ships as a dead link. Tools must be live to be linked.
 */
import { docUrl, getDocs } from './docs';
import { getPrompts, promptUrl } from './prompts';
import { getSkills, skillUrl } from './skills';
import { TOOLS, toolUrl } from './tools';

export interface RelatedLink {
	href: string;
	title: string;
	text: string;
}
export interface RelatedGroups {
	tools: RelatedLink[];
	skills: RelatedLink[];
	prompts: RelatedLink[];
	docs: RelatedLink[];
}
export interface RelatedIds {
	tools?: string[];
	skills?: string[];
	prompts?: string[];
	docs?: string[];
}

export async function resolveRelated(ids: RelatedIds, from: string): Promise<RelatedGroups> {
	const docs = await getDocs();
	const fail = (kind: string, id: string): never => {
		throw new Error(`${from}: related ${kind} "${id}" does not exist`);
	};
	return {
		tools: (ids.tools ?? []).map((id) => {
			const t = TOOLS.find((x) => x.slug === id && x.status === 'live') ?? fail('tool (live)', id);
			return { href: toolUrl(t), title: t.name, text: t.tagline };
		}),
		skills: (ids.skills ?? []).map((id) => {
			const s = getSkills().find((x) => x.slug === id) ?? fail('skill', id);
			return { href: skillUrl(s), title: s.title, text: s.tagline };
		}),
		prompts: (ids.prompts ?? []).map((id) => {
			const p = getPrompts().find((x) => x.slug === id) ?? fail('prompt', id);
			return { href: promptUrl(p), title: p.title, text: p.tagline };
		}),
		docs: (ids.docs ?? []).map((id) => {
			const d = docs.find((x) => x.id === id) ?? fail('docs article', id);
			return { href: docUrl(d), title: d.data.title, text: d.data.description };
		}),
	};
}
