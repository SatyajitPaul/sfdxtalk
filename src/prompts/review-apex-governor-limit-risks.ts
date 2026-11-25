import type { PromptMeta } from '../lib/prompts';

const prompt: PromptMeta = {
	slug: 'review-apex-governor-limit-risks',
	title: 'Review Apex for Governor Limit Risks',
	tagline: 'Get a prioritized list of bulkification and governor limit risks in your Apex, each with a corrected snippet.',
	description:
		'A tested prompt that reviews Apex for governor limit and bulkification risks: SOQL and DML in loops, unfiltered queries, CPU, callouts and heap, with fixes.',
	category: 'review',
	tags: ['apex', 'governor-limits', 'bulkification', 'code-review', 'performance', 'prompts'],
	summary:
		'This prompt asks an AI assistant to review Apex you paste in and list the governor limit risks in priority order. Each finding names the location, the limit it can hit, and a corrected snippet. The limit numbers come from a fixed table in the prompt, so they match the official limits as of Winter \'27.',
	useWhen: [
		'A trigger, handler or batch class works with one record but fails with a data load or an API call that sends 200 records.',
		'You want a bulkification review before a deployment or a pull request.',
		'You see "Too many SOQL queries", "Too many DML statements" or "Apex CPU time limit exceeded" and need to find the cause.',
	],
	variables: [
		{
			name: 'apex_source',
			label: 'Apex source',
			help: 'Paste the class, trigger or handler. Include helper classes it calls if they matter.',
			example: `public with sharing class OpportunityTriggerHandler {
    public void afterUpdate(List<Opportunity> newOpps, Map<Id, Opportunity> oldMap) {
        List<Account> allAccounts = [SELECT Id, Rating FROM Account];
        for (Opportunity opp : newOpps) {
            Opportunity oldOpp = oldMap.get(opp.Id);
            if (opp.StageName == 'Closed Won' && oldOpp.StageName != 'Closed Won') {
                for (Account acc : allAccounts) {
                    if (acc.Id == opp.AccountId) {
                        acc.Rating = 'Hot';
                        update acc;
                    }
                }
                List<Contact> contacts = [
                    SELECT Id FROM Contact WHERE AccountId = :opp.AccountId LIMIT 1
                ];
                if (!contacts.isEmpty()) {
                    insert new Task(
                        Subject = 'Send thank-you note',
                        WhoId = contacts[0].Id,
                        WhatId = opp.Id,
                        ActivityDate = Date.today().addDays(1)
                    );
                }
            }
        }
    }
}`,
			multiline: true,
		},
		{
			name: 'execution_context',
			label: 'Execution context',
			help: 'How the code runs: synchronous trigger, batch, Queueable, REST callout, Flow-invoked, and the usual record volume.',
			example:
				'Called from an after update trigger on Opportunity, so it runs synchronously. Opportunities are updated in bulk by Data Loader and by an integration API in chunks of up to 200. Flows and other triggers also run on Opportunity, Account and Task.',
			multiline: true,
		},
	],
	prompt: `You are a senior Salesforce Apex reviewer. Review the Apex code below for governor limit and bulkification risks, and report them in priority order.

Execution context:
{{execution_context}}

Apex source:
{{apex_source}}

Use only these limit values. Pick the synchronous or asynchronous value that matches the execution context, and do not state any other number as a limit.
- SOQL queries per transaction: 100 synchronous, 200 asynchronous. Each parent-child relationship subquery counts as an extra query.
- Records retrieved by SOQL per transaction: 50,000
- DML statements per transaction: 150
- Records processed by DML per transaction: 10,000
- Callouts per transaction: 100
- Future method calls per invocation: 50
- Queueable jobs added with System.enqueueJob: 50 synchronous, 1 asynchronous
- Heap size: 10 MB synchronous, 25 MB asynchronous
- CPU time: 10,000 ms synchronous, 60,000 ms asynchronous
- Apex trigger batch size: 200
- Trigger stack depth: 16

Look for these risks:
- SOQL queries or DML statements inside loops, including inside methods that are called from loops.
- Queries with no WHERE filter, no LIMIT or a non-selective filter that can return too many rows.
- Nested loops over collections that should be Maps or Sets, and other CPU-heavy work.
- Callouts inside loops, and future or Queueable calls made once per record.
- Large collections, big strings or queries of fields that are never used, which raise heap use.
- Interactions across the same transaction: other triggers, flows and packages on the same objects, and DML in this code that fires them.
- Recursion that can re-fire a trigger.

Rules:
- Report only risks that are in the code. Do not invent problems to fill the list. If a category has no issue, list it under "Checked, no issue".
- Do not claim the code will fail at an exact record count unless the arithmetic follows from the limits above and the loop in the code. Otherwise say it can fail.
- You cannot see data volumes, other automation or real CPU use. Say so where it affects a finding.
- Keep the behavior of the code the same unless a change is needed for the fix, and mention any behavior change.

Output format:
1. "Summary": one or two sentences with the overall risk.
2. "Findings", ordered from highest to lowest priority. For each finding give: Priority (Critical, High or Medium), Location (method and statement), Why it is a risk (which limit and how it is reached), and Fix (an explanation and a corrected apex snippet).
3. "Corrected code": the full corrected class in one apex code block.
4. "Checked, no issue": the risk categories above that you checked and found fine.
5. "To confirm": what to check with debug logs, the Limits class and tests.`,
	output: {
		language: 'markdown',
		body: `## Summary

The handler is not bulk-safe. A normal 200-record update can run out of DML statements before the handler finishes, and the unfiltered Account query plus the nested loop add further row, heap and CPU risk.

## Findings

### 1. Critical: DML inside the loop (two statements per record)

- **Location:** \`afterUpdate\`, \`update acc;\` inside the nested \`for (Account acc : allAccounts)\` loop, and \`insert new Task(...)\` inside the outer loop.
- **Why it is a risk:** Each qualifying Opportunity runs one \`update\` and up to one \`insert\`. The limit is 150 DML statements per transaction. A trigger chunk can hold 200 Opportunities, so 200 qualifying records would need up to 400 statements. With this code the 151st statement throws "Too many DML statements: 151". Each of those statements also fires any Account or Task triggers and flows again.
- **Fix:** Collect the changed Accounts and the new Tasks, then run one DML statement for each list after the loop. Use a Map keyed by Id for Accounts so the same Account is not added twice (a list with the same Id twice makes the update fail).

\`\`\`apex
Map<Id, Account> accountsToUpdate = new Map<Id, Account>();
List<Task> tasksToInsert = new List<Task>();
// ... fill inside the loop ...
if (!accountsToUpdate.isEmpty()) {
    update accountsToUpdate.values();
}
if (!tasksToInsert.isEmpty()) {
    insert tasksToInsert;
}
\`\`\`

### 2. Critical: SOQL query inside the loop

- **Location:** \`afterUpdate\`, the \`[SELECT Id FROM Contact WHERE AccountId = :opp.AccountId LIMIT 1]\` query inside the \`for (Opportunity opp : newOpps)\` loop.
- **Why it is a risk:** One query per qualifying Opportunity, plus the Account query before the loop. The synchronous limit is 100 queries per transaction, so 100 or more qualifying records reach "Too many SOQL queries: 101" (the first query is spent on the Account query). Other triggers and flows in the same transaction use the same budget.
- **Fix:** Collect the AccountIds first, query all Contacts once with \`IN :accountIds\`, and read the result from a Map. The original \`LIMIT 1\` returned an arbitrary Contact, so the fix orders by CreatedDate to make the choice stable. That is a small behavior change.

\`\`\`apex
Map<Id, Id> contactIdByAccountId = new Map<Id, Id>();
for (Contact c : [
    SELECT Id, AccountId FROM Contact
    WHERE AccountId IN :accountIds
    ORDER BY CreatedDate ASC
]) {
    if (!contactIdByAccountId.containsKey(c.AccountId)) {
        contactIdByAccountId.put(c.AccountId, c.Id);
    }
}
\`\`\`

### 3. High: Account query with no filter

- **Location:** \`afterUpdate\`, \`[SELECT Id, Rating FROM Account]\`.
- **Why it is a risk:** It reads every Account the running user can see on every update, even when no Opportunity qualifies. SOQL can retrieve 50,000 records per transaction, so an org with more Accounts than that throws "Too many query rows: 50001". Even below that, a large list uses heap against the 10 MB synchronous limit and it is built on each run.
- **Fix:** Query only the Accounts of the qualifying Opportunities, and only after you know there are some: \`[SELECT Id, Rating FROM Account WHERE Id IN :accountIds]\`.

### 4. High: nested loop used as a lookup

- **Location:** \`afterUpdate\`, \`for (Account acc : allAccounts)\` inside the \`for (Opportunity opp : newOpps)\` loop.
- **Why it is a risk:** The comparison runs once per Account for every qualifying Opportunity. With a large Account list and 200 Opportunities the iteration count multiplies, and CPU time counts against 10,000 ms synchronous. The exact CPU cost depends on the data and cannot be known from the code alone.
- **Fix:** Replace the inner loop with a Map lookup: \`accountsById.get(opp.AccountId)\`.

### 5. Medium: automation in the same transaction shares these limits

- **Location:** The Account \`update\` and the Task \`insert\`.
- **Why it is a risk:** Both statements fire the triggers and record-triggered flows on Account and Task, and the Opportunity update that started this code may also fire flows. All of it shares one transaction and one set of limits. A handler that is bulk-safe by itself can still hit a limit because of what its DML triggers. This is not visible from the code shown.
- **Fix:** After the fix above, run a 200-record test with the real automation active and check the totals with \`Limits.getQueries()\` and \`Limits.getDmlStatements()\`. Skip the Account update when the Rating is already Hot if that is acceptable, so unneeded updates do not fire automation.

## Corrected code

\`\`\`apex
public with sharing class OpportunityTriggerHandler {
    private static final String CLOSED_WON = 'Closed Won';
    private static final String HOT_RATING = 'Hot';
    private static final String TASK_SUBJECT = 'Send thank-you note';

    public void afterUpdate(List<Opportunity> newOpps, Map<Id, Opportunity> oldMap) {
        List<Opportunity> wonOpps = new List<Opportunity>();
        Set<Id> accountIds = new Set<Id>();
        for (Opportunity opp : newOpps) {
            Opportunity oldOpp = oldMap.get(opp.Id);
            if (opp.AccountId != null && opp.StageName == CLOSED_WON && oldOpp.StageName != CLOSED_WON) {
                wonOpps.add(opp);
                accountIds.add(opp.AccountId);
            }
        }
        if (wonOpps.isEmpty()) {
            return;
        }

        Map<Id, Account> accountsById = new Map<Id, Account>([
            SELECT Id, Rating FROM Account WHERE Id IN :accountIds
        ]);

        Map<Id, Id> contactIdByAccountId = new Map<Id, Id>();
        for (Contact c : [
            SELECT Id, AccountId FROM Contact
            WHERE AccountId IN :accountIds
            ORDER BY CreatedDate ASC
        ]) {
            if (!contactIdByAccountId.containsKey(c.AccountId)) {
                contactIdByAccountId.put(c.AccountId, c.Id);
            }
        }

        Map<Id, Account> accountsToUpdate = new Map<Id, Account>();
        List<Task> tasksToInsert = new List<Task>();
        for (Opportunity opp : wonOpps) {
            Account acc = accountsById.get(opp.AccountId);
            if (acc != null) {
                acc.Rating = HOT_RATING;
                accountsToUpdate.put(acc.Id, acc);
            }
            Id contactId = contactIdByAccountId.get(opp.AccountId);
            if (contactId != null) {
                tasksToInsert.add(new Task(
                    Subject = TASK_SUBJECT,
                    WhoId = contactId,
                    WhatId = opp.Id,
                    ActivityDate = Date.today().addDays(1)
                ));
            }
        }

        if (!accountsToUpdate.isEmpty()) {
            update accountsToUpdate.values();
        }
        if (!tasksToInsert.isEmpty()) {
            insert tasksToInsert;
        }
    }
}
\`\`\`

## Checked, no issue

- Callouts in loops: there are no callouts.
- Future and Queueable misuse: there are no future or Queueable calls.
- Recursion: this code updates Account and inserts Task, not Opportunity, so it does not re-fire this trigger directly. Account or Task automation that updates Opportunity could, which is covered in finding 5.

## To confirm

- Run a test that updates 200 Opportunities to Closed Won and assert that no limit exception is thrown. Log \`Limits.getQueries()\`, \`Limits.getDmlStatements()\` and \`Limits.getCpuTime()\` at the end of the handler.
- Check a debug log from a real data load for the total queries and DML across all triggers and flows, not only this handler.
- A single Contact lookup per Account reads every Contact of those Accounts. If an Account can have thousands of Contacts, check the retrieved row count.`,
	},
	checklist: [
		'Every finding names a real location in your code (method and statement) and a specific limit from the table, not a vague warning.',
		'Each stated number matches the limits table in the prompt for your context (synchronous or asynchronous), and no other limit values appear.',
		'SOQL or DML inside a loop is reported even when it is hidden inside a method that the loop calls.',
		'Each fix is a corrected snippet that collects first and queries or writes once, and any behavior change is stated.',
		'The assistant says what it cannot see: data volume, other triggers and flows, and real CPU use.',
		'Categories with no problem are listed as checked, instead of invented findings.',
	],
	caveats: [
		'A static review cannot see data volumes, other automation on the same objects, or real CPU use. A finding is a risk, not a measurement. Confirm with debug logs, the Limits class and a 200-record test.',
		'The limit table in the prompt was copied for Winter \'27 and API 68.0. Limits change between releases, so compare it with the current Apex Developer Guide before you rely on a number.',
		'The corrected code in the example was not compiled or run. Check it in a sandbox or scratch org and run your own tests.',
		'The fix can change behavior. In the example, the Contact choice becomes stable (oldest first) and an Account that appears in several Opportunities is updated once. Review each change against your requirements.',
		'The assistant reviews the code you paste. Helper classes, other triggers and flows that run in the same transaction are not reviewed unless you include them.',
	],
	tips: [
		'Say how many records the code really handles, for example "Data Loader batches of 200" or "one record from a screen flow", so the priorities fit.',
		'If a finding mentions work that should move to async Apex, use the Async Apex Chooser tool to pick between Queueable, Batch and future.',
		'Paste the debug log lines for the limit usage (the LIMIT_USAGE_FOR_NS section) with the code to help the assistant find the real hot spot.',
	],
	tested: {
		model: 'Claude Sonnet 5.5',
		date: '2026-11-17',
		method:
			'We ran the prompt with the example handler and context, took the review above, and checked it line by line against the checklist: the SOQL in the loop, the DML in the loop, the unfiltered query and the nested loop were all found, each limit number was compared with src/data/governor-limits.ts, and the corrected class was walked through by hand for a 200-record chunk.',
		notVerified:
			'The corrected class was not compiled, deployed or run in an org, and no debug log or real data was used, so the actual limit usage and CPU time were not measured.',
	},
	faq: [
		{
			q: 'Why does the prompt include the limit values?',
			a: 'Models can state limits from memory, and limits change between releases. Putting the values in the prompt keeps the numbers consistent and lets you update one table when Salesforce changes them.',
		},
		{
			q: 'Which limit usually fails first in a trigger?',
			a: 'It depends on the code. DML in a loop hits the 150 statement limit and SOQL in a loop hits the 100 query limit, so the one with more calls per record fails first. In the example, DML runs out first because each qualifying record does two DML statements and one query.',
		},
		{
			q: 'Can the review replace a bulk test?',
			a: 'No. A review finds patterns that are known to be risky. A test with 200 or more records, with your other triggers and flows active, shows what really happens. Use both.',
		},
		{
			q: 'Does it work for Batch Apex and Queueable code?',
			a: 'Yes. Set the execution context to batch or Queueable so the assistant uses the asynchronous values, such as 200 queries and 60,000 ms of CPU time, and Batch Apex limits reset for each execute call.',
		},
		{
			q: 'What if my code calls helper classes?',
			a: 'Include them in the Apex source. A query or DML inside a helper method that a loop calls is a common hidden problem, and the assistant can only find it if it can read the helper.',
		},
	],
	related: {
		tools: ['governor-limits', 'async-apex-chooser'],
		skills: ['apex-code-reviewer'],
		prompts: ['write-apex-test-class', 'generate-apex-trigger-handler'],
		docs: ['apex/trigger-handler-pattern'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm',
		'https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-gov-limits.html',
	],
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default prompt;
