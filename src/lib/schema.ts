/**
 * JSON-LD (schema.org) builders. See docs/PLAN.md §7.
 *
 * Every page emits one `@graph` whose nodes reference each other by `@id`
 * (Organization ← WebSite ← WebPage ← TechArticle / FAQPage / BreadcrumbList),
 * so crawlers and AI engines get one connected entity graph instead of
 * unrelated blobs.
 *
 * Everything is derived from the same frontmatter the page renders visibly —
 * structured data must never say something the page does not.
 */
import type { Contributor } from './contributors';
import { docUrl, type Doc } from './docs';
import { docOgImagePath } from './og-image';
import { SITE, abs } from './site';
import { CATEGORIES, type Category } from './taxonomy';

type Node = Record<string, unknown>;

export interface Crumb {
	name: string;
	/** Root-relative path with trailing slash. */
	path: string;
}

const ORG_ID = abs('/#organization');
const WEBSITE_ID = abs('/#website');
const LOGO_ID = abs('/#logo');
const ref = (id: string) => ({ '@id': id });

export const categoryUrl = (category: Category): string => `/docs/${category}/`;

/** Rough word count of an article's Markdown body (code included). */
export const wordCount = (markdown: string): number => markdown.split(/\s+/).filter(Boolean).length;

/** Reading time in whole minutes at ~220 words per minute. */
export const readingMinutes = (words: number): number => Math.max(1, Math.round(words / 220));

/** Share image node; articles pass their own image, same size as the default. */
const shareImage = (path: string = SITE.ogImage.path): Node => ({
	'@type': 'ImageObject',
	url: abs(path),
	width: SITE.ogImage.width,
	height: SITE.ogImage.height,
});

export function organization(): Node {
	return {
		'@type': 'Organization',
		'@id': ORG_ID,
		name: SITE.name,
		alternateName: SITE.editorial,
		url: abs('/'),
		description: SITE.description,
		logo: {
			'@type': 'ImageObject',
			'@id': LOGO_ID,
			url: abs(SITE.logo.path),
			width: SITE.logo.width,
			height: SITE.logo.height,
			caption: SITE.name,
		},
		image: ref(LOGO_ID),
		...(SITE.sameAs.length ? { sameAs: [...SITE.sameAs] } : {}),
	};
}

export function website(): Node {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: abs('/'),
		name: SITE.name,
		alternateName: 'sfdxtalk.com',
		description: SITE.description,
		inLanguage: SITE.language,
		publisher: ref(ORG_ID),
	};
}

export function breadcrumbList(pageUrl: string, crumbs: Crumb[]): Node {
	return {
		'@type': 'BreadcrumbList',
		'@id': `${pageUrl}#breadcrumb`,
		itemListElement: crumbs.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: abs(c.path),
		})),
	};
}

interface PageInput {
	path: string;
	title: string;
	description: string;
	type?: 'WebPage' | 'CollectionPage';
	crumbs?: Crumb[];
	published?: Date;
	modified?: Date;
	/** Root-relative share image; defaults to the site image. */
	image?: string;
}

function webPage(p: PageInput): Node {
	const url = abs(p.path);
	return {
		'@type': p.type ?? 'WebPage',
		'@id': `${url}#webpage`,
		url,
		name: p.title,
		description: p.description,
		inLanguage: SITE.language,
		isPartOf: ref(WEBSITE_ID),
		primaryImageOfPage: shareImage(p.image),
		...(p.crumbs?.length ? { breadcrumb: ref(`${url}#breadcrumb`) } : {}),
		...(p.published ? { datePublished: p.published.toISOString() } : {}),
		...(p.modified ? { dateModified: p.modified.toISOString() } : {}),
	};
}

const itemList = (docs: Doc[]): Node => ({
	'@type': 'ItemList',
	numberOfItems: docs.length,
	itemListElement: docs.map((d, i) => ({
		'@type': 'ListItem',
		position: i + 1,
		url: abs(docUrl(d)),
		name: d.data.title,
	})),
});

const graph = (...nodes: Node[]) => ({ '@context': 'https://schema.org', '@graph': nodes });

/** Any plain page (home, static pages). */
export function pageGraph(p: PageInput) {
	const url = abs(p.path);
	return graph(
		organization(),
		website(),
		webPage(p),
		...(p.crumbs?.length ? [breadcrumbList(url, p.crumbs)] : []),
	);
}

/** Hub page that lists articles (home, category index). */
export function collectionGraph(p: PageInput, docs: Doc[]) {
	const url = abs(p.path);
	return graph(
		organization(),
		website(),
		{ ...webPage({ ...p, type: 'CollectionPage' }), mainEntity: itemList(docs) },
		...(p.crumbs?.length ? [breadcrumbList(url, p.crumbs)] : []),
	);
}

