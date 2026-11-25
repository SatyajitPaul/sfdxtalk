/**
 * Curated reference of common Salesforce errors for /tools/salesforce-error-decoder/.
 *
 * API status codes (UPPER_SNAKE_CASE) are checked against the official StatusCode
 * list in the SOAP API Developer Guide. Apex exception messages and deployment
 * messages are well-known wording; message text varies slightly by release and
 * context, so `typicalMessage` is "typical", not guaranteed. Causes and fixes
 * are our own conservative advice.
 */

export type ErrorCategory = 'data' | 'access' | 'query' | 'apex' | 'integration' | 'limits' | 'deploy';

export interface ErrorRef {
	label: string;
	url: string;
}

export interface SfError {
	/** Stable anchor id; never rename once published. */
	id: string;
	/** Exact API status code or exception name, or the message pattern when there is no code. */
	code: string;
	/** Typical wording seen by users (placeholders in angle brackets or examples). */
	typicalMessage?: string;
	category: ErrorCategory;
	/** Extra lowercase message fragments for matching pasted text. */
	match?: string[];
	/** Very broad wrapper codes rank below the specific code inside the same message. */
	generic?: boolean;
	cause: string;
	fixSteps: string[];
	example?: { lang: string; code: string };
	refs?: ErrorRef[];
	/** Internal link to another SFDX Talk tool or guide. */
	internal?: { label: string; href: string };
}

export const ERRORS_META = {
	source: 'https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_calls_concepts_core_data_objects.htm',
	sourceName: 'SOAP API Developer Guide: Core Data Types, StatusCode',
	release: "Winter '27",
	apiVersion: '68.0',
	verified: '2026-11-17',
} as const;

export const CATEGORY_ORDER: ErrorCategory[] = ['data', 'access', 'query', 'apex', 'integration', 'limits', 'deploy'];

export const CATEGORY_LABELS: Record<ErrorCategory, { label: string; blurb: string }> = {
	data: { label: 'Data and DML', blurb: 'Errors when saving, deleting or referencing records.' },
	access: { label: 'Access and login', blurb: 'Permissions, sharing, sessions and credentials.' },
	query: { label: 'SOQL and queries', blurb: 'Malformed, slow or empty queries.' },
	apex: { label: 'Apex runtime', blurb: 'Exceptions thrown by Apex code and triggers.' },
	integration: { label: 'Integration and API', blurb: 'Callouts, OAuth and API request limits.' },
	limits: { label: 'Governor limits', blurb: 'System.LimitException messages.' },
	deploy: { label: 'Deployment', blurb: 'Errors when deploying metadata and running tests.' },
};

const STATUS: ErrorRef = { label: 'SOAP API Developer Guide: StatusCode', url: ERRORS_META.source };
const EXC: ErrorRef = {
	label: 'Apex Reference Guide: Exception Class and Built-In Exceptions',
	url: 'https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_classes_exception_methods.htm',
};
const LIMITS_REF: ErrorRef = {
	label: 'Apex Developer Guide: Execution Governors and Limits',
	url: 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm',
};
const GOV = { label: 'Governor limits reference', href: '/tools/governor-limits/' };

