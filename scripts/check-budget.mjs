#!/usr/bin/env node
// Size budget check (docs/PLAN.md §9). Fails when the build output outgrows it.
//
//   node scripts/check-budget.mjs [dir]     (default: dist)
//
// Budgets:
//   - every HTML page (CSS is inlined into it) under 40 KB gzipped
//   - JS loaded by any one page (its scripts plus their static imports) under that
//     page's limit gzipped: JS_LIMIT for most pages, TOOL_JS_LIMIT for /tools/ pages
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const HTML_LIMIT = 40 * 1024;
// PLAN §9 allows article pages under 3 KB of JS, not counting lazy-loaded search.
// _astro/ also holds the search UI code, so the limit is 6 KB for now; split
// the check per page if the two ever need separate limits. Pagefind's own
// runtime lives in /pagefind/ and is not counted.
const JS_LIMIT = 6 * 1024;
// Interactive tool pages load their own small script on top of the site script.
// Libraries are not allowed; hand-written code stays well below this.
const TOOL_JS_LIMIT = 24 * 1024;

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

// JS per page: follow <script src> and static imports between _astro files.
const scriptSize = new Map(scripts.map((script) => [script.file, script.size]));
function importsOf(file) {
	const code = readFileSync(join(dir, file), 'utf8');
	return [...code.matchAll(/(?:import|from)\s*["']\.\/([^"']+\.m?js)["']/g)].map((m) => `_astro/${m[1]}`);
}
function pageScripts(html) {
	const seen = new Set();
	const visit = (file) => {
		if (seen.has(file) || !scriptSize.has(file)) return;
		seen.add(file);
		importsOf(file).forEach(visit);
	};
	for (const m of html.matchAll(/<script[^>]*\ssrc="\/(_astro\/[^"]+\.m?js)"/g)) visit(m[1]);
	return [...seen];
}
const jsPages = pages.map((page) => {
	const loaded = pageScripts(readFileSync(join(dir, page.file), 'utf8'));
	const size = loaded.reduce((sum, file) => sum + scriptSize.get(file), 0);
	const limit = page.file.startsWith('tools/') ? TOOL_JS_LIMIT : JS_LIMIT;
	return { file: page.file, size, limit, loaded: loaded.length };
});
const jsOverPages = jsPages.filter((p) => p.size > p.limit);
const jsTotal = scripts.reduce((sum, script) => sum + script.size, 0);
const jsOver = jsOverPages.length > 0;

console.log(`HTML pages, gzipped (limit ${kb(HTML_LIMIT)} each) — ${pages.length} pages`);
// Show every failure, plus the largest pages so growth is visible before it fails.
const shown = [...overPages, ...pages.filter((page) => page.size <= HTML_LIMIT).slice(0, 5)];
table(shown.map((page) => [page.file, kb(page.size), page.size > HTML_LIMIT ? 'OVER' : 'ok']));
if (shown.length < pages.length) console.log(`  … ${pages.length - shown.length} smaller pages not shown`);

console.log(`\nJS per page, gzipped (limit ${kb(JS_LIMIT)}, tools ${kb(TOOL_JS_LIMIT)}) — ${scripts.length} files in _astro/, ${kb(jsTotal)} in total`);
const jsShown = [...jsOverPages, ...jsPages.filter((p) => p.size <= p.limit).sort((a, b) => b.size - a.size).slice(0, 6)];
table(jsShown.map((p) => [p.file, kb(p.size), p.size > p.limit ? 'OVER' : 'ok']));

if (overPages.length || jsOver) {
	console.error('\ncheck-budget: FAILED');
	if (overPages.length) console.error(`  ${overPages.length} page(s) over ${kb(HTML_LIMIT)} gzipped`);
	if (jsOver) console.error(`  ${jsOverPages.length} page(s) load more JS than their limit`);
	process.exit(1);
}
console.log('\ncheck-budget: passed');
