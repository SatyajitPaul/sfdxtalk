// Lighthouse CI (docs/PLAN.md §9, §10 phase 7). Run with `pnpm check:lighthouse`
// after `pnpm build`.
//
// Caveats — this audits the build on a local static server, not production:
// - scripts/serve-static.mjs does not apply public/_headers, so cache and
//   security headers are missing, and there is no CDN, HTTP/2 or Brotli.
//   Performance uses Lighthouse's simulated mobile throttling, so scores are
//   comparable between runs but are not field data.
// - Every run starts with a clean browser profile: the service worker is not
//   in control of the first page load, so its cache never helps the score.
// Use PageSpeed Insights on the live site for real-world numbers.

// LHCI_DIR lets a build in another directory be audited (default: dist).
const dir = process.env.LHCI_DIR || 'dist';
const port = 8821;
const origin = `http://localhost:${port}`;

module.exports = {
	ci: {
		collect: {
			startServerCommand: `node scripts/serve-static.mjs "${dir}" ${port}`,
			startServerReadyPattern: 'Serving',
			// Home, one article, one category hub. Never rename a published slug;
			// if this article is ever removed, point at another one.
			url: [`${origin}/`, `${origin}/docs/apex/trigger-handler-pattern/`, `${origin}/docs/apex/`],
			// The median of 3 runs smooths out noise on shared CI machines.
			numberOfRuns: 3,
		},
		assert: {
			assertions: {
				'categories:performance': ['error', { minScore: 0.95 }],
				'categories:accessibility': ['error', { minScore: 1 }],
				'categories:best-practices': ['error', { minScore: 0.95 }],
				'categories:seo': ['error', { minScore: 1 }],
				// PLAN target is CLS 0; 0.01 leaves room for rounding only.
				'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
			},
		},
		upload: {
			// Reports stay on disk (.lighthouseci/); nothing is sent to a third party.
			target: 'filesystem',
			outputDir: '.lighthouseci',
		},
	},
};
