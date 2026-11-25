import type { PromptMeta } from '../lib/prompts';

const prompt: PromptMeta = {
	slug: 'generate-apex-trigger-handler',
	title: 'Generate an Apex Trigger and Handler Class',
	tagline: 'Get a one-line trigger and a bulk-safe handler class from your business rules.',
	description:
		'A tested prompt that turns business rules into an Apex trigger plus a bulk-safe handler class, with a known-good output and a checklist to review it.',
	category: 'apex',
	tags: ['apex', 'triggers', 'bulkification', 'handler-pattern', 'prompts'],
	summary:
		'This prompt asks an AI assistant for an Apex trigger that only delegates, and a with-sharing handler class that implements your business rules in a bulk-safe way, with no SOQL or DML inside loops. It returns the two code files plus the assumptions the assistant made. It does not write the test class.',
	useWhen: [
		'You are adding logic to an object and want the one-trigger-per-object handler pattern from the start.',
		'You have written the rules in plain language and want a first draft of the Apex.',
		'You want a consistent structure across the triggers in your org.',
	],
	variables: [
		{ name: 'object_name', label: 'Object API name', help: 'Use the API name, for example Account or Invoice__c', example: 'Account' },
		{ name: 'events', label: 'Trigger events', help: 'For example: before insert, before update, after update', example: 'before insert, before update, after update' },
		{
			name: 'business_rules',
			label: 'Business rules',
			help: 'Numbered rules in plain language. Name the fields by API name.',
			example:
				"1. On insert and update, if Industry is blank, set Industry to 'Other'.\n2. After an update, when Rating changes to 'Hot', create a Task for the Account owner with Subject 'Call hot account' due in 2 days. Do not create it if an open Task with that Subject already exists for that Account.",
			multiline: true,
		},
	],
	prompt: `You are an expert Salesforce Apex developer. Write an Apex trigger and a handler class for the {{object_name}} object using the one-trigger-per-object handler pattern.

Requirements:
- The trigger is named {{object_name}}Trigger and handles these events: {{events}}.
- The trigger contains no business logic. It only calls methods on the handler.
- The handler class is named {{object_name}}TriggerHandler and is declared "public with sharing".
- The code must be bulk-safe: it must work for a chunk of 200 records. No SOQL or DML inside loops. Query once with a set of Ids and use Maps for lookups.
- In update events, only act on records where the relevant field actually changed (compare with Trigger.oldMap).
- Use constants for repeated string values. Keep methods short and name them after what they do.
- Do not invent fields or objects. If a rule needs a field I did not name, use a clearly named placeholder and list it in the assumptions.
- Do not write a test class.

Business rules:
{{business_rules}}

Output format:
1. The trigger in an apex code block.
2. The handler class in an apex code block.
3. A short "Assumptions" list.`,
	output: {
		language: 'apex',
		body: `// AccountTrigger.trigger
trigger AccountTrigger on Account (before insert, before update, after update) {
    AccountTriggerHandler handler = new AccountTriggerHandler();

    if (Trigger.isBefore) {
        if (Trigger.isInsert) {
            handler.beforeInsert(Trigger.new);
        } else if (Trigger.isUpdate) {
            handler.beforeUpdate(Trigger.new, Trigger.oldMap);
        }
    } else if (Trigger.isAfter && Trigger.isUpdate) {
        handler.afterUpdate(Trigger.new, Trigger.oldMap);
    }
}

// AccountTriggerHandler.cls
public with sharing class AccountTriggerHandler {
    private static final String DEFAULT_INDUSTRY = 'Other';
    private static final String HOT_RATING = 'Hot';
    private static final String TASK_SUBJECT = 'Call hot account';
    private static final Integer TASK_DUE_IN_DAYS = 2;

    public void beforeInsert(List<Account> newAccounts) {
        setDefaultIndustry(newAccounts);
    }

    public void beforeUpdate(List<Account> newAccounts, Map<Id, Account> oldMap) {
        setDefaultIndustry(newAccounts);
    }

    public void afterUpdate(List<Account> newAccounts, Map<Id, Account> oldMap) {
        createTasksForNewHotAccounts(newAccounts, oldMap);
    }

    private void setDefaultIndustry(List<Account> accounts) {
        for (Account acc : accounts) {
            if (String.isBlank(acc.Industry)) {
                acc.Industry = DEFAULT_INDUSTRY;
            }
        }
    }

    private void createTasksForNewHotAccounts(List<Account> newAccounts, Map<Id, Account> oldMap) {
        Map<Id, Account> hotAccounts = new Map<Id, Account>();
        for (Account acc : newAccounts) {
            Account oldAcc = oldMap.get(acc.Id);
            if (acc.Rating == HOT_RATING && oldAcc.Rating != HOT_RATING) {
                hotAccounts.put(acc.Id, acc);
            }
        }
        if (hotAccounts.isEmpty()) {
            return;
        }

        Set<Id> accountsWithOpenTask = new Set<Id>();
        for (Task existing : [
            SELECT WhatId
            FROM Task
            WHERE WhatId IN :hotAccounts.keySet()
            AND Subject = :TASK_SUBJECT
            AND IsClosed = false
        ]) {
            accountsWithOpenTask.add(existing.WhatId);
        }

        List<Task> tasksToInsert = new List<Task>();
        for (Account acc : hotAccounts.values()) {
            if (!accountsWithOpenTask.contains(acc.Id)) {
                tasksToInsert.add(new Task(
                    Subject = TASK_SUBJECT,
                    WhatId = acc.Id,
                    OwnerId = acc.OwnerId,
                    ActivityDate = Date.today().addDays(TASK_DUE_IN_DAYS)
                ));
            }
        }

        if (!tasksToInsert.isEmpty()) {
            insert tasksToInsert;
        }
    }
}

// Assumptions
// - "Open Task" means Task.IsClosed = false.
// - The Task is related to the Account through WhatId and owned by the Account owner.
// - Industry is only defaulted when blank, so existing values are never overwritten.
// - beforeUpdate sets the default on every updated record, including those whose Industry was blanked on purpose.`,
	},
	checklist: [
		'The trigger file has no logic beyond routing to the handler, and lists exactly the events you asked for.',
		'No SOQL query and no DML statement sits inside a for loop. Queries use a bind variable with a Set or Map key set.',
		'Update logic compares Trigger.oldMap so it only acts when the field actually changed.',
		'Every field and object in the code is one you named. Anything the assistant was unsure about is listed as an assumption.',
		'Before-trigger code changes records in memory (no DML on Trigger.new). After-trigger code that writes other records does it with one list DML.',
		'The handler is declared with sharing (or you have a reason to choose otherwise) and uses constants for repeated strings.',
	],
	caveats: [
		'The example output was not compiled or deployed. Paste it into a sandbox or scratch org, deploy it, and run your own tests before you rely on it.',
		'The prompt does not write a test class. Use the "Write an Apex test class" prompt next, and aim for assertions on behavior, not only coverage.',
		'Other triggers, flows and packages on the same object run in the same transaction and share its governor limits. Check them if you are near a limit.',
		'The handler does not guard against recursion because these rules do not need it. If a rule updates the same object again, add a static Set of processed Ids rather than a single static Boolean.',
		'Models differ from run to run. Judge your own output with the checklist instead of comparing it to this one line by line.',
	],
	tips: [
		'Paste the object\'s real field API names into the business rules so the assistant does not have to guess.',
		'Add a requirement line such as "Skip processing when a custom setting disables triggers" if your org uses a bypass switch.',
		'If your team has its own base handler class, add it to the requirements and ask the assistant to extend it.',
	],
	tested: {
		model: 'Claude Sonnet 5.5',
		date: '2026-11-17',
		method:
			'We ran the prompt exactly as shown with the example values, took the output above, and reviewed it line by line against the checklist: delegating trigger, no SOQL or DML in loops, bind variables, oldMap comparison and constants.',
		notVerified:
			'The code was not compiled, deployed or run in an org, so syntax errors and org-specific behavior (validation rules, other automation, field availability) are not ruled out.',
	},
	faq: [
		{
			q: 'Why a handler class instead of putting the logic in the trigger?',
			a: 'Logic in a class can be unit tested directly, read at a glance by event, and kept in a predictable order. Salesforce does not guarantee the order of several triggers on one object, so one trigger that calls one handler avoids that problem.',
		},
		{
			q: 'Does the prompt work for custom objects?',
			a: 'Yes. Use the API name, such as Invoice__c. Trigger and class names are built from it, so you may want to rename them, for example by dropping the __c.',
		},
		{
			q: 'How do I make the output safe for bulk data loads?',
			a: 'The prompt already requires code that works for 200 records at a time. Verify it with the checklist: no queries or DML in loops, bind variables, and one list DML. Then test with 200 or more records, not just one.',
		},
		{
			q: 'Why does it only act when a field changed?',
			a: 'An update trigger fires for every update, including ones that touch unrelated fields. Comparing the new value with Trigger.oldMap avoids repeating work, such as creating a duplicate Task.',
		},
		{
			q: 'Can I use this with a Salesforce MCP connection?',
			a: 'Yes. A connected assistant can read the object schema first, so field names are real instead of guessed. Paste those API names into the business rules.',
		},
	],
	related: {
		tools: ['governor-limits', 'async-apex-chooser'],
		skills: ['soql-query-assistant'],
		docs: ['apex/trigger-handler-pattern'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_context_variables.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm',
	],
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default prompt;
