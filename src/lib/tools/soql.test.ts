// Run with: node --test src/lib/tools/soql.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXAMPLES, KEYWORDS, formatSoql, lintSoql, tokenize } from './soql.ts';

const QUERIES = [
	...EXAMPLES.map((e) => e.query),
	'SELECT Id FROM Account',
	"SELECT Id FROM Account WHERE Name = 'It\\'s a \\\\ test' AND Description LIKE '%a b (c)%'",
	'SELECT Id FROM Account WHERE CreatedDate > 2026-01-01T10:00:00Z AND LastModifiedDate < 2026-02-03T04:05:06.000+01:00',
	'SELECT Id FROM Opportunity WHERE CloseDate = LAST_N_DAYS:5 OR CloseDate = NEXT_N_FISCAL_QUARTERS:2',
	'SELECT Id FROM Account WHERE Id IN :ids AND OwnerId = :UserInfo.getUserId() AND Amount__c > -12.5',
	'SELECT Id FROM Account WHERE (Name = :n AND (Type = null OR Type != \'x\')) OR NOT (Industry IN (\'A\',\'B\'))',
	'SELECT a.Name, a.Owner.Name FROM Account a WHERE a.Id != null',
	'SELECT toLabel(Status), FORMAT(Amount) amt, convertCurrency(Amount), COUNT_DISTINCT(Name) FROM Case GROUP BY ROLLUP(Status, Type)',
	'SELECT Id FROM Account USING SCOPE Mine WHERE Name != null ORDER BY Name ASC NULLS FIRST, Id DESC NULLS LAST LIMIT 10 OFFSET 5 FOR UPDATE',
	'SELECT Id FROM Account ALL ROWS',
	'SELECT Id FROM Order WHERE Status = \'Draft\'',
	'SELECT Id FROM Knowledge__kav WITH DATA CATEGORY Geography__c ABOVE_OR_BELOW usa__c AND Product__c AT x__c',
	'SELECT Id FROM Account FOR VIEW',
	'SELECT Id FROM Account FOR REFERENCE',
	'SELECT Id FROM Account UPDATE TRACKING',
	'SELECT Id, (SELECT Id, (SELECT Id FROM Notes) FROM Contacts) FROM Account',
	"SELECT Id FROM Account WHERE Id NOT IN (SELECT AccountId FROM Contact WHERE (LastName LIKE 'A%' OR LastName LIKE 'B%') AND Email != null)",
	'SELECT Id FROM Contact WHERE Interests__c EXCLUDES (\'a\',\'b\') AND Skills__c INCLUDES (\'x;y\')',
	'select   id ,name\nfrom\naccount\n\twhere  name =  \'a  b\'   and\n id>\'x\'',
	'SELECT COUNT() FROM Account WHERE CreatedDate = THIS_YEAR',
	'SELECT Id FROM Account WHERE Name = \'unterminated',
	'SELECT Id FROM Account WHERE (Name = \'a\'',
	'SELECT Id FROM Account WHERE Name = \'a\')',
	'SELECT Id FROM Account WHERE AnnualRevenue >= 1.5e3 AND Name <= \'z\' AND X__c = USD100',
];

const OPTION_SETS = [
	{},
	{ layout: 'compact' as const },
	{ keywordCase: 'keep' as const },
	{ indent: 4, layout: 'expanded' as const, keywordCase: 'keep' as const },
	{ indent: 1, layout: 'compact' as const, keywordCase: 'keep' as const },
];

const norm = (src: string, keepCase: boolean) =>
	tokenize(src).map((t) => (t.kind === 'word' && !keepCase && KEYWORDS.has(t.text.toUpperCase()) ? t.text.toUpperCase() : t.text));

test('tokens are identical before and after formatting for every query and option set', () => {
	for (const q of QUERIES) {
		for (const opts of OPTION_SETS) {
			const out = formatSoql(q, opts);
			const keep = opts.keywordCase === 'keep';
			assert.deepEqual(norm(out, keep), norm(q, keep), `tokens changed for: ${q}\n${out}`);
		}
	}
});

test('keep mode leaves keyword case exactly as typed', () => {
	const out = formatSoql("select Id from Account where Name = 'a'", { keywordCase: 'keep' });
	assert.match(out, /^select\b/);
	assert.match(out, /\nfrom\b/);
	assert.match(out, /\nwhere\b/);
});

test('formatting is idempotent', () => {
	for (const q of QUERIES) {
		const once = formatSoql(q);
		assert.equal(formatSoql(once), once, q);
	}
});

test('expanded layout puts fields and conditions on their own lines', () => {
	assert.equal(
		formatSoql("select Id,Name from Account where Industry='Tech' and Type='Customer' order by Name limit 5"),
		["SELECT", "  Id,", "  Name", "FROM Account", "WHERE Industry = 'Tech'", "  AND Type = 'Customer'", "ORDER BY Name", "LIMIT 5"].join('\n'),
	);
});

test('compact layout keeps fields and conditions on one line each', () => {
	assert.equal(
		formatSoql("select Id,Name from Account where Industry='Tech' and Type='Customer' limit 5", { layout: 'compact' }),
		["SELECT Id, Name", 'FROM Account', "WHERE Industry = 'Tech' AND Type = 'Customer'", 'LIMIT 5'].join('\n'),
	);
});

test('indent size is honoured', () => {
	assert.match(formatSoql('select Id from Account', { indent: 4 }), /\n {4}Id\n/);
});