export const ERRORS: SfError[] = [
	// ---------- data ----------
	{
		id: 'field-custom-validation-exception',
		code: 'FIELD_CUSTOM_VALIDATION_EXCEPTION',
		typicalMessage: 'FIELD_CUSTOM_VALIDATION_EXCEPTION, Amount must be positive: [Amount]',
		category: 'data',
		cause:
			'A validation rule on the object evaluated to true, so Salesforce blocked the save. The text after the code is the error message of that rule, and the field in brackets is where the rule shows the error.',
		fixSteps: [
			'Read the message after the code: it is the rule\'s own error message.',
			'In Setup, open Object Manager, the object, then Validation Rules, and find the rule with that message.',
			'Fix the data so the rule passes, or correct the rule formula if it is wrong.',
			'In Apex, catch DmlException and use getDmlMessage(0) to show the rule message to the user.',
		],
		refs: [STATUS],
	},
	{
		id: 'required-field-missing',
		code: 'REQUIRED_FIELD_MISSING',
		typicalMessage: 'REQUIRED_FIELD_MISSING, Required fields are missing: [Name]',
		category: 'data',
		cause:
			'The record is missing a value for a field that is required by the platform (such as Name), by the field definition, or by the page layout used through the API call.',
		fixSteps: [
			'Look at the field names in brackets and set a value for each one before the insert or update.',
			'For a custom field, check whether the field itself is marked required in its definition.',
			'In a data load, check the CSV column mapping and blank cells.',
		],
		example: { lang: 'apex', code: "insert new Contact(FirstName = 'Ada'); // LastName is required" },
		refs: [STATUS],
	},
	{
		id: 'duplicate-value',
		code: 'DUPLICATE_VALUE',
		typicalMessage: 'DUPLICATE_VALUE, duplicate value found: External_Id__c duplicates value on record with id: 001...',
		category: 'data',
		cause: 'A field marked unique (or an external ID with unique values) already holds the value you are saving on another record.',
		fixSteps: [
			'Use the record ID in the message to open the existing record.',
			'Update that record instead of inserting a new one, or change the value.',
			'In Apex or a data load, use upsert on the external ID field to update-or-insert.',
		],
		refs: [STATUS],
	},
	{
		id: 'duplicates-detected',
		code: 'DUPLICATES_DETECTED',
		typicalMessage: 'DUPLICATES_DETECTED, Use one of these records?',
		category: 'data',
		cause:
			'An active duplicate rule with the Block action found a likely duplicate of the record you are saving. The Allow action with an alert can be overridden by the caller.',
		fixSteps: [
			'Open the matching records named in the error and update one of them instead.',
			'If the rule action is Allow with an alert, saving through Apex can set the duplicate rule header to allow the save.',
			'Review the matching rule if it blocks legitimate records.',
		],
		example: {
			lang: 'apex',
			code: 'Database.DMLOptions dml = new Database.DMLOptions();\ndml.DuplicateRuleHeader.allowSave = true;\nDatabase.insert(acc, dml);',
		},
		refs: [STATUS],
	},
	{
		id: 'string-too-long',
		code: 'STRING_TOO_LONG',
		typicalMessage: 'STRING_TOO_LONG, Name: data value too large: ... (max length=80)',
		category: 'data',
		match: ['data value too large'],
		cause: 'A text value is longer than the maximum length of its field. The message names the field and the maximum length.',
		fixSteps: [
			'Shorten the value, or use the field\'s max length from the message as the limit.',
			'If the data legitimately needs more room, move it to a Long Text Area field.',
			'In Apex, truncate deliberately with String.abbreviate or substring before saving.',
		],
		refs: [STATUS],
	},
	{
		id: 'invalid-cross-reference-key',
		code: 'INVALID_CROSS_REFERENCE_KEY',
		typicalMessage: 'INVALID_CROSS_REFERENCE_KEY, invalid cross reference id',
		category: 'data',
		match: ['invalid cross reference id'],
		cause:
			'An ID in a lookup or master-detail field does not point to a usable record: it does not exist in this org, belongs to the wrong object, was deleted, or came from another org (for example a production ID used in a sandbox).',
		fixSteps: [
			'Check that the ID exists in this org with a SOQL query on the target object.',
			'Check the ID prefix matches the object the lookup expects.',
			'After a data migration or sandbox refresh, remap IDs instead of copying them.',
		],
		refs: [STATUS],
	},
	{
		id: 'entity-is-deleted',
		code: 'ENTITY_IS_DELETED',
		typicalMessage: 'ENTITY_IS_DELETED, entity is deleted',
		category: 'data',
		match: ['entity is deleted'],
		cause: 'The operation referenced a record that has been deleted (it may still be in the Recycle Bin).',
		fixSteps: [
			'Confirm the record is deleted: query it with ALL ROWS in Apex, or check the Recycle Bin.',
			'Restore it with undelete if it should exist, or remove the stale reference.',
			'Refresh cached IDs in integrations that hold on to old records.',
		],
		example: { lang: 'apex', code: "List<Account> a = [SELECT Id FROM Account WHERE Id = :id ALL ROWS];\nundelete a;" },
		refs: [STATUS],
	},
	{
		id: 'delete-failed',
		code: 'DELETE_FAILED',
		typicalMessage: 'DELETE_FAILED, Your attempt to delete <record> could not be completed because it is associated with ...',
		category: 'data',
		cause: 'The record is in use by another record or setting, such as a related record that restricts deletion, so it cannot be deleted.',
		fixSteps: [
			'Read the end of the message: it names what the record is associated with.',
			'Remove or reassign the associated records or references first, then delete again.',
			'Check lookup fields whose delete behavior is set to Don\'t allow deletion.',
		],
		refs: [STATUS],
	},
	{
		id: 'malformed-id',
		code: 'MALFORMED_ID',
		typicalMessage: 'MALFORMED_ID, malformed id 001XXXXXXXX',
		category: 'data',
		match: ['malformed id'],
		cause: 'A value passed as an ID is not a valid 15 or 18 character Salesforce ID (wrong length, stray characters, or changed case in an 18-character ID).',
		fixSteps: [
			'Check for whitespace, quotes or truncated values in the ID.',
			'Convert and validate the ID with the ID converter.',
			'In SOQL filters, compare an ID field with a valid ID, not a name or a label.',
		],
		internal: { label: 'Salesforce ID converter', href: '/tools/salesforce-id-converter/' },
		refs: [STATUS],
	},
	{
		id: 'invalid-type-on-field-in-record',
		code: 'INVALID_TYPE_ON_FIELD_IN_RECORD',
		typicalMessage: 'INVALID_TYPE_ON_FIELD_IN_RECORD, Close Date: value not of required type: ...',
		category: 'data',
		match: ['value not of required type'],
		cause: 'A value does not match the data type of its field, for example text in a number field or a date in the wrong format.',
		fixSteps: [
			'Check the field named in the message and its data type.',
			'Format dates as YYYY-MM-DD and datetimes in ISO 8601 for API and data loads.',
			'Remove thousands separators and currency symbols from number values.',
		],
	},
	{
		id: 'entity-is-locked',
		code: 'ENTITY_IS_LOCKED',
		typicalMessage: 'ENTITY_IS_LOCKED, entity is locked',
		category: 'data',
		match: ['entity is locked'],
		cause: 'The record is locked because an approval process is pending on it, so it cannot be edited until the approval finishes.',
		fixSteps: [
			'Open the record and check for a pending approval request.',
			'Ask the approver to approve or reject it, or have an admin recall or unlock it.',
			'In automation, check Approval.isLocked or the lock status before updating.',
		],
		refs: [STATUS],
	},
	{
		id: 'unable-to-lock-row',
		code: 'UNABLE_TO_LOCK_ROW',
		typicalMessage: 'UNABLE_TO_LOCK_ROW, unable to obtain exclusive access to this record',
		category: 'data',
		match: ['unable to obtain exclusive access'],
		cause:
			'Two transactions tried to update the same or related records at once, so one timed out waiting for the lock, or they deadlocked. Roll-up summary fields and child records of the same parent are common causes because the parent is locked.',
		fixSteps: [
			'Retry the failed operation; the error is often transient.',
			'In bulk loads, lower the batch size or switch to serial processing, and sort records by parent so batches do not compete for the same parent.',
			'Avoid running many jobs against the same parent record at the same time.',
			'In Apex, SOQL FOR UPDATE locks records on purpose; keep the transaction short.',
		],
		refs: [STATUS],
	},

	// ---------- access ----------
	{
		id: 'insufficient-access-or-readonly',
		code: 'INSUFFICIENT_ACCESS_OR_READONLY',
		typicalMessage: 'INSUFFICIENT_ACCESS_OR_READONLY, insufficient access rights on object id',
		category: 'access',
		match: ['insufficient access rights on object id'],
		cause: 'The running user lacks the permission or record access needed for the action, for example edit or delete rights on that record through ownership, sharing or object permissions.',
		fixSteps: [
			'Check object permissions (create, read, edit, delete) for the user in their profile and permission sets.',
			'Check record access: the owner, role hierarchy, sharing rules and org-wide defaults for the object.',
			'Reproduce as the user: use Login As in a sandbox or run the Apex in a System.runAs test.',
		],
		refs: [STATUS],
	},
	{
		id: 'insufficient-access-on-cross-reference-entity',
		code: 'INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY',
		typicalMessage: 'INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY, insufficient access rights on cross-reference id',
		category: 'access',
		match: ['insufficient access rights on cross-reference id'],
		cause: 'The save affects another record that this one references (for example a lookup target or a parent), and the user cannot access that referenced record.',
		fixSteps: [
			'Identify the referenced record from the ID in the message or from the lookup fields you are setting.',
			'Give the user access to it through sharing, or use a user who has access.',
			'In Apex that must act on records the user cannot see, run it in a class declared with sharing settings that fit the design, and document the reason.',
		],
		refs: [STATUS],
	},
	{
		id: 'invalid-session-id',
		code: 'INVALID_SESSION_ID',
		typicalMessage: 'INVALID_SESSION_ID: Session expired or invalid',
		category: 'access',
		match: ['session expired or invalid'],
		cause: 'The session ID or access token sent with the request is expired, malformed or no longer valid, or it was sent to the wrong instance URL.',
		fixSteps: [
			'Log in or refresh the OAuth access token and retry.',
			'Use the instance_url returned at login as the base URL for API calls.',
			'Check that the Authorization header is "Bearer <token>" with no extra characters.',
		],
		refs: [STATUS],
	},
	{
		id: 'invalid-login',
		code: 'INVALID_LOGIN',
		typicalMessage: 'INVALID_LOGIN: Invalid username, password, security token; or user locked out.',
		category: 'access',
		cause: 'The login credentials are not valid, the user is locked out, or the maximum number of logins has been exceeded.',
		fixSteps: [
			'Verify the username and password, and that the user is active and not locked out.',
			'If logging in from an IP outside the trusted range, append the security token to the password or add the IP to a trusted range.',
			'Confirm you are using the right login URL (login.salesforce.com, test.salesforce.com or the My Domain URL).',
		],
		refs: [STATUS],
	},
	{
		id: 'invalid-field-for-insert-update',
		code: 'INVALID_FIELD_FOR_INSERT_UPDATE',
		typicalMessage: 'INVALID_FIELD_FOR_INSERT_UPDATE, Unable to create/update fields: <Field>. Please check the security settings of this field...',
		category: 'access',
		match: ['unable to create/update fields'],
		cause: 'A field in the request cannot be written: it is read-only for the user through field-level security, or it is a formula, auto-number or system field.',
		fixSteps: [
			'Check field-level security for the field in the user\'s profile and permission sets.',
			'Check the field type: formula, roll-up summary and auto-number fields cannot be set.',
			'Remove the field from the request or load file if it should not be written.',
		],
	},

	// ---------- query ----------
	{
		id: 'invalid-field',
		code: 'INVALID_FIELD',
		typicalMessage: "INVALID_FIELD: No such column 'Foo__c' on entity 'Account'. If you are attempting to use a custom field, be sure to append the '__c' after the custom field name.",
		category: 'query',
		match: ['no such column'],
		cause: 'The query names a field that does not exist on the object, is misspelled, lacks the __c suffix, or is not visible to the running user.',
		fixSteps: [
			'Check the field API name on the object in Object Manager (labels differ from API names).',
			'Custom fields end with __c, and relationship paths use __r.',
			'Check that the user has field-level security access to the field.',
			'If the field is in a package, include the namespace prefix.',
		],
		example: { lang: 'soql', code: 'SELECT Id, Region__c FROM Account // field must be Region__c, not Region' },
		refs: [STATUS],
	},
	{
		id: 'malformed-query',
		code: 'MALFORMED_QUERY',
		typicalMessage: "MALFORMED_QUERY: unexpected token: 'FROM'",
		category: 'query',
		cause: 'The query string has invalid SOQL syntax, or exceeds a query limit such as the maximum query length.',
		fixSteps: [
			'Look at the token named in the message and the text right before it.',
			'Check commas between fields, quotes around strings and the order SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT.',
			'Test the query in the Developer Console Query Editor.',
		],
		refs: [STATUS],
	},
	{
		id: 'invalid-type',
		code: 'INVALID_TYPE',
		typicalMessage: "INVALID_TYPE: sObject type 'Foo' is not supported.",
		category: 'query',
		match: ['is not supported'],
		cause: 'The object name in the query or API call does not exist, is misspelled, lacks __c, or the user cannot see the object.',
		fixSteps: [
			'Check the object API name in Object Manager.',
			'Custom objects end with __c.',
			'Check that the user has Read access to the object.',
		],
		refs: [STATUS],
	},
	{
		id: 'query-timeout',
		code: 'QUERY_TIMEOUT',
		typicalMessage: 'QUERY_TIMEOUT: Your query request was running for too long.',
		category: 'query',
		match: ['query request was running for too long'],
		cause: 'The query took too long, usually because it filters on non-indexed fields over a large object or returns too much data.',
		fixSteps: [
			'Filter on indexed fields (such as Id, Name, lookups, external IDs) and use a narrower date range.',
			'Remove leading wildcards and negative filters like != where you can.',
			'For large exports, use Bulk API or query in smaller slices.',
		],
		refs: [STATUS],
	},
	{
		id: 'non-selective-query',
		code: 'System.QueryException: Non-selective query against large object type',
		typicalMessage: 'System.QueryException: Non-selective query against large object type (more than 200000 rows). Consider an indexed filter or contact salesforce.com about custom indexing.',
		category: 'query',
		match: ['non-selective query against large object type'],
		cause: 'A query in a trigger filters on fields that are not selective on an object with a large number of records, so Salesforce refuses to run it.',
		fixSteps: [
			'Add a filter on an indexed field that narrows the results to a small share of records.',
			'Avoid filtering on formula fields or fields with mostly the same value.',
			'Ask Salesforce Support about a custom index when the filter is correct but still not selective.',
		],
	},
	{
		id: 'aggregate-too-many-rows',
		code: 'System.QueryException: Aggregate query has too many rows for direct assignment',
		typicalMessage: 'System.QueryException: Aggregate query has too many rows for direct assignment, use FOR loop',
		category: 'query',
		match: ['aggregate query has too many rows for direct assignment'],
		cause: 'A query that returns more rows than direct assignment to a list or variable allows was assigned directly.',
		fixSteps: [
			'Use a SOQL for loop to process the rows in chunks.',
			'Add filters or LIMIT to return fewer rows.',
		],
		example: { lang: 'apex', code: 'for (Account a : [SELECT Id FROM Account]) {\n    // process one record at a time\n}' },
		internal: GOV,
	},
	{
		id: 'list-has-no-rows',
		code: 'System.QueryException: List has no rows for assignment to SObject',
		typicalMessage: 'System.QueryException: List has no rows for assignment to SObject',
		category: 'query',
		match: ['list has no rows for assignment to sobject'],
		cause: 'Apex assigned the result of a query straight to a single record, but the query returned no rows (or more than one, which gives a different message).',
		fixSteps: [
			'Assign the query to a List and check isEmpty() or size() before using it.',
			'Or add LIMIT 1 and handle the empty case.',
			'In tests, create the data the query expects.',
		],
		example: {
			lang: 'apex',
			code: "List<Account> rows = [SELECT Id FROM Account WHERE Name = :n LIMIT 1];\nif (!rows.isEmpty()) {\n    Account a = rows[0];\n}",
		},
		refs: [EXC],
	},
	{
		id: 'sobject-field-not-queried',
		code: 'System.SObjectException',
		typicalMessage: 'System.SObjectException: SObject row was retrieved via SOQL without querying the requested field: Account.Industry',
		category: 'query',
		match: ['sobject row was retrieved via soql without querying the requested field'],
		cause: 'Apex read a field on a record that was queried without that field in its SELECT list.',
		fixSteps: [
			'Add the named field to the SELECT list of the query that loaded the record.',
			'If the record was passed in from elsewhere, query it again with the fields you need.',
		],
		refs: [EXC],
	},

	// ---------- apex ----------
	{
		id: 'null-pointer-exception',
		code: 'System.NullPointerException',
		typicalMessage: 'System.NullPointerException: Attempt to de-reference a null object',
		category: 'apex',
		match: ['attempt to de-reference a null object'],
		cause: 'Code called a method or read a field on a variable that is null, such as an unqueried relationship, an empty map lookup or an uninitialised variable.',
		fixSteps: [
			'Use the line and column in the stack trace to find the expression that is null.',
			'Add null checks, or use the safe navigation operator ?. in Apex.',
			'Initialise collections, and check map.get(key) results before using them.',
		],
		example: { lang: 'apex', code: 'String name = acc?.Owner?.Name; // returns null instead of throwing' },
		refs: [EXC],
	},
	{
		id: 'list-index-out-of-bounds',
		code: 'System.ListException',
		typicalMessage: 'System.ListException: List index out of bounds: 0',
		category: 'apex',
		match: ['list index out of bounds'],
		cause: 'Code read an index that is not in the list, most often element 0 of an empty list.',
		fixSteps: [
			'Check list.isEmpty() or size() before reading an element.',
			'Check the loop bounds when iterating by index.',
		],
		refs: [EXC],
	},
	{
		id: 'dml-exception',
		code: 'System.DmlException',
		typicalMessage: 'System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]: [Name]',
		category: 'apex',
		generic: true,
		match: ['first exception on row'],
		cause: 'A DML statement failed. This is a wrapper: the real reason is the status code after "first error:".',
		fixSteps: [
			'Find the status code after "first error:" and look it up in this list.',
			'The row number is zero-based: row 0 is the first record in the list.',
			'Use Database.insert(records, false) and inspect each SaveResult to see every failure instead of only the first.',
		],
		example: {
			lang: 'apex',
			code: 'Database.SaveResult[] res = Database.insert(records, false);\nfor (Database.SaveResult r : res) {\n    if (!r.isSuccess()) System.debug(r.getErrors()[0].getStatusCode() + \': \' + r.getErrors()[0].getMessage());\n}',
		},
		refs: [EXC],
	},
	{
		id: 'callout-uncommitted-work',
		code: 'System.CalloutException: You have uncommitted work pending',
		typicalMessage: 'System.CalloutException: You have uncommitted work pending. Please commit or rollback before calling out',
		category: 'apex',
		match: ['you have uncommitted work pending'],
		cause: 'Apex made a callout after DML in the same transaction. A callout is not allowed while there are uncommitted changes.',
		fixSteps: [
			'Make the callout before the DML.',
			'Or move the callout (or the DML) to a Queueable or @future method so it runs in its own transaction.',
		],
		refs: [EXC],
	},
	{
		id: 'type-exception',
		code: 'System.TypeException',
		typicalMessage: 'System.TypeException: Invalid conversion from runtime type Account to Contact',
		category: 'apex',
		match: ['invalid conversion from runtime type'],
		cause: 'A cast or conversion is not valid for the actual runtime type of the value, or a string could not be converted to a number, date or ID.',
		fixSteps: [
			'Check the real type with instanceof before casting.',
			'Validate strings before converting them to numbers or dates.',
		],
		refs: [EXC],
	},
	{
		id: 'mixed-dml-operation',
		code: 'MIXED_DML_OPERATION',
		typicalMessage: 'MIXED_DML_OPERATION, DML operation on setup object is not permitted after you have updated a non-setup object (or vice versa)',
		category: 'apex',
		match: ['dml operation on setup object is not permitted'],
		cause: 'One transaction changed both a setup object (such as User, Group or PermissionSetAssignment) and a non-setup object (such as Account). Salesforce limits this mix.',
		fixSteps: [
			'Move one of the DML operations to a separate transaction, such as a Queueable or @future method.',
			'In tests, wrap the setup-object DML in System.runAs(user) { ... }.',
		],
		refs: [STATUS],
	},
	{
		id: 'self-reference-from-trigger',
		code: 'SELF_REFERENCE_FROM_TRIGGER',
		typicalMessage: 'SELF_REFERENCE_FROM_TRIGGER, Object (id = 001...) is currently in trigger X, therefore it cannot recursively update itself',
		category: 'apex',
		match: ['cannot recursively update itself'],
		cause: 'A trigger updated or deleted the same record it is running for, in a way that is not allowed, such as updating the record from its own before trigger by DML.',
		fixSteps: [
			'In a before trigger, set field values on Trigger.new directly instead of using DML.',
			'Do not delete the triggering record from its own trigger.',
			'Use a static flag to guard against recursion if two triggers update each other.',
		],
		refs: [STATUS],
	},
	{
		id: 'cannot-insert-update-activate-entity',
		code: 'CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY',
		typicalMessage: 'CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY, MyTrigger: execution of BeforeInsert caused by: System.NullPointerException: Attempt to de-reference a null object',
		category: 'apex',
		generic: true,
		match: ['execution of beforeinsert caused by', 'execution of afterinsert caused by', 'execution of beforeupdate caused by', 'execution of afterupdate caused by'],
		cause:
			'An error occurred in a trigger, flow or process that ran while saving. This is a wrapper: the real error is the exception named after "caused by". The status code can also mean a missing permission to create, update or activate the record.',
		fixSteps: [
			'Read the text after "caused by:" and find that exception in this list.',
			'The trigger name and line number in the message show where it failed.',
			'Reproduce with the same data and open the debug log to see the execution path.',
		],
		refs: [STATUS],
	},
	{
		id: 'variable-does-not-exist',
		code: 'Variable does not exist',
		typicalMessage: 'Variable does not exist: Region__c',
		category: 'apex',
		match: ['variable does not exist'],
		cause: 'An Apex compile error: the code uses a variable or field that does not exist in the org, is misspelled, or is not visible to the code (for example a field missing in the target org).',
		fixSteps: [
			'Check the spelling and the API name of the field or variable.',
			'If it is a custom field, confirm it exists in the org you are saving or deploying to.',
			'When deploying, include the field in the deployment or deploy it first.',
		],
	},

	// ---------- integration ----------
	{
		id: 'request-limit-exceeded',
		code: 'REQUEST_LIMIT_EXCEEDED',
		typicalMessage: 'REQUEST_LIMIT_EXCEEDED: TotalRequests Limit exceeded.',
		category: 'integration',
		match: ['totalrequests limit exceeded'],
		cause: 'The org exceeded either the concurrent request limit or the request limit for its API usage, so Salesforce rejects new API requests.',
		fixSteps: [
			'Check API usage in Setup under System Overview and the Limits resource of the REST API.',
			'Batch work: use composite requests, Bulk API or sObject Collections to use fewer calls.',
			'Cache reads and avoid polling in tight loops; stop runaway integrations.',
		],
		refs: [STATUS],
		internal: GOV,
	},
	{
		id: 'unauthorized-endpoint',
		code: 'System.CalloutException: Unauthorized endpoint',
		typicalMessage: 'System.CalloutException: Unauthorized endpoint, please check Setup->Security->Remote site settings.',
		category: 'integration',
		match: ['unauthorized endpoint'],
		cause: 'Apex called an external URL that is not allowed: the URL is not registered as a Remote Site Setting, or it is not covered by a Named Credential.',
		fixSteps: [
			'Prefer a Named Credential for the callout and use the callout: URL syntax.',
			'Or add the exact base URL as a Remote Site Setting in Setup.',
			'Check the protocol and host; http and https are different.',
		],
		refs: [EXC],
	},
	{
		id: 'oauth-invalid-grant',
		code: 'invalid_grant',
		typicalMessage: '{"error":"invalid_grant","error_description":"authentication failure"}',
		category: 'integration',
		match: ['authentication failure'],
		cause:
			'An OAuth token request was refused. Common reasons: wrong username, password or token, a user the connected app does not allow, an expired or revoked refresh token, or a login URL that does not match the org (production versus sandbox or My Domain).',
		fixSteps: [
			'Check the token endpoint host matches the org type (login.salesforce.com, test.salesforce.com or your My Domain).',
			'Check the connected app policies: permitted users and pre-authorized profiles or permission sets.',
			'For JWT bearer flow, check the username, the certificate and that the app is pre-authorized for that user.',
			'Request a new refresh token if the old one was revoked.',
		],
	},

	// ---------- limits ----------
	{
		id: 'too-many-soql-queries',
		code: 'System.LimitException: Too many SOQL queries',
		typicalMessage: 'System.LimitException: Too many SOQL queries: 101',
		category: 'limits',
		match: ['too many soql queries'],
		cause: 'A transaction ran more SOQL queries than the per-transaction governor limit, usually a query inside a loop.',
		fixSteps: [
			'Move queries out of loops: collect IDs first, then query once with IN :ids.',
			'Store results in a Map to look them up inside the loop.',
			'Check the debug log for the CUMULATIVE_LIMIT_USAGE section to see which code ran the queries.',
		],
		internal: GOV,
		refs: [LIMITS_REF],
	},
	{
		id: 'too-many-dml-statements',
		code: 'System.LimitException: Too many DML statements',
		typicalMessage: 'System.LimitException: Too many DML statements: 151',
		category: 'limits',
		match: ['too many dml statements'],
		cause: 'A transaction ran more DML statements than the governor limit, usually a DML call inside a loop.',
		fixSteps: [
			'Add records to a list inside the loop and run one DML statement afterwards.',
			'Check that triggers, flows and process automation on the same object are not each doing their own updates.',
		],
		internal: GOV,
		refs: [LIMITS_REF],
	},
	{
		id: 'too-many-query-rows',
		code: 'System.LimitException: Too many query rows',
		typicalMessage: 'System.LimitException: Too many query rows: 50001',
		category: 'limits',
		match: ['too many query rows'],
		cause: 'The queries in one transaction returned more rows in total than the governor limit allows.',
		fixSteps: [
			'Filter queries to return only the rows you need and add LIMIT.',
			'Process big sets in Batch Apex, which gets fresh limits per batch.',
		],
		internal: GOV,
		refs: [LIMITS_REF],
	},
	{
		id: 'apex-cpu-time-limit',
		code: 'System.LimitException: Apex CPU time limit exceeded',
		typicalMessage: 'System.LimitException: Apex CPU time limit exceeded',
		category: 'limits',
		match: ['apex cpu time limit exceeded', 'cpu time limit exceeded'],
		cause: 'Apex code, triggers, flows and other automation in the transaction used more CPU time than allowed. Nested loops, heavy string work and many automations on one record are common causes.',
		fixSteps: [
			'Use the debug log with limits and profiling to find the slow code.',
			'Replace nested loops over lists with Maps.',
			'Move long work to Queueable or Batch Apex.',
			'Check for many triggers, flows and process automation firing on the same object.',
		],
		internal: GOV,
		refs: [LIMITS_REF],
	},

	// ---------- deploy ----------
	{
		id: 'deploy-average-coverage',
		code: 'Code coverage failure: Average test coverage across all Apex Classes and Triggers is below the required percent',
		typicalMessage: 'Code coverage failure: Average test coverage across all Apex Classes and Triggers is 62%, at least 75% required',
		category: 'deploy',
		match: ['average test coverage across all apex classes and triggers', 'code coverage failure'],
		cause: 'A deployment to production that runs tests did not reach the required org-wide Apex test coverage of 75 percent.',
		fixSteps: [
			'Write tests for the classes with the lowest coverage; assert behavior, not only coverage.',
			'Run all local tests in a sandbox and check coverage per class before deploying.',
			'Check that failing tests are not lowering coverage.',
		],
	},
	{
		id: 'deploy-trigger-coverage',
		code: 'Test coverage of selected Apex Trigger is 0%',
		typicalMessage: 'Test coverage of selected Apex Trigger is 0%, at least 1% test coverage is required',
		category: 'deploy',
		match: ['test coverage of selected apex trigger'],
		cause: 'A trigger in the deployment has no test coverage. Triggers need some coverage to deploy to production.',
		fixSteps: [
			'Write a test that inserts, updates or deletes records so the trigger runs.',
			'Include that test class in the deployment and run it.',
			'Make sure the test creates its own data and performs the DML the trigger listens for (insert, update or delete).',
		],
		example: {
			lang: 'apex',
			code: "@isTest\nprivate class AccountTriggerTest {\n    @isTest static void insertsFireTrigger() {\n        insert new Account(Name = 'Test');\n    }\n}",
		},
	},
	{
		id: 'deploy-no-customobject-found',
		code: 'no CustomObject named X found',
		typicalMessage: 'In field: object - no CustomObject named Invoice__c found',
		category: 'deploy',
		match: ['no customobject named', 'no customfield named'],
		cause:
			'A component in the deployment (a layout, permission set, profile, flow or field) refers to an object that is neither in the target org nor part of this deployment. The same message pattern applies to other types, such as "no CustomField named ...".',
		fixSteps: [
			'Add the missing object or field to the package.xml or deploy source so it ships in the same deployment.',
			'Check the object API name spelling and the namespace prefix.',
			'If the component should not reference it, remove the reference from the metadata file.',
		],
	},
	{
		id: 'dependent-class-invalid',
		code: 'Dependent class is invalid and needs recompilation',
		typicalMessage: 'Dependent class is invalid and needs recompilation: Class MyClass : Variable does not exist: Region__c',
		category: 'deploy',
		match: ['dependent class is invalid and needs recompilation'],
		cause: 'An Apex class that the deployed code depends on no longer compiles, often because a field or class it uses was changed, removed or is missing in the target org.',
		fixSteps: [
			'Read the text after the second colon: it is the actual compile error in the dependent class.',
			'Deploy the missing or changed fields and classes together with the code.',
			'Recompile all classes in Setup after fixing the cause.',
		],
	},
];
