/**
 * Site-wide identity used by <head> metadata, JSON-LD, feeds and llms.txt.
 * One place, so the name and description never disagree between them.
 */
export const SITE = {
	name: 'SFDX Talk',
	/** Byline for every article (docs/PLAN.md, open decision 4). */
	editorial: 'SFDX Talk Editorial',
	url: 'https://sfdxtalk.com',
	title: 'SFDX Talk — Unofficial Salesforce Developer Documentation',
	description:
		'Unofficial, developer-friendly Salesforce documentation: Apex, Lightning Web Components, SOQL, Salesforce CLI and APIs. Not affiliated with Salesforce.',
	disclaimer:
		'SFDX Talk is unofficial documentation. It is not affiliated with, endorsed by, or sponsored by Salesforce, Inc.',
	locale: 'en_US',
	language: 'en',
	/** Square logo for Organization JSON-LD (Google: at least 112×112, crawlable). */
	logo: { path: '/icon-512.png', width: 512, height: 512 },
	/** Default social share image, 1.91:1. */
	ogImage: { path: '/og-default.png', width: 1200, height: 630, alt: 'SFDX Talk — unofficial Salesforce developer documentation' },
	/** Public profile URLs for Organization `sameAs`. Add real profiles only. */
	sameAs: [] as string[],
} as const;

/** Absolute URL for a root-relative path. */
export const abs = (path: string): string => new URL(path, SITE.url).href;
