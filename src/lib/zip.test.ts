import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { crc32, zipStore } from './zip.ts';

const bytes = (s: string) => new TextEncoder().encode(s);

test('crc32 matches the standard check value', () => {
	assert.equal(crc32(bytes('123456789')), 0xcbf43926);
});

test('zipStore output is deterministic', () => {
	const entries = [{ path: 'a/SKILL.md', data: bytes('hello') }];
	assert.deepEqual(zipStore(entries), zipStore(entries));
});

test('zipStore archive passes the unzip integrity test and extracts the content', (t) => {
	try {
		execFileSync('unzip', ['-v'], { stdio: 'ignore' });
	} catch {
		return t.skip('unzip is not installed');
	}
	const dir = mkdtempSync(join(tmpdir(), 'zip-test-'));
	const file = join(dir, 'x.zip');
	writeFileSync(
		file,
		zipStore([
			{ path: 'my-skill/SKILL.md', data: bytes('---\nname: my-skill\n---\nHello é\n') },
			{ path: 'my-skill/references/notes.md', data: bytes('notes') },
		]),
	);
	assert.match(execFileSync('unzip', ['-t', file]).toString(), /No errors detected/);
	assert.equal(execFileSync('unzip', ['-p', file, 'my-skill/SKILL.md']).toString(), '---\nname: my-skill\n---\nHello é\n');
});
