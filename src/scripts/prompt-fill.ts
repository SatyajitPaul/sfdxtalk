/**
 * Prompt pages: fill {{placeholders}} from form fields and copy the result.
 * Progressive enhancement; the template and the worked example are already in the HTML.
 */
import { fillPrompt } from '../lib/prompt-fill';

const root = document.querySelector<HTMLElement>('[data-pf]');
if (root) {
	const template = root.dataset.template ?? '';
	const fields = [...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-var]')];
	const out = root.querySelector<HTMLElement>('[data-pf-out] code')!;
	const exampleValues: Record<string, string> = JSON.parse(root.dataset.examples ?? '{}');

	const values = () => Object.fromEntries(fields.filter((f) => f.value.trim()).map((f) => [f.dataset.var!, f.value]));
	const render = () => (out.textContent = fillPrompt(template, values()));

	const flash = (button: HTMLElement, text: string) => {
		const old = button.dataset.label ?? (button.dataset.label = button.textContent ?? '');
		button.textContent = text;
		setTimeout(() => (button.textContent = old), 1400);
	};
	const copy = async (button: HTMLElement, text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			flash(button, 'Copied');
		} catch {
			flash(button, 'Copy failed');
		}
	};

	for (const f of fields) f.addEventListener('input', render);
	root.addEventListener('click', (e) => {
		const el = e.target as HTMLElement;
		if (el.closest('[data-pf-copy-template]')) return void copy(el.closest('button')!, template);
		if (el.closest('[data-pf-copy]')) return void copy(el.closest('button')!, out.textContent ?? '');
		if (el.closest('[data-pf-example]')) {
			for (const f of fields) f.value = exampleValues[f.dataset.var!] ?? '';
			render();
		}
	});
	render();
}
