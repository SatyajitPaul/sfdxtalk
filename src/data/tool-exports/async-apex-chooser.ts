/** Markdown export and sitemap date for /tools/async-apex-chooser/. */
import { abs } from '../../lib/site';
import { TOOLS, toolUrl } from '../../lib/tools';
import { SCENARIOS, limit, eventTriggerBatch, scenarioTop } from '../../lib/tools/async-chooser';
import type { ToolExport } from '../../lib/tool-exports';

export const ASYNC_CHOOSER_META = {
	source: 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_async_overview.htm',
	sourceName: 'Apex Developer Guide: Asynchronous Apex',
	release: "Winter '27",
	apiVersion: '68.0',
	verified: '2026-11-17',
} as const;

/** Rows of the comparison table; limit values are read from the governor limits data. */
export function comparisonRows(): { name: string; takes: string; chain: string; monitor: string; limits: string; best: string }[] {
	return [
		{
			name: '@future method',
			takes: 'Primitives and collections of primitives',
			chain: 'No',
			monitor: 'No job ID (returns void)',
			limits: `${limit('future-calls')} calls per transaction`,
			best: 'Small, simple work, or a callout after DML, in existing code',
		},
		{
			name: 'Queueable Apex',
			takes: 'sObjects and custom types as member variables',
			chain: 'Yes, and finalizers can run follow-up logic',
			monitor: 'Job ID from System.enqueueJob',
			limits: `${limit('queueable-jobs')} enqueued in sync Apex, ${limit('queueable-jobs', 'async')} from an async job`,
			best: 'Most new background work, ordered steps, complex parameters',
		},
		{
			name: 'Batch Apex',
			takes: 'Whatever the class holds; processes records in chunks via start, execute, finish',
			chain: 'Start another job from finish',
			monitor: 'Job ID from Database.executeBatch',
			limits: `${limit('batch-concurrent')} queued or active, ${limit('flex-queue-holding')} in the flex queue`,
			best: 'Large data volumes processed in chunks',
		},
		{
			name: 'Schedulable Apex',
			takes: 'Runs a class on a cron schedule',
			chain: 'Usually starts a batch or Queueable job',
			monitor: 'Scheduled job ID from System.schedule',
			limits: `${limit('scheduled-classes')} classes scheduled at once`,
			best: 'Recurring work at set times',
		},
		{
			name: 'Platform event / CDC trigger',
			takes: 'Event messages delivered to an Apex trigger',
			chain: 'Not applicable; publish another event',
			monitor: 'Event bus and trigger logs',
			limits: `Trigger batches of up to ${eventTriggerBatch()} events; ${limit('eventbus-publish')} immediate publish calls per transaction`,
			best: 'Decoupled, event-driven reactions to data changes',
		},
	];
}

function markdown(): string {
	const tool = TOOLS.find((t) => t.slug === 'async-apex-chooser')!;
	return [
		`# ${tool.name}`,
		'',
		`> Compare @future, Queueable, Batch, Schedulable and platform event Apex. Salesforce recommends Queueable over @future for new work. Limits checked against the official docs on ${ASYNC_CHOOSER_META.verified}.`,
		'',
		`Source: [${ASYNC_CHOOSER_META.sourceName}](${ASYNC_CHOOSER_META.source})`,
		`Interactive chooser: ${abs(toolUrl(tool))}`,
		`Limits: ${abs('/tools/governor-limits/')}`,
		'',
		'## Comparison',
		'',
		'| Option | Accepts | Chaining | Monitoring | Key limits | Best for |',
		'| --- | --- | --- | --- | --- | --- |',
		...comparisonRows().map((r) => `| ${r.name} | ${r.takes} | ${r.chain} | ${r.monitor} | ${r.limits} | ${r.best} |`),
		'',
		'## Decision guide',
		'',
		...SCENARIOS.map((s) => {
			const t = scenarioTop(s);
			return `- ${s.label}: ${t[0].name}${t[1] ? `, then ${t[1].name}` : ''}.`;
		}),
		'',
		'The scoring is a heuristic, not a Salesforce rule. Hard rules: a future method cannot be called from a future or batch context and cannot chain.',
		'',
	].join('\n');
}

export default { slug: 'async-apex-chooser', markdown, lastmod: new Date(`${ASYNC_CHOOSER_META.verified}T00:00:00Z`) } satisfies ToolExport;
