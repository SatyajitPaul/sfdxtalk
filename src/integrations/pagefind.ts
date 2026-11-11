import type { AstroIntegration } from 'astro';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

/**
 * Builds the Pagefind search index into dist/pagefind/ after the build
 * (docs/PLAN.md §6). Only pages with a `data-pagefind-body` element — the
 * articles — are indexed. The browser loads the index on first search.
 *
 * The index can only be made from built HTML, so `pnpm dev` serves the one
 * left in dist/ by the last `pnpm build`. Search results in dev are therefore
 * as fresh as that build.
 */
const TYPES: Record<string, string> = {
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.wasm': 'application/wasm',
};

export default function pagefindIndex(): AstroIntegration {
	let outDir = '';
	return {
		name: 'sfdxtalk:pagefind',
		hooks: {
			'astro:config:done': ({ config }) => {
				outDir = fileURLToPath(config.outDir);
			},
			'astro:server:setup': ({ server, logger }) => {
				const root = join(outDir, 'pagefind');
				if (!existsSync(root)) {
					logger.warn('no search index yet — run `pnpm build` once to make search work in dev');
				}
				server.middlewares.use('/pagefind', (req, res, next) => {
					const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
					const file = join(root, path);
					// Stay inside dist/pagefind and only serve real files.
					if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) return next();
					res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
					createReadStream(file).pipe(res);
				});
			},
			'astro:build:done': async ({ dir, logger }) => {
				const distDir = fileURLToPath(dir);
				const { index, errors } = await pagefind.createIndex();
				if (!index) throw new Error(`Pagefind failed to start: ${errors.join('; ')}`);
				const added = await index.addDirectory({ path: distDir });
				if (added.errors.length) throw new Error(`Pagefind indexing failed: ${added.errors.join('; ')}`);
				const written = await index.writeFiles({ outputPath: join(distDir, 'pagefind') });
				if (written.errors.length) throw new Error(`Pagefind write failed: ${written.errors.join('; ')}`);
				await pagefind.close();
				logger.info(`search index written (${added.page_count} pages)`);
			},
		},
	};
}
