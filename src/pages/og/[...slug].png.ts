// Per-article Open Graph image at /og/{category}/{slug}.png (docs/PLAN.md §7).
// Drawn at build time by src/lib/og-image.ts.
import type { APIRoute } from 'astro';
import { getDocs, type Doc } from '../../lib/docs';
import { docOgImage } from '../../lib/og-image';

export async function getStaticPaths() {
	const docs = await getDocs();
	return docs.map((doc) => ({ params: { slug: doc.id }, props: { doc } }));
}

export const GET: APIRoute = async ({ props }) =>
	new Response(new Uint8Array(await docOgImage((props as { doc: Doc }).doc)), {
		headers: { 'Content-Type': 'image/png' },
	});
