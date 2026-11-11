#!/usr/bin/env node
// Tells IndexNow (Bing, Yandex and partners) which pages changed in this deploy.
// Protocol: https://www.indexnow.org/documentation (docs/PLAN.md §7).
//
//   node scripts/indexnow.mjs [dir] [--days N] [--all] [--dry-run]
//
//   dir        build directory holding sitemap.xml (default: dist)
//   --days N   submit URLs whose <lastmod> is within the last N days (default: 2)
//   --all      submit every URL in the sitemap
//   --dry-run  print the request without sending it
//
// The key is not a secret: it is served at https://sfdxtalk.com/{key}.txt
// (public/{key}.txt) so the search engines can confirm the site owns it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HOST = 'sfdxtalk.com';
const KEY = '62da024fca63ae42bd577ce7ea53e2fd';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_POST = 10_000; // protocol limit
const DEFAULT_DAYS = 2;
const DAY_MS = 86_400_000;

const args = process.argv.slice(2);
let dir = 'dist';
let days = DEFAULT_DAYS;
let all = false;
let dryRun = false;
for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === '--all') all = true;
	else if (arg === '--dry-run') dryRun = true;
	else if (arg === '--days' || arg.startsWith('--days=')) {
		days = Number(arg.includes('=') ? arg.split('=')[1] : args[++i]);
		if (!Number.isFinite(days) || days < 0) fail(`--days needs a non-negative number`);
	} else if (arg.startsWith('-')) fail(`Unknown option: ${arg}`);
	else dir = arg;
}

function fail(message) {
	console.error(`indexnow: ${message}`);
	process.exit(1);
}

const sitemapPath = join(dir, 'sitemap.xml');
if (!existsSync(sitemapPath)) fail(`${sitemapPath} not found — run the build first`);

// A key file missing from the build would make every submission fail with 403.
if (!existsSync(join(dir, `${KEY}.txt`))) fail(`${join(dir, `${KEY}.txt`)} not found — the key file must be deployed`);

const unescapeXml = (s) =>
	s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const entries = [...readFileSync(sitemapPath, 'utf8').matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
	loc: unescapeXml(body.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1] ?? ''),
	lastmod: body.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1],
}));
if (entries.length === 0) fail(`no <url> entries in ${sitemapPath}`);

// Engines reject the whole batch (422) if any URL is on another host.
const foreign = entries.filter((e) => !e.loc.startsWith(`https://${HOST}/`));
if (foreign.length) fail(`sitemap has URLs outside https://${HOST}/: ${foreign.map((e) => e.loc).join(', ')}`);

// lastmod is a date without a time, so compare whole UTC days. A URL with no
// lastmod is skipped unless --all: we cannot tell that it changed.
const cutoff = Math.floor(Date.now() / DAY_MS) * DAY_MS - days * DAY_MS;
const urls = entries
	.filter((e) => all || (e.lastmod && Date.parse(e.lastmod) >= cutoff))
	.map((e) => e.loc);

const scope = all ? 'all URLs' : `URLs updated in the last ${days} day(s)`;
if (urls.length === 0) {
	console.log(`indexnow: nothing to submit (${entries.length} URLs in sitemap, none match: ${scope}).`);
	process.exit(0);
}

console.log(`indexnow: ${urls.length} of ${entries.length} sitemap URLs (${scope})`);
for (const url of urls) console.log(`  ${url}`);

for (let i = 0; i < urls.length; i += MAX_URLS_PER_POST) {
	// The key file sits at the site root, so keyLocation is not needed.
	const payload = { host: HOST, key: KEY, urlList: urls.slice(i, i + MAX_URLS_PER_POST) };
	if (dryRun) {
		console.log(`indexnow: dry run — would POST to ${ENDPOINT}:`);
		console.log(JSON.stringify(payload, null, '\t'));
		continue;
	}
	let response;
	try {
		response = await fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(30_000),
		});
	} catch (error) {
		fail(`request failed: ${error.cause?.message ?? error.message}`);
	}
	console.log(`indexnow: POST ${ENDPOINT} → HTTP ${response.status} ${response.statusText}`);
	// 200 = received; 202 = received, key check pending (normal on first use).
	if (response.status !== 200 && response.status !== 202) {
		const hint =
			{
				400: 'invalid request format',
				403: `key not valid — is https://${HOST}/${KEY}.txt reachable and does it contain the key?`,
				422: 'URLs do not belong to the host, or the key does not match',
				429: 'too many requests — try again later',
			}[response.status] ?? 'unexpected status';
		const text = (await response.text().catch(() => '')).trim();
		fail(`${hint}${text ? `\n${text.slice(0, 500)}` : ''}`);
	}
}
