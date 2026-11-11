/**
 * Shiki transformer: wraps every code block in
 *   <figure class="code-block" data-lang="apex">
 *     <figcaption class="code-header"><span>AccountTrigger.trigger</span><button …>Copy</button></figcaption>
 *     <pre class="astro-code">…</pre>
 *   </figure>
 * The caption shows `title="…"` from the code fence, or the language name.
 * The copy button is hidden until JavaScript runs (see src/scripts/site.ts).
 */

type HNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HNode[] };

const LANG_LABELS: Record<string, string> = {
	apex: 'Apex',
	soql: 'SOQL',
	sosl: 'SOSL',
	sql: 'SQL',
	javascript: 'JavaScript',
	js: 'JavaScript',
	typescript: 'TypeScript',
	ts: 'TypeScript',
	html: 'HTML',
	css: 'CSS',
	xml: 'XML',
	json: 'JSON',
	yaml: 'YAML',
	bash: 'Terminal',
	shell: 'Terminal',
	sh: 'Terminal',
	text: 'Text',
	plaintext: 'Text',
};

export function codeBlocks() {
	return {
		name: 'sfdxtalk:code-blocks',
		root(this: { options: { lang?: string; meta?: { __raw?: string } } }, root: { children: HNode[] }) {
			const lang = this.options.lang ?? 'text';
			const title = /title="([^"]+)"/.exec(this.options.meta?.__raw ?? '')?.[1];
			const caption = title ?? LANG_LABELS[lang] ?? lang.toUpperCase();

			const header: HNode = {
				type: 'element',
				tagName: 'figcaption',
				properties: { className: ['code-header'] },
				children: [
					{
						type: 'element',
						tagName: 'span',
						properties: { className: [title ? 'code-title' : 'code-lang'] },
						children: [{ type: 'text', value: caption }],
					},
					{
						type: 'element',
						tagName: 'button',
						properties: { type: 'button', className: ['copy-btn'], dataCopy: '', ariaLabel: 'Copy code' },
						children: [{ type: 'text', value: 'Copy' }],
					},
				],
			};

			root.children = [
				{
					type: 'element',
					tagName: 'figure',
					properties: { className: ['code-block'], dataLang: lang },
					children: [header, ...root.children],
				},
			];
		},
	};
}
