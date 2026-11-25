/**
 * Apex governor limits, transcribed from the official Apex Developer Guide page
 * "Execution Governors and Limits". Re-verify against the page on every Salesforce
 * release and bump `LIMITS_META` (the page, sitemap lastmod and exports follow).
 *
 * Values are copied as written (including units and wording). Do not "fix" or
 * round them, and do not add a limit that is not on the official page.
 */

export const LIMITS_META = {
	source: 'https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-gov-limits.html',
	sourceName: 'Apex Developer Guide: Execution Governors and Limits',
	release: "Winter '27",
	apiVersion: '68.0',
	/** Date the page was last compared with the official source (ISO). */
	verified: '2026-11-17',
} as const;

export interface LimitRow {
	/** Anchor id, stable forever: /tools/governor-limits/#soql-queries */
	id: string;
	name: string;
	/** Synchronous Apex value, or the single value when sync and async are the same. */
	sync: string;
	/** Asynchronous value; omitted when it is the same as `sync`. */
	async?: string;
	/** Plain-language note that helps a developer apply the limit. */
	note?: string;
	/** Apex `Limits` method that returns this limit at runtime, when one exists. */
	method?: string;
}

export interface LimitSection {
	id: string;
	title: string;
	intro: string;
	/** Column headings; defaults to Synchronous / Asynchronous for per-transaction. */
	columns: 'sync-async' | 'single';
	rows: LimitRow[];
}

