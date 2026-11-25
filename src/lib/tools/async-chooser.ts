/**
 * Async Apex chooser: pure scoring logic (no DOM). The score is a transparent
 * heuristic, not a Salesforce rule: each answer adds or removes points for an
 * option, and a few hard rules exclude an option outright. Limit numbers shown
 * in advice are read from src/data/governor-limits.ts so they cannot drift.
 */
import { LIMIT_SECTIONS } from '../../data/governor-limits.ts';

export type OptionId = 'future' | 'queueable' | 'batch' | 'schedulable' | 'events';
export type Volume = 'few' | 'thousands' | 'millions';
export type Context = 'sync' | 'future' | 'batch' | 'queueable';

export interface Answers {
	volume: Volume;
	/** Needs to pass sObjects, collections of them, or custom Apex types. */
	complexTypes: boolean;
	/** Needs steps to run one after another. */
	chain: boolean;
	/** Needs to run on a recurring schedule. */
	schedule: boolean;
	/** Needs a callout after DML. */
	callout: boolean;
	/** Should react to a data change in a decoupled, event-driven way. */
	decoupled: boolean;
	/** Needs a job ID and status to monitor. */
	monitoring: boolean;
	/** Where the new async work is started from. */
	context: Context;
}

export const DEFAULT_ANSWERS: Answers = {
	volume: 'few',
	complexTypes: false,
	chain: false,
	schedule: false,
	callout: false,
	decoupled: false,
	monitoring: false,
	context: 'sync',
};

export interface Ranked {
	id: OptionId;
	name: string;
	score: number;
	excluded: boolean;
	why: string[];
	watch: string[];
}

export const OPTION_NAMES: Record<OptionId, string> = {
	future: '@future method',
	queueable: 'Queueable Apex',
	batch: 'Batch Apex',
	schedulable: 'Schedulable Apex',
	events: 'Platform events / Change Data Capture trigger',
};

const ORDER: OptionId[] = ['queueable', 'batch', 'future', 'schedulable', 'events'];

/** Value of a governor-limits row (sync column, or async when asked). */
export function limit(id: string, column: 'sync' | 'async' = 'sync'): string {
	for (const s of LIMIT_SECTIONS) {
		const row = s.rows.find((r) => r.id === id);
		if (row) return column === 'async' ? (row.async ?? row.sync) : row.sync;
	}
	throw new Error(`Unknown limit row: ${id}`);
}

/** Trigger batch size for platform events and CDC, read from the note on the trigger-batch-size row. */
export function eventTriggerBatch(): string {
	for (const sec of LIMIT_SECTIONS) {
		const row = sec.rows.find((r) => r.id === 'trigger-batch-size');
		const m = row?.note?.match(/is ([\d,]+)\./);
		if (m) return m[1];
	}
	throw new Error('trigger-batch-size note not found');
}

