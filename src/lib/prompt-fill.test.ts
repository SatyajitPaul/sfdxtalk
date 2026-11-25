import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fillPrompt, placeholders } from './prompt-fill.ts';

test('fills known placeholders and leaves unknown ones', () => {
	assert.equal(fillPrompt('Write {{kind}} for {{ object }} and {{other}}', { kind: 'a trigger', object: 'Account' }), 'Write a trigger for Account and {{other}}');
});

test('values containing $ and braces are inserted literally', () => {
	assert.equal(fillPrompt('x {{a}}', { a: '$& {{b}} $1' }), 'x $& {{b}} $1');
});

test('placeholders lists each name once', () => {
	assert.deepEqual([...placeholders('{{a}} {{b}} {{a}}')].sort(), ['a', 'b']);
});
