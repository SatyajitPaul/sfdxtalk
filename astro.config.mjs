// @ts-check
import { defineConfig } from 'astro/config';

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
});
