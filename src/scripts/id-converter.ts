/**
 * Salesforce ID converter page: converts pasted IDs in the browser. Nothing is
 * sent anywhere; results are built with textContent, never innerHTML.
 */
import { parseId, splitIds, type ParsedId } from '../lib/tools/sf-id';

interface Row extends ParsedId {
	object: string;
}

const MAX_ROWS = 5000;
const root = document.querySelector<HTMLElement>('[data-id-tool]');

if (root) {
	const input = root.querySelector<HTMLTextAreaElement>('textarea')!;
	const summary = root.querySelector<HTMLElement>('[data-id-summary]')!;
	const wrap = root.querySelector<HTMLElement>('[data-id-results]')!;
	const body = root.querySelector<HTMLElement>('[data-id-out]')!;
	const prefixes: Record<string, { object: string; apiName?: string }> = JSON.parse(root.dataset.prefixes ?? '{}');
	const example = root.dataset.example ?? '';
	let rows: Row[] = [];

	const objectFor = (p?: string) => {
		const hit = p ? prefixes[p] : undefined;
		return hit ? (hit.apiName ? `${hit.object} (${hit.apiName})` : hit.object) : '';
	};

	const cell = (tr: HTMLTableRowElement, text: string, mono = false) => {
		const td = tr.insertCell();
		td.textContent = text;
		if (mono) td.className = 'id-mono';
		return td;
	};

	const render = () => {
		const ids = splitIds(input.value);
		const truncated = ids.length > MAX_ROWS;
		rows = ids.slice(0, MAX_ROWS).map((raw) => {
			const p = parseId(raw);
			return { ...p, object: objectFor(p.prefix) };
		});
		body.replaceChildren();
		for (const r of rows) {
			const tr = body.insertRow();
			cell(tr, r.input, true);
			cell(tr, r.id15 ?? '', true);
			cell(tr, r.id18 ?? '', true);
			cell(tr, r.object);
			const status = cell(tr, r.status === 'ok' ? 'Valid' : r.status === 'invalid' ? 'Invalid' : 'Checksum mismatch');
			status.className = `id-status id-status-${r.status}`;
			if (r.issue) {
				const note = document.createElement('span');
				note.className = 'ref-note';
				note.textContent = r.issue;
				status.append(note);
			}
		}
		wrap.hidden = rows.length === 0;
		const ok = rows.filter((r) => r.status === 'ok').length;
		const bad = rows.length - ok;
		summary.textContent = rows.length
			? `${rows.length} ID${rows.length === 1 ? '' : 's'}: ${ok} valid${bad ? `, ${bad} need attention` : ''}.${truncated ? ` Showing the first ${MAX_ROWS}.` : ''}`
			: 'Paste IDs above to convert them.';
	};

	const flash = (button: HTMLButtonElement, text: string) => {
		const old = button.dataset.label ?? (button.dataset.label = button.textContent ?? '');
		button.textContent = text;
		setTimeout(() => (button.textContent = old), 1400);
	};

	const copy = async (button: HTMLButtonElement, text: string, empty: string) => {
		if (!text) return flash(button, empty);
		try {
			await navigator.clipboard.writeText(text);
			flash(button, 'Copied');
		} catch {
			flash(button, 'Copy failed');
		}
	};

	const good = () => rows.filter((r) => r.status === 'ok');
	const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

	root.addEventListener('click', (e) => {
		const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
		if (!button) return;
		switch (button.dataset.action) {
			case 'copy18':
				return void copy(button, good().map((r) => r.id18).join('\n'), 'Nothing to copy');
			case 'copy15':
				return void copy(button, good().map((r) => r.id15).join('\n'), 'Nothing to copy');
			case 'copycsv':
				return void copy(
					button,
					rows.length
						? ['input,id15,id18,object,status', ...rows.map((r) => [r.input, r.id15 ?? '', r.id18 ?? '', r.object, r.status].map(csvCell).join(','))].join('\n')
						: '',
					'Nothing to copy',
				);
			case 'example':
				input.value = example;
				render();
				return input.focus();
			case 'clear':
				input.value = '';
				render();
				return input.focus();
		}
	});

	input.addEventListener('input', render);
	render();
}
