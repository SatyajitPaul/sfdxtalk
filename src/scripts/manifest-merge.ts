/**
 * package.xml viewer, diff and merge page. Everything runs in the browser;
 * results are built with textContent, never innerHTML, and nothing is sent anywhere.
 */
import { diffManifests, diffReport, mergeManifests, parseManifest, type Manifest } from '../lib/tools/manifest';

const root = document.querySelector<HTMLElement>('[data-mf-tool]');

if (root) {
	const a = root.querySelector<HTMLTextAreaElement>('[data-mf-a]')!;
	const b = root.querySelector<HTMLTextAreaElement>('[data-mf-b]')!;
	const out = root.querySelector<HTMLElement>('[data-mf-out]')!;
	const status = root.querySelector<HTMLElement>('[data-mf-status]')!;
	const warn = root.querySelector<HTMLElement>('[data-mf-warn]')!;
	const exampleA = root.dataset.exampleA ?? '';
	const exampleB = root.dataset.exampleB ?? '';
	let lastText = '';
	let lastFile = 'package.xml';

	const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string) => {
		const n = document.createElement(tag);
		if (text !== undefined) n.textContent = text;
		if (cls) n.className = cls;
		return n;
	};
	const list = (items: string[], prefix: string, cls: string) => {
		const ul = el('ul');
		for (const i of items) ul.append(el('li', `${prefix} ${i}`, cls));
		return ul;
	};
	const reset = () => {
		out.replaceChildren();
		warn.textContent = '';
		lastText = '';
	};
	const read = (ta: HTMLTextAreaElement, label: string): Manifest | undefined => {
		if (!ta.value.trim()) return undefined;
		const m = parseManifest(ta.value);
		if (m.warnings.length) warn.textContent += `${label}: ${m.warnings.join(' ')} `;
		return m;
	};
	const actions = () => {
		const bar = el('div', undefined, 'mf-actions');
		const copy = el('button', 'Copy result');
		copy.type = 'button';
		copy.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(lastText);
				status.textContent = 'Copied to the clipboard.';
			} catch {
				status.textContent = 'Copy failed. Select the text and copy it manually.';
			}
		});
		const dl = el('button', 'Download');
		dl.type = 'button';
		dl.addEventListener('click', () => {
			const url = URL.createObjectURL(new Blob([lastText], { type: lastFile.endsWith('.xml') ? 'application/xml' : 'text/plain' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = lastFile;
			link.click();
			URL.revokeObjectURL(url);
		});
		bar.append(copy, dl);
		return bar;
	};

	const view = () => {
		reset();
		const m = read(a, 'Manifest A');
		if (!m) return void (status.textContent = 'Paste a package.xml into box A first.');
		out.append(el('h3', `API version ${m.version ?? 'not set'}: ${m.types.length} types`));
		for (const t of m.types) {
			const d = el('details');
			d.append(el('summary', `${t.name} (${t.members.length})`));
			d.append(list(t.members, '', ''));
			out.append(d);
		}
		status.textContent = `Parsed ${m.types.length} types.`;
	};

	const compare = () => {
		reset();
		const ma = read(a, 'Manifest A');
		const mb = read(b, 'Manifest B');
		if (!ma || !mb) return void (status.textContent = 'Paste a package.xml into both boxes to compare.');
		const d = diffManifests(ma, mb);
		lastText = diffReport(d);
		lastFile = 'manifest-diff.txt';
		if (d.identical) {
			status.textContent = 'The manifests are identical.';
			return;
		}
		status.textContent = `${d.typesAdded.length} types added, ${d.typesRemoved.length} removed, ${d.changed.length} changed, ${d.unchanged.length} unchanged.`;
		if (d.version.differs) out.append(el('p', `Version: ${d.version.a ?? '(none)'} to ${d.version.b ?? '(none)'}`));
		for (const t of d.typesAdded) {
			out.append(el('h3', `Added type: ${t.name}`), list(t.members, '+', 'mf-add'));
		}
		for (const t of d.typesRemoved) {
			out.append(el('h3', `Removed type: ${t.name}`), list(t.members, '-', 'mf-del'));
		}
		for (const t of d.changed) {
			out.append(el('h3', `Changed type: ${t.name}`));
			if (t.wildcardChange) out.append(el('p', 'One side uses * and the other names members.', 'mf-warn'));
			out.append(list(t.added, '+', 'mf-add'), list(t.removed, '-', 'mf-del'));
		}
		out.append(actions());
	};

	const merge = () => {
		reset();
		const inputs = [read(a, 'Manifest A'), read(b, 'Manifest B')].filter((m): m is Manifest => !!m);
		if (!inputs.length) return void (status.textContent = 'Paste at least one package.xml to merge or clean up.');
		const r = mergeManifests(inputs, root.dataset.version ?? '68.0');
		lastText = r.xml;
		lastFile = 'package.xml';
		status.textContent = `Merged into ${r.typeCount} types and ${r.memberCount} members at API ${r.version}. ${r.duplicatesRemoved} duplicate members removed.`;
		const ta = el('textarea');
		ta.readOnly = true;
		ta.value = r.xml;
		ta.setAttribute('aria-label', 'Merged package.xml');
		out.append(ta, actions());
	};

	root.addEventListener('click', (e) => {
		const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
		if (action === 'view') view();
		else if (action === 'compare') compare();
		else if (action === 'merge') merge();
		else if (action === 'example') {
			a.value = exampleA;
			b.value = exampleB;
			compare();
		} else if (action === 'clear') {
			a.value = '';
			b.value = '';
			reset();
			status.textContent = 'Paste a package.xml into box A, and into box B to compare or merge.';
		}
	});
}