test('string literals, bind variables and date literals are untouched', () => {
	const out = formatSoql("select Id from Task where A = 'x  AND  \\'y\\'' and B = :a.b and C = LAST_N_DAYS:5 and D = 2026-01-01");
	assert.ok(out.includes("'x  AND  \\'y\\''"));
	assert.ok(out.includes('= :a.b'));
	assert.ok(out.includes('LAST_N_DAYS:5'));
	assert.ok(out.includes('2026-01-01'));
	assert.deepEqual(tokenize('A = LAST_N_DAYS:5').map((t) => t.text), ['A', '=', 'LAST_N_DAYS:5']);
});

test('subqueries are indented and the closing parenthesis returns to the outer level', () => {
	const out = formatSoql('select Id, (select Id from Contacts) from Account');
	assert.equal(out, ['SELECT', '  Id,', '  (', '    SELECT', '      Id', '    FROM Contacts', '  )', 'FROM Account'].join('\n'));
});

test('compact layout keeps short subqueries inline', () => {
	assert.equal(formatSoql('select Id, (select Id from Contacts) from Account', { layout: 'compact' }), 'SELECT Id, (SELECT Id FROM Contacts)\nFROM Account');
});

test('object named Order is not mistaken for ORDER BY', () => {
	assert.equal(formatSoql('select Id from order'), ['SELECT', '  Id', 'FROM order'].join('\n'));
});

test('function calls have no space before the parenthesis, IN does', () => {
	const out = formatSoql("select COUNT(Id) from Account where Id in ('a')", { layout: 'compact' });
	assert.ok(out.includes('COUNT(Id)'));
	assert.ok(out.includes("IN ('a')"));
});

test('TYPEOF branches are indented', () => {
	const out = formatSoql('select TYPEOF What when Account then Phone when Opportunity then Amount else Name end, Subject from Event');
	assert.ok(out.includes('  TYPEOF What\n    WHEN Account THEN Phone\n    WHEN Opportunity THEN Amount\n    ELSE Name\n  END,\n  Subject'));
});

test('empty input gives empty output', () => {
	assert.equal(formatSoql('   \n '), '');
	assert.deepEqual(lintSoql(''), []);
});

const ids = (q: string) => lintSoql(q).map((f) => f.ruleId).sort();

test('lint: leading wildcard', () => {
	assert.ok(ids("SELECT Id FROM Account WHERE Name LIKE '%abc' LIMIT 1").includes('leading-wildcard'));
	assert.ok(!ids("SELECT Id FROM Account WHERE Name LIKE 'abc%' LIMIT 1").includes('leading-wildcard'));
});

test('lint: negative operators in WHERE only', () => {
	for (const w of ["A != 1", "A <> 1", "A NOT IN (1)", "A NOT LIKE 'x%'", "A EXCLUDES ('x')"]) {
		assert.ok(ids(`SELECT Id FROM Account WHERE ${w} LIMIT 1`).includes('negative-operator'), w);
	}
	assert.ok(!ids('SELECT Id FROM Account WHERE A = 1 LIMIT 1').includes('negative-operator'));
	assert.ok(!ids("SELECT Id FROM Account WHERE Name = 'a != b' LIMIT 1").includes('negative-operator'));
});

test('lint: != null is not flagged', () => {
	assert.ok(!ids('SELECT Id FROM Account WHERE Email != null LIMIT 1').includes('negative-operator'));
	assert.ok(!ids('SELECT Id FROM Account WHERE Email <> NULL LIMIT 1').includes('negative-operator'));
});

test('lint: negative operator inside a semi-join is found', () => {
	assert.ok(ids('SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact WHERE Type != \'x\') LIMIT 1').includes('negative-operator'));
});

test('lint: missing WHERE and LIMIT, ORDER BY without LIMIT', () => {
	assert.deepEqual(ids('SELECT Id FROM Account'), ['no-limit', 'no-where']);
	assert.deepEqual(ids('SELECT Id FROM Account ORDER BY Name'), ['no-limit', 'no-where', 'order-without-limit']);
	assert.deepEqual(ids('SELECT Id FROM Account WHERE Name = \'a\' LIMIT 5'), []);
});

test('lint: subqueries are not flagged for missing WHERE or LIMIT', () => {
	assert.deepEqual(ids("SELECT Id, (SELECT Id FROM Contacts) FROM Account WHERE Name = 'a' LIMIT 5"), []);
});

test('lint: aggregate queries are not flagged for missing LIMIT', () => {
	assert.deepEqual(ids("SELECT COUNT() FROM Account WHERE Name = 'a'"), []);
	assert.deepEqual(ids("SELECT Type, COUNT(Id) FROM Account WHERE Name = 'a' GROUP BY Type"), []);
});

test('lint: very many fields', () => {
	const fields = Array.from({ length: 51 }, (_, i) => `F${i}__c`).join(', ');
	assert.ok(ids(`SELECT ${fields} FROM Account WHERE Name = 'a' LIMIT 1`).includes('many-fields'));
	assert.ok(!ids("SELECT Id, (SELECT A, B FROM Contacts) FROM Account WHERE Name = 'a' LIMIT 1").includes('many-fields'));
});

test('lint: findings carry severity, reason and a governor-limits link', () => {
	for (const f of lintSoql('SELECT Id FROM Account WHERE Name LIKE \'%a\'')) {
		assert.ok(['warning', 'info'].includes(f.severity));
		assert.ok(f.reason.length > 20 && f.rule && f.match);
		assert.match(f.href, /^\/tools\/governor-limits\/#[a-z-]+$/);
	}
});

test('lint: text that is not a SELECT query gives no findings', () => {
	assert.deepEqual(lintSoql('hello world'), []);
});
