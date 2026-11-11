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

	/** Public GitHub repository: "Edit this page", history and issue links. */
	repo: {
		url: 'https://github.com/SatyajitPaul/sfdxtalk',
		branch: 'master',
	},

	/** Articles are CC BY 4.0 (LICENSE-CONTENT); site code is MIT (LICENSE). */
	contentLicense: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },

	/**
	 * Git author names whose commits are credited to SFDX Talk Editorial rather
	 * than listed as community contributors (src/lib/contributors.ts).
	 * Names only — never put email addresses here.
	 */
	editorialAuthors: ['Satyajit Paul'] as string[],

	/**
	 * Giscus comments (GitHub Discussions on the repo above). Comments stay off
	 * until repoId and categoryId are filled in: get both from https://giscus.app
	 * after enabling Discussions and installing the giscus app on the repo.
	 */
	giscus: {
		repo: 'SatyajitPaul/sfdxtalk',
		repoId: 'R_kgDOVqYvqg',
		category: 'Comments',
		categoryId: 'DIC_kwDOVqYvqs4DK5ku',
	},
} as const;

/** GitHub URLs for one article's source file. */
export function repoLinks(docId: string) {
	const path = `src/content/docs/${docId}.md`;
	const { url, branch } = SITE.repo;
	return {
		edit: `${url}/edit/${branch}/${path}`,
		history: `${url}/commits/${branch}/${path}`,
		/** Prefilled "Report a problem" issue form (.github/ISSUE_TEMPLATE/article-issue.yml). */
		issue: (pageUrl: string, title: string) =>
			`${url}/issues/new?${new URLSearchParams({ template: 'article-issue.yml', title: `[Article] ${title}`, page: pageUrl })}`,
	};
}

/** Absolute URL for a root-relative path. */
export const abs = (path: string): string => new URL(path, SITE.url).href;
