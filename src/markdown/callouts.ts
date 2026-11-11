/**
 * Sätteri HTML-tree plugin for SFDX Talk Markdown:
 *   - Callouts: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!RELEASE] Winter '27`
 *     become <div class="callout" role="note" data-type="…">.
 *   - Tables are wrapped in a focusable, horizontally scrollable region.
 *   - h2/h3 get a hover "#" link to their own id (needs heading ids first).
 *
 * Written against Sätteri 0.11 (bundled with Astro 7). Plain objects are used
 * instead of Sätteri's type helpers because `satteri` is not a direct dependency.
 */

type HNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HNode[];
};
type Ctx = {
	replaceNode(node: HNode, next: HNode | HNode[]): void;
	wrapNode(node: HNode, parent: HNode): void;
	appendChild(node: HNode, child: HNode | HNode[]): void;
};

export const CALLOUT_TYPES = {
	note: 'Note',
	tip: 'Tip',
	warning: 'Warning',
	release: 'Release',
} as const;
type CalloutType = keyof typeof CALLOUT_TYPES;

const MARKER = /^\s*\[!([a-z]+)\][ \t]*([^\n]*)\n?/i;

const el = (tagName: string, properties: Record<string, unknown>, children: HNode[] = []): HNode => ({
	type: 'element',
	tagName,
	properties,
	children,
});
const text = (value: string): HNode => ({ type: 'text', value });

function transformCallout(node: HNode, ctx: Ctx) {
	const children = node.children ?? [];
	const firstIndex = children.findIndex((c) => c.type === 'element');
	const first = children[firstIndex];
	if (!first || first.tagName !== 'p') return;
	const lead = first.children?.[0];
	if (!lead || lead.type !== 'text' || !lead.value) return;

	const match = MARKER.exec(lead.value);
	if (!match) return;
	const type = match[1].toLowerCase();
	if (!(type in CALLOUT_TYPES)) {
		throw new Error(`Unknown callout type [!${match[1]}]. Use one of: ${Object.keys(CALLOUT_TYPES).join(', ')}`);
	}
	const label = CALLOUT_TYPES[type as CalloutType];
	const custom = match[2].trim();

	// Remove the marker line from the first paragraph; drop the paragraph if it's now empty.
	const rest = lead.value.slice(match[0].length);
	const firstChildren = [...(first.children ?? [])];
	if (rest) firstChildren[0] = text(rest);
	else firstChildren.shift();
	while (firstChildren[0]?.type === 'element' && firstChildren[0].tagName === 'br') firstChildren.shift();

	const body = children.slice(firstIndex + 1);
	if (firstChildren.some((c) => c.type !== 'text' || c.value?.trim())) {
		body.unshift(el('p', {}, firstChildren));
	}

	const title = el('p', { className: ['callout-title'] }, [
		el('span', { className: ['callout-icon'], ariaHidden: 'true' }),
		el('span', {}, [text(custom && type === 'release' ? `${label}: ${custom}` : custom || label)]),
	]);

	ctx.replaceNode(
		node,
		el('div', { className: ['callout'], role: 'note', dataType: type }, [
			title,
			el('div', { className: ['callout-body'] }, body),
		]),
	);
}

export function sfdxMarkdown() {
	return {
		name: 'sfdxtalk:markdown',
		element: [
			{ filter: ['blockquote'], visit: (node: HNode, ctx: Ctx) => transformCallout(node, ctx) },
			{
				filter: ['table'],
				visit: (node: HNode, ctx: Ctx) =>
					ctx.wrapNode(node, el('div', { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Table' })),
			},
			{
				filter: ['h2', 'h3'],
				visit: (node: HNode, ctx: Ctx) => {
					const id = node.properties?.id;
					if (typeof id !== 'string' || !id) return;
					ctx.appendChild(
						node,
						el('a', { className: ['heading-anchor'], href: `#${id}`, ariaHidden: 'true', tabIndex: -1 }, [text('#')]),
					);
				},
			},
		],
	};
}
