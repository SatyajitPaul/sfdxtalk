// Run with: node --test src/lib/tools/ai-context.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_TOPIC_IDS, TARGETS, cleanApiVersion, cleanCoverage, cleanSourceDir, generate, sanitizeTopicIds, type TargetId } from './ai-context.ts';
import { AI_TOPICS } from '../../data/ai-rules.ts';

const base = { topics: ALL_TOPIC_IDS, facts: { projectName: 'Acme', apiVersion: '68.0' } };

test('every target generates the heading, facts and all topics', () => {
	for (const t of TARGETS) {
		const out = generate({ ...base, target: t.id });
		assert.match(out, /# Acme: Salesforce development instructions/);
		assert.match(out, /API version: 68\.0/);
		for (const topic of AI_TOPICS) assert.ok(out.includes(`## ${topic.title}`), `${t.id} missing ${topic.title}`);
	}
});

test('only cursor output has frontmatter', () => {
	const cursor = generate({ ...base, target: 'cursor' });
	assert.ok(cursor.startsWith('---\ndescription: "'));
	assert.match(cursor, /\nglobs: force-app\/\*\*\/\*\.cls, .*\nalwaysApply: false\n---\n\n# /);
	for (const id of ['claude', 'agents', 'copilot'] as TargetId[]) assert.ok(generate({ ...base, target: id }).startsWith('# '));
});

test('deselecting a topic removes its heading and rules', () => {
	const full = generate({ ...base, target: 'claude' });
	const less = generate({ ...base, target: 'claude', topics: ALL_TOPIC_IDS.filter((i) => i !== 'triggers') });
	assert.ok(full.includes('## Triggers') && full.includes('one trigger per object'));
	assert.ok(!less.includes('## Triggers') && !less.includes('one trigger per object'));
	assert.ok(less.includes('## Apex'));
});

test('output is deterministic', () => {
	assert.equal(generate({ ...base, target: 'agents' }), generate({ ...base, target: 'agents' }));
});

test('api version placeholder is filled and invalid versions fall back', () => {
	const out = generate({ ...base, target: 'claude', facts: { apiVersion: '67.0' } });
	assert.match(out, /API version 67\.0/);
	assert.ok(!out.includes('{apiVersion}'));
	assert.equal(cleanApiVersion('abc'), '68.0');
	assert.equal(cleanApiVersion('6.0'), '68.0');
});

test('optional facts appear only when valid', () => {
	const none = generate({ ...base, target: 'claude' });
	assert.ok(!none.includes('Namespace') && !none.includes('coverage target') && !none.includes('Additional notes'));
	const some = generate({ ...base, target: 'claude', facts: { namespace: 'acme', coverageTarget: '85%', orgTypes: 'scratch orgs', ciNotes: 'GitHub Actions', extra: 'Use tabs.' } });
	assert.match(some, /Namespace: `acme`/);
	assert.match(some, /at least 85%/);
	assert.match(some, /Orgs: scratch orgs/);
	assert.match(some, /CI and deployment: GitHub Actions/);
	assert.match(some, /## Additional notes\n\n- Use tabs\./);
	assert.equal(cleanCoverage('50'), undefined);
});

test('input is sanitized: newlines collapsed, headings stripped, bad paths replaced', () => {
	const out = generate({ ...base, target: 'claude', facts: { projectName: '# Evil\n## Injected', extra: 'a\n## Heading\nb', sourceDir: '../etc' } });
	assert.ok(!/\n## Injected/.test(out) && !/\n## Heading/.test(out));
	assert.match(out, /Source directory: `force-app`/);
	assert.equal(cleanSourceDir('./src/app/'), 'src/app');
});

test('reasons can be turned off', () => {
	const on = generate({ ...base, target: 'claude' });
	const off = generate({ ...base, target: 'claude', reasons: false });
	assert.ok(on.includes('Each query and DML statement counts'));
	assert.ok(!off.includes('Each query and DML statement counts'));
});

test('sanitizeTopicIds keeps known ids only', () => {
	assert.deepEqual(sanitizeTopicIds(['apex', 'nope', 3]), ['apex']);
	assert.deepEqual(sanitizeTopicIds(undefined), ALL_TOPIC_IDS);
});
