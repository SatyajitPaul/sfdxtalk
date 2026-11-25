/**
 * Registry of the interactive tools under /tools/. Single source of truth for
 * the hub page, sitemap, llms.txt and JSON-LD. See docs/TOOLS-PLAN.md.
 *
 * A tool is only linked, listed in the sitemap or put in structured data once
 * its status is 'live' (its page exists). 'planned' tools appear on the hub as
 * "coming soon" text only, so we never link to a page that does not exist.
 * The hub itself stays noindex until at least one tool is live.
 */
import type { Category } from './taxonomy';

export type ToolStatus = 'live' | 'planned';

export const TOOL_GROUPS = {
	query: { label: 'Query & code', description: 'Write, format and check SOQL and Apex.' },
	debug: { label: 'Debugging', description: 'Understand logs and error messages faster.' },
	metadata: { label: 'Metadata & deployment', description: 'Build manifests and read deployment output.' },
	limits: { label: 'Limits & decisions', description: 'Governor limits and "which one should I use" guides.' },
	data: { label: 'Data & IDs', description: 'Record IDs, JSON and data conversion helpers.' },
	ai: { label: 'AI-era tools', description: 'Context files and checks for working with AI coding assistants.' },
} as const;

export type ToolGroup = keyof typeof TOOL_GROUPS;
export const TOOL_GROUP_KEYS = Object.keys(TOOL_GROUPS) as [ToolGroup, ...ToolGroup[]];

export interface Tool {
	/** URL slug: /tools/{slug}/. Never rename once live. */
	slug: string;
	name: string;
	/** One line, plain text: what the tool does. */
	tagline: string;
	group: ToolGroup;
	status: ToolStatus;
	/** Build order among planned tools (1 = first). */
	order: number;
	/** The search question this page must answer best (also drives its title/H1). */
	primaryQuery: string;
	/** Docs categories whose articles this tool links to. */
	relatedCategories: Category[];
}

export const TOOLS: readonly Tool[] = [
	{
		slug: 'governor-limits',
		name: 'Salesforce Governor Limits Reference',
		tagline: 'Searchable per-transaction limits, sync vs async, each with its official source and API version.',
		group: 'limits',
		status: 'live',
		order: 1,
		primaryQuery: 'salesforce governor limits',
		relatedCategories: ['apex'],
	},
	{
		slug: 'salesforce-id-converter',
		name: 'Salesforce ID Converter (15 to 18 Character)',
		tagline: 'Convert 15-character IDs to 18 and back, in bulk, and look up what an ID prefix means.',
		group: 'data',
		status: 'live',
		order: 2,
		primaryQuery: 'salesforce 15 to 18 digit id converter',
		relatedCategories: ['apis', 'soql-sosl'],
	},
	{
		slug: 'soql-formatter',
		name: 'SOQL Formatter and Query Checker',
		tagline: 'Format SOQL and get hints for non-selective patterns, each linked to the fix.',
		group: 'query',
		status: 'live',
		order: 3,
		primaryQuery: 'soql formatter',
		relatedCategories: ['soql-sosl', 'apex'],
	},
	{
		slug: 'salesforce-error-decoder',
		name: 'Salesforce Error Message Decoder',
		tagline: 'Paste an error and get the cause, the fix and the docs that explain it.',
		group: 'debug',
		status: 'live',
		order: 4,
		primaryQuery: 'salesforce error message meaning and fix',
		relatedCategories: ['apex', 'devops'],
	},
	{
		slug: 'package-xml-generator',
		name: 'package.xml Generator',
		tagline: 'Pick metadata types and members, get a package.xml and the matching sf retrieve command.',
		group: 'metadata',
		status: 'live',
		order: 5,
		primaryQuery: 'salesforce package.xml generator',
		relatedCategories: ['metadata', 'sf-cli'],
	},
	{
		slug: 'async-apex-chooser',
		name: 'Which Async Apex Should I Use?',
		tagline: 'Answer a few questions and compare Future, Queueable, Batch, Schedulable and platform events.',
		group: 'limits',
		status: 'live',
		order: 6,
		primaryQuery: 'future vs queueable vs batch apex',
		relatedCategories: ['apex'],
	},
	{
		slug: 'ai-context-file-generator',
		name: 'AI Context File Generator for Salesforce',
		tagline: 'Build a CLAUDE.md, Cursor rules or Copilot instructions file tailored to your Salesforce project.',
		group: 'ai',
		status: 'live',
		order: 7,
		primaryQuery: 'claude.md for salesforce development',
		relatedCategories: ['agentforce', 'apex', 'lwc'],
	},
	{
		slug: 'apex-code-checker',
		name: 'Apex Bulk-Safety Checker',
		tagline: 'Paste Apex, including AI-generated code, and flag SOQL or DML in loops and other common problems.',
		group: 'query',
		status: 'planned',
		order: 8,
		primaryQuery: 'apex code review checker governor limits',
		relatedCategories: ['apex', 'testing'],
	},
	{
		slug: 'debug-log-analyzer',
		name: 'Apex Debug Log Analyzer',
		tagline: 'Drop in a debug log and see limit usage, SOQL and DML counts, slow methods and exceptions.',
		group: 'debug',
		status: 'planned',
		order: 9,
		primaryQuery: 'salesforce debug log analyzer',
		relatedCategories: ['apex'],
	},
	{
		slug: 'manifest-merge',
		name: 'package.xml Viewer, Diff and Merge',
		tagline: 'View a manifest as a tree, compare two, merge and de-duplicate them.',
		group: 'metadata',
		status: 'live',
		order: 10,
		primaryQuery: 'merge package.xml files',
		relatedCategories: ['metadata', 'devops'],
	},
] as const;

export const toolUrl = (tool: Pick<Tool, 'slug'>): string => `/tools/${tool.slug}/`;
export const TOOLS_INDEX_URL = '/tools/';

export const liveTools = (): Tool[] => TOOLS.filter((t) => t.status === 'live');

/** Tools in a group, live first, then by build order. */
export function toolsInGroup(group: ToolGroup): Tool[] {
	return TOOLS.filter((t) => t.group === group).sort(
		(a, b) => Number(b.status === 'live') - Number(a.status === 'live') || a.order - b.order,
	);
}

/** The hub is indexable (and in the sitemap) only when it lists a real tool. */
export const toolsHubIndexable = (): boolean => liveTools().length > 0;
