/**
 * Pure logic for the AI Context File Generator. Assembles project instruction
 * files for AI coding assistants from curated rules. No DOM, deterministic.
 */
import { AI_TOPICS, type AiRule, type AiTopic } from '../../data/ai-rules.ts';

export type TargetId = 'claude' | 'agents' | 'cursor' | 'copilot';

export interface Target {
	id: TargetId;
	label: string;
	/** Path of the file in the repository. */
	path: string;
	/** Name used for the downloaded file. */
	downloadName: string;
	/** Where the assistant reads it. */
	note: string;
}

export const TARGETS: Target[] = [
	{ id: 'claude', label: 'CLAUDE.md', path: 'CLAUDE.md', downloadName: 'CLAUDE.md', note: 'Claude Code reads it from the project root (or .claude/CLAUDE.md).' },
	{ id: 'agents', label: 'AGENTS.md', path: 'AGENTS.md', downloadName: 'AGENTS.md', note: 'Open format read by many coding agents, including Cursor and Claude Code when no CLAUDE.md exists.' },
	{ id: 'cursor', label: 'Cursor rule', path: '.cursor/rules/salesforce.mdc', downloadName: 'salesforce.mdc', note: 'Cursor project rules live in .cursor/rules and use .mdc with frontmatter.' },
	{ id: 'copilot', label: 'Copilot instructions', path: '.github/copilot-instructions.md', downloadName: 'copilot-instructions.md', note: 'GitHub Copilot reads this repository-wide file from the .github folder.' },
];

export interface Facts {
	projectName?: string;
	apiVersion?: string;
	sourceDir?: string;
	namespace?: string;
	coverageTarget?: string | number;
	orgTypes?: string;
	ciNotes?: string;
	extra?: string;
}

export interface Options {
	target: TargetId;
	/** Topic ids to include. Unknown ids are ignored. */
	topics: string[];
	facts?: Facts;
	/** Include the one-line reason after each rule. Default true. */
	reasons?: boolean;
}

export const DEFAULT_API_VERSION = '68.0';
export const DEFAULT_SOURCE_DIR = 'force-app';

/** Collapse to one line, drop control characters, trim, cap length. */
export function cleanLine(value: unknown, max = 200): string {
	const s = String(value ?? '')
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u001f\u007f]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return s.slice(0, max).trim();
}

export function cleanApiVersion(v: unknown): string {
	const s = cleanLine(v, 10);
	return /^\d{2}\.0$/.test(s) ? s : DEFAULT_API_VERSION;
}

export function cleanSourceDir(v: unknown): string {
	const s = cleanLine(v, 100).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
	return /^[A-Za-z0-9_.\-/]+$/.test(s) && !s.split('/').includes('..') && s ? s : DEFAULT_SOURCE_DIR;
}

export function cleanNamespace(v: unknown): string {
	const s = cleanLine(v, 15);
	return /^[A-Za-z][A-Za-z0-9_]*$/.test(s) ? s : '';
}

/** Integer 75..100 or undefined. */
export function cleanCoverage(v: unknown): number | undefined {
	const n = Number(String(v ?? '').replace('%', '').trim());
	return Number.isInteger(n) && n >= 75 && n <= 100 ? n : undefined;
}

/** Heading text: no leading # or markdown line-start characters. */
function cleanTitle(v: unknown): string {
	return cleanLine(v, 80).replace(/^[#>\-*\s]+/, '').trim();
}

const fillRule = (r: AiRule, apiVersion: string, reasons: boolean) =>
	`- ${r.text.replaceAll('{apiVersion}', apiVersion)}${reasons && r.why ? ` ${r.why}` : ''}`;

/** Cursor glob list (comma separated, as Cursor documents) for Salesforce source. */
export function cursorGlobs(sourceDir: string): string {
	return [`${sourceDir}/**/*.cls`, `${sourceDir}/**/*.trigger`, `${sourceDir}/**/lwc/**`, `${sourceDir}/**/aura/**`, `${sourceDir}/**/*-meta.xml`, 'sfdx-project.json'].join(', ');
}

export function getTarget(id: TargetId): Target {
	return TARGETS.find((t) => t.id === id) ?? TARGETS[0];
}

export function generate(options: Options, topics: AiTopic[] = AI_TOPICS): string {
	const f = options.facts ?? {};
	const reasons = options.reasons !== false;
	const apiVersion = cleanApiVersion(f.apiVersion);
	const sourceDir = cleanSourceDir(f.sourceDir);
	const ns = cleanNamespace(f.namespace);
	const coverage = cleanCoverage(f.coverageTarget);
	const name = cleanTitle(f.projectName);
	const orgTypes = cleanLine(f.orgTypes);
	const ci = cleanLine(f.ciNotes, 300);
	const extra = cleanLine(f.extra, 300);
	const selected = new Set(options.topics);

	const out: string[] = [];

	if (options.target === 'cursor') {
		out.push(
			'---',
			'description: "Salesforce development rules: Apex, SOQL, LWC, security, testing and deployment"',
			`globs: ${cursorGlobs(sourceDir)}`,
			'alwaysApply: false',
			'---',
			'',
		);
	}

	out.push(`# ${name ? `${name}: ` : ''}Salesforce development instructions`, '');
	out.push('Follow these rules when writing or changing code in this Salesforce DX project. Ask when a rule conflicts with the task.', '');

	out.push('## Project facts', '');
	out.push(`- Salesforce API version: ${apiVersion}. Keep \`sourceApiVersion\` in sfdx-project.json and new metadata at this version.`);
	out.push(`- Source directory: \`${sourceDir}\``);
	if (ns) out.push(`- Namespace: \`${ns}\`. Include it when referencing packaged components from outside the namespace.`);
	if (orgTypes) out.push(`- Orgs: ${orgTypes}`);
	if (coverage) out.push(`- Apex test coverage target: at least ${coverage}% per class, with meaningful assertions.`);
	if (ci) out.push(`- CI and deployment: ${ci}`);
	out.push('');

	for (const t of topics) {
		if (!selected.has(t.id) || t.rules.length === 0) continue;
		out.push(`## ${t.title}`, '');
		for (const r of t.rules) out.push(fillRule(r, apiVersion, reasons));
		out.push('');
	}

	if (extra) out.push('## Additional notes', '', `- ${extra}`, '');

	return out.join('\n').replace(/\n+$/, '\n');
}

/** Topics from the curated list that exist, for UI defaults. */
export const ALL_TOPIC_IDS = AI_TOPICS.map((t) => t.id);

/** Parse saved settings defensively; returns only known ids. */
export function sanitizeTopicIds(ids: unknown): string[] {
	return Array.isArray(ids) ? ids.filter((i): i is string => typeof i === 'string' && ALL_TOPIC_IDS.includes(i)) : ALL_TOPIC_IDS;
}
