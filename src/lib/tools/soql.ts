/**
 * SOQL formatter and conservative query checker. Pure logic, no DOM.
 *
 * The formatter tokenizes the query, builds a small parenthesis tree and prints
 * it again. It never merges, splits, drops or reorders tokens, so the meaning
 * cannot change; only whitespace and the case of recognised keywords change.
 * String literals are copied byte for byte.
 */

export type TokenKind = 'string' | 'word' | 'number' | 'op' | 'punct';

export interface Token {
	kind: TokenKind;
	text: string;
}

export interface FormatOptions {
	/** 'upper' uppercases recognised keywords, 'keep' leaves them as typed. */
	keywordCase: 'upper' | 'keep';
	/** 'expanded' puts each SELECT field and each AND/OR on its own line. */
	layout: 'expanded' | 'compact';
	/** Spaces per indent level (1 to 8). */
	indent: number;
}

export const DEFAULT_OPTIONS: FormatOptions = { keywordCase: 'upper', layout: 'expanded', indent: 2 };

const DATE_RE = /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2}))?/y;
const NUMBER_RE = /-?(?:\d+\.?\d*|\.\d+)(?![A-Za-z_])/y;
const WORD_RE = /[A-Za-z_:$][A-Za-z0-9_.:$]*|\d[A-Za-z0-9_.:$]*/y;

/** Split a query into tokens. Whitespace and comments are not tokens (SOQL has no comments). */
export function tokenize(src: string): Token[] {
	const out: Token[] = [];
	let i = 0;
	while (i < src.length) {
		const c = src[i];
		if (/\s/.test(c)) {
			i++;
			continue;
		}
		if (c === "'") {
			let j = i + 1;
			while (j < src.length && src[j] !== "'") j += src[j] === '\\' ? 2 : 1;
			j = Math.min(j + 1, src.length);
			out.push({ kind: 'string', text: src.slice(i, j) });
			i = j;
			continue;
		}
		const tryRe = (re: RegExp, kind: TokenKind) => {
			re.lastIndex = i;
			const m = re.exec(src);
			if (!m) return false;
			out.push({ kind, text: m[0] });
			i += m[0].length;
			return true;
		};
		if (/\d/.test(c) && tryRe(DATE_RE, 'word')) continue;
		if ((/[\d.-]/.test(c)) && tryRe(NUMBER_RE, 'number')) continue;
		if (tryRe(WORD_RE, 'word')) continue;
		const two = src.slice(i, i + 2);
		if (two === '!=' || two === '<>' || two === '<=' || two === '>=') {
			out.push({ kind: 'op', text: two });
			i += 2;
			continue;
		}
		if ('=<>'.includes(c)) out.push({ kind: 'op', text: c });
		else out.push({ kind: 'punct', text: c });
		i++;
	}
	return out;
}

/** Words that formatting may re-case. Everything else is copied as typed. */
export const KEYWORDS = new Set([
	'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'NULL', 'TRUE', 'FALSE', 'INCLUDES', 'EXCLUDES',
	'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'NULLS', 'FIRST', 'LAST', 'LIMIT', 'OFFSET', 'WITH', 'USING',
	'SCOPE', 'FOR', 'VIEW', 'REFERENCE', 'UPDATE', 'ALL', 'ROWS', 'TYPEOF', 'WHEN', 'THEN', 'ELSE', 'END', 'TRACKING', 'VIEWSTAT',
]);

// ---- parse tree -----------------------------------------------------------

interface Tok extends Token {
	t: 'tok';
	kw: boolean;
}
interface Group {
	t: 'group';
	children: Node[];
	closed: boolean;
}
type Node = Tok | Group;

const up = (n: Node) => (n.t === 'tok' ? n.text.toUpperCase() : '');
const isP = (n: Node | undefined, p: string) => !!n && n.t === 'tok' && n.kind === 'punct' && n.text === p;
const isW = (n: Node | undefined, w: string) => !!n && n.t === 'tok' && n.kind === 'word' && n.text.toUpperCase() === w;