/** Tools hub: CollectionPage listing only live tools, plus the visible FAQ as FAQPage. */
export function toolsHubGraph(
	p: PageInput,
	tools: { name: string; tagline: string; path: string }[],
	faq: { q: string; a: string }[],
) {
	const url = abs(p.path);
	const pageId = `${url}#webpage`;
	return graph(
		organization(),
		website(),
		{
			...webPage({ ...p, type: 'CollectionPage' }),
			...(tools.length
				? {
						mainEntity: {
							'@type': 'ItemList',
							numberOfItems: tools.length,
							itemListElement: tools.map((t, i) => ({
								'@type': 'ListItem',
								position: i + 1,
								url: abs(t.path),
								name: t.name,
							})),
						},
					}
				: {}),
		},
		...(p.crumbs?.length ? [breadcrumbList(url, p.crumbs)] : []),
		{
			'@type': 'FAQPage',
			'@id': `${url}#faq`,
			url: `${url}#faq`,
			name: `${p.title}: frequently asked questions`,
			inLanguage: SITE.language,
			isPartOf: ref(pageId),
			mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
		},
	);
}

interface ToolInput {
	path: string;
	/** Page <title>. */
	title: string;
	/** Tool name, shown as the WebApplication name. */
	name: string;
	description: string;
	tldr: string;
	crumbs: Crumb[];
	faq: { q: string; a: string }[];
	modified: Date;
	/** Official pages the tool's data was checked against. */
	citations: string[];
}

/**
 * Tool page: WebApplication (free, runs in the browser) + FAQPage + BreadcrumbList.
 * Only states what the page shows: no ratings, no price claims beyond "free".
 */
export function toolGraph(t: ToolInput) {
	const url = abs(t.path);
	const pageId = `${url}#webpage`;
	const appId = `${url}#app`;
	return graph(
		organization(),
		website(),
		{
			...webPage({ path: t.path, title: t.title, description: t.description, crumbs: t.crumbs, modified: t.modified }),
			mainEntity: ref(appId),
			speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.tldr'] },
		},
		breadcrumbList(url, t.crumbs),
		{
			'@type': 'WebApplication',
			'@id': appId,
			name: t.name,
			url,
			description: t.description,
			abstract: t.tldr,
			applicationCategory: 'DeveloperApplication',
			applicationSubCategory: 'Salesforce developer tool',
			operatingSystem: 'Any (runs in a web browser)',
			browserRequirements: 'Requires JavaScript for interactive features. The reference content is readable without it.',
			isAccessibleForFree: true,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
			inLanguage: SITE.language,
			isPartOf: ref(WEBSITE_ID),
			publisher: ref(ORG_ID),
			dateModified: t.modified.toISOString(),
			license: SITE.contentLicense.url,
			citation: t.citations.map((href) => ({ '@type': 'WebPage', url: href })),
		},
		{
			'@type': 'FAQPage',
			'@id': `${url}#faq`,
			url: `${url}#faq`,
			name: `${t.name}: frequently asked questions`,
			inLanguage: SITE.language,
			isPartOf: ref(pageId),
			mainEntity: t.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
		},
	);
}

const MIT_URL = 'https://opensource.org/license/mit';

interface LibraryItemInput {
	path: string;
	title: string;
	/** Item name (skill or prompt title). */
	name: string;
	description: string;
	/** Answer-first summary, also the speakable text. */
	summary: string;
	crumbs: Crumb[];
	faq: { q: string; a: string }[];
	published: Date;
	modified: Date;
	keywords: string[];
	/** Human label of the item's category. */
	section: string;
	/** Official pages the content was checked against. */
	citations: string[];
}

function libraryArticle(i: LibraryItemInput, license: string): Node {
	const url = abs(i.path);
	return {
		'@type': 'TechArticle',
		'@id': `${url}#article`,
		headline: i.name,
		name: i.name,
		description: i.description,
		abstract: i.summary,
		url,
		mainEntityOfPage: ref(`${url}#webpage`),
		isPartOf: ref(WEBSITE_ID),
		datePublished: i.published.toISOString(),
		dateModified: i.modified.toISOString(),
		author: ref(ORG_ID),
		publisher: ref(ORG_ID),
		image: shareImage(),
		inLanguage: SITE.language,
		articleSection: i.section,
		keywords: i.keywords.join(', '),
		isAccessibleForFree: true,
		license,
		citation: i.citations.map((href) => ({ '@type': 'WebPage', url: href })),
		speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.tldr'] },
	};
}

function libraryFaq(i: LibraryItemInput): Node {
	const url = abs(i.path);
	return {
		'@type': 'FAQPage',
		'@id': `${url}#faq`,
		url: `${url}#faq`,
		name: `${i.name}: frequently asked questions`,
		inLanguage: SITE.language,
		isPartOf: ref(`${url}#webpage`),
		mainEntity: i.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
	};
}

