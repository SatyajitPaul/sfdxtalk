// Run with: node --test src/lib/tools/async-chooser.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_ANSWERS, decodeAnswers, encodeAnswers, eventTriggerBatch, limit, rank, scenarioTop, SCENARIOS } from './async-chooser.ts';

const top = (o: object) => rank({ ...DEFAULT_ANSWERS, ...o }).filter((r) => !r.excluded).map((r) => r.id);
const get = (o: object, id: string) => rank({ ...DEFAULT_ANSWERS, ...o }).find((r) => r.id === id)!;

test('few records with a callout favour future or queueable, not batch', () => {
	const t = top({ callout: true });
	assert.ok(['future', 'queueable'].includes(t[0]));
	assert.ok(t.indexOf('batch') > t.indexOf('queueable'));
});

test('millions of records rank batch first', () => assert.equal(top({ volume: 'millions' })[0], 'batch'));

test('sObjects, chaining and monitoring rank queueable first', () => {
	assert.equal(top({ complexTypes: true, chain: true, monitoring: true })[0], 'queueable');
});

test('future is excluded from batch and future contexts', () => {
	assert.ok(get({ context: 'batch' }, 'future').excluded);
	assert.ok(get({ context: 'future' }, 'future').excluded);
	assert.ok(!get({ context: 'queueable' }, 'future').excluded);
	assert.ok(!get({ context: 'sync' }, 'future').excluded);
});

test('future is excluded when chaining is needed', () => assert.ok(get({ chain: true }, 'future').excluded));

test('schedulable and events only appear when asked', () => {
	assert.ok(get({}, 'schedulable').excluded);
	assert.ok(get({}, 'events').excluded);
	assert.equal(top({ schedule: true })[0], 'schedulable');
	assert.equal(top({ decoupled: true })[0], 'events');
});

test('excluded options always sort last', () => {
	const r = rank({ ...DEFAULT_ANSWERS, context: 'batch' });
	const firstExcluded = r.findIndex((x) => x.excluded);
	assert.ok(r.slice(firstExcluded).every((x) => x.excluded));
});

test('numbers come from the limits data', () => {
	assert.equal(limit('batch-concurrent'), '5');
	assert.equal(limit('flex-queue-holding'), '100');
	assert.equal(limit('queueable-jobs', 'async'), '1');
	assert.equal(eventTriggerBatch(), '2,000');
	const watch = get({ volume: 'millions' }, 'batch').watch.join(' ');
	assert.match(watch, /5 batch jobs/);
	assert.match(watch, /100 in Holding/);
});

test('future warns about primitives and missing job ID', () => {
	const w = get({ complexTypes: true, monitoring: true }, 'future').watch.join(' ');
	assert.match(w, /primitives/);
	assert.match(w, /no job ID/);
});

test('hash round trip and bad input falls back to defaults', () => {
	const a = { ...DEFAULT_ANSWERS, volume: 'millions' as const, chain: true, context: 'batch' as const };
	assert.deepEqual(decodeAnswers('#' + encodeAnswers(a)), a);
	assert.deepEqual(decodeAnswers('#v=bogus&x=nope'), DEFAULT_ANSWERS);
});

test('scenarios give a recommendation', () => {
	for (const s of SCENARIOS) assert.ok(scenarioTop(s).length >= 1);
});
