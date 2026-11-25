// Static JSON list of Metadata API types with a doc page, fetched lazily by the package.xml generator.
import type { APIRoute } from 'astro';
import { docUrl, getDocs } from '../../lib/docs';
import { apiNameFor, type PackageXmlType } from '../../lib/tools/package-xml-types';

export const GET: APIRoute = async () => {
	const docs = await getDocs();
	const types: PackageXmlType[] = [];
	for (const d of docs) {
		const name = apiNameFor(d.id, d.data.title);
		if (name) types.push({ name, title: d.data.title, doc: docUrl(d) });
	}
	types.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	return new Response(JSON.stringify(types), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