export const LIMIT_SECTIONS: LimitSection[] = [
	{
		id: 'per-transaction',
		title: 'Per-transaction Apex limits',
		intro:
			'These limits count for each Apex transaction. For Batch Apex they reset for each execute call. Where a row shows one value, it applies to both synchronous and asynchronous Apex. Scheduled Apex is asynchronous, but synchronous limits apply to it.',
		columns: 'sync-async',
		rows: [
			{
				id: 'soql-queries',
				name: 'Total number of SOQL queries issued',
				sync: '100',
				async: '200',
				note: 'Each parent-child relationship subquery counts as an extra query. Custom metadata type queries are not limited.',
				method: 'Limits.getLimitQueries()',
			},
			{
				id: 'soql-rows',
				name: 'Total number of records retrieved by SOQL queries',
				sync: '50,000',
				method: 'Limits.getLimitQueryRows()',
			},
			{
				id: 'query-locator-rows',
				name: 'Total number of records retrieved by Database.getQueryLocator',
				sync: '10,000',
				method: 'Limits.getLimitQueryLocatorRows()',
			},
			{ id: 'sosl-queries', name: 'Total number of SOSL queries issued', sync: '20', method: 'Limits.getLimitSoslQueries()' },
			{ id: 'sosl-rows', name: 'Total number of records retrieved by a single SOSL query', sync: '2,000' },
			{
				id: 'dml-statements',
				name: 'Total number of DML statements issued',
				sync: '150',
				note: 'Includes insert, update, upsert, delete, undelete, merge, Database methods, Approval.process, Database.convertLead and System.runAs.',
				method: 'Limits.getLimitDmlStatements()',
			},
			{
				id: 'dml-rows',
				name: 'Total number of records processed as a result of DML statements, Approval.process, or database.emptyRecycleBin',
				sync: '10,000',
				method: 'Limits.getLimitDmlRows()',
			},
			{
				id: 'trigger-stack-depth',
				name: 'Total stack depth for any Apex invocation that recursively fires triggers due to insert, update, or delete statements',
				sync: '16',
				note: 'Recursion that fires a trigger starts a new invocation, so the depth limit is tighter than for plain recursive calls.',
			},
			{
				id: 'callouts',
				name: 'Total number of callouts (HTTP requests or web services calls) in a transaction',
				sync: '100',
				method: 'Limits.getLimitCallouts()',
			},
			{
				id: 'callout-timeout-total',
				name: 'Maximum cumulative timeout for all callouts (HTTP requests or Web services calls) in a transaction',
				sync: '120 seconds',
			},
			{
				id: 'future-calls',
				name: 'Maximum number of methods with the future annotation allowed per Apex invocation',
				sync: '50',
				async: '0 in batch and future contexts; 50 in queueable context',
				method: 'Limits.getLimitFutureCalls()',
			},
			{
				id: 'queueable-jobs',
				name: 'Maximum number of Apex jobs added to the queue with System.enqueueJob',
				sync: '50',
				async: '1',
				method: 'Limits.getLimitQueueableJobs()',
			},
			{ id: 'send-email', name: 'Total number of sendEmail methods allowed', sync: '10', method: 'Limits.getLimitEmailInvocations()' },
			{
				id: 'heap-size',
				name: 'Total heap size',
				sync: '10 MB',
				async: '25 MB',
				note: 'Exceeding it throws an uncatchable System.LimitException. Email services heap size is 50 MB. CPU and heap are related: heavy heap use makes the CPU limit more likely.',
				method: 'Limits.getLimitHeapSize()',
			},
			{
				id: 'cpu-time',
				name: 'Maximum CPU time on the Salesforce servers',
				sync: '10,000 milliseconds',
				async: '60,000 milliseconds',
				note: 'Counts Apex, package code and workflows in the transaction, and application-server CPU spent in DML. Database time for DML, SOQL and SOSL, and waiting for callouts, do not count.',
				method: 'Limits.getLimitCpuTime()',
			},
			{ id: 'execution-time', name: 'Maximum execution time for each Apex transaction', sync: '10 minutes' },
			{
				id: 'push-calls',
				name: 'Maximum number of push notification method calls allowed per Apex transaction',
				sync: '10',
			},
			{
				id: 'push-per-call',
				name: 'Maximum number of push notifications that can be sent in each push notification method call',
				sync: '2,000',
			},
			{
				id: 'eventbus-publish',
				name: 'Maximum number of EventBus.publish calls for platform events configured to publish immediately',
				sync: '150',
			},
			{ id: 'cursor-rows', name: 'Maximum number of rows across all Apex cursors per transaction', sync: '50 million' },
			{ id: 'cursor-fetch', name: 'Maximum number of Cursor.fetch calls per transaction', sync: '100' },
			{
				id: 'pagination-cursor-rows',
				name: 'Maximum number of rows across all Apex pagination cursors per transaction',
				sync: '100,000',
			},
			{
				id: 'pagination-cursor-instances',
				name: 'Maximum number of Apex pagination cursor instances per transaction',
				sync: '50',
			},
			{
				id: 'pagination-cursor-page',
				name: 'Maximum number of rows retrieved per page from an Apex pagination cursor',
				sync: '2000',
			},
		],
	},
	{
		id: 'certified-packages',
		title: 'Certified managed package cumulative limits',
		intro:
			'Certified managed packages (AppExchange security-reviewed) get their own per-namespace limits. Across all namespaces in one transaction the cumulative limit is 11 times the per-namespace limit. Heap, CPU time, execution time and the number of unique namespaces are shared by the whole transaction.',
		columns: 'single',
		rows: [
			{ id: 'xns-soql-queries', name: 'Total number of SOQL queries issued', sync: '1,100' },
			{ id: 'xns-query-locator-rows', name: 'Total number of records retrieved by Database.getQueryLocator', sync: '110,000' },
			{ id: 'xns-sosl-queries', name: 'Total number of SOSL queries issued', sync: '220' },
			{ id: 'xns-dml-statements', name: 'Total number of DML statements issued', sync: '1,650' },
			{ id: 'xns-callouts', name: 'Total number of callouts (HTTP requests or web services calls) in a transaction', sync: '1,100' },
			{ id: 'xns-send-email', name: 'Total number of sendEmail methods allowed', sync: '110' },
		],
	},
	{
		id: 'platform',
		title: 'Salesforce Platform Apex limits',
		intro: 'These limits are enforced by the platform, not per Apex transaction.',
		columns: 'single',
		rows: [
			{
				id: 'daily-async-executions',
				name: 'Asynchronous Apex method executions per 24-hour period (batch, future, Queueable and scheduled Apex)',
				sync: '250,000 or the number of applicable user licenses in your org multiplied by 200, whichever is greater',
				note: 'This is the DailyAsyncApexExecutions org limit. For Batch Apex, start, execute and finish each count. Check remaining capacity with the REST API limits resource or OrgLimits.getMap().',
			},
			{
				id: 'daily-async-elastic',
				name: 'Batch, Queueable and future method executions that can be enqueued in 24 hours, including elastic executions processed at a throttled rate (beta)',
				sync: "The org's daily asynchronous Apex method executions limit plus either the org's licensed daily asynchronous Apex method executions limit or 2 million executions, whichever is less",
				note: 'This is the DailyAsyncApexElasticExecutions org limit.',
			},
			{ id: 'cursor-instances-daily', name: 'Maximum number of Apex cursor instances per 24-hour period', sync: '10,000' },
			{
				id: 'cursor-rows-daily',
				name: 'Maximum cumulative number of new cursor rows and pagination cursor rows per 24-hour period',
				sync: '100 million',
			},
			{
				id: 'pagination-cursor-instances-daily',
				name: 'Maximum number of Apex pagination cursor instances per 24-hour period',
				sync: '200,000',
			},
			{
				id: 'long-running-concurrent',
				name: 'Synchronous concurrent transactions for long-running transactions that last longer than 5 seconds for each org',
				sync: 'Based on the number of applicable licenses; a ratio of 100 licenses to one concurrent long-running Apex transaction. Minimum limit is 10. Maximum limit is 50',
				note: 'HTTP callout processing time is not included when calculating this limit.',
			},
			{
				id: 'scheduled-classes',
				name: 'Maximum number of Apex classes scheduled concurrently',
				sync: '100. In Developer Edition orgs, the limit is 5',
			},
			{ id: 'flex-queue-holding', name: 'Maximum number of batch Apex jobs in the Apex flex queue that are in Holding status', sync: '100' },
			{ id: 'batch-concurrent', name: 'Maximum number of batch Apex jobs queued or active concurrently', sync: '5' },
			{ id: 'batch-start-concurrent', name: 'Maximum number of batch Apex job start method concurrent executions', sync: '1' },
			{ id: 'batch-in-test', name: 'Maximum number of batch jobs that can be submitted in a running test', sync: '5' },
			{
				id: 'test-queue-production',
				name: 'Maximum number of test classes that can be queued per 24-hour period (production orgs other than Developer Edition)',
				sync: 'The greater of 500 or 10 multiplied by the number of test classes in the org',
			},
			{
				id: 'test-queue-sandbox',
				name: 'Maximum number of test classes that can be queued per 24-hour period (sandbox and Developer Edition orgs)',
				sync: 'The greater of 500 or 20 multiplied by the number of test classes in the org',
			},
		],
	},
	{
		id: 'static',
		title: 'Static Apex limits',
		intro: 'Fixed values that do not vary by transaction type.',
		columns: 'single',
		rows: [
			{ id: 'callout-default-timeout', name: 'Default timeout of callouts (HTTP requests or Web services calls) in a transaction', sync: '10 seconds' },
			{
				id: 'callout-size',
				name: 'Maximum size of callout request or response (HTTP request or Web services call)',
				sync: '6 MB for synchronous Apex or 12 MB for asynchronous Apex',
				note: 'Request and response sizes count towards the total heap size.',
			},
			{ id: 'soql-run-time', name: 'Maximum SOQL query run time before Salesforce cancels the transaction', sync: '120 seconds' },
			{ id: 'deploy-code-units', name: 'Maximum number of class and trigger code units in a deployment of Apex', sync: '7500' },
			{
				id: 'trigger-batch-size',
				name: 'Apex trigger batch size',
				sync: '200',
				note: 'The trigger batch size for platform events and Change Data Capture events is 2,000.',
			},
			{ id: 'for-loop-batch', name: 'For loop list batch size', sync: '200' },
			{ id: 'querylocator-rows', name: 'Maximum number of records returned for a Batch Apex query in Database.QueryLocator', sync: '50 million' },
		],
	},
	{
		id: 'size',
		title: 'Size-specific Apex limits',
		intro: 'Limits on the size of Apex code.',
		columns: 'single',
		rows: [
			{ id: 'class-characters', name: 'Maximum number of characters for a class', sync: '1 million' },
			{ id: 'trigger-characters', name: 'Maximum number of characters for a trigger', sync: '1 million' },
			{
				id: 'org-code-size',
				name: 'Maximum amount of code used by all Apex code in an org',
				sync: '6 MB',
				note: 'Does not apply to managed packages (1GP or 2GP) or to code in classes with @isTest. Scratch orgs allow 10 MB. You can ask Salesforce Support to raise it.',
			},
			{
				id: 'method-size',
				name: 'Method size limit',
				sync: '65,535 bytecode instructions in compiled form',
				note: 'Larger methods throw an exception when run.',
			},
		],
	},
];

