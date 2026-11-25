/**
 * AI Context File Generator: builds the instruction file in the browser.
 * Only settings (target, topics, project facts) are stored in localStorage.
 */
import { TARGETS, generate, getTarget, sanitizeTopicIds, type Facts, type TargetId } from '../lib/tools/ai-context';

const root = document.querySelector<HTMLElement>('[data-ai-tool]');
const KEY = 'sfdxtalk-ai-context-v1';

if (root) {
	const out = root.querySelector<HTMLElement>('[data-ai-out]')!;
	const pathEl = root.querySelector<HTMLElement>('[data-ai-path]')!;
	const status = root.querySelector<HTMLElement>('[data-ai-status]')!;
	const targets = [...root.querySelectorAll<HTMLInputElement>('input[name="ai-target"]')];
	const topics = [...root.querySelectorAll<HTMLInputElement>('input[name="ai-topic"]')];
	const reasons = root.querySelector<HTMLInputElement>('input[name="ai-reasons"]')!;
	const fields = [...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-fact]')];

	const currentTarget = (): TargetId => (targets.find((t) => t.checked)?.value as TargetId) ?? 'claude';
	const selectedTopics = () => topics.filter((t) => t.checked).map((t) => t.value);
	const facts = (): Facts => Object.fromEntries(fields.map((f) => [f.dataset.fact!, f.value])) as Facts;
	const text = () => generate({ target: currentTarget(), topics: selectedTopics(), facts: facts(), reasons: reasons.checked });

	const save = () => {
		try {
			localStorage.setItem(KEY, JSON.stringify({ target: currentTarget(), topics: selectedTopics(), facts: facts(), reasons: reasons.checked }));
		} catch {
			/* storage unavailable */
		}
	};

	const render = () => {
		const t = getTarget(currentTarget());
		out.textContent = text();
		pathEl.textContent = `Save as ${t.path}`;
		save();
	};

	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (saved && typeof saved === 'object') {
			const ids = sanitizeTopicIds(saved.topics);
			for (const t of topics) t.checked = ids.includes(t.value);
			for (const t of targets) t.checked = t.value === saved.target && TARGETS.some((x) => x.id === saved.target);
			if (!targets.some((t) => t.checked)) targets[0].checked = true;
			for (const f of fields) if (typeof saved.facts?.[f.dataset.fact!] === 'string') f.value = saved.facts[f.dataset.fact!].slice(0, 300);
			if (typeof saved.reasons === 'boolean') reasons.checked = saved.reasons;
		}
	} catch {
		/* ignore bad or missing settings */
	}

	root.addEventListener('input', render);
	root.addEventListener('change', render);

	const say = (m: string) => {
		status.textContent = m;
	};

	root.querySelector('[data-action="copy"]')?.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(text());
			say('Copied to clipboard.');
		} catch {
			say('Copy failed. Select the text in the preview and copy it manually.');
		}
	});

	root.querySelector('[data-action="download"]')?.addEventListener('click', () => {
		const t = getTarget(currentTarget());
		const url = URL.createObjectURL(new Blob([text()], { type: 'text/markdown;charset=utf-8' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = t.downloadName;
		document.body.append(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		say(`Downloaded ${t.downloadName}. Put it at ${t.path}.`);
	});

	root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
		for (const t of topics) t.checked = true;
		for (const f of fields) f.value = f.dataset.default ?? '';
		reasons.checked = true;
		targets[0].checked = true;
		render();
		say('Settings reset.');
	});

	render();
}
