import type { PromptMeta } from '../lib/prompts';

const prompt: PromptMeta = {
	slug: 'convert-process-builder-to-flow',
	title: 'Convert a Process Builder Process to a Record-Triggered Flow',
	tagline: 'Turn a Process Builder process into a written migration design for an equivalent record-triggered Flow.',
	description:
		'A tested prompt that maps a Process Builder process to a record-triggered Flow design: trigger choice, element list, gaps, order of execution and a test plan.',
	category: 'flow',
	tags: ['flow', 'process-builder', 'migration', 'record-triggered-flow', 'prompts'],
	summary:
		'This prompt asks an AI assistant to read a Process Builder process (a description or its metadata XML) and write a migration design for an equivalent record-triggered Flow. You get the recommended trigger type, entry conditions, an ordered element list with each criteria node and action mapped, what does not map cleanly, order-of-execution notes and a test plan. The output is a design, not deployable flow-meta.xml.',
	useWhen: [
		'You have an active Process Builder process and need a plan to rebuild it as a record-triggered Flow.',
		'You want to know which parts can run before save and which must run after save.',
		'You want a concrete test plan to prove the Flow behaves like the process before you deactivate it.',
		'Salesforce\'s Migrate to Flow tool does not cover your process and you are rebuilding by hand.',
	],
	variables: [
		{
			name: 'object_name',
			label: 'Object API name',
			help: 'The object the process starts on, by API name, for example Opportunity or Invoice__c',
			example: 'Opportunity',
		},
		{
			name: 'process_definition',
			label: 'Process definition',
			help: 'Paste a description of every criteria node, its conditions, its actions and whether it evaluates the next criteria. You can also paste the process metadata XML.',
			example:
				'Process name: Opportunity Stage Automation\nObject: Opportunity\nStarts when: a record is created or edited\nStatus: Active\n\nCriteria node 1: Large open deal\n  Conditions (all true): [Opportunity].Amount >= 100000 AND [Opportunity].IsClosed = false\n  Execute actions only when specified changes are made to the record: No\n  Immediate actions:\n    1. Update Records: [Opportunity] (the record that started the process). Set Large_Deal__c = true\n  Evaluate next criteria: Yes\n\nCriteria node 2: Closed Won\n  Conditions (all true): [Opportunity].StageName equals Closed Won\n  Execute actions only when specified changes are made to the record: Yes (StageName changed)\n  Immediate actions:\n    1. Update Records: [Opportunity].Account. Set Type = Customer\n    2. Email Alert: Opportunity_Closed_Won_Notice (recipient: Opportunity Owner)\n    3. Apex: ProvisionCustomerAction (invocable method). Input recordId = [Opportunity].Id\n  Evaluate next criteria: No\n\nScheduled actions: none',
			multiline: true,
		},
	],
	prompt: `You are an expert Salesforce automation architect. Design the migration of a Process Builder process on the {{object_name}} object to record-triggered Flow.

Important: produce a written migration DESIGN. Do not generate flow-meta.xml or any other deployable metadata, because you cannot validate it here. Say this in the first lines of your answer.

Process to migrate (a description or metadata XML):
{{process_definition}}

Rules:
- Use only what the process definition states. Do not invent fields, objects, email alerts, Apex classes or conditions. If something is missing or ambiguous, list it under "Open questions" and state the assumption you used.
- Decide the trigger type per action. A before-save Flow can only change fields on the triggering record and cannot call actions such as Apex, email alerts or other-record updates. Anything else needs an after-save Flow. If the process mixes both, recommend separate Flows and say why.
- Map every criteria node and every action to a specific Flow element (Start entry conditions, Decision, Assignment, Get Records, Update Records, Create Records, Action, Subflow). Preserve the original order of actions.
- Convert "Execute actions only when specified changes are made" into the matching Flow entry setting. Convert "Evaluate next criteria" faithfully: a single Decision with several outcomes stops at the first match, so explain how to keep the original behavior.
- Add what the process never had but a Flow should: fault paths for Update Records and Action elements, and a note on bulk safety (no queries or DML inside loops).
- Call out anything that does not map cleanly or behaves differently (scheduled actions, formulas, recursion, timing, error handling). Do not say a mapping is identical when it is not.
- Mention that Salesforce's Migrate to Flow tool may handle simple processes, and that you cannot tell from this definition whether it would handle this one.

Output format (markdown, use these headings in this order):
1. Scope (state clearly that this is a design, not deployable XML)
2. Recommendation (trigger type or types, and why)
3. Mapping table (process node or action, Flow element, notes)
4. Flow design (for each Flow: object, trigger, entry conditions, ordered elements)
5. What does not map cleanly
6. Order of execution notes
7. Test plan (concrete cases with input and expected result)
8. Open questions and assumptions`,
	output: {
		language: 'markdown',
		body: `## 1. Scope

This is a migration DESIGN for the process "Opportunity Stage Automation" on Opportunity. It is not flow-meta.xml and it has not been validated in an org. Build the Flows in Flow Builder from this design, then test them in a sandbox.

## 2. Recommendation

Build TWO record-triggered Flows, not one.

- Flow A, before save: criteria node 1. Its only action sets Large_Deal__c on the same Opportunity, which a before-save Flow can do without an extra save of the record.
- Flow B, after save: criteria node 2. It updates the parent Account, sends an email alert and calls an invocable Apex action. A before-save Flow cannot do any of those, so these must run after save.

Splitting also removes the extra update the process made to its own record. With the process, setting Large_Deal__c was a second save of the Opportunity. In Flow A it happens in the same save.

## 3. Mapping table

| Process element | Flow element | Notes |
|---|---|---|
| Starts when a record is created or edited | Start: trigger "A record is created or updated" in both Flows | Use the same trigger in A and B |
| Node 1 conditions: Amount >= 100000 AND IsClosed = false | Flow A Start entry conditions (condition requirements: All Conditions Are Met), run "Every time a record is updated and meets the condition requirements" | The process had no "only when changed" setting, so it ran on every save while true |
| Node 1 action 1: Update Records [Opportunity] Large_Deal__c = true | Flow A Assignment: $Record.Large_Deal__c = true | No Update Records element is needed in a before-save Flow |
| Node 1 "Evaluate next criteria: Yes" | Nothing to build | A and B are separate Flows. Each checks its own entry conditions against the saved record |
| Node 2 condition: StageName equals Closed Won | Flow B Start entry conditions: StageName Equals Closed Won | |
| Node 2 "only when specified changes are made (StageName changed)" | Flow B Start: "Only when a record is updated to meet the condition requirements" | Equivalent for a stage that must change into Closed Won. See section 5 for creation |
| Node 2 action 1: Update Records [Opportunity].Account Type = Customer | Flow B Decision "Has Account", then Update Records on Account where Id = {!$Record.AccountId}, Type = Customer | The Decision protects against an Opportunity with no Account |
| Node 2 action 2: Email Alert Opportunity_Closed_Won_Notice | Flow B Action: the existing Email Alert, recordId = {!$Record.Id} | Reuse the existing alert and its template and recipients |
| Node 2 action 3: Apex ProvisionCustomerAction | Flow B Action: the Apex action, recordId = {!$Record.Id} | The class must already be an invocable method |
| Node 2 "Evaluate next criteria: No" | Nothing to build | There is no node 3 |

## 4. Flow design

### Flow A: Opportunity Large Deal Flag (before save)

- Object: Opportunity. Trigger: A record is created or updated. Optimize the Flow for: Fast Field Updates.
- Entry conditions: Amount Greater Than Or Equal 100000 AND IsClosed Equals False. Run: every time a record is updated and meets the condition requirements.
- Elements in order:
  1. Assignment "Set Large Deal": $Record.Large_Deal__c Equals true.
- No fault path is needed because the Flow does no DML of its own.
- Optional tweak: add Large_Deal__c Equals False to the entry conditions to skip records already flagged. The result is the same, but it changes the Flow's entry behavior, so only add it if you accept that.

### Flow B: Opportunity Closed Won Actions (after save)

- Object: Opportunity. Trigger: A record is created or updated. Optimize the Flow for: Actions and Related Records.
- Entry conditions: StageName Equals Closed Won. Run: only when a record is updated to meet the condition requirements.
- Elements in order:
  1. Decision "Has Account": outcome "Has Account" when {!$Record.AccountId} Is Null Equals False. Default outcome "No Account" goes straight to element 3.
  2. Update Records "Mark Account Customer": Account where Id Equals {!$Record.AccountId}, set Type = Customer. Add a fault connector. Then continue to element 3.
  3. Action "Send Closed Won Email": Email Alert Opportunity_Closed_Won_Notice, record Id = {!$Record.Id}. Add a fault connector.
  4. Action "Provision Customer": Apex action ProvisionCustomerAction, recordId = {!$Record.Id}. Add a fault connector.
- Fault connectors: send each to one shared fault path, for example an email to an administrator that includes {!$Flow.FaultMessage} and the Opportunity Id.
- If ProvisionCustomerAction makes a callout, put it on the Run Asynchronously path of the Flow instead of the main path. Callouts cannot run on the main after-save path.

## 5. What does not map cleanly

- Creation as Closed Won. It is not certain from the definition whether the process ran its actions for an Opportunity created already at Closed Won, and the Flow setting may treat creation differently. Test this case against both before you retire the process, and adjust the Flow entry setting to match the behavior you want.
- "Evaluate next criteria" with one Flow. If you ever merge A and B into one Flow, a Decision with several outcomes stops at the first matching outcome. To keep "evaluate next criteria: yes" you would need sequential Decisions that rejoin. Two separate Flows avoid the problem.
- Error handling. The process had no fault handling. If an action fails, the user sees an error and the save is rolled back. A Flow fault connector changes that: once you handle the fault, the user's save can continue. Decide which behavior you want for each action.
- Apex input. A process and a Flow both pass a list to an invocable method, but check that ProvisionCustomerAction reads its input variable name correctly and handles several records in one call.
- Scheduled actions: none in this process. If a process has them, they need a manual redesign (for example Scheduled Paths in a Flow) and are not covered by this mapping.
- Salesforce's Migrate to Flow tool may handle simple processes. This definition mixes a related-record update, an email alert and Apex, so check in Setup whether the process is listed as eligible. If it is, compare its output with this design instead of trusting either one.

## 6. Order of execution notes

- Flow A runs before save, before before-triggers, so Apex before-triggers and validation rules now see Large_Deal__c already set on the same save. The process set it after the save, so triggers and validation rules saw the old value first.
- Flow B runs after save, in the same part of the transaction as the process did, after after-triggers.
- The Account update in Flow B fires Account triggers, validation rules and automation. It did so in the process too.
- The order between several after-save Flows and processes on the same object is not guaranteed unless you set a trigger order. Check Flow Trigger Explorer for this object.
- Do not keep the process and Flow B active at once. They would both update the Account, send the email and call Apex. Deactivate the process when you activate the Flows.

## 7. Test plan

Run in a sandbox with the process deactivated and Flows A and B active. Record the same cases against the original process first so you can compare.

1. Create an Opportunity: Amount 150000, StageName Prospecting. Expect Large_Deal__c = true. No Account change, no email, no Apex call.
2. Update Amount from 90000 to 120000 on an open Opportunity. Expect Large_Deal__c = true.
3. Boundary: Amount 100000 gives true. Amount 99999.99 gives false.
4. Amount 150000 with StageName Closed Won. Expect Large_Deal__c unchanged (IsClosed is true) and all Flow B actions run once.
5. Update StageName from Negotiation to Closed Won with an Account on the record. Expect Account Type = Customer, one email, one Apex call.
6. Edit another field (for example Description) on the Closed Won Opportunity. Expect no Flow B actions.
7. Create an Opportunity directly at Closed Won. Compare with how the process behaved and match it.
8. Move StageName to Closed Won on an Opportunity with no Account. Expect the email and Apex call to run and no Account update, and no error.
9. Make ProvisionCustomerAction throw an exception in the sandbox. Expect the fault path to run and the notice to contain the message. Confirm what the user sees.
10. Bulk: insert and update 200 Opportunities at once with a mix of the cases above. Expect no limit errors. Check the debug log for query and DML counts.
11. Profile test: run as a user without edit access to Account. Check whether the Account update behaves as the process did.

## 8. Open questions and assumptions

- Assumed Large_Deal__c is a checkbox that is never cleared, because the process has no action that unchecks it. Confirm that is intended.
- Assumed the email alert Opportunity_Closed_Won_Notice already exists and can be reused as is.
- Assumed ProvisionCustomerAction is an invocable method with one input named recordId, and that it does not make callouts. Confirm both.
- Not stated: whether any other process, Flow or trigger on Opportunity or Account sets the same fields.`,
	},
	checklist: [
		'The answer says in its first lines that it is a design and not deployable flow-meta.xml, and it contains no flow-meta.xml.',
		'Every criteria node and every action in your process appears in the mapping table, in the original order.',
		'Same-record field changes go to a before-save Flow, and anything needing Apex, email alerts or other-record updates goes to an after-save Flow.',
		'"Only when specified changes are made" and "Evaluate next criteria" are each translated, and the differences are explained, not hidden.',
		'Fault paths are proposed for the Update Records and Action elements, with no queries or DML inside loops.',
		'The answer does not invent fields, classes or alerts that are not in your definition. Unknowns are listed as open questions.',
		'The test plan has concrete inputs and expected results, including a boundary case, a no-change edit and a bulk case.',
	],
	caveats: [
		'The output is a design written from the text you pasted. It was not built or run in an org, and the assistant cannot see your real metadata, other automation or data.',
		'Salesforce\'s own Migrate to Flow tool may handle simple processes. Check what it offers for your process before you rebuild by hand, and compare its result with this design.',
		'Scheduled actions and some formulas need manual redesign. A design from this prompt can flag them but cannot translate them reliably.',
		'Behavior can differ even when the design looks equal: evaluate-next-criteria semantics, changed-only settings on create, error handling and the timing of field updates. Prove each with the test plan.',
		'If you paste the process metadata XML, the assistant reads it as text. Very large processes may need to be split into smaller pieces.',
		'Models differ from run to run. Judge your own output with the checklist instead of comparing it to this one line by line.',
	],
	tips: [
		'List every field by API name and give the real names of any email alerts and Apex classes so nothing has to be guessed.',
		'If a process has many criteria nodes, ask for one Flow per node when they touch different fields, and a shared subflow for repeated actions.',
		'Ask the assistant to rank the risks if the process runs on a high-volume object.',
		'Run the same test plan against the old process first, and keep the results next to the Flow results.',
	],
	tested: {
		model: 'Claude Sonnet 5.5',
		date: '2026-11-17',
		method:
			'We ran the prompt with the example values (an Opportunity process with a before-save style field update, an Account update, an email alert and an invocable Apex action), took the output above, and reviewed it line by line against the checklist: design-only statement, full mapping, trigger split, changed-only and evaluate-next-criteria handling, fault paths and test cases.',
		notVerified:
			'The design was not built or run in an org. We did not verify the behavior of the changed-only setting on record creation, the Migrate to Flow tool\'s coverage of this process, or the Flow Trigger Explorer ordering.',
	},
	faq: [
		{
			q: 'Does this prompt generate the Flow metadata XML?',
			a: 'No. It writes a migration design. A language model cannot validate flow-meta.xml without an org, so the prompt tells the assistant not to produce it. Build the Flow in Flow Builder from the design.',
		},
		{
			q: 'Why recommend two Flows instead of one?',
			a: 'A before-save Flow can only change fields on the triggering record and cannot call Apex or email alerts. In the example, one criteria node only sets a field on the same record and the other needs after-save actions. Splitting them keeps the field update fast and keeps each Flow simple.',
		},
		{
			q: 'How is "Evaluate next criteria" handled?',
			a: 'Separate Flows each test their own entry conditions, so the next node is always considered. In a single Flow, a Decision with several outcomes stops at the first match, so you would need sequential Decisions to keep the original behavior.',
		},
		{
			q: 'Should I use Salesforce\'s Migrate to Flow tool instead?',
			a: 'Try it first for simple processes. It may handle them, and its result is a useful comparison. Processes with scheduled actions, complex formulas or many actions often need manual work, and this prompt helps you plan that.',
		},
		{
			q: 'Can I paste the process metadata instead of a description?',
			a: 'Yes. Paste the XML into the process definition field. Check that the assistant listed every criteria node and action, because a long XML file is easy to misread.',
		},
	],
	related: {
		tools: ['async-apex-chooser'],
		skills: ['process-builder-to-flow-migration', 'flow-explainer'],
		prompts: ['explain-a-salesforce-flow'],
		docs: ['apex/trigger-handler-pattern'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_order_of_execution.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_flow.htm',
	],
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default prompt;
