/**
 * Markdown versions of tool pages (for AI assistants and /llms-full.txt) and the
 * honest last-modified date of each tool's data (for the sitemap).
 *
 * Each tool contributes one file, src/data/tool-exports/{slug}.ts, whose default
 * export is a ToolExport. Files are discovered automatically, so adding a tool
 * never means editing this file.
 */
export interface ToolExport {
	/** Must equal the tool's slug in src/lib/tools.ts. */
	slug: string;
	/** Markdown of the page's reference content, generated from the same data the page renders. */
	markdown: () => string;
	/** Date the tool's data was last checked against its source. */
	lastmod: Date;
}

const modules = import.meta.glob<{ default: ToolExport }>('../data/tool-exports/*.ts', { eager: true });
const exportsBySlug = new Map<string, ToolExport>(Object.values(modules).map((m) => [m.default.slug, m.default]));

/** Markdown for a tool, or undefined if it has none. */
export const toolMarkdown = (slug: string): string | undefined => exportsBySlug.get(slug)?.markdown();

/** Last-modified date of a tool's data, for the sitemap. */
export const toolLastmod = (slug: string): Date | undefined => exportsBySlug.get(slug)?.lastmod;
