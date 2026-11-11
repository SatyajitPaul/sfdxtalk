/**
 * Code highlighting themes built from the site palette (docs/PLAN.md §2).
 * Desaturated hues so code reads calmly on long sessions; every token color
 * meets WCAG AA (≥4.5:1) against its code background.
 *
 *   Dark bg  #1F2429   Light bg #ECE9E2
 */

const theme = (
	name: string,
	type: 'dark' | 'light',
	c: {
		bg: string;
		fg: string;
		comment: string;
		keyword: string;
		string: string;
		number: string;
		fn: string;
		type: string;
		tag: string;
		attr: string;
		punct: string;
	},
) => ({
	name,
	type,
	colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
	tokenColors: [
		{ settings: { foreground: c.fg, background: c.bg } },
		{ scope: ['comment', 'punctuation.definition.comment', 'string.comment'], settings: { foreground: c.comment, fontStyle: 'italic' } },
		{
			scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new', 'keyword.control', 'variable.language'],
			settings: { foreground: c.keyword },
		},
		{ scope: ['string', 'string.quoted', 'string.template', 'markup.inline.raw'], settings: { foreground: c.string } },
		{ scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'], settings: { foreground: c.number } },
		{ scope: ['entity.name.function', 'support.function', 'meta.function-call', 'variable.function'], settings: { foreground: c.fn } },
		{
			scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type', 'entity.other.inherited-class', 'storage.type.java'],
			settings: { foreground: c.type },
		},
		{ scope: ['entity.name.tag', 'punctuation.definition.tag', 'support.type.property-name.json'], settings: { foreground: c.tag } },
		{ scope: ['entity.other.attribute-name', 'meta.object-literal.key', 'variable.other.property'], settings: { foreground: c.attr } },
		{ scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: c.punct } },
		{ scope: ['variable.parameter'], settings: { foreground: c.fg } },
	],
});

export const sfdxDark = theme('sfdx-dark', 'dark', {
	bg: '#1F2429',
	fg: '#D6D3CC',
	comment: '#8A949C',
	keyword: '#C3A6E0',
	string: '#A8C99A',
	number: '#E0B47E',
	fn: '#82B4D6',
	type: '#6FB7A8',
	tag: '#D99494',
	attr: '#E0B47E',
	punct: '#A9B1B8',
});

export const sfdxLight = theme('sfdx-light', 'light', {
	bg: '#ECE9E2',
	fg: '#2A2F35',
	comment: '#5F6870',
	keyword: '#6E4596',
	string: '#3F6B30',
	number: '#85540F',
	fn: '#2A5D84',
	type: '#246B5E',
	tag: '#9A3636',
	attr: '#85540F',
	punct: '#4D555D',
});