/** Skill page: WebPage + TechArticle + SoftwareSourceCode (the downloadable skill) + FAQPage + BreadcrumbList. */
export function skillGraph(i: LibraryItemInput & { version: string; zipPath: string; rawPath: string }) {
	const url = abs(i.path);
	return graph(
		organization(),
		website(),
		{ ...webPage({ path: i.path, title: i.title, description: i.description, crumbs: i.crumbs, published: i.published, modified: i.modified }), mainEntity: ref(`${url}#article`) },
		breadcrumbList(url, i.crumbs),
		libraryArticle(i, MIT_URL),
		{
			'@type': 'SoftwareSourceCode',
			'@id': `${url}#skill`,
			name: i.name,
			description: i.description,
			programmingLanguage: 'Markdown',
			codeSampleType: 'full solution',
			version: i.version,
			license: MIT_URL,
			url,
			isPartOf: ref(WEBSITE_ID),
			publisher: ref(ORG_ID),
			dateModified: i.modified.toISOString(),
			targetProduct: { '@type': 'SoftwareApplication', name: 'Salesforce Platform', applicationCategory: 'DeveloperApplication' },
			encoding: [
				{ '@type': 'MediaObject', contentUrl: abs(i.zipPath), encodingFormat: 'application/zip' },
				{ '@type': 'MediaObject', contentUrl: abs(i.rawPath), encodingFormat: 'text/markdown' },
			],
		},
		libraryFaq(i),
	);
}

/** Prompt page: WebPage + TechArticle + FAQPage + BreadcrumbList. */
export function promptGraph(i: LibraryItemInput) {
	const url = abs(i.path);
	return graph(
		organization(),
		website(),
		{ ...webPage({ path: i.path, title: i.title, description: i.description, crumbs: i.crumbs, published: i.published, modified: i.modified }), mainEntity: ref(`${url}#article`) },
		breadcrumbList(url, i.crumbs),
		libraryArticle(i, SITE.contentLicense.url),
		libraryFaq(i),
	);
}

/** Breadcrumb trail for an article: Home › Category › Article. */
export function docCrumbs(doc: Doc): Crumb[] {
	return [
		{ name: 'Home', path: '/' },
		{ name: CATEGORIES[doc.data.category].label, path: categoryUrl(doc.data.category) },
		{ name: doc.data.title, path: docUrl(doc) },
	];
}

/** Article page: TechArticle + FAQPage + BreadcrumbList on top of the site graph. */
export function articleGraph(doc: Doc, pageTitle: string, contributors: Contributor[] = []) {
	const d = doc.data;
	const path = docUrl(doc);
	const url = abs(path);
	const pageId = `${url}#webpage`;
	const articleId = `${url}#article`;
	const category = CATEGORIES[d.category];
	const words = wordCount(doc.body ?? '');
	const crumbs = docCrumbs(doc);
	const image = docOgImagePath(doc);

	const article: Node = {
		'@type': 'TechArticle',
		'@id': articleId,
		headline: d.title,
		name: d.title,
		description: d.description,
		abstract: d.tldr,
		url,
		mainEntityOfPage: ref(pageId),
		isPartOf: ref(WEBSITE_ID),
		datePublished: d.published.toISOString(),
		dateModified: d.lastUpdated.toISOString(),
		author: ref(ORG_ID),
		publisher: ref(ORG_ID),
		image: shareImage(image),
		inLanguage: SITE.language,
		articleSection: category.label,
		keywords: d.tags.join(', '),
		proficiencyLevel: d.level[0].toUpperCase() + d.level.slice(1),
		dependencies: `Salesforce ${d.release} (API version ${d.apiVersion})`,
		wordCount: words,
		timeRequired: `PT${readingMinutes(words)}M`,
		isAccessibleForFree: true,
		// Shown on the page under the article (license line and contributors).
		license: SITE.contentLicense.url,
		...(contributors.length
			? { contributor: contributors.map((c) => ({ '@type': 'Person', name: c.name, ...(c.url ? { url: c.url } : {}) })) }
			: {}),
		about: [
			{ '@type': 'Thing', name: category.label, description: category.description, url: abs(categoryUrl(d.category)) },
			{ '@type': 'SoftwareApplication', name: 'Salesforce Platform', applicationCategory: 'DeveloperApplication', softwareVersion: `${d.release} (API ${d.apiVersion})` },
		],
		// Official Salesforce pages the article was verified against.
		citation: d.officialRefs.map((href) => ({ '@type': 'WebPage', url: href })),
		// The "Quick answer" box is the best text to read aloud or quote.
		speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.tldr'] },
	};

	const faq: Node = {
		'@type': 'FAQPage',
		'@id': `${url}#faq`,
		url: `${url}#faq`,
		name: `${d.title}: frequently asked questions`,
		inLanguage: SITE.language,
		isPartOf: ref(pageId),
		mainEntity: d.faq.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	};

	return graph(
		organization(),
		website(),
		{
			...webPage({ path, title: pageTitle, description: d.description, crumbs, published: d.published, modified: d.lastUpdated, image }),
			mainEntity: ref(articleId),
		},
		breadcrumbList(url, crumbs),
		article,
		faq,
	);
}
