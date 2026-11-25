/**
 * Tool pages: type to filter reference tables. Progressive enhancement only;
 * every row is already in the HTML, so the page works without this script.
 *
 * Markup: a [data-tf] wrapper holding the input and a [data-tf-status]
 * element (with data-noun="limits" for the count text); tables sit inside
 * [data-tf-section] wrappers, and filterable rows carry [data-tf-row].
 * Rows with an id are the ones counted; other rows (summary tables) are only filtered.
 */
const root = document.querySelector<HTMLElement>('[data-tf]');
const input = root?.querySelector<HTMLInputElement>('input');
const status = root?.querySelector<HTMLElement>('[data-tf-status]');

if (root && input && status) {
	const noun = root.dataset.noun ?? 'results';
	const sections = [...document.querySelectorAll<HTMLElement>('[data-tf-section]')];
	const rows = [...document.querySelectorAll<HTMLTableRowElement>('[data-tf-row]')];
	const text = new Map(rows.map((r) => [r, (r.textContent ?? '').toLowerCase()]));
	const counted = rows.filter((r) => r.id);

	const apply = () => {
		const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
		for (const r of rows) r.hidden = !terms.every((t) => text.get(r)!.includes(t));
		for (const s of sections) s.hidden = !s.querySelector('[data-tf-row]:not([hidden])');
		const shown = counted.filter((r) => !r.hidden).length;
		status.textContent = terms.length ? `${shown} of ${counted.length} ${noun} match` : `${counted.length} ${noun}`;
	};

	input.addEventListener('input', apply);
	// A deep link to a hidden row must still work: clear the filter if it hides the target.
	addEventListener('hashchange', () => {
		const target = location.hash && document.getElementById(location.hash.slice(1));
		if (target?.hidden) {
			input.value = '';
			apply();
		}
	});
}
