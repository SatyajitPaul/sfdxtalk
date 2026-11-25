// /sitemap.xml — every indexable page. `lastmod` comes from `lastUpdated`
// only, because Google trusts lastmod only when it is consistently accurate.
import type { APIRoute } from 'astro';
import { docUrl, getDocs } from '../lib/docs';
import { byCategory, isoDate, latestUpdate, xmlEscape } from '../lib/export';
import {
	DOCS_INDEX_URL,
	RELEASES_INDEX_URL,
	TAGS_INDEX_URL,
	byRelease,
	byTag,
	releaseUrl,
	tagUrl,
	tagsIndexable,
} from '../lib/hubs';
import { categoryUrl } from '../lib/schema';
import { abs } from '../lib/site';
import { PROMPTS_INDEX_URL, getPrompts, promptUrl, promptsHubIndexable } from '../lib/prompts';
import { SKILLS_INDEX_URL, getSkills, skillUrl, skillsHubIndexable } from '../lib/skills';
import { toolLastmod } from '../lib/tool-exports';
import { TOOLS_INDEX_URL, liveTools, toolUrl, toolsHubIndexable } from '../lib/tools';

export const GET: APIRoute = async () => {
	const docs = await getDocs();
	const all = latestUpdate(docs);
	const tags = byTag(docs);
	const entries: { path: string; lastmod?: Date }[] = [
		{ path: '/', lastmod: all },
		{ path: DOCS_INDEX_URL, lastmod: all },
		...byCategory(docs).map((g) => ({ path: categoryUrl(g.category), lastmod: latestUpdate(g.docs) })),
		// The tools hub is noindex until a tool is live, and noindex URLs stay out of the sitemap.
		...(toolsHubIndexable() ? [{ path: TOOLS_INDEX_URL, lastmod: new Date(Math.max(...liveTools().map((t) => toolLastmod(t.slug)?.getTime() ?? 0))) }, ...liveTools().map((t) => ({ path: toolUrl(t), lastmod: toolLastmod(t.slug) }))] : []),
		// Skills and prompts hubs are noindex until they list an item.
		...(skillsHubIndexable()
			? [{ path: SKILLS_INDEX_URL, lastmod: new Date(`${getSkills()[0].updated}T00:00:00Z`) }, ...getSkills().map((s) => ({ path: skillUrl(s), lastmod: new Date(`${s.updated}T00:00:00Z`) }))]
			: []),
		...(promptsHubIndexable()
			? [{ path: PROMPTS_INDEX_URL, lastmod: new Date(`${getPrompts()[0].updated}T00:00:00Z`) }, ...getPrompts().map((p) => ({ path: promptUrl(p), lastmod: new Date(`${p.updated}T00:00:00Z`) }))]
			: []),
		{ path: RELEASES_INDEX_URL, lastmod: all },
		...byRelease(docs).map((g) => ({ path: releaseUrl(g.release), lastmod: latestUpdate(g.docs) })),
		// Thin tag pages are noindex, and a noindex URL must not be in the sitemap.
		...(tagsIndexable(tags) ? [{ path: TAGS_INDEX_URL, lastmod: all }] : []),
		...tags.filter((g) => g.indexable).map((g) => ({ path: tagUrl(g.tag), lastmod: latestUpdate(g.docs) })),
		...docs.map((d) => ({ path: docUrl(d), lastmod: d.data.lastUpdated })),
	];
	const urls = entries.map(
		(e) =>
			`<url><loc>${xmlEscape(abs(e.path))}</loc>${e.lastmod ? `<lastmod>${isoDate(e.lastmod)}</lastmod>` : ''}</url>`,
	);
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
