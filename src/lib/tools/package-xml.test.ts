// Run with: node --test src/lib/tools/package-xml.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPackageXml, cleanMembers, normalizeVersion, parseMembers, sfCommands } from './package-xml.ts';

test('builds sorted types and members with version last', () => {
	const xml = buildPackageXml({
		version: '68.0',
		types: [
			{ name: 'Flow', members: ['*'] },
			{ name: 'ApexClass', members: ['Zed', 'Alpha', 'Alpha'] },
		],
	});
	assert.equal(
		xml,
		`<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Alpha</members>
        <members>Zed</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>*</members>
        <name>Flow</name>
    </types>
    <version>68.0</version>
</Package>
`,
	);
});

test('wildcard replaces other members; same type entries merge', () => {
	assert.deepEqual(cleanMembers(['A', '*', 'B']), ['*']);
	const xml = buildPackageXml({ version: '68.0', types: [{ name: 'ApexClass', members: ['B'] }, { name: 'ApexClass', members: ['A'] }] });
	assert.equal(xml.match(/<types>/g)?.length, 1);
});

test('escapes XML characters', () => {
	const xml = buildPackageXml({ version: '68.0', types: [{ name: 'Layout', members: ['Account-A & B <x> "q"'] }] });
	assert.ok(xml.includes('Account-A &amp; B &lt;x&gt; &quot;q&quot;'));
});

test('rejects empty names and bad versions; drops types without members', () => {
	assert.throws(() => buildPackageXml({ version: '68.0', types: [{ name: ' ', members: ['*'] }] }));
	assert.throws(() => buildPackageXml({ version: 'abc', types: [] }));
	assert.ok(!buildPackageXml({ version: '68.0', types: [{ name: 'Flow', members: [] }] }).includes('<types>'));
});

test('normalizes versions', () => {
	assert.equal(normalizeVersion('68'), '68.0');
	assert.equal(normalizeVersion(' v68.0 '), '68.0');
	assert.equal(normalizeVersion('68.5'), undefined);
});

test('parses pasted lists', () => {
	assert.deepEqual(parseMembers('A\r\n B ,C\n\nA\n'), ['A', 'B', 'C']);
});

test('commands mention manifest and target org', () => {
	const c = sfCommands();
	assert.ok(c.retrieve.startsWith('sf project retrieve start --manifest package.xml'));
	assert.ok(c.deploy.includes('--target-org'));
});
