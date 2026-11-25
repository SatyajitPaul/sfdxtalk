import type { SkillMeta } from '../../lib/skills';

const meta: SkillMeta = {
	slug: 'process-builder-to-flow-migration',
	title: 'Process Builder to Flow Migration Planner',
	tagline: 'Inventories your Process Builder processes and plans the move to Flow, without changing the org.',
	description:
		'A free Agent Skill that inventories Process Builder processes, maps them to Flow and writes a migration plan with a test plan. It never changes your org.',
	category: 'flow',
	tags: ['process-builder', 'flow', 'migration', 'sf-cli', 'agent-skills'],
	summary:
		'This skill teaches an AI assistant to plan a Process Builder to Flow migration. It inventories active processes, reads each definition, maps criteria and actions to Flow equivalents, flags what does not map cleanly, and writes an ordered migration plan with a test plan. It is read-only: all changes are made by a human in a sandbox.',
	does: [
		'Inventories active Process Builder processes with a Tooling API query on Flow where ProcessType is Workflow, and groups them by object.',
		'Retrieves each process definition with sf project retrieve start and reads its criteria and actions.',
		'Maps each criteria node and action to the Flow equivalent: decision, update or create records, email alert, invocable Apex, Chatter post, quick action and subflow.',
		'Flags what does not map cleanly: scheduled actions, formulas, evaluate-next logic and order-of-execution changes.',
		'Recommends consolidating into one record-triggered flow per object and timing, and chooses before save or after save.',
	],
	whenToUse: [
		'You still have active Process Builder processes and want a plan to move them to Flow.',
		'You want to consolidate several processes on one object into a single record-triggered flow.',
		'You want to know what Salesforce Migrate to Flow can handle and what needs a manual rebuild.',
		'You need a test plan to prove a new flow behaves like the old process.',
	],
	needs: {
		connection:
			'The Salesforce CLI logged in to an org (and an SFDX project to retrieve metadata into), or a Salesforce MCP server that can query, or process XML you provide. Without a connection, paste the XML.',
		permissions:
			'Permission to query Flow through the Tooling API and to retrieve metadata. Use a sandbox. The skill only reads.',
	},
	howItWorks: [
		'It queries Flow where ProcessType is Workflow and Status is Active to list the processes, and groups them by object.',
		'It retrieves each process as Flow metadata and reads the start condition, criteria nodes and actions.',
		'It maps every criteria node and action using a mapping table that ships with the skill.',
		'It flags items that need a design decision, such as scheduled actions and evaluate-next logic.',
		'It recommends Migrate to Flow in Setup or a manual rebuild per process, and designs the target flows per object and timing.',
		'It writes an ordered plan and a test plan, and lists what it could not verify.',
	],
	safety: [
		'Read-only: it never modifies, activates, deactivates or deletes a process or flow, and never runs DML or deploys.',
		'It does not run the Migrate to Flow tool; that is a Setup action for a human.',
		'It plans for changes in a sandbox first and keeps the old process active until the new flow is verified.',
		'It states the Process Builder retirement timeline only as announced by Salesforce and sends you to the current announcement; it gives no shutdown date.',
		'It marks anything it cannot read from the XML as unknown instead of guessing.',
	],
	tryAsking: [
		'List all active Process Builder processes in my org by object.',
		'Plan the migration of the Opportunity processes to Flow and consolidate them.',
		'Read the process Case_Routing and map each criteria and action to Flow.',
		'Write a test plan to prove the new Account flow behaves like the old process.',
	],
	faq: [
		{
			q: 'Will this skill migrate my processes for me?',
			a: 'No. It plans. It reads the processes, maps them to Flow and writes the plan. A human builds or migrates the flows in a sandbox, tests them and decides when to deactivate the old process.',
		},
		{
			q: 'How does it find Process Builder processes?',
			a: 'Process Builder processes are stored as Flow records with ProcessType Workflow. The skill runs a Tooling API query for active ones, and if the query fails it falls back to checking Setup, Process Automation, Process Builder.',
		},
		{
			q: 'Should I use Salesforce Migrate to Flow or rebuild by hand?',
			a: 'The skill offers both and recommends one per process. It does not claim what the Migrate to Flow tool supports beyond what Setup reports for each process. Complex processes with scheduled actions or evaluate-next logic usually need review either way.',
		},
		{
			q: 'When does Process Builder stop working?',
			a: 'The skill does not state a shutdown date. Secondary sources report that Salesforce set end of support for Workflow Rules and Process Builder at December 31, 2025. Check Salesforce\'s current announcement for the exact impact on your org.',
		},
		{
			q: 'Does it work with assistants other than Claude?',
			a: 'Yes. Assistants that support the Agent Skills format can load the folder. For any other LLM, paste SKILL.md and the mapping reference into the system prompt, and give it the process XML.',
		},
	],
	related: {
		tools: ['async-apex-chooser', 'governor-limits'],
		prompts: ['convert-process-builder-to-flow', 'explain-a-salesforce-flow'],
		docs: ['sf-cli/salesforce-cli-reference-guide', 'apex/trigger-handler-pattern'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_flow.htm',
		'https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_retrieve_start.html',
		'https://agentskills.io/specification',
	],
	version: '1.0.0',
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default meta;
