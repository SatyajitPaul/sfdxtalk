/**
 * Curated rules for AI coding assistants working on Salesforce projects.
 * Our own conservative engineering guidance, not copied from any vendor.
 * Rule text may use the placeholder {apiVersion}.
 *
 * Output formats (CLAUDE.md, AGENTS.md, Cursor .mdc, Copilot instructions)
 * were checked against the vendors' docs; see AI_RULES_META.
 */

export interface AiRule {
	/** Short imperative sentence. */
	text: string;
	/** Optional one-line reason. */
	why?: string;
	/** Site-relative link to a matching SFDX Talk article or tool. */
	href?: string;
	/** Link label. */
	label?: string;
}

export interface AiTopic {
	id: string;
	title: string;
	summary: string;
	rules: AiRule[];
}

export const AI_RULES_META = {
	source: 'https://code.claude.com/docs/en/memory',
	sourceName: 'Claude Code documentation: How Claude remembers your project (CLAUDE.md)',
	release: "Winter '27",
	apiVersion: '68.0',
	verified: '2026-11-17',
	otherSources: [
		{ name: 'Cursor docs: Rules', url: 'https://cursor.com/docs/context/rules' },
		{ name: 'GitHub Docs: Adding repository custom instructions for GitHub Copilot', url: 'https://docs.github.com/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot' },
		{ name: 'AGENTS.md', url: 'https://agents.md/' },
	],
} as const;

