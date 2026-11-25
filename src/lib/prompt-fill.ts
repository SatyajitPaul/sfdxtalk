/** Placeholder filling for prompt templates. Pure, so the page script, the build and tests share it. */
export const VAR = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;

/** Fill {{name}} placeholders; unknown placeholders are left untouched. */
export function fillPrompt(template: string, values: Record<string, string>): string {
	return template.replace(VAR, (whole, name: string) => (name in values ? values[name] : whole));
}

/** Names of the placeholders a template uses. */
export const placeholders = (template: string): Set<string> => new Set([...template.matchAll(VAR)].map((m) => m[1]));
