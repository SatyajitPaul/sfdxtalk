import type { SkillMeta } from '../../lib/skills';

const meta: SkillMeta = {
	slug: 'salesforce-org-explorer',
	title: 'Salesforce Org Explorer',
	tagline: 'Maps an org\'s objects, fields, relationships and automation without changing anything.',
	description:
		'A free Agent Skill that maps a Salesforce org: objects, fields, relationships, triggers, flows and validation rules, through MCP or the sf CLI, read only.',
	category: 'metadata',
	tags: ['org', 'metadata', 'schema', 'mcp', 'sf-cli', 'agent-skills'],
	summary:
		'This skill teaches an AI assistant to explore a Salesforce org read only and explain it in plain language. It discovers objects and fields through MCP schema tools or the sf CLI, finds the triggers, flows and validation rules on an object, and reports risks and anything it could not see. It never writes data or metadata.',
	does: [
		'Finds objects with the MCP getObjectSchema two-phase discovery (index first, then one object) or sf sobject list and sf sobject describe.',
		'Summarizes an object: key fields, lookup and master-detail relationships, child relationships, record types and picklist values.',
		'Lists the Apex triggers, validation rules and flows on an object through read-only Tooling API queries and sf org list metadata.',
		'Traces where a field is used with the Tooling API MetadataComponentDependency object, and says when the result may be incomplete.',
		'Flags risks such as several triggers or record-triggered flows on one object, and lists what it could not see with the permissions in use.',
	],
	whenToUse: [
		'You joined a project and need a quick map of an unfamiliar org or object.',
		'You are about to change a field and want to know what depends on it.',
		'You want to know what automation fires when a record is saved before you add more.',
		'You need a plain-language summary of an object for documentation or a design review.',
	],
	needs: {
		connection:
			'A Salesforce MCP server with schema tools (for example the hosted platform/sobject-reads server) or the Salesforce CLI logged in to an org. Without a connection it works only from output you paste in.',
		permissions:
			'Read access to the objects you ask about. Listing metadata with the CLI needs Modify Metadata Through Metadata API Functions or Modify All Data, so some steps may be unavailable to a restricted user. The skill reports what it could not see.',
	},
	howItWorks: [
		'It reads the org context (getUserInfo or sf org display) and says whether the org is production.',
		'It narrows the question to one object, one area or one field, asking one short question if the name is ambiguous.',
		'It finds and describes the object with getObjectSchema or sf sobject describe and keeps only the fields that explain it.',
		'It queries triggers, validation rules and flows on the object with read-only Tooling API queries, checking real field names with a describe when a query fails.',
		'It traces field usage with the dependency object, and can retrieve specific metadata into a temporary project when you need a formula or definition.',
		'It writes a map with risks and a clear list of what it could not see.',
	],
	safety: [
		'Read-only: no DML, no deploys, no anonymous Apex, and no tool or command that creates, updates or deletes records or metadata.',
		'It uses only object and field names it has seen in tool output and never guesses an API name.',
		'It separates "no access", "empty result" and "does not exist" instead of presenting gaps as facts.',
		'It asks before writing retrieved metadata files into your project folder.',
		'It reads structure and configuration, not record data, and treats metadata as sensitive.',
	],
	tryAsking: [
		'Give me a map of the Opportunity object: key fields, record types, and every trigger, flow and validation rule on it.',
		'Where is Contract_Value__c used in this org?',
		'Which custom objects exist in this sandbox, and which ones look unused?',
		'What automation fires when a Case is closed? Flag anything risky.',
	],
	faq: [
		{
			q: 'Can this skill change anything in my org?',
			a: 'No. The skill only reads schema and configuration and tells the assistant never to run DML, deploys, anonymous Apex or any write tool. Instructions are not a security control, so use a read-only server or a user without edit access, and a sandbox first.',
		},
		{
			q: 'What is two-phase discovery in getObjectSchema?',
			a: 'Calling the tool without an object name returns a lightweight index of accessible objects. Calling it with an object name returns that object\'s fields, record types and relationships. It keeps large orgs from flooding the assistant\'s context.',
		},
		{
			q: 'Will it find every place a field is used?',
			a: 'Not always. It uses the Tooling API MetadataComponentDependency object, which is documented as beta, limits Tooling queries to 2,000 records and does not cover reports. The skill presents the result as the places it found and says the list may be incomplete.',
		},
		{
			q: 'Why might some steps fail for me?',
			a: 'Listing and retrieving metadata needs extra permissions such as Modify Metadata Through Metadata API Functions or Modify All Data. When a query is refused or a field is not available, the skill continues with what it can see and lists the gap under what it could not see.',
		},
		{
			q: 'Does it work with assistants other than Claude?',
			a: 'Yes. Assistants that support the Agent Skills format can load the folder. For any other model, paste SKILL.md into the system prompt and give it a Salesforce MCP server or CLI access.',
		},
	],
	related: {
		tools: ['package-xml-generator', 'salesforce-id-converter'],
		docs: ['agentforce/sobject-and-headless-mcp-servers', 'sf-cli/salesforce-cli-reference-guide', 'agentforce/hosted-mcp-servers-setup'],
	},
	refs: [
		'https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_sobject_describe.html',
		'https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_org_list_metadata.html',
		'https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_metadatacomponentdependency.htm',
		'https://agentskills.io/specification',
	],
	version: '1.0.0',
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default meta;