export const AI_TOPICS: AiTopic[] = [
	{
		id: 'apex',
		title: 'Apex',
		summary: 'Bulk-safe, readable Apex that respects governor limits.',
		rules: [
			{ text: 'Write every method to handle a list of records (bulkify), never a single record.', why: 'Triggers, Flows and batches deliver up to 200 records at a time.' },
			{ text: 'Never run SOQL or DML inside a loop. Query once into a Map, then loop over the Map.', why: 'Each query and DML statement counts against per-transaction limits.', href: '/tools/governor-limits/', label: 'Governor limits' },
			{ text: 'Never hard-code record IDs, profile names or org-specific URLs. Query them, or use Custom Metadata, Custom Labels or Named Credentials.' },
			{ text: 'Do not try to catch LimitException to recover. It cannot be caught, so check the Limits class before expensive work instead.' },
			{ text: 'Use bind variables in SOQL. If a query must be dynamic, bind values or escape them with String.escapeSingleQuotes().', why: 'Prevents SOQL injection.' },
			{ text: 'Choose async Apex deliberately: Queueable for most new work, Batch Apex for large volumes, Schedulable for timed jobs. Avoid new @future methods.', href: '/tools/async-apex-chooser/', label: 'Async Apex chooser' },
			{ text: 'Keep methods small and name them for what they do. Put reusable logic in service classes, not in triggers or controllers.' },
		],
	},
	{
		id: 'triggers',
		title: 'Triggers',
		summary: 'One thin trigger per object that delegates to a handler class.',
		rules: [
			{ text: 'Create one trigger per object and keep it logic-free: it only calls a handler class.', why: 'Order of multiple triggers on one object is not guaranteed.', href: '/docs/apex/trigger-handler-pattern/', label: 'Trigger handler pattern' },
			{ text: 'Branch on Trigger.operationType in the handler. Use before triggers to change the records being saved, and after triggers for work that needs the record ID.' },
			{ text: 'Guard against recursion and compare Trigger.oldMap with Trigger.new so logic runs only when a relevant field actually changed.' },
			{ text: 'Do not make synchronous callouts from a trigger. Enqueue a Queueable that implements Database.AllowsCallouts instead.' },
		],
	},
	{
		id: 'soql',
		title: 'SOQL',
		summary: 'Selective, minimal and safe queries.',
		rules: [
			{ text: 'Select only the fields you need and filter in the WHERE clause. Never query all records of an object without a filter or LIMIT.', href: '/tools/soql-formatter/', label: 'SOQL formatter' },
			{ text: 'Prefer indexed fields (Id, Name, lookup and master-detail fields, external IDs) in WHERE clauses on large objects.', why: 'Non-selective queries on large objects fail or run slowly.' },
			{ text: 'Use relationship queries and aggregate queries instead of several separate queries when one will do.' },
			{ text: 'Use WITH USER_MODE in queries that run on behalf of the user. See the Security topic.' },
		],
	},
	{
		id: 'security',
		title: 'Security and sharing',
		summary: 'Sharing, CRUD and field-level security by default.',
		rules: [
			{ text: 'Declare classes with `with sharing` by default. Use `without sharing` or `inherited sharing` only deliberately, with a comment explaining why.' },
			{ text: 'Enforce object and field permissions: use `WITH USER_MODE` in SOQL and `as user` or AccessLevel.USER_MODE for DML, or Security.stripInaccessible() on records you read or write.', why: 'Apex runs in system mode by default and ignores the user\'s CRUD and FLS.' },
			{ text: 'Never build SOQL, SOSL or JavaScript from raw user input. Use bind variables and escape output.' },
			{ text: 'Never put secrets, tokens or passwords in code, metadata or logs. Use Named Credentials or protected Custom Metadata.' },
			{ text: 'Do not use Schema describe calls to hide fields as a substitute for real permission checks. Rely on permission sets and the enforcement mechanisms above.' },
		],
	},
	{
		id: 'testing',
		title: 'Testing',
		summary: 'Tests that assert behavior, not tests that only add coverage.',
		rules: [
			{ text: 'Every test must assert expected behavior with System.Assert methods. Never write tests whose only purpose is code coverage.' },
			{ text: 'Create test data in the test or in a test data factory. Do not rely on existing org data, and do not use SeeAllData=true.' },
			{ text: 'Use @TestSetup for data shared by the methods of a test class.' },
			{ text: 'Test in bulk (200 records), test a negative path, and test as a user with limited permissions using System.runAs().' },
			{ text: 'Wrap the code under test in Test.startTest() and Test.stopTest(), and call Test.stopTest() before asserting on async results.' },
			{ text: 'Mock callouts with Test.setMock() and HttpCalloutMock. Real callouts are not allowed in tests.' },
		],
	},
	{
		id: 'lwc',
		title: 'Lightning Web Components',
		summary: 'Modern LWC patterns and safe Apex calls from components.',
		rules: [
			{ text: 'Build new UI as Lightning Web Components, not Aura, unless extending existing Aura code.' },
			{ text: 'Mark an Apex method `@AuraEnabled(cacheable=true)` only if it is read-only, because @wire requires it and cached results can be stale. Use imperative calls for anything that changes data.', href: '/docs/lwc/call-apex-from-lwc/', label: 'Call Apex from LWC' },
			{ text: 'Prefer Lightning Data Service wire adapters and base components (such as lightning-record-form) over custom Apex for simple record reads and edits.' },
			{ text: 'Handle errors from Apex and wire results, and show them to the user. Call refreshApex() after changing data that a wire depends on.' },
			{ text: 'Never set innerHTML or use lwc:dom="manual" with unsanitized data. Do not rely on global DOM queries such as document.querySelector; use this.template.querySelector.' },
			{ text: 'Write Jest tests for components with the @salesforce/sfdx-lwc-jest tooling.' },
		],
	},
	{
		id: 'flow',
		title: 'Flow and automation',
		summary: 'Declarative automation that coexists with Apex.',
		rules: [
			{ text: 'Prefer Flow for simple automation and Apex for complex logic. Do not duplicate the same logic in both a Flow and a trigger on one object.' },
			{ text: 'Use before-save record-triggered flows for same-record field updates, and set precise entry conditions so the flow does not run on every save.' },
			{ text: 'Never put Get Records, Create, Update or Delete elements inside a loop in a Flow. Collect records in a collection variable and run one element after the loop.' },
			{ text: 'Add fault paths to elements that can fail, and give a clear error message or log the failure.' },
			{ text: 'Do not use Process Builder or Workflow Rules for new automation. Salesforce is retiring them in favor of Flow.' },
		],
	},
	{
		id: 'integration',
		title: 'Integration and callouts',
		summary: 'Authenticated, mockable, async-friendly callouts.',
		rules: [
			{ text: 'Use Named Credentials (callout:Name) for endpoints and authentication. Never hard-code URLs, keys or tokens.', href: '/docs/integration/named-credentials-callouts/', label: 'Named Credentials and callouts' },
			{ text: 'Do not make a callout after uncommitted DML in the same transaction. Do the callout first, or move it to a Queueable.' },
			{ text: 'Check the HTTP status code, handle non-2xx responses and timeouts, and set an explicit timeout on the request.' },
			{ text: 'Keep callout code in a dedicated service class that tests can mock with HttpCalloutMock.' },
			{ text: 'For event-driven integration, consider Platform Events or Change Data Capture instead of polling.' },
		],
	},
	{
		id: 'cli',
		title: 'Salesforce CLI and deployment',
		summary: 'Modern sf commands, source-driven development.',
		rules: [
			{ text: 'Use the `sf` CLI (for example `sf project deploy start`). Do not use the legacy `sfdx` commands or the old force:source commands.', href: '/docs/sf-cli/salesforce-cli-reference-guide/', label: 'Salesforce CLI reference' },
			{ text: 'Keep metadata in source format in the repository and treat the repository as the source of truth, not the org.' },
			{ text: 'Run local tests before deploying: `sf apex run test --test-level RunLocalTests --wait 10 --result-format human --code-coverage`.' },
			{ text: 'Validate production deployments first with `sf project deploy start --dry-run`. Production deployments need Apex test coverage of at least 75%.' },
			{ text: 'Never run commands that deploy to, delete from or modify a production org without explicit confirmation from the user.' },
			{ text: 'Scan code before review with Salesforce Code Analyzer and fix reported issues.', href: '/docs/devops/salesforce-code-analyzer/', label: 'Salesforce Code Analyzer' },
		],
	},
	{
		id: 'ai-mistakes',
		title: 'Known AI mistakes',
		summary: 'Things coding assistants commonly get wrong on Salesforce.',
		rules: [
			{ text: 'Do not invent Apex methods, classes, SObject fields, metadata types or CLI flags. If you are not certain something exists in API version {apiVersion}, say so and ask, rather than guessing.' },
			{ text: 'Do not use deprecated or retired features (Workflow Rules, Process Builder, legacy sfdx commands) in new code.' },
			{ text: 'Do not state governor limits from memory. Say the limit may differ and check the current documentation.', href: '/tools/governor-limits/', label: 'Governor limits' },
			{ text: 'Do not assume Apex works like Java or JavaScript. Check that a language feature or library idiom exists in Apex before using it.' },
			{ text: 'Do not claim code works unless it was compiled or tested. State what was not verified.' },
		],
	},
];
