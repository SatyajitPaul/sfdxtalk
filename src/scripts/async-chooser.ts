/** Async Apex chooser page script. Answers stay in the browser; the result is shareable via the URL hash. */
import { DEFAULT_ANSWERS, decodeAnswers, encodeAnswers, rank, type Answers } from '../lib/tools/async-chooser';

const root = document.querySelector<HTMLElement>('[data-ac]');
if (root) {
	const form = root.querySelector<HTMLFormElement>('form')!;
	const out = root.querySelector<HTMLElement>('[data-ac-out]')!;
	const summary = root.querySelector<HTMLElement>('[data-ac-summary]')!;
	const FLAGS = ['complexTypes', 'chain', 'schedule', 'callout', 'decoupled', 'monitoring'] as const;

	const read = (): Answers => {
		const a: Answers = { ...DEFAULT_ANSWERS };
		const data = new FormData(form);
		a.volume = (data.get('volume') as Answers['volume']) ?? 'few';
		a.context = (data.get('context') as Answers['context']) ?? 'sync';
		for (const f of FLAGS) a[f] = data.get(f) === '1';
		return a;
	};

	const write = (a: Answers) => {
		for (const input of form.querySelectorAll<HTMLInputElement>('input')) {
			if (input.type === 'radio') input.checked = input.value === a[input.name as 'volume' | 'context'];
			else input.checked = a[input.name as (typeof FLAGS)[number]] === true;
		}
	};

	const list = (title: string, items: string[]) => {
		if (!items.length) return null;
		const frag = document.createDocumentFragment();
		const h = document.createElement('h4');
		h.textContent = title;
		const ul = document.createElement('ul');
		for (const t of items) ul.append(Object.assign(document.createElement('li'), { textContent: t }));
		frag.append(h, ul);
		return frag;
	};

	const render = () => {
		const a = read();
		const ranked = rank(a);
		out.replaceChildren();
		let n = 0;
		for (const r of ranked) {
			const li = document.createElement('li');
			li.className = 'ac-card' + (r.excluded ? ' ac-excluded' : n === 0 ? ' ac-top' : '');
			const h = document.createElement('h3');
			h.textContent = r.excluded ? `${r.name} (not applicable)` : `${++n}. ${r.name}`;
			li.append(h);
			li.append(list(r.excluded ? 'Why not' : 'Why', r.why) ?? '');
			if (!r.excluded) li.append(list('Watch out for', r.watch) ?? '');
			out.append(li);
		}
		const top = ranked.find((r) => !r.excluded);
		summary.textContent = top ? `Best fit: ${top.name}.` : 'No option fits these answers.';
		history.replaceState(null, '', '#' + encodeAnswers(a));
	};

	write(location.hash ? decodeAnswers(location.hash) : DEFAULT_ANSWERS);
	form.addEventListener('change', render);
	form.addEventListener('submit', (e) => e.preventDefault());
	root.querySelector('[data-action="copy"]')?.addEventListener('click', async (e) => {
		const b = e.currentTarget as HTMLButtonElement;
		try {
			await navigator.clipboard.writeText(location.href);
			b.textContent = 'Link copied';
		} catch {
			b.textContent = 'Copy failed';
		}
		setTimeout(() => (b.textContent = 'Copy link to this result'), 1400);
	});
	root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
		write(DEFAULT_ANSWERS);
		render();
	});
	render();
}