function parse(tokens: Token[]): Node[] {
	const root: Node[] = [];
	const stack: Node[][] = [root];
	const groups: Group[] = [];
	for (const tk of tokens) {
		const cur = stack[stack.length - 1];
		if (tk.kind === 'punct' && tk.text === '(') {
			const g: Group = { t: 'group', children: [], closed: false };
			cur.push(g);
			groups.push(g);
			stack.push(g.children);
		} else if (tk.kind === 'punct' && tk.text === ')' && stack.length > 1) {
			stack.pop();
			groups.pop()!.closed = true;
		} else cur.push({ ...tk, t: 'tok', kw: false });
	}
	return root;
}

const isSub = (n: Node): n is Group => n.t === 'group' && isW(n.children[0], 'SELECT');

type Clause = { kw: Tok[]; name: string; body: Node[] };

const CLAUSE_START = new Set(['SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'OFFSET', 'WITH', 'FOR']);

/** Splits one query level into clauses and marks keyword tokens. */
function splitClauses(nodes: Node[]): { pre: Node[]; clauses: Clause[] } {
	const pre: Node[] = [];
	const clauses: Clause[] = [];
	let cur: Clause | null = null;
	for (let i = 0; i < nodes.length; i++) {
		const n = nodes[i];
		const w = n.t === 'tok' && n.kind === 'word' ? up(n) : '';
		const nx = nodes[i + 1];
		let take = 0;
		if (CLAUSE_START.has(w)) take = 1;
		else if ((w === 'GROUP' || w === 'ORDER') && isW(nx, 'BY')) take = 2;
		else if (w === 'USING' && isW(nx, 'SCOPE')) take = 2;
		else if (w === 'ALL' && isW(nx, 'ROWS')) take = 2;
		else if (w === 'UPDATE' && cur?.name !== 'FOR' && (isW(nx, 'TRACKING') || isW(nx, 'VIEWSTAT'))) take = 2;
		if (take) {
			const kw = nodes.slice(i, i + take) as Tok[];
			kw.forEach((k) => (k.kw = true));
			cur = { kw, name: w, body: [] };
			clauses.push(cur);
			i += take - 1;
		} else if (cur) cur.body.push(n);
		else pre.push(n);
	}
	return { pre, clauses };
}

/** Marks operator and literal keywords anywhere in the tree. */
function markKeywords(nodes: Node[]): void {
	const ALWAYS = new Set(['AND', 'OR', 'NOT', 'IN', 'LIKE', 'NULL', 'TRUE', 'FALSE', 'INCLUDES', 'EXCLUDES', 'ASC', 'DESC', 'NULLS']);
	let inTypeof = false;
	nodes.forEach((n, i) => {
		if (n.t === 'group') return markKeywords(n.children);
		if (n.kind !== 'word') return;
		const w = n.text.toUpperCase();
		if (w === 'TYPEOF') inTypeof = true;
		if (inTypeof && ['TYPEOF', 'WHEN', 'THEN', 'ELSE', 'END'].includes(w)) n.kw = true;
		if (w === 'END') inTypeof = false;
		if (ALWAYS.has(w)) n.kw = true;
		if ((w === 'FIRST' || w === 'LAST') && isW(nodes[i - 1], 'NULLS')) n.kw = true;
		if (w === 'BY' && ['GROUP', 'ORDER'].includes(up(nodes[i - 1] ?? n))) n.kw = true;
	});
}

/** Marks clause keywords of every query level, so subqueries printed inline are re-cased too. */
function markClauses(nodes: Node[]): void {
	splitClauses(nodes);
	for (const n of nodes) if (n.t === 'group') markClauses(n.children);
}

// ---- printing -------------------------------------------------------------

interface Ctx {
	o: FormatOptions;
	unit: string;
}

const word = (n: Tok, c: Ctx) => (n.kw && c.o.keywordCase === 'upper' ? n.text.toUpperCase() : n.text);

/** A word that may be a function name: no space before its "(". */
const callable = (n: Node | undefined): boolean =>
	!!n && n.t === 'tok' && n.kind === 'word' && !(KEYWORDS.has(n.text.toUpperCase()) && n.kw) && !['IN', 'NOT', 'AND', 'OR', 'WHERE', 'FROM', 'SELECT', 'HAVING', 'LIKE', 'BY', 'THEN', 'ELSE', 'WHEN'].includes(n.text.toUpperCase());

function inline(nodes: Node[], c: Ctx): string {
	let s = '';
	nodes.forEach((n, i) => {
		const prev = nodes[i - 1];
		let sp = i > 0;
		if (isP(n, ',') || isP(n, ')')) sp = false;
		else if (isP(prev, ',')) sp = true;
		else if (n.t === 'group' && callable(prev)) sp = false;
		s += (sp ? ' ' : '') + (n.t === 'group' ? '(' + inline(n.children, c) + (n.closed ? ')' : '') : n.kind === 'string' ? n.text : word(n, c));
	});
	return s;
}

const hasSub = (nodes: Node[]): boolean => nodes.some((n) => n.t === 'group' && (isSub(n) || hasSub(n.children)));
const hasLogic = (nodes: Node[]): boolean => nodes.some((n) => isW(n, 'AND') || isW(n, 'OR'));

/** Prints nodes; `prefix` is text already on the first line. Returns finished lines. */
function seq(nodes: Node[], ind: string, prefix: string, c: Ctx): string[] {
	const lines: string[] = [];
	let cur = prefix;
	const add = (s: string, sp: boolean) => {
		cur += (sp && cur.trim() !== '' && !cur.endsWith(' ') ? ' ' : '') + s;
	};
	nodes.forEach((n, i) => {
		const prev = nodes[i - 1];
		let sp = true;
		if (isP(n, ',') || isP(n, ')')) sp = false;
		else if (n.t === 'group' && callable(prev)) sp = false;
		if (n.t === 'tok') return add(n.kind === 'string' ? n.text : word(n, c), sp);
		const flat = '(' + inline(n.children, c) + (n.closed ? ')' : '');
		const sub = hasSub([n]);
		const wide = flat.length > 60;
		if (sub && (c.o.layout === 'expanded' || wide)) {
			add('(', sp);
			lines.push(cur);
			const inner = ind + c.unit;
			lines.push(...(isSub(n) ? query(n.children, inner, c) : cond(n.children, inner, inner, c)));
			cur = n.closed ? ind + ')' : ind;
		} else if (c.o.layout === 'expanded' && hasLogic(n.children) && wide) {
			add('(', sp);
			lines.push(cur);
			lines.push(...cond(n.children, ind + c.unit, ind + c.unit, c));
			cur = n.closed ? ind + ')' : ind;
		} else add(flat, sp);
	});
	lines.push(cur);
	return lines;
}

/** Conditions split at top-level AND/OR (expanded) or one line (compact). */
function cond(nodes: Node[], ind: string, prefix: string, c: Ctx): string[] {
	if (c.o.layout === 'compact') return seq(nodes, ind, prefix, c);
	const units: Node[][] = [[]];
	const ops: Tok[] = [];
	for (const n of nodes) {
		if ((isW(n, 'AND') || isW(n, 'OR')) && units[units.length - 1].length) {
			ops.push(n as Tok);
			units.push([]);
		} else units[units.length - 1].push(n);
	}
	const out: string[] = [];
	units.forEach((u, i) => out.push(...seq(u, ind, i === 0 ? prefix : ind + word(ops[i - 1], c) + ' ', c)));
	return out;
}

function selectItems(body: Node[]): Node[][] {
	const items: Node[][] = [[]];
	let inTypeof = false;
	for (const n of body) {
		if (isW(n, 'TYPEOF')) inTypeof = true;
		if (isP(n, ',') && !inTypeof) items.push([]);
		else items[items.length - 1].push(n);
		if (isW(n, 'END')) inTypeof = false;
	}
	return items.filter((it) => it.length);
}

function typeofLines(item: Node[], ind: string, c: Ctx): string[] {
	for (const n of item) if (n.t === 'tok' && ['TYPEOF', 'WHEN', 'THEN', 'ELSE', 'END'].includes(up(n))) n.kw = true;
	const segs: Node[][] = [[]];
	for (const n of item) {
		if ((isW(n, 'WHEN') || isW(n, 'ELSE') || isW(n, 'END')) && segs[segs.length - 1].length) segs.push([n]);
		else segs[segs.length - 1].push(n);
	}
	return segs.map((s, i) => ind + (i === 0 || isW(s[0], 'END') ? '' : c.unit) + inline(s, c));
}

function query(nodes: Node[], ind: string, c: Ctx): string[] {
	const { pre, clauses } = splitClauses(nodes);
	const out: string[] = [];
	if (pre.length) out.push(...seq(pre, ind, ind, c));
	for (const cl of clauses) {
		const kw = cl.kw.map((k) => word(k, c)).join(' ');
		const head = ind + kw;
		const body = ind + c.unit;
		if (cl.name === 'SELECT' && c.o.layout === 'expanded' && cl.body.length) {
			out.push(head);
			const items = selectItems(cl.body);
			items.forEach((it, i) => {
				const comma = i < items.length - 1 ? ',' : '';
				const lines = it.some((n) => isW(n, 'TYPEOF')) ? typeofLines(it, body, c) : seq(it, body, body, c);
				lines[lines.length - 1] += comma;
				out.push(...lines);
			});
		} else if (cl.name === 'SELECT') {
			out.push(...seq(selectItems(cl.body).flatMap((it, i, a) => (i < a.length - 1 ? [...it, { t: 'tok', kind: 'punct', text: ',', kw: false } as Tok] : it)), ind, head, c));
		} else if (cl.name === 'WHERE' || cl.name === 'HAVING') {
			out.push(...cond(cl.body, body, head, c));
		} else out.push(...seq(cl.body, ind, head, c));
	}
	return out;
}

/** Formats a SOQL query. Whitespace and keyword case change; nothing else does. */
export function formatSoql(src: string, options: Partial<FormatOptions> = {}): string {
	const o = { ...DEFAULT_OPTIONS, ...options };
	o.indent = Math.max(1, Math.min(8, Math.round(Number(o.indent)) || 2));
	const tree = parse(tokenize(src));
	if (!tree.length) return '';
	markKeywords(tree);
	markClauses(tree);
	const c: Ctx = { o, unit: ' '.repeat(o.indent) };
	// markKeywords runs on every level; clause keywords are marked while printing.
	return query(tree, '', c).join('\n');
}

// ---- linter ---------------------------------------------------------------

export type Severity = 'warning' | 'info';

export interface Finding {
	ruleId: string;
	severity: Severity;
	/** Short rule name. */
	rule: string;
	/** The exact text in the query that triggered the rule. */
	match: string;
	/** Plain-language reason, hedged: these are heuristics, not proof. */
	reason: string;
	/** Root-relative link to the related governor limit. */
	href: string;
}

export interface RuleInfo {
	id: string;
	severity: Severity;
	rule: string;
	flags: string;
	why: string;
	href: string;
	hrefLabel: string;
}

export const MANY_FIELDS_THRESHOLD = 50;

export const RULES: RuleInfo[] = [
	{
		id: 'leading-wildcard',
		severity: 'warning',
		rule: "LIKE with a leading wildcard, such as LIKE '%abc'",
		flags: "A LIKE filter whose pattern starts with %.",
		why: 'An index is ordered by the start of a value, so a pattern that starts with a wildcard generally cannot use it. The filter may be non-selective and the query may scan many records. If you need to find text anywhere in a field, SOSL is built for that.',
		href: '/tools/governor-limits/#soql-run-time',
		hrefLabel: 'SOQL run time limit',
	},
	{
		id: 'negative-operator',
		severity: 'warning',
		rule: 'Negative operator in WHERE: !=, <>, NOT IN, NOT LIKE or EXCLUDES',
		flags: 'A negative filter operator in the WHERE clause. Comparing with null (!= null) is not flagged.',
		why: 'Negative filters match everything except a few values, so they generally cannot narrow the data through an index and may be non-selective. Prefer a positive filter, for example IN with the values you want, when you can.',
		href: '/tools/governor-limits/#soql-run-time',
		hrefLabel: 'SOQL run time limit',
	},
	{
		id: 'no-where',
		severity: 'warning',
		rule: 'No WHERE clause',
		flags: 'The main query has no WHERE clause.',
		why: 'Without a filter the query reads every record of the object (limited by LIMIT, if present). On a large object it may be slow, and in Apex it can reach the limit on records retrieved.',
		href: '/tools/governor-limits/#soql-rows',
		hrefLabel: 'Records retrieved limit',
	},
	{
		id: 'no-limit',
		severity: 'info',
		rule: 'No LIMIT',
		flags: 'The main query has no LIMIT and is not an aggregate query.',
		why: 'If you only need a bounded number of records, say so with LIMIT. Without it, a query can return every matching record, and Apex stops a transaction that retrieves too many.',
		href: '/tools/governor-limits/#soql-rows',
		hrefLabel: 'Records retrieved limit',
	},
	{
		id: 'order-without-limit',
		severity: 'info',
		rule: 'ORDER BY without LIMIT',
		flags: 'The main query sorts but has no LIMIT.',
		why: 'Sorting a large result costs more than returning it unsorted. If you only need the top or bottom records, add LIMIT so the sort is worth it.',
		href: '/tools/governor-limits/#soql-rows',
		hrefLabel: 'Records retrieved limit',
	},
	{
		id: 'many-fields',
		severity: 'info',
		rule: `SELECT of more than ${MANY_FIELDS_THRESHOLD} fields`,
		flags: `More than ${MANY_FIELDS_THRESHOLD} top-level items in the SELECT list. The threshold is our own choice, not a Salesforce limit.`,
		why: 'Every selected field is held in memory for every returned record, so wide queries use more heap. Select only the fields the code reads.',
		href: '/tools/governor-limits/#heap-size',
		hrefLabel: 'Heap size limit',
	},
];

const RULE_BY_ID = new Map(RULES.map((r) => [r.id, r]));

function finding(id: string, match: string): Finding {
	const r = RULE_BY_ID.get(id)!;
	return { ruleId: id, severity: r.severity, rule: r.rule, match, reason: r.why, href: r.href };
}

const AGGREGATES = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COUNT_DISTINCT']);

/**
 * Conservative checks that a query alone can justify. Real selectivity depends on
 * the org's data volume and indexes, so every finding is a hint, not a verdict.
 * Subqueries are not checked for missing WHERE or LIMIT, only for filter patterns.
 */
export function lintSoql(src: string): Finding[] {
	const tree = parse(tokenize(src));
	if (!tree.length) return [];
	const findings: Finding[] = [];
	const { clauses } = splitClauses(tree);
	if (!clauses.some((c) => c.name === 'SELECT') || !clauses.some((c) => c.name === 'FROM')) return [];
	const names = new Set(clauses.map((c) => c.name));

	const lintFilters = (nodes: Node[]) => {
		const { clauses: cs } = splitClauses(nodes);
		for (const cl of cs.filter((x) => x.name === 'WHERE')) scanFilter(cl.body);
	};
	const scanFilter = (nodes: Node[]) => {
		nodes.forEach((n, i) => {
			if (n.t === 'group') {
				if (isSub(n)) lintFilters(n.children);
				else scanFilter(n.children);
				return;
			}
			if (n.kind === 'op' && (n.text === '!=' || n.text === '<>')) {
				// "!= null" is a common, different pattern; this checker does not judge it.
				if (!isW(nodes[i + 1], 'NULL')) findings.push(finding('negative-operator', n.text));
			}
			else if (isW(n, 'EXCLUDES')) findings.push(finding('negative-operator', 'EXCLUDES'));
			else if (isW(n, 'NOT') && (isW(nodes[i + 1], 'IN') || isW(nodes[i + 1], 'LIKE'))) findings.push(finding('negative-operator', `NOT ${up(nodes[i + 1])}`));
			else if (isW(n, 'LIKE')) {
				const p = nodes[i + 1];
				if (p && p.t === 'tok' && p.kind === 'string' && p.text.startsWith("'%")) findings.push(finding('leading-wildcard', `LIKE ${p.text}`));
			}
		});
	};
	// Filters anywhere in the main query, including semi-join subqueries.
	for (const cl of clauses) {
		if (cl.name === 'WHERE') scanFilter(cl.body);
		else if (cl.name === 'SELECT' || cl.name === 'FROM') cl.body.forEach((n) => n.t === 'group' && isSub(n) && lintFilters(n.children));
	}

	if (!names.has('WHERE')) findings.push(finding('no-where', 'no WHERE clause'));
	const sel = clauses.find((c) => c.name === 'SELECT')!;
	const aggregate = sel.body.some((n, i) => n.t === 'tok' && n.kind === 'word' && AGGREGATES.has(n.text.toUpperCase()) && sel.body[i + 1]?.t === 'group');
	if (!names.has('LIMIT') && !aggregate && !names.has('GROUP')) findings.push(finding('no-limit', 'no LIMIT'));
	if (names.has('ORDER') && !names.has('LIMIT')) findings.push(finding('order-without-limit', 'ORDER BY'));
	const fields = selectItems(sel.body).length;
	if (fields > MANY_FIELDS_THRESHOLD) findings.push(finding('many-fields', `${fields} fields`));
	// One finding per rule and match text.
	const seen = new Set<string>();
	return findings.filter((f) => !seen.has(f.ruleId + f.match) && seen.add(f.ruleId + f.match));
}

// ---- examples (rendered at build time and offered by "Try an example") ----

export const EXAMPLES: { title: string; note: string; query: string }[] = [
	{
		title: 'Parent-child subquery and a semi-join',
		note: 'A child subquery in SELECT and a semi-join subquery in WHERE each get their own indented block.',
		query: "select Id,Name,(select Id,LastName from Contacts where Email!=null order by LastName limit 5) from Account where Industry='Technology' and Id in (select AccountId from Opportunity where StageName='Closed Won') order by Name limit 100",
	},
	{
		title: 'Bind variables and date literals',
		note: 'Bind variables, LAST_N_DAYS:n literals and string escapes are kept exactly as written.',
		query: "SELECT Id, Subject FROM Task WHERE OwnerId = :ownerId AND CreatedDate = LAST_N_DAYS:30 AND (Subject LIKE '%O\\'Brien%' OR Status IN :statuses) AND ActivityDate >= 2026-01-01",
	},
	{
		title: 'TYPEOF and a query tail',
		note: 'TYPEOF branches are indented, and SECURITY_ENFORCED, GROUP BY, ORDER BY, LIMIT, OFFSET and FOR VIEW stay on their own lines.',
		query: 'SELECT TYPEOF What WHEN Account THEN Phone, NumberOfEmployees WHEN Opportunity THEN Amount, CloseDate ELSE Name END, Subject FROM Event WHERE IsAllDayEvent = true WITH SECURITY_ENFORCED ORDER BY Subject DESC NULLS LAST LIMIT 20 OFFSET 40 FOR VIEW',
	},
	{
		title: 'Aggregate query',
		note: 'GROUP BY and HAVING with aggregate functions.',
		query: 'select StageName, COUNT(Id) total, SUM(Amount) revenue from Opportunity where CloseDate = THIS_YEAR group by StageName having COUNT(Id) > 5 order by SUM(Amount) desc',
	},
];
