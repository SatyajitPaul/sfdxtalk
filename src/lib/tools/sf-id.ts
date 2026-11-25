/**
 * Salesforce record ID helpers: 15 <-> 18 character conversion and prefix lookup.
 * Pure functions with no DOM access, so the page script, the build-time examples
 * and the tests all share one implementation.
 *
 * The 18-character form is the 15-character ID plus a 3-character case-safe
 * suffix. Each 5-character chunk of the 15 characters produces one suffix
 * character: bit i is set when character i of the chunk is an uppercase letter,
 * and the 5-bit number picks a character from A-Z then 0-5.
 */

const SUFFIX_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
const ID_PATTERN = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;

/** Case-safe suffix (3 characters) for a 15-character ID. */
export function idSuffix(id15: string): string {
	let suffix = '';
	for (let chunk = 0; chunk < 3; chunk++) {
		let bits = 0;
		for (let i = 0; i < 5; i++) {
			const c = id15.charAt(chunk * 5 + i);
			if (c >= 'A' && c <= 'Z') bits |= 1 << i;
		}
		suffix += SUFFIX_ALPHABET.charAt(bits);
	}
	return suffix;
}

/** 15-character ID to its 18-character form. Input must already be a valid 15-character ID. */
export const toId18 = (id15: string): string => id15 + idSuffix(id15);

export type IdStatus =
	/** Valid 15- or 18-character ID. */
	| 'ok'
	/** 18 characters, but the suffix does not match the case of the first 15. */
	| 'checksum-mismatch'
	| 'invalid';

export interface ParsedId {
	input: string;
	status: IdStatus;
	/** Present unless status is 'invalid'. */
	id15?: string;
	/** Correct 18-character form of the first 15 characters. Present unless status is 'invalid'. */
	id18?: string;
	/** First three characters, the key prefix (e.g. "001"). */
	prefix?: string;
	/** Human-readable reason when status is not 'ok'. */
	issue?: string;
}

export function parseId(raw: string): ParsedId {
	const input = raw.trim();
	if (!ID_PATTERN.test(input)) {
		const issue = /[^a-zA-Z0-9]/.test(input)
			? 'Contains characters other than letters and digits'
			: `Has ${input.length} characters; a Salesforce ID has 15 or 18`;
		return { input, status: 'invalid', issue };
	}
	const id15 = input.slice(0, 15);
	const id18 = toId18(id15);
	const base = { input, id15, id18, prefix: id15.slice(0, 3) };
	if (input.length === 18 && input !== id18) {
		return {
			...base,
			status: 'checksum-mismatch',
			issue: 'The last 3 characters do not match the case of the first 15 (the ID may have been lowercased or edited)',
		};
	}
	return { ...base, status: 'ok' };
}

/** Split pasted text into IDs: any mix of whitespace, commas and semicolons. */
export const splitIds = (text: string): string[] => text.split(/[\s,;]+/).filter(Boolean);
