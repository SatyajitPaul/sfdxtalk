import type { SkillMeta } from '../../lib/skills';

const meta: SkillMeta = {
	slug: 'flow-explainer',
	title: 'Flow Explainer',
	tagline: 'Reads a Salesforce Flow and explains what it does, what it touches and where it could break.',
	description:
		'A free Agent Skill that retrieves or reads a Salesforce Flow and explains its trigger, path, data access, fault handling and risks in plain language.',
	category: 'flow',
	tags: ['flow', 'automation', 'sf-cli', 'metadata', 'agent-skills'],
	summary:
		'This skill teaches an AI assistant to read a Salesforce Flow, from a flow-meta.xml file or one retrieved with the sf CLI, and explain it in plain language. It reports the trigger, the step-by-step path, the objects and fields it reads and writes, fault handling and risks. It never edits or activates a flow.',
	does: [
		'Retrieves a flow with sf project retrieve start --metadata Flow:<ApiName>, or reads a flow-meta.xml you provide or your project already holds.',
		'Classifies the trigger and entry conditions: record-triggered before or after save, scheduled, platform event, or an invoked flow.',
		'Walks the elements in execution order, including decisions, assignments, record operations, loops, subflows, Apex and other actions, and screens.',
		'Lists every object and field the flow reads, creates, updates or deletes.',
		'Flags risks it can see in the XML: data elements inside loops, missing fault paths, hard-coded IDs, no entry filter and run context.',
	],
	whenToUse: [
		'You inherited an org and need to know what a Flow actually does before changing it.',
		'A record is changing unexpectedly and you want to know whether a Flow could be the cause.',
		'You want a risk review of a record-triggered Flow before it goes to production.',
		'You need a plain-language description of a Flow for documentation or a hand-off.',
	],
	needs: {
		connection:
			'A flow-meta.xml file, or the Salesforce CLI logged in to an org inside an SFDX project so the flow can be retrieved. A Salesforce MCP server can help describe objects and fields. Without a connection, paste the XML.',
		permissions:
			'Permission to retrieve metadata from the org (the Customize Application or View Setup access your admin grants for metadata retrieval). A sandbox is recommended. The skill only reads.',
	},
	howItWorks: [
		'It identifies the flow by API name and gets the XML from your project, your paste, or an sf project retrieve start call.',
		'It reads the header and start element to determine the flow type, status, trigger and entry conditions.',
		'It follows every connector and fault connector from the start element and numbers the steps in execution order.',
		'It collects the objects, fields and filters used by Get, Create, Update and Delete Records elements.',
		'It checks fault handling and applies a risk checklist to the elements it found.',
		'It returns a summary, a numbered walkthrough, a risks list and a list of unknowns.',
	],
	safety: [
		'Read-only: it never edits the flow file and never runs deploy, activate, deactivate or delete commands.',
		'It explains only what the XML shows and marks called Apex and subflows as unread unless it read them.',
		'It does not present order-of-execution interactions as fact; it lists them as items to check.',
		'It reports that hard-coded IDs or sensitive values exist without pasting personal data.',
		'It states what it could not verify instead of guessing.',
	],
	tryAsking: [
		'Retrieve the flow Opportunity_After_Save_Update and explain what it does.',
		'Explain force-app/main/default/flows/Case_Escalation.flow-meta.xml and list the risks.',
		'Does any record-triggered flow in my project update Account.Rating? Explain the ones that do.',
		'Walk me through this flow XML step by step: (paste XML).',
	],
	faq: [
		{
			q: 'Can this skill change or activate a Flow?',
			a: 'No. The skill instructs the assistant to only read the flow. It retrieves metadata to a local file and never runs deploy, activate or delete commands. Use a sandbox and a read-only connection if you want a stronger guarantee, because instructions are not a security control.',
		},
		{
			q: 'How does it get the Flow?',
			a: 'It reads a flow-meta.xml you paste or that sits in your SFDX project, or it runs sf project retrieve start --metadata Flow:<ApiName> inside the project. If the retrieve returns nothing, it asks you to check the exact API name.',
		},
		{
			q: 'Does it explain Process Builder processes too?',
			a: 'It can read the XML of any flow-type metadata and describe the elements it recognizes, but the Process Builder to Flow Migration skill is built for planning a move to Flow and mapping criteria and actions.',
		},
		{
			q: 'Will it find every risk?',
			a: 'No. It reports risks visible in the XML, such as data elements in loops or missing fault paths. It cannot see other triggers, flows or validation rules on the same object, so it lists order-of-execution interactions as things for you to check.',
		},
		{
			q: 'Does it work with assistants other than Claude?',
			a: 'Yes. Assistants that support the Agent Skills format can load the folder. For any other LLM, paste the contents of SKILL.md into the system prompt and give it the flow XML.',
		},
	],
	related: {
		tools: ['async-apex-chooser', 'governor-limits'],
		prompts: ['explain-a-salesforce-flow', 'convert-process-builder-to-flow'],
		docs: ['sf-cli/salesforce-cli-reference-guide', 'apex/trigger-handler-pattern'],
	},
	refs: [
		'https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_retrieve_start.html',
		'https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_flow.htm',
		'https://agentskills.io/specification',
	],
	version: '1.0.0',
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default meta;
