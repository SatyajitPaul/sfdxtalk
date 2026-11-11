/**
 * Community contributors per article, read from git history at build time.
 *
 * Articles are published by SFDX Talk Editorial; people who improve an article
 * through a pull request are credited by name on that article (and as
 * `contributor` in its JSON-LD). Commits by SITE.editorialAuthors are left out.
 *
 * GitHub usernames are only known when the commit uses a GitHub noreply
 * address (<id>+<user>@users.noreply.github.com), which is the default for web
 * edits; those names link to the GitHub profile. Email addresses are never
 * written to the page.
 *
 * Needs full history. On a shallow clone (CI, Cloudflare builds) it fetches the
 * rest once; if that fails it credits no one rather than crediting wrongly.
 */
import { execFileSync } from 'node:child_process';
import { SITE } from './site';

export interface Contributor {
	name: string;
	/** GitHub profile, when the username is known. */
	url?: string;
}

const CONTENT_DIR = 'src/content/docs/';
const NOREPLY = /^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$/i;
// Bots and merge tooling are not contributors.
const IGNORED = /\[bot\]$|^dependabot|^github-actions|^GitHub$/i;

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function ensureFullHistory(): boolean {
	try {
		if (git('rev-parse', '--is-shallow-repository').trim() !== 'true') return true;
		git('fetch', '--unshallow', '--quiet');
		return true;
	} catch (err) {
		console.warn(`[contributors] git history unavailable, skipping contributor credits: ${(err as Error).message}`);
		return false;
	}
}

let cache: Map<string, Contributor[]> | undefined;

/** Map of article id ("apex/trigger-handler-pattern") → contributors, first contribution first. */
function load(): Map<string, Contributor[]> {
	const byDoc = new Map<string, Map<string, Contributor>>();
	if (!ensureFullHistory()) return new Map();

	let log: string;
	try {
		// Oldest first, so contributors are listed in the order they joined.
		// \x1f separates fields; each commit block starts with \x1e.
		log = git('log', '--reverse', '--no-merges', '--format=%x1e%an%x1f%ae', '--name-only', '--', CONTENT_DIR);
	} catch {
		return new Map();
	}

	const editorial = new Set(SITE.editorialAuthors.map((n) => n.toLowerCase()));
	for (const block of log.split('\x1e').slice(1)) {
		const [head, ...files] = block.split('\n');
		const [name, email] = head.split('\x1f');
		if (!name || editorial.has(name.toLowerCase()) || IGNORED.test(name)) continue;
		const user = NOREPLY.exec(email ?? '')?.[1];
		const key = (user ?? name).toLowerCase();
		const person: Contributor = user ? { name, url: `https://github.com/${user}` } : { name };

		for (const file of files) {
			if (!file.startsWith(CONTENT_DIR) || !file.endsWith('.md')) continue;
			const id = file.slice(CONTENT_DIR.length, -3);
			const people = byDoc.get(id) ?? new Map<string, Contributor>();
			if (!people.has(key)) people.set(key, person);
			byDoc.set(id, people);
		}
	}
	return new Map([...byDoc].map(([id, people]) => [id, [...people.values()]]));
}

export function contributorsFor(docId: string): Contributor[] {
	cache ??= load();
	return cache.get(docId) ?? [];
}
