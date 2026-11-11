/**
 * Search behavior shared by the home page box and the header dialog
 * (src/components/Search.astro; one instance per page). Pagefind and its
 * index are fetched on the first keystroke or filter use, never on page load.
 */

interface PagefindResult {
	url: string;
	excerpt: string;
	meta: Record<string, string>;
}
interface Pagefind {
	filters(): Promise<Record<string, Record<string, number>>>;
	debouncedSearch(
		term: string | null,
		options?: object,
		debounceMs?: number,
	): Promise<{ results: { data(): Promise<PagefindResult> }[] } | null>;
}

const MAX_RESULTS = 8;
const root = document.querySelector('[data-search]');
const input = root?.querySelector<HTMLInputElement>('[data-search-input]');
const list = root?.querySelector<HTMLOListElement>('[data-search-results]');
const status = root?.querySelector<HTMLElement>('[data-search-status]');
const filterBox = root?.querySelector<HTMLElement>('[data-search-filters]');
const selects = [...(filterBox?.querySelectorAll('select') ?? [])];
// Present on every page except home, where the box sits in the page itself.
const dialog = root?.closest('dialog');
let engine: Promise<Pagefind> | undefined;

// A variable path keeps the bundler from trying to resolve a file that only exists after the build.
const indexUrl = '/pagefind/pagefind.js';
const load = () =>
	(engine ??= (import(/* @vite-ignore */ indexUrl) as Promise<Pagefind>).then(async (pagefind) => {
		const available = await pagefind.filters();
		for (const select of selects) {
			const values = Object.entries(available[select.dataset.filter!] ?? {});
			if (!values.length) continue;
			select.append(...values.map(([value, count]) => new Option(`${value} (${count})`, value)));
			select.hidden = false;
			filterBox!.hidden = false;
		}
		return pagefind;
	}));

async function run() {
	if (!input || !list || !status) return;
	const term = input.value.trim();
	const filters: Record<string, string> = {};
	for (const select of selects) if (select.value) filters[select.dataset.filter!] = select.value;
	const filtered = Object.keys(filters).length > 0;
	if (!term && !filtered) {
		list.replaceChildren();
		status.textContent = '';
		return;
	}
	let search;
	try {
		// A null term lists everything that matches the filters.
		search = await (await load()).debouncedSearch(term || null, { filters }, 150);
	} catch {
		engine = undefined;
		// In dev the index comes from the last build (see src/integrations/pagefind.ts).
		status.textContent = import.meta.env.DEV
			? 'No search index yet. Run "pnpm build" once, then reload.'
			: 'Search is not available right now.';
		return;
	}
	if (!search) return; // a newer keystroke replaced this search
	const results = await Promise.all(search.results.slice(0, MAX_RESULTS).map((r) => r.data()));
	if (input.value.trim() !== term) return;

	list.replaceChildren(
		...results.map((r) => {
			const li = document.createElement('li');
			const a = document.createElement('a');
			a.href = r.url;
			a.textContent = r.meta.title ?? r.url;
			const p = document.createElement('p');
			// Pagefind escapes page text; the only markup in an excerpt is its <mark> highlights.
			p.innerHTML = r.excerpt;
			if (r.meta.category) {
				const tag = document.createElement('span');
				tag.className = 'search-category';
				tag.textContent = r.meta.category;
				li.append(tag);
			}
			li.append(a, p);
			return li;
		}),
	);
	const total = search.results.length;
	status.textContent =
		total === 0
			? `No articles match${term ? ` “${term}”` : ''}${filtered ? ' with these filters' : ''}.`
			: total > MAX_RESULTS
				? `Top ${MAX_RESULTS} of ${total} articles`
				: `${total} article${total === 1 ? '' : 's'}`;
}

function open() {
	if (!input) return;
	if (dialog && !dialog.open) dialog.showModal();
	input.focus();
	input.select();
}

input?.addEventListener('input', run);
filterBox?.addEventListener('change', run);
root?.querySelector('[data-search-form]')?.addEventListener('submit', (event) => {
	event.preventDefault();
	// Enter opens the first result.
	list?.querySelector('a')?.click();
});
document.querySelector('[data-search-open]')?.addEventListener('click', open);
// A click on the backdrop lands on the dialog element itself.
dialog?.addEventListener('click', (event) => {
	if (event.target === dialog) dialog.close();
});

// "/" and Ctrl/Cmd+K jump to the search box.
addEventListener('keydown', (event) => {
	const typing = (event.target as Element | null)?.closest('input, textarea, select, [contenteditable]');
	const slash = event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey;
	const k = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
	if (slash || k) {
		event.preventDefault();
		open();
	} else if (event.key === 'Escape' && event.target === input) {
		// Closed by hand: natively, Escape in a filled search field only clears it.
		if (dialog) return dialog.close();
		input!.value = '';
		run();
	}
});
