import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_KEYS, LEVELS, RELEASE_NAMES, apiVersionFor } from './lib/taxonomy';

/**
 * Article schema. Mirrors docs/CONTENT-SPEC.md §2 — the build fails on any violation.
 * Checks that need every article (category folder, related links) live in src/lib/docs.ts.
 */

const slugPart = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase-hyphenated');

const plainText = (max: number) =>
	z
		.string()
		.trim()
		.min(1)
		.max(max)
		// Backticks, HTML, bold and links. Underscores stay allowed (Account__c).
		.refine((s) => !/[`<>]|\*\*|\]\(/.test(s), 'must be plain text (no Markdown or HTML)');

const faqItem = z.object({
	q: plainText(200).refine((s) => s.endsWith('?'), 'question must end with "?"'),
	a: plainText(300),
});

const docSchema = z
	.object({
		title: z.string().trim().min(10).max(60),
		description: z.string().trim().min(120).max(160),
		category: z.enum(CATEGORY_KEYS),
		tags: z.array(slugPart).min(1).max(6).refine((t) => new Set(t).size === t.length, 'duplicate tags'),
		release: z.enum(RELEASE_NAMES),
		apiVersion: z.string().regex(/^\d{2,3}\.0$/, 'format like "68.0"'),
		published: z.coerce.date(),
		lastUpdated: z.coerce.date(),
		level: z.enum(LEVELS),
		tldr: z.string().trim().min(40).max(300),
		faq: z.array(faqItem).min(3).max(8),
		related: z
			.array(z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, 'format "{category}/{slug}"'))
			.max(5)
			.default([]),
		officialRefs: z.array(z.url({ protocol: /^https$/ })).min(1),
		draft: z.boolean().default(false),
	})
	.strict()
	.superRefine((d, ctx) => {
		const expected = apiVersionFor(d.release);
		if (d.apiVersion !== expected) {
			ctx.addIssue({
				code: 'custom',
				path: ['apiVersion'],
				message: `${d.release} is API ${expected}, not ${d.apiVersion}`,
			});
		}
		if (d.lastUpdated < d.published) {
			ctx.addIssue({ code: 'custom', path: ['lastUpdated'], message: 'lastUpdated is before published' });
		}
		const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
		for (const key of ['published', 'lastUpdated'] as const) {
			if (d[key].getTime() > tomorrow) {
				ctx.addIssue({ code: 'custom', path: [key], message: 'date is in the future' });
			}
		}
	});

const docs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
	schema: docSchema,
});

export const collections = { docs };
