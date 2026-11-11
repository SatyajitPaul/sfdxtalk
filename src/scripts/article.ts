/**
 * Article-page extras, loaded after src/scripts/site.ts. Together they must
 * stay under 3KB minified (docs/PLAN.md §5), so keep this small.
 *   - "On this page": mark the section being read.
 *   - Rails: open as sidebars on wide screens, collapsed bars on small ones.
 *   - "Copy page for AI": copy the article's Markdown version.
 *   - Giscus comments: loaded on demand when the reader nears them.
 */

const wide = matchMedia('(min-width:1200px)');
const rails = document.querySelectorAll<HTMLDetailsElement>('[data-rail]');
const toc = document.querySelector<HTMLElement>('[data-toc]');

// The inline scripts set the first state before paint; this follows resizes.
wide.addEventListener('change', () => rails.forEach((d) => (d.open = wide.matches)));

if (toc && 'IntersectionObserver' in window) {
	const links = [...toc.querySelectorAll<HTMLAnchorElement>('a')];
	const heads = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
	// The observer only tells us *when* a heading crosses the reading line
	// (top fifth of the viewport); the active section is then the last heading
	// above that line, which is also right when scrolling back up.
	const io = new IntersectionObserver(
		() => {
			let active = -1;
			heads.forEach((h, i) => {
				if (h && h.getBoundingClientRect().top < innerHeight * 0.2 + 1) active = i;
			});
			links.forEach((a, i) => (i === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
		},
		{ rootMargin: '0px 0px -80% 0px', threshold: [0, 1] },
	);
	heads.forEach((h) => h && io.observe(h));
}

document.addEventListener('click', async (event) => {
	const target = event.target as Element | null;

	// Small screens: picking a section closes the collapsed outline again.
	if (!wide.matches && target?.closest('[data-toc] a')) toc!.querySelector('details')!.open = false;

	const button = target?.closest<HTMLButtonElement>('[data-copy-page]');
	if (!button) return;
	const status = document.querySelector('[data-copy-page-status]');
	const label = 'Copy page for AI';
	const text = fetch(button.dataset.copyPage!).then((r) => (r.ok ? r.text() : Promise.reject()));
	let message = 'Copied';
	try {
		// Safari only allows clipboard writes started inside the click itself,
		// so hand it the pending download instead of awaiting it first.
		if ('ClipboardItem' in window) {
			await navigator.clipboard.write([
				new ClipboardItem({ 'text/plain': text.then((t) => new Blob([t], { type: 'text/plain' })) }),
			]);
		} else {
			await navigator.clipboard.writeText(await text);
		}
		button.dataset.copied = '';
	} catch {
		message = 'Copy failed';
	}
	button.textContent = message;
	if (status) status.textContent = message === 'Copied' ? 'Page copied as Markdown' : message;
	setTimeout(() => {
		button.textContent = label;
		delete button.dataset.copied;
		if (status) status.textContent = '';
	}, 2000);
});

// Giscus comments (src/components/article/Comments.astro): load the third-party
// script only when the reader gets near the comments, and keep its theme in
// step with the site's light/dark toggle.
const giscus = document.querySelector<HTMLElement>('[data-giscus]');
if (giscus && 'IntersectionObserver' in window) {
	const theme = () => {
		const t = document.documentElement.dataset.theme;
		const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
		return dark ? 'transparent_dark' : 'light';
	};
	const io = new IntersectionObserver(
		(entries) => {
			if (!entries.some((e) => e.isIntersecting)) return;
			io.disconnect();
			const s = document.createElement('script');
			s.src = 'https://giscus.app/client.js';
			s.async = true;
			s.crossOrigin = 'anonymous';
			const attrs: Record<string, string> = {
				...giscus.dataset,
				mapping: 'specific',
				strict: '1',
				reactionsEnabled: '1',
				emitMetadata: '0',
				inputPosition: 'top',
				lang: 'en',
				theme: theme(),
			};
			delete attrs.giscus;
			for (const [k, v] of Object.entries(attrs)) s.dataset[k] = v!;
			giscus.append(s);
			new MutationObserver(() => {
				giscus.querySelector<HTMLIFrameElement>('iframe.giscus-frame')?.contentWindow?.postMessage(
					{ giscus: { setConfig: { theme: theme() } } },
					'https://giscus.app',
				);
			}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		},
		{ rootMargin: '0px 0px 800px 0px' },
	);
	io.observe(giscus);
}
