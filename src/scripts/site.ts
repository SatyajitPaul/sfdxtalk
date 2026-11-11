/**
 * The site's only shared script (bundled into a content-hashed /_astro file,
 * cached for a year and pre-cached by the service worker).
 * Keep it tiny: theme toggle + copy-code buttons, both via event delegation.
 */

const COLORS = { light: '#f6f4ef', dark: '#181c20' } as const;
type Theme = keyof typeof COLORS;

function currentTheme(): Theme {
	const set = document.documentElement.dataset.theme;
	if (set === 'light' || set === 'dark') return set;
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COLORS[theme]));
	try {
		localStorage.setItem('theme', theme);
	} catch {}
	updateToggleLabel();
}

function updateToggleLabel() {
	const next = currentTheme() === 'dark' ? 'light' : 'dark';
	document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-label', `Switch to ${next} theme`));
}

async function copyCode(button: HTMLButtonElement) {
	const code = button.closest('.code-block')?.querySelector('pre code, pre');
	if (!code) return;
	try {
		await navigator.clipboard.writeText((code as HTMLElement).innerText.replace(/\n$/, ''));
		button.textContent = 'Copied';
		button.dataset.copied = '';
	} catch {
		button.textContent = 'Press Ctrl+C';
	}
	setTimeout(() => {
		button.textContent = 'Copy';
		delete button.dataset.copied;
	}, 2000);
}

document.addEventListener('click', (event) => {
	const target = event.target as Element | null;
	const copy = target?.closest<HTMLButtonElement>('[data-copy]');
	if (copy) return void copyCode(copy);
	if (target?.closest('[data-theme-toggle]')) applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
});

updateToggleLabel();
