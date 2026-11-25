// Run with: node --test src/lib/tools/error-match.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchErrors } from './error-match.ts';
import { ERRORS } from '../../data/salesforce-errors.ts';

const top = (s: string) => matchErrors(s, ERRORS)[0]?.id;

test('ids are unique and category values valid', () => {
	assert.equal(new Set(ERRORS.map((e) => e.id)).size, ERRORS.length);
	assert.ok(ERRORS.length >= 35 && ERRORS.length <= 45);
	for (const e of ERRORS) assert.ok(e.fixSteps.length >= 2 && e.fixSteps.length <= 4, e.id);
});

test('full code plus message', () => {
	assert.equal(top('FIELD_CUSTOM_VALIDATION_EXCEPTION: Amount must be positive'), 'field-custom-validation-exception');
	assert.equal(top('Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [LastName]: [LastName]'), 'required-field-missing');
});

test('specific code beats the DmlException wrapper', () => {
	const r = matchErrors('System.DmlException: Update failed. First exception on row 2 with id 001xx; first error: UNABLE_TO_LOCK_ROW, unable to obtain exclusive access to this record: []', ERRORS);
	assert.equal(r[0].id, 'unable-to-lock-row');
	assert.ok(r.some((x) => x.id === 'dml-exception'));
});

test('INVALID_FIELD does not match INVALID_FIELD_FOR_INSERT_UPDATE', () => {
	assert.equal(top('INVALID_FIELD_FOR_INSERT_UPDATE, Unable to create/update fields: Name'), 'invalid-field-for-insert-update');
	assert.ok(!matchErrors('INVALID_FIELD_FOR_INSERT_UPDATE', ERRORS).some((x) => x.id === 'invalid-field'));
});

test('Apex messages without a code', () => {
	assert.equal(top('System.QueryException: List has no rows for assignment to SObject'), 'list-has-no-rows');
	assert.equal(top('Class.MyHandler.run: line 12, column 1 System.NullPointerException: Attempt to de-reference a null object'), 'null-pointer-exception');
	assert.equal(top("No such column 'Region' on entity 'Account'"), 'invalid-field');
	assert.equal(top('System.LimitException: Too many SOQL queries: 101'), 'too-many-soql-queries');
});

test('wrapper error finds the wrapped cause too', () => {
	const r = matchErrors('CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY, AccTrigger: execution of BeforeInsert caused by: System.NullPointerException: Attempt to de-reference a null object: Trigger.AccTrigger: line 4, column 1', ERRORS);
	assert.equal(r[0].id, 'null-pointer-exception');
	assert.ok(r.some((x) => x.id === 'cannot-insert-update-activate-entity'));
});

test('deployment messages', () => {
	assert.equal(top('Test coverage of selected Apex Trigger is 0%, at least 1% test coverage is required'), 'deploy-trigger-coverage');
	assert.equal(top('In field: object - no CustomObject named Invoice__c found'), 'deploy-no-customobject-found');
});

test('case and whitespace are ignored', () => {
	assert.equal(top('  malformed_id:   malformed id 001'), 'malformed-id');
});

test('unrelated text returns nothing', () => {
	assert.deepEqual(matchErrors('The quick brown fox jumps over the lazy dog', ERRORS), []);
	assert.deepEqual(matchErrors('how do I make a good cup of coffee', ERRORS), []);
	assert.deepEqual(matchErrors('', ERRORS), []);
	assert.deepEqual(matchErrors('ab', ERRORS), []);
});
