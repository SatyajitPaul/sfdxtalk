import type { PromptMeta } from '../lib/prompts';

const FLOW_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <actionCalls>
        <name>Email_Failure_Alert</name>
        <label>Email Failure Alert</label>
        <locationX>314</locationX>
        <locationY>638</locationY>
        <actionName>emailSimple</actionName>
        <actionType>emailSimple</actionType>
        <inputParameters>
            <name>emailAddresses</name>
            <value>
                <stringValue>sf-alerts@example.com</stringValue>
            </value>
        </inputParameters>
        <inputParameters>
            <name>emailSubject</name>
            <value>
                <stringValue>Flow failed: Closed Won Review Flags</stringValue>
            </value>
        </inputParameters>
        <inputParameters>
            <name>emailBody</name>
            <value>
                <stringValue>Opportunity {!$Record.Id} failed. Error: {!$Flow.FaultMessage}</stringValue>
            </value>
        </inputParameters>
    </actionCalls>
    <apiVersion>68.0</apiVersion>
    <assignments>
        <name>Flag_For_Review</name>
        <label>Flag For Review</label>
        <locationX>138</locationX>
        <locationY>422</locationY>
        <assignmentItems>
            <assignToReference>Loop_Open_Opportunities.Needs_Review__c</assignToReference>
            <operator>Assign</operator>
            <value>
                <booleanValue>true</booleanValue>
            </value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>Loop_Open_Opportunities.Review_Reason__c</assignToReference>
            <operator>Assign</operator>
            <value>
                <stringValue>Another opportunity on this account was Closed Won</stringValue>
            </value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>opportunitiesToUpdate</assignToReference>
            <operator>Add</operator>
            <value>
                <elementReference>Loop_Open_Opportunities</elementReference>
            </value>
        </assignmentItems>
        <connector>
            <targetReference>Loop_Open_Opportunities</targetReference>
        </connector>
    </assignments>
    <decisions>
        <name>Has_Account</name>
        <label>Has Account</label>
        <locationX>314</locationX>
        <locationY>134</locationY>
        <defaultConnectorLabel>No Account</defaultConnectorLabel>
        <rules>
            <name>Account_Present</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>$Record.AccountId</leftValueReference>
                <operator>IsNull</operator>
                <rightValue>
                    <booleanValue>false</booleanValue>
                </rightValue>
            </conditions>
            <connector>
                <targetReference>Get_Other_Open_Opportunities</targetReference>
            </connector>
            <label>Account Present</label>
        </rules>
    </decisions>
    <description>When an Opportunity reaches Closed Won, flag the other open Opportunities on the same Account for review.</description>
    <environments>Default</environments>
    <interviewLabel>Closed Won Review Flags {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Closed Won Review Flags</label>
    <loops>
        <name>Loop_Open_Opportunities</name>
        <label>Loop Open Opportunities</label>
        <locationX>50</locationX>
        <locationY>314</locationY>
        <collectionReference>Get_Other_Open_Opportunities</collectionReference>
        <iterationOrder>Asc</iterationOrder>
        <nextValueConnector>
            <targetReference>Flag_For_Review</targetReference>
        </nextValueConnector>
        <noMoreValuesConnector>
            <targetReference>Update_Flagged_Opportunities</targetReference>
        </noMoreValuesConnector>
    </loops>
    <processType>AutoLaunchedFlow</processType>
    <recordLookups>
        <name>Get_Other_Open_Opportunities</name>
        <label>Get Other Open Opportunities</label>
        <locationX>50</locationX>
        <locationY>242</locationY>
        <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
        <connector>
            <targetReference>Loop_Open_Opportunities</targetReference>
        </connector>
        <faultConnector>
            <targetReference>Email_Failure_Alert</targetReference>
        </faultConnector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>AccountId</field>
            <operator>EqualTo</operator>
            <value>
                <elementReference>$Record.AccountId</elementReference>
            </value>
        </filters>
        <filters>
            <field>IsClosed</field>
            <operator>EqualTo</operator>
            <value>
                <booleanValue>false</booleanValue>
            </value>
        </filters>
        <filters>
            <field>Id</field>
            <operator>NotEqualTo</operator>
            <value>
                <elementReference>$Record.Id</elementReference>
            </value>
        </filters>
        <getFirstRecordOnly>false</getFirstRecordOnly>
        <object>Opportunity</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordLookups>
    <recordUpdates>
        <name>Update_Flagged_Opportunities</name>
        <label>Update Flagged Opportunities</label>
        <locationX>50</locationX>
        <locationY>530</locationY>
        <faultConnector>
            <targetReference>Email_Failure_Alert</targetReference>
        </faultConnector>
        <inputReference>opportunitiesToUpdate</inputReference>
    </recordUpdates>
    <start>
        <locationX>188</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Has_Account</targetReference>
        </connector>
        <doesRequireRecordChangedToMeetCriteria>true</doesRequireRecordChangedToMeetCriteria>
        <filterLogic>and</filterLogic>
        <filters>
            <field>StageName</field>
            <operator>EqualTo</operator>
            <value>
                <stringValue>Closed Won</stringValue>
            </value>
        </filters>
        <object>Opportunity</object>
        <recordTriggerType>CreateAndUpdate</recordTriggerType>
        <triggerType>RecordAfterSave</triggerType>
    </start>
    <status>Active</status>
    <variables>
        <name>opportunitiesToUpdate</name>
        <dataType>SObject</dataType>
        <isCollection>true</isCollection>
        <isInput>false</isInput>
        <isOutput>false</isOutput>
        <objectType>Opportunity</objectType>
    </variables>
</Flow>`;

const prompt: PromptMeta = {
	slug: 'explain-a-salesforce-flow',
	title: 'Explain a Salesforce Flow in Plain English',
	tagline: 'Paste a flow-meta.xml and get a plain-English walkthrough with risks called out.',
	description:
		'A tested prompt that explains a Salesforce Flow from its flow-meta.xml or a description: trigger, path, records and fields touched, fault handling and risks.',
	category: 'flow',
	tags: ['flow', 'flow-metadata', 'documentation', 'code-review', 'prompts'],
	summary:
		'This prompt asks an AI assistant to read a Flow (its flow-meta.xml, or a description) and explain it in plain English. You get the trigger and entry conditions, the step-by-step path, the records read and written, the fields touched, how failures are handled, and a list of risks. It explains configuration only. It does not run the Flow or see your org.',
	useWhen: [
		'You inherited a Flow and need to understand what it does before you change it.',
		'You are reviewing a teammate\'s Flow and want a quick list of risks.',
		'You need documentation for an existing Flow, or a plain-English summary for a non-technical reader.',
		'You are preparing to replace or merge automation and need to know what the current Flow touches.',
	],
	variables: [
		{
			name: 'flow_definition',
			label: 'Flow definition',
			help: 'Paste the full flow-meta.xml (retrieve it with sf project retrieve start --metadata Flow:YourFlowApiName), or a description of the Flow.',
			example: FLOW_XML,
			multiline: true,
		},
		{
			name: 'audience',
			label: 'Audience',
			help: 'Who will read the explanation, so the assistant picks the right level of detail',
			example: 'A Salesforce admin who did not build this Flow',
		},
	],
	prompt: `You are an expert Salesforce Flow reviewer. Explain the Flow below for this reader: {{audience}}.

Flow (flow-meta.xml, or a description):
{{flow_definition}}

Rules:
- Base every statement on the definition above. Do not guess what is not in it. If something is not visible (for example the content of a subflow, a managed-package action, an Apex class, a formula defined elsewhere, or field values at runtime), say so instead of inferring it.
- Follow the connectors in the XML (connector, nextValueConnector, noMoreValuesConnector, defaultConnector, faultConnector) to describe the real path. Do not describe the order in which elements appear in the file.
- Use the element labels and API names exactly as they appear.
- Do not claim the Flow was run. You are reading configuration, not observing behavior.
- Keep the explanation plain. Define a term the first time you use it.

Output format (markdown, use these headings in this order):
1. Summary (one short paragraph)
2. Trigger and entry conditions (object, when it runs, before or after save, filters, whether it only runs when the record changes to meet the criteria, and the status)
3. Step-by-step path (numbered, in the order the Flow runs, including loops and what each branch does)
4. Records and fields (a table of what is read, what is written, and which fields are set or compared)
5. Fault handling (which elements have fault connectors, where they go, and which elements have none)
6. Risks (queries or DML inside loops, missing fault paths, hard-coded IDs or addresses, missing or weak entry filters, unbounded queries, interactions with other automation and order of execution). Say "none found" for a risk you checked and did not find.
7. What this explanation cannot tell you`,
	output: {
		language: 'markdown',
		body: `## 1. Summary

"Closed Won Review Flags" is an active, record-triggered Flow on Opportunity. When an Opportunity reaches the stage Closed Won, it finds the other open Opportunities on the same Account, marks each one as needing review with a reason, and saves them together in one update. If a lookup or the update fails, it emails an address with the error. It does not change the Opportunity that started it.

This is based on the XML only. The Flow was not run.

## 2. Trigger and entry conditions

- Object: Opportunity. Trigger type: RecordAfterSave, so it runs after the Opportunity has been saved.
- Record trigger type: CreateAndUpdate, so it applies to both new and edited records.
- Entry filter: StageName equals Closed Won.
- doesRequireRecordChangedToMeetCriteria is true. In the Flow Builder UI this is "Only when a record is updated to meet the condition requirements". The Flow should run when an Opportunity changes into Closed Won, not on every later edit of a record that is already Closed Won. Check how it behaves on creation in a test, because the XML does not state it.
- Status: Active. API version 68.0.

## 3. Step-by-step path

1. Has Account (Decision). If $Record.AccountId is not null, the outcome "Account Present" goes to step 2. Otherwise the default outcome "No Account" has no connector, so the Flow simply ends.
2. Get Other Open Opportunities (Get Records on Opportunity, all matches, not just the first). The filters are all combined with AND: AccountId equals the triggering record's AccountId, IsClosed equals false, and Id does not equal the triggering record's Id. The result is stored automatically as a collection under the element name. If the query itself fails, the fault connector goes to step 7.
3. Loop Open Opportunities (Loop). It goes through that collection in ascending order. For each item it goes to step 4. When there are no more items it goes to step 5. If the lookup found nothing, the loop ends at once and goes to step 5 with an empty collection.
4. Flag For Review (Assignment). For the current item it sets Needs_Review__c to true and sets Review_Reason__c to the text "Another opportunity on this account was Closed Won". Then it adds that item to the collection variable opportunitiesToUpdate, and returns to step 3. This step only changes values in memory.
5. Update Flagged Opportunities (Update Records). One update on the collection opportunitiesToUpdate, so the changes are saved together after the loop. If the update fails, the fault connector goes to step 7. Update Records has no connector of its own for success, so the Flow ends after this step.
6. (End.) The triggering Opportunity is never updated by this Flow.
7. Email Failure Alert (Action, email send). It sends an email to sf-alerts@example.com with the subject "Flow failed: Closed Won Review Flags". The body contains the Id of the triggering Opportunity and the Flow's fault message ($Flow.FaultMessage). This element has no connector after it, so the Flow ends here.

## 4. Records and fields

| Object | Access | Fields |
|---|---|---|
| Opportunity (triggering record) | Read | StageName (entry filter), AccountId (Decision and lookup filter), Id (lookup filter, email body). Nothing is written. |
| Opportunity (other open ones on the same Account) | Read | AccountId, IsClosed and Id are used as filters. Because the output is stored automatically, all fields of each matching record are loaded into the Flow. |
| Opportunity (other open ones on the same Account) | Written | Needs_Review__c = true and Review_Reason__c = a fixed text, on every record the lookup returned. |

## 5. Fault handling

- Get Other Open Opportunities has a fault connector to Email Failure Alert.
- Update Flagged Opportunities has a fault connector to Email Failure Alert.
- Has Account, Loop Open Opportunities and Flag For Review have no fault connectors. A Decision, a Loop and an Assignment do not perform queries or DML in this Flow, so none is needed here.
- Email Failure Alert has no fault connector. If the email itself fails, nothing further is handled.
- The XML does not show what happens to the user's save after the fault path runs. Test that.

## 6. Risks

- Queries or DML inside loops: none found. The query runs once before the loop and the update runs once after it, on a collection.
- Unbounded query: Get Other Open Opportunities has no limit and loads all fields. An Account with a very large number of open Opportunities could approach the 50,000 row query limit and the 10,000 row DML limit. Check how many open Opportunities the biggest Accounts have.
- Hard-coded values: no record IDs found. The recipient address sf-alerts@example.com and the review reason text are fixed in the Flow. Replace the address with something your team can change without editing the Flow, such as a custom label or a custom metadata value, if that is your standard.
- Missing fault paths: covered for the query and the update. Not covered for the email action.
- Entry filter: present, and it checks only StageName. Closed Won is a stage name, so a renamed or translated stage value would stop it from running without any error.
- Silent skip: an Opportunity with no Account ends the Flow with no message, which may be intended but is worth confirming.
- Order of execution and other automation: it runs after the save of the triggering record, so it sees after-triggers' work. The update on the other Opportunities causes their own triggers, validation rules and automation to run. This Flow only starts for stage Closed Won, and it does not change StageName, so it should not re-start itself, but check any other Flow or trigger on Opportunity that reacts to Needs_Review__c.
- Bulk saves: if two Opportunities on the same Account reach Closed Won in one transaction, the same other Opportunity could appear in both runs' collections. Test this with a bulk load, because the XML cannot show how the duplicate update is handled.
- Custom fields: Needs_Review__c and Review_Reason__c must exist and be editable for the running user, or the update will fail. The XML does not confirm this.

## 7. What this explanation cannot tell you

- The XML shows configuration, not runtime data. It cannot tell you how many records are matched, how long it takes or whether it has failed in production.
- It contains no subflow and no Apex, so nothing hidden in those is covered. A managed-package action would also be invisible. Here the only action is the standard email send.
- It was not run in an org. Permissions, field-level security, other automation and validation rules can change the real result.
- It does not show who gets the failure email or whether that mailbox is monitored.`,
	},
	checklist: [
		'The trigger section names the object, before or after save, the create or update type, the exact entry filter and the status, all matching the XML.',
		'The path follows the connectors, including the loop branches, the empty-collection case and the fault connectors, not just the file order.',
		'Every field in the table was actually read, compared or assigned in the XML, and none was added from guesswork.',
		'Fault handling lists the elements that have fault connectors and the ones that do not.',
		'Risks are specific to this Flow (a named element, a named value) and say "none found" where that is true, instead of generic advice.',
		'The answer says what it cannot see: subflows, managed-package actions, Apex, runtime data, and that nothing was run.',
	],
	caveats: [
		'The XML shows how the Flow is configured, not what it did at runtime. Record counts, failures and timing need debug logs, Flow interview errors or testing.',
		'Managed-package actions, subflows and invocable Apex are shown only by name. The assistant cannot see inside them, so anything it says about them is a guess unless you paste them too.',
		'The explanation was not checked in an org. Permissions, field-level security, other automation and validation rules can change the real result.',
		'The example XML is short and made for this page. Flows exported from an org have more elements and settings, and a very long file may need to be pasted in parts.',
		'Models differ from run to run. Judge your own output with the checklist instead of comparing it to this one line by line.',
	],
	tips: [
		'Retrieve the file with the Salesforce CLI, for example sf project retrieve start --metadata Flow:YourFlowApiName, then paste the whole file.',
		'Add a line to the audience such as "Explain only the risks" if you need a quick review instead of a full walkthrough.',
		'Paste the Apex class behind an invocable action as well if you want the assistant to include what it does.',
		'Ask a follow-up for a diagram description or a test plan once the explanation looks right.',
	],
	tested: {
		model: 'Claude Sonnet 5.5',
		date: '2026-11-17',
		method:
			'We ran the prompt with the example flow-meta.xml and audience, took the output above, and checked each statement against that XML: the start element, the decision, the lookup filters, the loop and assignment, the update, the two fault connectors and the email action.',
		notVerified:
			'The example Flow was not deployed or run in an org, and the XML is hand-written to be compact, so it was not validated by Salesforce. The creation-time behavior of the changed-to-meet-criteria setting and the bulk duplicate case were not tested.',
	},
	faq: [
		{
			q: 'Where do I get the flow-meta.xml?',
			a: 'Retrieve it with the Salesforce CLI, for example sf project retrieve start --metadata Flow:YourFlowApiName, or from your project\'s flows folder. Run sf project retrieve start --help to check the flags in your CLI version.',
		},
		{
			q: 'Can it explain a Flow I can only describe, without the XML?',
			a: 'Yes, but the answer is only as accurate as your description. With XML the assistant can follow the real connectors and conditions. With a description it will say which parts it could not check.',
		},
		{
			q: 'Does it explain subflows and invocable Apex?',
			a: 'Only by name. Paste the subflow XML or the Apex class too if you want those included. The prompt tells the assistant to say when something is not visible.',
		},
		{
			q: 'Is it safe to paste Flow XML into an AI tool?',
			a: 'Flow XML can contain email addresses, record IDs and business rules. Check your company policy and remove anything sensitive before you paste.',
		},
		{
			q: 'How do I know the risk list is complete?',
			a: 'It is not a guarantee. It checks the common issues for the XML you pasted. Pair it with Salesforce\'s own tools and a test in a sandbox, including a bulk test.',
		},
	],
	related: {
		tools: ['governor-limits'],
		skills: ['flow-explainer', 'process-builder-to-flow-migration'],
		prompts: ['convert-process-builder-to-flow'],
		docs: ['apex/trigger-handler-pattern'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_flow.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_order_of_execution.htm',
	],
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default prompt;
