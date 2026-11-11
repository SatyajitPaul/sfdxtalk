/**
 * Sätteri HTML-tree plugin: renders ```mermaid fences to inline SVG at build
 * time with beautiful-mermaid (pure TypeScript, no browser), so diagrams show
 * without any client JavaScript and their labels are real text in the HTML.
 *
 * `mermaid` is excluded from Shiki in astro.config.mjs, so the fence reaches
 * this plugin as a plain <pre><code class="language-mermaid">.
 *
 * Colours come from the site's CSS tokens (--text, --surface, --border,
 * --accent), so diagrams follow the light/dark theme with no re-render.
 * The raw Mermaid source stays in the article body, so the .md and
 * llms-full.txt exports still carry it for AI tools.
 *
 * A diagram that fails to parse fails the build, like other content errors.
 */
import { renderMermaidSVG } from 'beautiful-mermaid';

type HNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HNode[];
};
type Ctx = { textContent(node: HNode): string };

let counter = 0;

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Node labels in source order, for the accessible name. */
function labels(source: string): string[] {
	const found = [...source.matchAll(/\["([^"]+)"\]|\[([^\]"]+)\]|\(([^)"]+)\)|\{([^}"]+)\}/g)]
		.map((m) => (m[1] ?? m[2] ?? m[3] ?? m[4]).trim())
		.filter(Boolean);
	// ER diagrams have no bracket labels: use the entity names on relationship lines.
	if (!found.length) {
		for (const m of source.matchAll(/^\s*([\w-]+)\s+[|}o][|o]?--[|o{]{1,2}\s+([\w-]+)/gm)) found.push(m[1], m[2]);
	}
	return [...new Set(found)];
}

export function renderDiagram(source: string): string {
	const id = `mmd${++counter}`;
	let svg = renderMermaidSVG(source, { bg: 'var(--surface)', fg: 'var(--text)', transparent: true });

	svg = svg
		// No third-party font request: diagrams use the page's own font.
		.replace(/@import url\([^)]*\);?\s*/g, '')
		.replace(/text \{ font-family:[^}]*\}/, `#${id} text { font-family: inherit; }`)
		// An inline <style> is document-wide; scope it to this diagram.
		.replace(/(^|\n)\s*svg \{/, `$1  #${id} {`)
		// Marker ids must be unique when a page has several diagrams.
		.replace(/\bid="([\w-]+)"/g, `id="${id}-$1"`)
		.replace(/url\(#([\w-]+)\)/g, `url(#${id}-$1)`)
		.replace(/<svg /, `<svg id="${id}" role="img" focusable="false" `);

	// Shrink to fit, but never below 85% (13px labels stay ≥ 11px); wider diagrams scroll.
	const width = Number(/<svg [^>]*\bwidth="([\d.]+)"/.exec(svg)?.[1]);
	if (width) svg = svg.replace(/(<svg [^>]*\bstyle=")/, `$1min-width:${Math.round(width * 0.85)}px;`);

	const names = labels(source);
	const label = names.length ? `Diagram: ${names.join(' → ')}` : 'Diagram';
	svg = svg.replace(/<svg /, `<svg aria-label="${escapeAttr(label)}" `);

	return `<figure class="diagram" tabindex="0">${svg}</figure>`;
}

export function mermaidDiagrams() {
	return {
		name: 'sfdxtalk:mermaid',
		element: {
			filter: ['pre'],
			visit(node: HNode, ctx: Ctx) {
				const code = node.children?.find((c) => c.type === 'element' && c.tagName === 'code');
				const cls = code?.properties?.className;
				if (!code || !Array.isArray(cls) || !cls.includes('language-mermaid')) return;
				const source = ctx.textContent(code).replace(/\n$/, '');
				try {
					return { type: 'raw', value: renderDiagram(source) };
				} catch (err) {
					throw new Error(`Mermaid diagram failed to render: ${(err as Error).message}\n${source}`);
				}
			},
		},
	};
}
