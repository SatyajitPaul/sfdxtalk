/* SFDX Talk service worker.
 * Generated at build time by src/integrations/service-worker.ts — the
 * placeholders below are replaced with real values. Do not edit dist/sw.js.
 *
 * Strategy (see docs/PLAN.md §9):
 *   - Pages (navigations): stale-while-revalidate. Visited pages open
 *     instantly from cache; a fresh copy is fetched in the background
 *     (using navigation preload) and shown on the next visit.
 *   - /_astro/* (content-hashed): cache-first, never revalidated.
 *   - /pagefind/*: stale-while-revalidate.
 *   - Icons and manifest: cache-first.
 *   - Everything else: straight to the network (no interception).
 *   - Offline with no cached copy: the /offline/ page.
 */

const VERSION = __SW_VERSION__;
const PRECACHE_URLS = __SW_PRECACHE__;
const OFFLINE_URL = '/offline/';
const MAX_PAGES = 150;

const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const SEARCH_CACHE = `search-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, SEARCH_CACHE];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			if (self.registration.navigationPreload) {
				await self.registration.navigationPreload.enable();
			}
			const names = await caches.keys();
			await Promise.all(names.filter((n) => !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n)));
			await self.clients.claim();
		})(),
	);
});

const isCacheable = (res) => res && res.ok && res.type === 'basic';

async function trimCache(cacheName, max) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	// Keys come back in insertion order: drop the oldest first.
	await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function handleNavigation(event) {
	const cache = await caches.open(PAGES_CACHE);
	const cached = await cache.match(event.request);

	const network = (async () => {
		const res = (await event.preloadResponse) || (await fetch(event.request));
		if (isCacheable(res)) {
			await cache.put(event.request, res.clone());
			await trimCache(PAGES_CACHE, MAX_PAGES);
		}
		return res;
	})();

	if (cached) {
		event.waitUntil(network.catch(() => {}));
		return cached;
	}
	try {
		return await network;
	} catch {
		return (await caches.match(OFFLINE_URL)) || Response.error();
	}
}

async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;
	const res = await fetch(request);
	if (isCacheable(res)) await cache.put(request, res.clone());
	return res;
}

async function staleWhileRevalidate(event, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(event.request);
	const network = fetch(event.request).then(async (res) => {
		if (isCacheable(res)) await cache.put(event.request, res.clone());
		return res;
	});
	if (cached) {
		event.waitUntil(network.catch(() => {}));
		return cached;
	}
	return network;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(handleNavigation(event));
	} else if (url.pathname.startsWith('/_astro/')) {
		event.respondWith(cacheFirst(request, STATIC_CACHE));
	} else if (url.pathname.startsWith('/pagefind/')) {
		event.respondWith(staleWhileRevalidate(event, SEARCH_CACHE));
	} else if (/^\/(favicon\.ico|apple-touch-icon\.png|icon-[\w-]+\.png|manifest\.webmanifest)$/.test(url.pathname)) {
		event.respondWith(cacheFirst(request, STATIC_CACHE));
	}
});
