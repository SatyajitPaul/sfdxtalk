/**
 * SOQL formatter page: formats and checks the pasted query in the browser.
 * Nothing is sent anywhere; output is built with textContent, never innerHTML.
 */
import { EXAMPLES, formatSoql, lintSoql, type FormatOptions } from '../lib/tools/soql';

const root = document.querySelector<HTMLElement>('[data-sq-tool]');

if (root) {
	const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
	const input = $<HTMLTextAreaElement>('textarea');
	const out = $<HTMLElement>('[data-sq-out]');
	const summary = $<HTMLElement>('[data-sq-summary]');
	const list = $<HTMLElement>('[data-sq-findings]');
	const layout = $<HTMLSelectElement>('[data-sq-layout]');
	const kcase = $<HTMLSelectElement>('[data-sq-case]');
	const indent = $<HTMLInputElement>('[data-sq-indent]');
	let formatted = '';
	let nextExample = 0;

	const render = () => {
		const options: FormatOptions = {
			layout: layout.value === 'compact' ? 'compact' : 'expanded',
			keywordCase: kcase.value === 'keep' ? 'keep' : 'upper',
			indent: Number(indent.value) || 2,
		};
		formatted = formatSoql(input.value, options);
		out.textContent = formatted || 'The formatted query appears here.';
		const findings = lintSoql(input.value);
		list.replaceChildren();
		for (const f of findings) {
			const li = document.createElement('li');
			li.className = `sq-finding sq-finding-${f.severity}`;
			const title = document.createElement('strong');
			title.textContent = f.rule;
			const badge = document.createElement('span');
			badge.className = 'sq-badge';
			badge.textContent = `${f.severity} · matched: ${f.match}`;
			const why = document.createElement('p');
			why.textContent = f.reason + ' ';
			const link = document.createElement('a');
			link.href = f.href;
			link.textContent = 'Related limit';
			why.append(link);
			li.append(title, badge, why);
			list.append(li);
		}
		summary.textContent = !input.value.trim()
			? 'Paste a SOQL query to format and check it.'
			: findings.length
				? `${findings.length} hint${findings.length === 1 ? '' : 's'}. These are heuristics: whether a query is selective depends on your org's data and indexes.`
				: 'No hints from the checker. That does not prove the query is selective.';
	};

	const flash = (button: HTMLButtonElement, text: string) => {
		const old = button.dataset.label ?? (button.dataset.label = button.textContent ?? '');
		button.textContent = text;
		setTimeout(() => (button.textContent = old), 1400);
	};

	root.addEventListener('click', async (e) => {
		const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
		if (!button) return;
		if (button.dataset.action === 'copy') {
			if (!formatted) return flash(button, 'Nothing to copy');
			try {
				await navigator.clipboard.writeText(formatted);
				flash(button, 'Copied');
			} catch {
				flash(button, 'Copy failed');
			}
		} else if (button.dataset.action === 'example') {
			input.value = EXAMPLES[nextExample++ % EXAMPLES.length].query;
			render();
			input.focus();
		} else if (button.dataset.action === 'clear') {
			input.value = '';
			render();
			input.focus();
		}
	});

	input.addEventListener('input', render);
	root.addEventListener('change', render);
	render();
}
