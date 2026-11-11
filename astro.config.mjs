// @ts-check
import { defineConfig } from 'astro/config';
import { satteri, satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import serviceWorker from './src/integrations/service-worker.ts';
import { sfdxMarkdown } from './src/markdown/callouts.ts';
import { codeBlocks } from './src/markdown/code-blocks.ts';
import { sfdxDark, sfdxLight } from './src/markdown/shiki-themes.ts';

// Static build served by Cloudflare Workers static assets.
// See docs/PLAN.md for the reasoning behind each setting.
export default defineConfig({
	site: 'https://sfdxtalk.com',
	output: 'static',

	// One canonical URL form: /docs/apex/triggers/ (folder + index.html).
	// Matches Cloudflare's default `auto-trailing-slash` html_handling.
	trailingSlash: 'always',
	build: {
		format: 'directory',
		// Inline all CSS so no stylesheet blocks the first render (LCP).
		inlineStylesheets: 'always',
	},

	compressHTML: true,

	// Prefetch pages on hover/focus; Speculation Rules where supported.
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'hover',
	},
	experimental: {
		clientPrerender: true,
	},

	markdown: {
		processor: satteri({
			// Heading ids first so the anchor links in sfdxMarkdown can use them.
			hastPlugins: [satteriHeadingIdsPlugin(), sfdxMarkdown()],
		}),
		shikiConfig: {
			themes: { light: sfdxLight, dark: sfdxDark },
			// Emit CSS variables only; src/styles/global.css picks the theme.
			defaultColor: false,
			langAlias: { soql: 'sql', sosl: 'sql', sh: 'bash', shell: 'bash' },
			transformers: [codeBlocks()],
		},
	},

	integrations: [serviceWorker()],
});
