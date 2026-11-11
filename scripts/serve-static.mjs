#!/usr/bin/env node
// Minimal static file server for Lighthouse CI (see lighthouserc.cjs).
//
//   node scripts/serve-static.mjs [dir] [port]     (default: dist 8821)
//
// Mimics the parts of Cloudflare static assets that affect a Lighthouse score:
// directory URLs serve index.html, text is gzipped, unknown paths get 404.html.
// It does not apply public/_headers, so cache and security headers are absent.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { pipeline } from 'node:stream';
import { createGzip } from 'node:zlib';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 8821);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.md': 'text/markdown; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/;

const isFile = (path) => existsSync(path) && statSync(path).isFile();

createServer((req, res) => {
	let pathname;
	try {
		pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
	} catch {
		res.writeHead(400).end();
		return;
	}
	// normalize() resolves "..", so the path cannot leave the root.
	let file = join(root, normalize(pathname));
	if (pathname.endsWith('/')) file = join(file, 'index.html');
	let status = 200;
	if (!isFile(file)) {
		file = join(root, '404.html');
		status = 404;
		if (!isFile(file)) {
			res.writeHead(404).end('Not found');
			return;
		}
	}
	const type = TYPES[extname(file)] ?? 'application/octet-stream';
	const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
	res.writeHead(status, { 'Content-Type': type, ...(gzip && { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }) });
	const done = () => res.destroy();
	if (gzip) pipeline(createReadStream(file), createGzip(), res, (error) => error && done());
	else pipeline(createReadStream(file), res, (error) => error && done());
}).listen(port, '127.0.0.1', () => {
	// lighthouserc.cjs waits for this line before starting the audits.
	console.log(`Serving ${root} at http://localhost:${port}/`);
});