export function rank(a: Answers): Ranked[] {
	const out = {} as Record<OptionId, Ranked>;
	const mk = (id: OptionId, score: number): Ranked => (out[id] = { id, name: OPTION_NAMES[id], score, excluded: false, why: [], watch: [] });
	const exclude = (r: Ranked, reason: string) => {
		r.excluded = true;
		r.why = [reason];
	};

	// Future
	const f = mk('future', 2);
	if (a.context === 'future' || a.context === 'batch') {
		exclude(f, `A future method cannot be called from a future or batch context (the limit is ${limit('future-calls', 'async').split(';')[0]}).`);
	} else if (a.chain) {
		exclude(f, 'Future methods cannot be chained, so they cannot run steps in order.');
	} else {
		if (a.volume === 'few') { f.score += 2; f.why.push('Small amount of work, which is what a simple fire-and-forget method suits.'); }
		if (a.volume === 'thousands') f.score -= 1;
		if (a.volume === 'millions') f.score -= 3;
		if (a.callout) { f.score += 1; f.why.push('@future(callout=true) lets the work make a callout outside the original transaction.'); }
		if (a.complexTypes) { f.score -= 3; f.watch.push('Future methods take only primitives and collections of primitives, so pass record IDs and query inside the method.'); }
		if (a.monitoring) { f.score -= 3; f.watch.push('A future call returns void, so there is no job ID to track.'); }
		f.watch.push(`Up to ${limit('future-calls')} future calls per transaction. Salesforce recommends Queueable Apex for new work.`);
		f.watch.push('Execution order is not guaranteed.');
	}

	// Queueable
	const q = mk('queueable', 4);
	q.why.push('Runs asynchronously, accepts sObjects and custom types as member variables, and returns a job ID.');
	if (a.complexTypes) { q.score += 3; q.why.push('You need to pass sObjects or custom types, which Queueable supports.'); }
	if (a.chain) { q.score += 3; q.why.push('A Queueable job can start another job, which gives you ordered steps. Finalizers can run follow-up logic after a job.'); }
	if (a.monitoring) { q.score += 2; q.why.push('System.enqueueJob returns a job ID you can look up in AsyncApexJob.'); }
	if (a.callout) { q.score += 1; q.why.push('Implement Database.AllowsCallouts to make callouts.'); }
	if (a.volume === 'thousands') q.score += 1;
	if (a.volume === 'millions') { q.score -= 3; q.watch.push('Millions of records do not fit one job well. Batch Apex processes large sets in chunks.'); }
	q.watch.push(`Per transaction you can enqueue ${limit('queueable-jobs')} jobs in synchronous Apex but only ${limit('queueable-jobs', 'async')} from an asynchronous job.`);
	if (a.context === 'queueable' || a.context === 'future' || a.context === 'batch') q.watch.push('From asynchronous Apex you can enqueue only one job per execution.');
	if (a.chain) q.watch.push('Plan for a failed link in a chain: later steps do not run unless something starts them.');

	// Batch
	const b = mk('batch', 1);
	if (a.volume === 'millions') { b.score += 6; b.why.push('Batch Apex is built to process large data sets in chunks through start, execute and finish.'); }
	if (a.volume === 'thousands') { b.score += 3; b.why.push('Thousands of records are a fit for chunked processing, with limits reset for each execute call.'); }
	if (a.volume === 'few') { b.score -= 3; b.watch.push('For a handful of records a batch job is more machinery than needed.'); }
	if (a.monitoring) { b.score += 2; b.why.push('Database.executeBatch returns a job ID and progress shows in Apex Jobs.'); }
	if (a.chain) b.score += 1;
	if (a.callout) b.watch.push('Implement Database.AllowsCallouts on the batch class to make callouts.');
	b.watch.push(`At most ${limit('batch-concurrent')} batch jobs can be queued or active at once; more wait in the flex queue (up to ${limit('flex-queue-holding')} in Holding status).`);
	b.watch.push('Batches may not run in order, and the default scope is 200 records.');
	if (a.context === 'sync') b.watch.push('Starting a batch from a trigger can pile up jobs. Guard against firing it for every save.');

	// Schedulable
	const s = mk('schedulable', 0);
	if (!a.schedule) {
		exclude(s, 'Only relevant when the work must run on a schedule.');
	} else {
		s.score += 10;
		s.why.push('Schedulable Apex runs a class on a cron schedule you set with System.schedule.');
		s.watch.push(`Up to ${limit('scheduled-classes')} Apex classes can be scheduled at once.`);
		s.watch.push('Keep the schedulable class thin: have execute start a batch or Queueable job for real work.');
	}

	// Events
	const e = mk('events', 0);
	if (!a.decoupled) {
		exclude(e, 'Only relevant when you want decoupled, event-driven processing.');
	} else {
		e.score += 8;
		e.why.push('Publishers and subscribers are decoupled: an Apex trigger on the event runs asynchronously from the publisher.');
		e.watch.push(`Platform event and Change Data Capture triggers receive batches of up to ${eventTriggerBatch()} events, compared with ${limit('trigger-batch-size')} for record triggers.`);
		e.watch.push(`A transaction can make ${limit('eventbus-publish')} EventBus.publish calls for platform events that publish immediately.`);
		e.watch.push('Design subscribers to tolerate retries and duplicates.');
	}

	const list = ORDER.map((id) => out[id]);
	return list
		.map((r, i) => ({ r, i }))
		.sort((x, y) => Number(x.r.excluded) - Number(y.r.excluded) || y.r.score - x.r.score || x.i - y.i)
		.map((x) => x.r);
}

// ---- URL hash (shareable result) ----
const VOLUMES: Volume[] = ['few', 'thousands', 'millions'];
const CONTEXTS: Context[] = ['sync', 'future', 'batch', 'queueable'];
const FLAGS: [keyof Answers, string][] = [
	['complexTypes', 'ty'],
	['chain', 'ch'],
	['schedule', 'sc'],
	['callout', 'co'],
	['decoupled', 'ev'],
	['monitoring', 'mo'],
];

export function encodeAnswers(a: Answers): string {
	const p = new URLSearchParams();
	p.set('v', a.volume);
	p.set('x', a.context);
	for (const [k, key] of FLAGS) if (a[k]) p.set(key, '1');
	return p.toString();
}

export function decodeAnswers(hash: string): Answers {
	const p = new URLSearchParams(hash.replace(/^#/, ''));
	const v = p.get('v') as Volume;
	const x = p.get('x') as Context;
	const a: Answers = { ...DEFAULT_ANSWERS };
	if (VOLUMES.includes(v)) a.volume = v;
	if (CONTEXTS.includes(x)) a.context = x;
	for (const [k, key] of FLAGS) (a as unknown as Record<string, unknown>)[k] = p.get(key) === '1';
	return a;
}

/** Worked scenarios used by the page and export (generated by rank()). */
export const SCENARIOS: { label: string; answers: Partial<Answers> }[] = [
	{ label: 'Send one record to an external system after an update', answers: { callout: true } },
	{ label: 'Pass a list of sObjects to a follow-up step', answers: { complexTypes: true, monitoring: true } },
	{ label: 'Clean up two million records', answers: { volume: 'millions', monitoring: true } },
	{ label: 'Nightly sync of a few thousand records', answers: { volume: 'thousands', schedule: true, callout: true } },
	{ label: 'Let other systems react to a change', answers: { decoupled: true } },
];

export const scenarioTop = (s: { answers: Partial<Answers> }) => rank({ ...DEFAULT_ANSWERS, ...s.answers }).filter((r) => !r.excluded).slice(0, 2);
