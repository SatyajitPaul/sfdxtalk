/**
 * Match pasted Salesforce error text to reference entries. Pure logic, no DOM.
 *
 * Strategy: an entry matches when the pasted text contains its code or one of
 * its message fragments (case-insensitive, whole-token for codes). The longest
 * matching needle wins, so a specific code beats a wrapper such as
 * System.DmlException. If nothing matches, a conservative word-overlap
 * fallback runs; unrelated text returns no results.
 */

export interface MatchEntry {
	id: string;
	code: string;
	typicalMessage?: string;
	match?: string[];
	generic?: boolean;
}

export interface MatchResult {
	id: string;
	score: number;
	reason: 'code' | 'message' | 'words';
}

const STOP = new Set(['the', 'and', 'for', 'you', 'your', 'that', 'this', 'with', 'from', 'have', 'been', 'are', 'was', 'not', 'object', 'record', 'error', 'failed', 'first', 'exception']);

export const normalize = (s: string): string =>
	s
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/\s+/g, ' ')
		.trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when `needle` occurs in `text` and is not glued to other identifier characters. */
export function hasToken(text: string, needle: string): boolean {
	if (!needle) return false;
	return new RegExp(`(?<![a-z0-9_])${escapeRe(needle)}(?![a-z0-9_])`).test(text);
}

const words = (s: string): string[] => [...new Set(normalize(s).match(/[a-z]{4,}/g) ?? [])].filter((w) => !STOP.has(w));

/** Needles derived from a code: the full code, plus the bare class for "System.X" and the part before a colon. */
function codeNeedles(code: string): string[] {
	const c = normalize(code);
	const out = [c];
	const head = c.split(':')[0];
	if (head !== c) out.push(head);
	const bare = head.replace(/^system\./, '');
	if (bare !== head && !bare.includes(' ')) out.push(bare);
	return out;
}

export function matchErrors(input: string, entries: MatchEntry[], limit = 4): MatchResult[] {
	const text = normalize(input);
	if (text.length < 3) return [];
	const results: MatchResult[] = [];

	for (const e of entries) {
		let best = 0;
		let reason: MatchResult['reason'] = 'code';
		for (const n of codeNeedles(e.code)) {
			if (n.length >= 6 && hasToken(text, n)) best = Math.max(best, n.length);
		}
		for (const m of e.match ?? []) {
			const n = normalize(m);
			if (n && text.includes(n) && n.length > best) {
				best = n.length;
				reason = 'message';
			}
		}
		if (best > 0) results.push({ id: e.id, score: e.generic ? best * 0.5 : best, reason });
	}

	if (results.length === 0) {
		const inWords = new Set(words(text));
		for (const e of entries) {
			const target = words(e.typicalMessage ?? '');
			if (target.length < 3) continue;
			const shared = target.filter((w) => inWords.has(w)).length;
			if (shared >= 3 && shared / target.length >= 0.6) results.push({ id: e.id, score: shared, reason: 'words' });
		}
	}

	return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
