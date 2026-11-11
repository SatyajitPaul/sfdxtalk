import type { AstroIntegration } from 'astro';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE = fileURLToPath(new URL('../service-worker/sw.template.js', import.meta.url));

/** Small, render-critical files worth pre-caching. Article images are cached on demand. */
const PRECACHE_EXT = /\.(js|css)$/;

async function listFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true, recursive: true });
	return entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
}

/**
 * Writes dist/sw.js after the build.
 *
 * The version hash covers the SW template, the pre-cached file names (which
 * contain content hashes) and the site's inlined CSS. It changes when the
 * design or scripts change — which clears cached pages — but not when only
 * article text changes, so content deploys keep the page cache warm.
 */
export default function serviceWorker(): AstroIntegration {
	return {
		name: 'sfdxtalk:service-worker',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const distDir = fileURLToPath(dir);
				const toUrl = (file: string) => '/' + relative(distDir, file).split(sep).join('/');

				const astroFiles = (await listFiles(join(distDir, '_astro')).catch(() => []))
					.filter((f) => PRECACHE_EXT.test(f))
					.map(toUrl)
					.sort();
				const shellPages = ['index.html', 'offline/index.html'];
				const shellHtml = await Promise.all(shellPages.map((p) => readFile(join(distDir, p), 'utf8')));

				// Also pre-cache images every page shows (e.g. the header logo).
				const shellAssets = new Set<string>();
				for (const html of shellHtml) {
					for (const [url] of html.matchAll(/\/_astro\/[\w.-]+\.(?:webp|avif|png|svg)/g)) shellAssets.add(url);
				}

				const precache = ['/offline/', '/favicon.ico', ...astroFiles, ...[...shellAssets].sort()];

				const template = await readFile(TEMPLATE, 'utf8');
				const hash = createHash('sha256').update(template).update(precache.join('\n'));
				for (const html of shellHtml) {
					for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) hash.update(css);
				}
				const version = hash.digest('hex').slice(0, 12);

				const sw = template
					.replace('__SW_VERSION__', JSON.stringify(version))
					.replace('__SW_PRECACHE__', JSON.stringify(precache));
				await writeFile(join(distDir, 'sw.js'), sw);
				logger.info(`sw.js written (version ${version}, ${precache.length} pre-cached files)`);
			},
		},
	};
}
