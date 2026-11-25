// Run with: pnpm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { idSuffix, parseId, splitIds, toId18 } from './sf-id.ts';

test('all-lowercase and digit IDs get the AAA suffix', () => {
	assert.equal(toId18('001000000000000'), '001000000000000AAA');
});

test('uppercase letters set bits from the left of each 5-character chunk', () => {
	// chunk 3 is "00Abc": uppercase at index 2 -> bit value 4 -> "E"
	assert.equal(idSuffix('000000000000Abc'), 'AAE');
	// chunk 3 is "00aBC": uppercase at indexes 3 and 4 -> 8 + 16 = 24 -> "Y"
	assert.equal(idSuffix('000000000000aBC'), 'AAY');
	// five uppercase letters -> 31 -> "5"
	assert.equal(idSuffix('ABCDE0000000000'), '5AA');
});

test('matches a widely cited real Account ID pair', () => {
	assert.equal(toId18('001D000000IqhSL'), '001D000000IqhSLIAZ');
});

test('all-uppercase chunks map to the digit end of the alphabet', () => {
	assert.equal(idSuffix('AAAAAAAAAAAAAAA'), '555');
});

test('case-sensitive IDs that differ only by case get different suffixes', () => {
	assert.notEqual(toId18('000000000000Abc'), toId18('000000000000aBC'));
});

test('parseId accepts 15 and valid 18 character IDs', () => {
	const a = parseId('000000000000Abc');
	assert.equal(a.status, 'ok');
	assert.equal(a.id18, '000000000000AbcAAE');
	const b = parseId('000000000000AbcAAE');
	assert.equal(b.status, 'ok');
	assert.equal(b.id15, '000000000000Abc');
	assert.equal(b.prefix, '000');
});

test('parseId flags an 18 character ID whose suffix does not match', () => {
	const r = parseId('000000000000abcAAE');
	assert.equal(r.status, 'checksum-mismatch');
	assert.equal(r.id18, '000000000000abcAAA');
});

test('parseId rejects bad lengths and characters', () => {
	assert.equal(parseId('12345').status, 'invalid');
	assert.equal(parseId('00100000000000!').status, 'invalid');
	assert.equal(parseId('').status, 'invalid');
});

test('splitIds handles newlines, commas, semicolons and spaces', () => {
	assert.deepEqual(splitIds('a,b;c\nd  e\r\nf'), ['a', 'b', 'c', 'd', 'e', 'f']);
});