/** Common LimitException messages and the limit each one means. */
export interface ErrorHint {
	message: string;
	limit: string;
	rowId: string;
	fix: string;
}

export const ERROR_HINTS: ErrorHint[] = [
	{
		message: 'Too many SOQL queries: 101',
		limit: '100 SOQL queries per synchronous transaction (200 asynchronous)',
		rowId: 'soql-queries',
		fix: 'Move queries out of loops. Query once for the whole set of records into a Map, and check for the same query being run in triggers, flows and helper classes in the same transaction.',
	},
	{
		message: 'Too many query rows: 50001',
		limit: '50,000 records retrieved by SOQL queries per transaction',
		rowId: 'soql-rows',
		fix: 'Add selective filters, query only what you need, aggregate in SOQL, or move the work to Batch Apex.',
	},
	{
		message: 'Too many DML statements: 151',
		limit: '150 DML statements per transaction',
		rowId: 'dml-statements',
		fix: 'Collect records in a List and run one DML statement outside the loop.',
	},
	{
		message: 'Too many DML rows: 10001',
		limit: '10,000 records processed by DML per transaction',
		rowId: 'dml-rows',
		fix: 'Process the records in chunks with Batch Apex or Queueable Apex.',
	},
	{
		message: 'Apex CPU time limit exceeded',
		limit: '10,000 ms CPU time synchronous (60,000 ms asynchronous)',
		rowId: 'cpu-time',
		fix: 'Look for nested loops, repeated work and heavy string or collection handling. Use Maps for lookups, and move long work to async Apex. Use a debug log to find the slow method.',
	},
	{
		message: 'Apex heap size too large',
		limit: '10 MB heap synchronous (25 MB asynchronous)',
		rowId: 'heap-size',
		fix: 'Query fewer fields and rows, avoid holding large lists or strings, and process data in batches.',
	},
	{
		message: 'Too many callouts: 101',
		limit: '100 callouts per transaction',
		rowId: 'callouts',
		fix: 'Reduce the number of calls, batch requests where the API allows it, or split the work across async jobs.',
	},
	{
		message: 'Too many future calls: 51',
		limit: '50 future method calls per Apex invocation',
		rowId: 'future-calls',
		fix: 'Combine work into one future call, or use Queueable Apex.',
	},
	{
		message: 'Too many Queueable jobs added to the queue: 51',
		limit: '50 System.enqueueJob calls per synchronous transaction (1 asynchronous)',
		rowId: 'queueable-jobs',
		fix: 'Enqueue one job that processes many records, and chain the next job from inside it.',
	},
	{
		message: 'Too many SOSL queries: 21',
		limit: '20 SOSL queries per transaction',
		rowId: 'sosl-queries',
		fix: 'Combine searches into one SOSL query across several objects.',
	},
	{
		message: 'Too many Email Invocations: 11',
		limit: '10 sendEmail calls per transaction',
		rowId: 'send-email',
		fix: 'Build a list of messages and send them with one Messaging.sendEmail call.',
	},
	{
		message: 'Maximum trigger depth exceeded',
		limit: 'Trigger stack depth of 16',
		rowId: 'trigger-stack-depth',
		fix: 'Find the update that re-fires the trigger. Act only on changed fields, and use a static Set of processed record IDs as a guard if needed.',
	},
];
