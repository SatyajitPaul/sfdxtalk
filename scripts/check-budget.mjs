#!/usr/bin/env node
// Size budget check (docs/PLAN.md §9). Fails when the build output outgrows it.
//
//   node scripts/check-budget.mjs [dir]     (default: dist)
//
// Budgets:
//   - every HTML page (CSS is inlined into it) under 40 KB gzipped
//   - all JS in _astro/ together under JS_LIMIT gzipped
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const HTML_LIMIT = 40 * 1024;
// PLAN §9 allows article pages under 3 KB of JS, not counting lazy-loaded search.
// _astro/ also holds the search UI code, so the limit is 6 KB for now; split
// the check per page if the two ever need separate limits. Pagefind's own
// runtime lives in /pagefind/ and is not counted.
const JS_LIMIT = 6 * 1024;

const dir = process.argv[2] ?? 'dist';
if (!existsSync(dir)) {
	console.error(`check-budget: ${dir} not found — run the build first`);
	process.exit(1);
}

function walk(folder) {
	return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
		const path = join(folder, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

// Level 9 approximates what Cloudflare serves; brotli would be smaller still.
const gzipSize = (path) => gzipSync(readFileSync(path), { level: 9 }).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;
const name = (path) => relative(dir, path).split(sep).join('/');

const files = walk(dir);
const pages = files
	// Pagefind writes no HTML pages, but skip its folder in case that changes.
	.filter((path) => path.endsWith('.html') && !name(path).startsWith('pagefind/'))
	.map((path) => ({ file: name(path), size: gzipSize(path) }))
	.sort((a, b) => b.size - a.size);
const scripts = files
	.filter((path) => name(path).startsWith('_astro/') && /\.m?js$/.test(path))
	.map((path) => ({ file: name(path), size: gzipSize(path) }))
	.sort((a, b) => b.size - a.size);

if (pages.length === 0) {
	console.error(`check-budget: no HTML pages in ${dir}`);
	process.exit(1);
}

function table(rows) {
	const width = Math.max(...rows.map((r) => r[0].length));
	for (const [label, size, status] of rows) console.log(`  ${label.padEnd(width)}  ${size.padStart(10)}  ${status}`);
}

const overPages = pages.filter((page) => page.size > HTML_LIMIT);
const jsTotal = scripts.reduce((sum, script) => sum + script.size, 0);
const jsOver = jsTotal > JS_LIMIT;

console.log(`HTML pages, gzipped (limit ${kb(HTML_LIMIT)} each) — ${pages.length} pages`);
// Show every failure, plus the largest pages so growth is visible before it fails.
const shown = [...overPages, ...pages.filter((page) => page.size <= HTML_LIMIT).slice(0, 5)];
table(shown.map((page) => [page.file, kb(page.size), page.size > HTML_LIMIT ? 'OVER' : 'ok']));
if (shown.length < pages.length) console.log(`  … ${pages.length - shown.length} smaller pages not shown`);

console.log(`\nJS in _astro/, gzipped (limit ${kb(JS_LIMIT)} in total) — ${scripts.length} files`);
table([
	...scripts.map((script) => [script.file, kb(script.size), '']),
	['total', kb(jsTotal), jsOver ? 'OVER' : 'ok'],
]);

if (overPages.length || jsOver) {
	console.error('\ncheck-budget: FAILED');
	if (overPages.length) console.error(`  ${overPages.length} page(s) over ${kb(HTML_LIMIT)} gzipped`);
	if (jsOver) console.error(`  _astro/ JS is ${kb(jsTotal)} gzipped, over ${kb(JS_LIMIT)}`);
	process.exit(1);
}
console.log('\ncheck-budget: passed');
