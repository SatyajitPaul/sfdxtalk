// /feed.xml — Atom feed of the 50 most recently updated articles.
import type { APIRoute } from 'astro';
import { docUrl, getDocs } from '../lib/docs';
import { latestUpdate, xmlEscape as x } from '../lib/export';
import { SITE, abs } from '../lib/site';
import { CATEGORIES } from '../lib/taxonomy';

export const GET: APIRoute = async () => {
	const docs = (await getDocs()).slice(0, 50);
	const updated = (latestUpdate(docs) ?? new Date(0)).toISOString();
	const entries = docs.map((doc) => {
		const d = doc.data;
		const url = abs(docUrl(doc));
		return [
			'<entry>',
			`<title>${x(d.title)}</title>`,
			`<link href="${x(url)}"/>`,
			`<id>${x(url)}</id>`,
			`<published>${d.published.toISOString()}</published>`,
			`<updated>${d.lastUpdated.toISOString()}</updated>`,
			`<summary>${x(d.tldr)}</summary>`,
			`<category term="${x(CATEGORIES[d.category].label)}"/>`,
			'</entry>',
		].join('');
	});
	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<feed xmlns="http://www.w3.org/2005/Atom">',
		`<title>${x(SITE.name)}</title>`,
		`<subtitle>${x(SITE.description)}</subtitle>`,
		`<link href="${abs('/feed.xml')}" rel="self"/>`,
		`<link href="${abs('/')}"/>`,
		`<id>${abs('/')}</id>`,
		`<updated>${updated}</updated>`,
		`<author><name>${x(SITE.editorial)}</name></author>`,
		...entries,
		'</feed>',
		'',
	].join('\n');
	return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
