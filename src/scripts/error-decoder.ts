/**
 * Salesforce error decoder: matches pasted error text to the reference entries
 * rendered on the page. Runs entirely in the browser; nothing is sent anywhere,
 * and results are built with textContent.
 */
import { matchErrors, type MatchEntry } from '../lib/tools/error-match';

const root = document.querySelector<HTMLElement>('[data-err-tool]');
const dataEl = document.getElementById('err-data');

if (root && dataEl) {
	const entries: MatchEntry[] = JSON.parse(dataEl.textContent ?? '[]');
	const input = root.querySelector<HTMLTextAreaElement>('textarea')!;
	const summary = root.querySelector<HTMLElement>('[data-err-summary]')!;
	const list = root.querySelector<HTMLElement>('[data-err-results]')!;
	const example = root.dataset.example ?? '';

	const render = () => {
		const text = input.value.trim();
		const hits = text ? matchErrors(text, entries) : [];
		list.replaceChildren();
		for (const h of hits) {
			const section = document.getElementById(h.id);
			if (!section) continue;
			const li = document.createElement('li');
			const a = document.createElement('a');
			a.href = `#${h.id}`;
			a.textContent = section.querySelector('h3')?.textContent ?? h.id;
			const p = document.createElement('p');
			p.textContent = section.querySelector('.err-cause')?.textContent ?? '';
			li.append(a, p);
			list.append(li);
		}
		summary.textContent = !text
			? 'Paste an error message to find it in the reference.'
			: hits.length
				? `${hits.length} possible match${hits.length === 1 ? '' : 'es'}, best first.`
				: 'No match in this reference. Try pasting only the status code or the first line of the message.';
	};

	root.addEventListener('click', (e) => {
		const action = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]')?.dataset.action;
		if (action === 'example') input.value = example;
		else if (action === 'clear') input.value = '';
		else return;
		render();
		input.focus();
	});
	input.addEventListener('input', render);
	render();
}
