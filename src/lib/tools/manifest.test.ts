import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffManifests, diffReport, mergeManifests, parseManifest } from './manifest.ts';
import { buildPackageXml } from './package-xml.ts';

const A = buildPackageXml({ version: '67.0', types: [{ name: 'ApexClass', members: ['A', 'B'] }, { name: 'Flow', members: ['F1'] }] });
const B = buildPackageXml({ version: '68.0', types: [{ name: 'ApexClass', members: ['B', 'C'] }, { name: 'CustomField', members: ['Account.X__c'] }] });

test('parse round-trips a generated manifest', () => {
	const m = parseManifest(A);
	assert.equal(m.version, '67.0');
	assert.deepEqual(m.types, [{ name: 'ApexClass', members: ['A', 'B'] }, { name: 'Flow', members: ['F1'] }]);
	assert.deepEqual(m.warnings, []);
});

test('parse handles entities, comments, CDATA and CRLF', () => {
	const xml = '<?xml version="1.0"?>\r\n<Package xmlns="x"><!-- c -->\r\n<types><members>A&amp;B</members><members><![CDATA[C<D]]></members><name>ApexClass</name></types><version>68</version></Package>';
	const m = parseManifest(xml);
	assert.deepEqual(m.types[0].members, ['A&B', 'C<D']);
	assert.equal(m.version, '68.0');
});

test('parse warns on non-manifest and missing version', () => {
	assert.ok(parseManifest('hello').warnings.length);
	const m = parseManifest('<Package><types><members>A</members><name>ApexClass</name></types></Package>');
	assert.equal(m.version, undefined);
	assert.ok(m.warnings.some((w) => w.includes('version')));
});

test('parse skips invalid type names with a warning', () => {
	const m = parseManifest('<Package><types><members>A</members><name>Bad Name</name></types><types><members>A</members><name>ApexClass</name></types><version>68.0</version></Package>');
	assert.deepEqual(m.types.map((t) => t.name), ['ApexClass']);
	assert.ok(m.warnings.length);
});

test('diff finds added, removed and changed', () => {
	const d = diffManifests(parseManifest(A), parseManifest(B));
	assert.deepEqual(d.typesAdded.map((t) => t.name), ['CustomField']);
	assert.deepEqual(d.typesRemoved.map((t) => t.name), ['Flow']);
	assert.equal(d.changed.length, 1);
	assert.deepEqual(d.changed[0].added, ['C']);
	assert.deepEqual(d.changed[0].removed, ['A']);
	assert.equal(d.version.differs, true);
	assert.equal(d.identical, false);
	assert.match(diffReport(d), /~ ApexClass/);
});

test('identical manifests, and wildcard flag', () => {
	assert.equal(diffManifests(parseManifest(A), parseManifest(A)).identical, true);
	const w = buildPackageXml({ version: '68.0', types: [{ name: 'ApexClass', members: ['*'] }] });
	const n = buildPackageXml({ version: '68.0', types: [{ name: 'ApexClass', members: ['A'] }] });
	assert.equal(diffManifests(parseManifest(w), parseManifest(n)).changed[0].wildcardChange, true);
});

test('merge unions, dedupes, takes highest version', () => {
	const r = mergeManifests([parseManifest(A), parseManifest(B)], '68.0');
	assert.equal(r.version, '68.0');
	assert.deepEqual(r.types.find((t) => t.name === 'ApexClass')?.members, ['A', 'B', 'C']);
	assert.equal(r.typeCount, 3);
	assert.equal(r.duplicatesRemoved, 1);
	assert.match(r.xml, /<version>68\.0<\/version>/);
});

test('merge collapses wildcard and uses fallback version', () => {
	const w = parseManifest('<Package><types><members>*</members><name>ApexClass</name></types></Package>');
	const n = parseManifest('<Package><types><members>X</members><name>ApexClass</name></types></Package>');
	const r = mergeManifests([w, n], '68');
	assert.deepEqual(r.types[0].members, ['*']);
	assert.equal(r.version, '68.0');
});
