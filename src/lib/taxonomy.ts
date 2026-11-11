/**
 * Single source of truth for categories and Salesforce releases.
 * Keep in sync with docs/CONTENT-SPEC.md §3 and §4.
 */

export const CATEGORIES = {
	apex: { label: 'Apex', description: 'Apex language, triggers, async Apex and governor limits.' },
	lwc: { label: 'Lightning Web Components', description: 'Building UI with Lightning Web Components.' },
	aura: { label: 'Aura Components', description: 'Legacy Aura component framework.' },
	'soql-sosl': { label: 'SOQL & SOSL', description: 'Queries, search and query optimization.' },
	'sf-cli': { label: 'Salesforce CLI', description: 'The sf CLI, legacy sfdx commands and scratch orgs.' },
	metadata: { label: 'Metadata', description: 'Metadata API, source format, package.xml and deployments.' },
	devops: { label: 'DevOps', description: 'CI/CD, DevOps Center and packaging.' },
	testing: { label: 'Testing', description: 'Apex tests, Jest for LWC and test data.' },
	apis: { label: 'APIs', description: 'REST, SOAP, Bulk, Composite, GraphQL and Pub/Sub APIs.' },
	integration: { label: 'Integration', description: 'Named Credentials, callouts, Platform Events and CDC.' },
	flow: { label: 'Flow', description: 'Flow from a developer perspective, including invocable Apex.' },
	security: { label: 'Security', description: 'Sharing, CRUD/FLS, user mode and Shield.' },
	agentforce: { label: 'Agentforce', description: 'Agentforce and AI features for developers.' },
	'data-cloud': { label: 'Data Cloud', description: 'Data Cloud developer topics.' },
} as const;

export type Category = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [Category, ...Category[]];

/**
 * Salesforce releases and their API versions, oldest first.
 * Verify each new row against official release notes before adding.
 */
export const RELEASES = [
	{ name: "Winter '25", apiVersion: '62.0', ga: '2024-10' },
	{ name: "Spring '25", apiVersion: '63.0', ga: '2025-02' },
	{ name: "Summer '25", apiVersion: '64.0', ga: '2025-06' },
	{ name: "Winter '26", apiVersion: '65.0', ga: '2025-10' },
	{ name: "Spring '26", apiVersion: '66.0', ga: '2026-02' },
	{ name: "Summer '26", apiVersion: '67.0', ga: '2026-06' },
	{ name: "Winter '27", apiVersion: '68.0', ga: '2026-10' },
	{ name: "Spring '27", apiVersion: '69.0', ga: '2027-02' },
] as const;

export type Release = (typeof RELEASES)[number]['name'];
export const RELEASE_NAMES = RELEASES.map((r) => r.name) as [Release, ...Release[]];

export const apiVersionFor = (release: Release): string =>
	RELEASES.find((r) => r.name === release)!.apiVersion;

/** URL-safe slug for a release, e.g. "Winter '27" → "winter-27". */
export const releaseSlug = (release: Release): string =>
	release.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];
