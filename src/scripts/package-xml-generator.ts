/**
 * package.xml generator page. The type list is fetched on first interaction;
 * nothing the user types leaves the browser. DOM is built with textContent.
 */
import { buildPackageXml, normalizeVersion, parseMembers } from '../lib/tools/package-xml';

interface TypeInfo {
	name: string;
	doc: string;
}

const root = document.querySelector<HTMLElement>('[data-pkg-tool]');

if (root) {
	const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
	const search = q<HTMLInputElement>('[data-pkg-search]');
	const status = q('[data-pkg-status]');
	const list = q('[data-pkg-list]');
	const selectedEl = q('[data-pkg-selected]');
	const version = q<HTMLInputElement>('[data-pkg-version]');
	const preview = q<HTMLTextAreaElement>('[data-pkg-preview]');
	const err = q('[data-pkg-error]');

	const MAX_SHOWN = 100;
	let types: TypeInfo[] = [];
	let loading: Promise<void> | undefined;
	const chosen = new Map<string, string>(); // type name -> members text

	const load = () =>
		(loading ??= fetch(root.dataset.src!)
			.then((r) => r.json())
			.then((d: TypeInfo[]) => {
				types = d;
				renderList();
			})
			.catch(() => {
				loading = undefined;
				status.textContent = 'Could not load the type list. Reload the page to try again.';
			}));

	const renderList = () => {
		const f = search.value.trim().toLowerCase();
		const hits = types.filter((t) => !f || t.name.toLowerCase().includes(f));
		list.replaceChildren();
		for (const t of hits.slice(0, MAX_SHOWN)) {
			const li = document.createElement('li');
			const label = document.createElement('label');
			const cb = document.createElement('input');
			cb.type = 'checkbox';
			cb.checked = chosen.has(t.name);
			cb.addEventListener('change', () => {
				if (cb.checked) chosen.set(t.name, '*');
				else chosen.delete(t.name);
				renderSelected();
				update();
			});
			label.append(cb, document.createTextNode(t.name));
			const a = document.createElement('a');
			a.href = t.doc;
			a.textContent = 'docs';
			a.setAttribute('aria-label', `${t.name} documentation`);
			li.append(label, a);
			list.append(li);
		}
		status.textContent = hits.length > MAX_SHOWN ? `Showing ${MAX_SHOWN} of ${hits.length} types. Type to narrow the list.` : `${hits.length} types`;
	};

	const renderSelected = () => {
		selectedEl.replaceChildren();
		let i = 0;
		for (const [name, text] of chosen) {
			const li = document.createElement('li');
			const id = `pkg-m-${i++}`;
			const label = document.createElement('label');
			label.htmlFor = id;
			label.textContent = `${name} members`;
			const ta = document.createElement('textarea');
			ta.id = id;
			ta.value = text;
			ta.spellcheck = false;
			ta.addEventListener('input', () => {
				chosen.set(name, ta.value);
				update();
			});
			li.append(label, ta);
			selectedEl.append(li);
		}
	};

	const current = () => {
		const v = normalizeVersion(version.value);
		const typesIn = [...chosen].map(([name, text]) => ({ name, members: parseMembers(text) }));
		return { v, typesIn };
	};

	const update = () => {
		const { v, typesIn } = current();
		err.textContent = '';
		if (!v) {
			err.textContent = 'Enter an API version such as 68.0.';
			return;
		}
		try {
			preview.value = buildPackageXml({ types: typesIn, version: v });
		} catch (e) {
			err.textContent = (e as Error).message;
		}
	};

	const flash = (btn: HTMLElement, text: string) => {
		const old = btn.textContent;
		btn.textContent = text;
		setTimeout(() => (btn.textContent = old), 1500);
	};

	root.addEventListener('click', async (e) => {
		const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
		if (!btn) return;
		const action = btn.dataset.action;
		if (action === 'copy' || action === 'copycmd') {
			const text = action === 'copy' ? preview.value : btn.dataset.text ?? '';
			try {
				await navigator.clipboard.writeText(text);
				flash(btn, 'Copied');
			} catch {
				flash(btn, 'Copy failed');
			}
		} else if (action === 'download') {
			const url = URL.createObjectURL(new Blob([preview.value], { type: 'application/xml' }));
			const a = document.createElement('a');
			a.href = url;
			a.download = 'package.xml';
			a.click();
			URL.revokeObjectURL(url);
		} else if (action === 'clear') {
			chosen.clear();
			renderSelected();
			renderList();
			update();
		}
	});

	search.addEventListener('focus', load, { once: true });
	search.addEventListener('input', () => {
		load();
		renderList();
	});
	version.addEventListener('input', update);
	update();
}
