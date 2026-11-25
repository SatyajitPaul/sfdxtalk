import type { SkillMeta } from '../../lib/skills';

const meta: SkillMeta = {
	slug: 'soql-query-assistant',
	title: 'SOQL Query Assistant',
	tagline: 'Writes, checks and runs read-only SOQL against your org, using real field names.',
	description:
		'A free Agent Skill that writes, checks and runs read-only SOQL through a Salesforce MCP server or the sf CLI, using real field names from your org.',
	category: 'data',
	tags: ['soql', 'mcp', 'queries', 'sf-cli', 'agent-skills'],
	summary:
		'This skill teaches an AI assistant to turn a plain-language question about Salesforce data into a correct, read-only SOQL query. It discovers real field API names first, runs the query through a Salesforce MCP server or the sf CLI, and explains the result. It never changes data.',
	does: [
		'Discovers objects and field API names with the MCP getObjectSchema tool or sf sobject describe before it writes a query.',
		'Writes SOQL with parent fields, child subqueries, date literals and aggregates, and fixes queries that fail.',
		'Runs a bounded first query, then reports the row count and the key findings.',
		'Warns about patterns that are often slow on large objects, such as leading wildcards and negative filters.',
		'Falls back to writing the query without running it when no connection is available.',
	],
	whenToUse: [
		'You want to find, count or list records and do not remember the exact field names.',
		'A query fails with an invalid field or relationship error and you want it fixed.',
		'You want a query explained, tightened or checked before it goes into Apex.',
		'You want an assistant to answer data questions without any risk of it editing records.',
	],
	needs: {
		connection:
			'A Salesforce MCP server that exposes query tools (for example the hosted platform/sobject-reads server) or the Salesforce CLI logged in to an org. Without a connection it still writes queries but cannot run them.',
		permissions:
			'Read access to the objects and fields you ask about. Use a read-only server or permission set, and a sandbox first. The connection enforces your profile, permission sets and field-level security.',
	},
	howItWorks: [
		'It clarifies the object, filters and expected result size, and asks one short question if something is ambiguous.',
		'It inspects the schema with getObjectSchema (MCP) or sf sobject describe (CLI) so every field name is real.',
		'It writes the query using a checklist for correctness and efficiency, with named fields, bound values and a LIMIT.',
		'It runs a bounded version first (soqlQuery on MCP, or sf data query), then the full query if needed.',
		'It reports the query, the row count and the findings, and says if a limit truncated the result.',
		'If the query errors, it reads the message, fixes the query and runs it again.',
	],
	safety: [
		'Read-only: it never runs DML, anonymous Apex or any tool that creates, updates or deletes records.',
		'It never invents field names. A field missing from the schema result is treated as unreadable or non-existent.',
		'It does not work around field-level security.',
		'It treats query results as sensitive and does not repeat personal data beyond what you asked for.',
		'It flags non-selective patterns instead of silently running them.',
	],
	tryAsking: [
		'How many open Opportunities over $50,000 closed in the last quarter, grouped by owner?',
		'List the Accounts with no Contacts, newest first. Show the first 20.',
		'This query fails with "No such column": fix it. SELECT Id, Total_Amount__c FROM Opportunity',
		'Which Cases are older than 30 days and still open? Write the SOQL and run it.',
	],
	faq: [
		{
			q: 'Can this skill change or delete my Salesforce data?',
			a: 'No. The skill instructs the assistant to run read-only queries and never to use a write tool. Your connection should also be read-only, because instructions are not a security control. Use the hosted platform/sobject-reads server or a permission set without edit access.',
		},
		{
			q: 'Do I need an MCP server, or does the Salesforce CLI work?',
			a: 'Either works. With an MCP server the assistant uses getObjectSchema and soqlQuery. With the CLI it uses sf sobject describe and sf data query. Without any connection the skill still writes queries but states that it has not run them.',
		},
		{
			q: 'Why does it look at the schema before writing the query?',
			a: 'Assistants often guess field names and get them wrong, especially with custom fields such as Total_ARR__c. Reading the schema first means every field in the query was seen in your org.',
		},
		{
			q: 'How many records can it return?',
			a: 'A SOQL query can return up to 50,000 records in one transaction, and the MCP soqlQuery tool follows that limit. For larger exports, the skill suggests narrowing the filter or using Bulk API.',
		},
		{
			q: 'Does it work with assistants other than Claude?',
			a: 'Yes. Assistants that support the Agent Skills format can load the folder. For any other LLM, paste the contents of SKILL.md into the system prompt, and give it a Salesforce connection.',
		},
	],
	related: {
		tools: ['soql-formatter', 'governor-limits'],
		docs: ['agentforce/sobject-and-headless-mcp-servers', 'agentforce/hosted-mcp-servers-setup', 'sf-cli/salesforce-cli-reference-guide'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql.htm',
		'https://developer.salesforce.com/docs/einstein/genai/guide/mcp.html',
		'https://agentskills.io/specification',
	],
	version: '1.0.0',
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default meta;
