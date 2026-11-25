import type { SkillMeta } from '../../lib/skills';

const meta: SkillMeta = {
	slug: 'apex-code-reviewer',
	title: 'Apex Code Reviewer',
	tagline: 'Reviews Apex for bulk safety, security and test quality, and proposes fixes as diffs only.',
	description:
		'A free Agent Skill that reviews Apex for bulkification, governor limits, CRUD/FLS, SOQL injection and test quality, with prioritized findings and fixes.',
	category: 'apex',
	tags: ['apex', 'code-review', 'security', 'governor-limits', 'testing', 'agent-skills'],
	summary:
		'This skill teaches an AI assistant to review Apex classes, triggers and test classes the way a careful senior developer would. It finds bulkification, security and test-quality problems, ranks them high, medium or low with line references and corrected snippets, and lists what it did not review. It never edits or deploys code.',
	does: [
		'Checks for SOQL and DML in loops, single-record assumptions and other bulkification problems that fail in triggers and data loads.',
		'Reviews sharing keywords, CRUD and field-level security (with sharing, WITH USER_MODE, Security.stripInaccessible) and SOQL injection (bind variables, String.escapeSingleQuotes).',
		'Finds hard-coded IDs and URLs, recursion problems, trigger structure issues and async misuse.',
		'Reviews test classes for assertions, @TestSetup, SeeAllData and bulk coverage, and callouts for Named Credential use.',
		'Produces findings with severity, line reference, why it matters and a corrected snippet, plus a list of what was not reviewed.',
	],
	whenToUse: [
		'You want a second pair of eyes on a class or trigger before a pull request.',
		'A trigger fails during a data load and you suspect it is not bulk safe.',
		'You inherited Apex and need to know which parts are risky.',
		'You want a security pass on an @AuraEnabled controller or REST resource.',
	],
	needs: {
		connection:
			'No connection if you paste code or have the project locally. To review code that lives in an org, the Salesforce CLI logged in to it (sf project retrieve start or a Tooling API query on ApexClass) or an MCP server that can read Apex source.',
		permissions:
			'Reading Apex source from an org needs access to view Apex classes (for example View Setup and Configuration). Managed package code is hidden and cannot be reviewed.',
	},
	howItWorks: [
		'It gets the code: pasted, read from your local project, or retrieved from the org read-only.',
		'It lists the files in scope with their API versions and reads everything, including the test classes, before judging.',
		'It walks the checklist in references/apex-review-checklist.md, one section at a time.',
		'It verifies each finding against the exact line and drops anything it cannot support.',
		'It ranks findings high, medium or low and writes a minimal corrected snippet for each important one.',
		'It states what was not reviewed and that nothing was compiled, run or deployed.',
	],
	safety: [
		'It never edits files, deploys, runs anonymous Apex or changes anything in an org. Fixes appear only as snippets or diffs in the report.',
		'It reviews only code it has actually read and does not invent findings for code it was not given.',
		'It quotes governor limit numbers only from the verified list on this site and points to the governor limits tool for the rest.',
		'It marks uncertain findings as possible and says what would confirm them.',
		'It treats your code as confidential and asks before writing retrieved files into your project.',
	],
	tryAsking: [
		'Review this trigger and handler for bulkification and recursion. [paste code]',
		'Review force-app/main/default/classes/OrderService.cls and its test class. Focus on security.',
		'Retrieve the ApexClass CaseRouter from my sandbox and review it for governor-limit risk.',
		'Is this test class good enough? List missing assertions and bulk cases.',
	],
	faq: [
		{
			q: 'Will it change or deploy my code?',
			a: 'No. The skill only reads and reports. Fixes are shown as corrected snippets or diffs for you to apply. Retrieving code from an org only downloads files, and the skill asks before writing them into your project folder.',
		},
		{
			q: 'Where does it get the governor limit numbers?',
			a: 'It quotes only a short list of limits verified for Winter \'27 (API 68.0) taken from this site\'s governor limits data, and points to the governor limits tool for everything else. It will name a limit without a number rather than guess one.',
		},
		{
			q: 'Does it replace Salesforce Code Analyzer or a human review?',
			a: 'No. It is a fast review that explains problems and proposes fixes, but it does not compile or run the code. Use a static analyzer and your normal review process as well. It says in every report that nothing was run.',
		},
		{
			q: 'Can it review code that is only in my org?',
			a: 'Yes, if the CLI is logged in. It can retrieve the class with sf project retrieve start or read the source with a Tooling API query on ApexClass or ApexTrigger. Managed package code is not readable, and it reports that as not reviewed.',
		},
		{
			q: 'Does it work with assistants other than Claude?',
			a: 'Yes. Assistants that support the Agent Skills format can load the folder, including the checklist in references. For any other model, paste SKILL.md and the checklist into the prompt.',
		},
	],
	related: {
		tools: ['governor-limits', 'async-apex-chooser'],
		docs: ['apex/trigger-handler-pattern', 'devops/salesforce-code-analyzer', 'integration/named-credentials-callouts'],
	},
	refs: [
		'https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-gov-limits.html',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_with_security_stripInaccessible.htm',
		'https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_org_list_metadata.html',
		'https://agentskills.io/specification',
	],
	version: '1.0.0',
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default meta;
