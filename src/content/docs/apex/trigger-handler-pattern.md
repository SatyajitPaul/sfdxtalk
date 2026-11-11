---
title: "Apex Trigger Handler Pattern"
description: "Structure Apex triggers with one trigger per object and a handler class to keep logic bulk-safe, testable, and in a predictable order."
category: apex
tags: [triggers, best-practices, bulkification]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-11
lastUpdated: 2026-11-11
level: intermediate
tldr: "Write one trigger per object that does nothing except call a handler class. The handler routes each trigger event to a method, which keeps logic bulk-safe, easy to test, and in a predictable order."
faq:
  - q: "Can I have more than one trigger on the same object?"
    a: "Yes, but Salesforce does not guarantee the order in which multiple triggers on the same object run. Use one trigger per object and control the order inside a handler class."
  - q: "Does a trigger handler affect governor limits?"
    a: "No. The handler runs in the same transaction as the trigger and shares the same governor limits. The pattern only organizes code; you still need to bulkify queries and DML."
  - q: "How many records does a trigger receive at once?"
    a: "A trigger processes records in chunks of up to 200. A single DML statement on 1,000 records fires the trigger five times, each with up to 200 records in Trigger.new."
  - q: "Should a trigger handler class use with sharing?"
    a: "Triggers run in system context, but the sharing keyword on the handler class applies to code inside it. Choose with sharing, without sharing, or inherited sharing deliberately based on what the logic must see."
  - q: "How do I stop a trigger from running recursively?"
    a: "Prevent the update that causes recursion where possible, for example by only acting on changed fields. If you still need a guard, use a static Set of processed record Ids rather than a single static Boolean."
related:
  - sf-cli/create-scratch-org
officialRefs:
  - "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm"
  - "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_context_variables.htm"
---

## Overview

The trigger handler pattern moves all logic out of an Apex trigger and into a regular Apex class. The trigger file becomes a single line that hands control to the handler.

Use this pattern for any object that has, or will have, more than trivial trigger logic. It solves three problems with logic written directly in triggers:

- **Unpredictable order.** Salesforce does not guarantee the run order of multiple triggers on one object. One trigger per object removes the problem.
- **Hard to test.** Methods in a class can be called and tested in isolation; anonymous trigger bodies cannot.
- **Hard to read.** A handler with one method per event shows at a glance what happens on insert, update, and delete.

## Prerequisites

- Permission to author Apex (the "Author Apex" permission) in a sandbox, scratch org, or Developer Edition org.
- Familiarity with [trigger context variables](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_context_variables.htm) such as `Trigger.new` and `Trigger.oldMap`.

## How the Trigger Handler Pattern Works

The trigger handler pattern has two parts: a trigger that subscribes to every event, and a handler class that decides what to do for each event.

1. The trigger subscribes to all the events the object might need, so adding logic later never requires editing the trigger.
2. The trigger calls one method on the handler.
3. The handler uses `Trigger.operationType` (a `System.TriggerOperation` enum value) in a `switch` statement to route to one method per event.
4. Each method receives typed collections (`List<Account>`, `Map<Id, Account>`) instead of reading the generic `Trigger` variables directly. This makes each method testable on its own.

### Keep Each Method Bulk-Safe

Every handler method must work for 1 record and for 200 records. Salesforce passes records to a trigger in chunks of up to 200.

- Never run SOQL or DML inside a `for` loop.
- Collect Ids or records in the loop, then query or perform DML once after it.
- Compare old and new values so the logic runs only when a relevant field changed.

## Example

The trigger subscribes to every event and delegates to the handler:

```apex title="AccountTrigger.trigger"
trigger AccountTrigger on Account (
    before insert, before update, before delete,
    after insert, after update, after delete, after undelete
) {
    new AccountTriggerHandler().run();
}
```

The handler sets a default rating on insert and creates a follow-up task when an account's rating changes to Hot:

```apex title="AccountTriggerHandler.cls"
public with sharing class AccountTriggerHandler {

    public void run() {
        switch on Trigger.operationType {
            when BEFORE_INSERT {
                beforeInsert((List<Account>) Trigger.new);
            }
            when AFTER_UPDATE {
                afterUpdate((List<Account>) Trigger.new, (Map<Id, Account>) Trigger.oldMap);
            }
        }
    }

    @TestVisible
    private void beforeInsert(List<Account> newAccounts) {
        for (Account acc : newAccounts) {
            if (String.isBlank(acc.Rating)) {
                acc.Rating = 'Warm';
            }
        }
    }

    @TestVisible
    private void afterUpdate(List<Account> newAccounts, Map<Id, Account> oldMap) {
        List<Task> followUps = new List<Task>();
        for (Account acc : newAccounts) {
            Boolean becameHot = acc.Rating == 'Hot' && oldMap.get(acc.Id).Rating != 'Hot';
            if (becameHot) {
                followUps.add(new Task(
                    WhatId = acc.Id,
                    OwnerId = acc.OwnerId,
                    Subject = 'Follow up: account rated Hot',
                    ActivityDate = Date.today().addDays(1)
                ));
            }
        }
        if (!followUps.isEmpty()) {
            insert as user followUps;
        }
    }
}
```

The test inserts and updates 200 records to prove the handler is bulk-safe:

```apex title="AccountTriggerHandlerTest.cls"
@IsTest
private class AccountTriggerHandlerTest {

    @IsTest
    static void setsDefaultRatingAndCreatesTasksInBulk() {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(Name = 'Test ' + i));
        }

        Test.startTest();
        insert accounts;
        for (Account acc : accounts) {
            acc.Rating = 'Hot';
        }
        update accounts;
        Test.stopTest();

        Assert.areEqual(200, [SELECT COUNT() FROM Account WHERE Rating = 'Hot']);
        Assert.areEqual(200, [SELECT COUNT() FROM Task WHERE Subject = 'Follow up: account rated Hot']);
    }
}
```

> [!TIP]
> Only the events you handle in the `switch` do anything. Subscribing to all seven events in the trigger costs nothing and means you never redeploy the trigger file to add logic.

## Limits and Gotchas

- **Chunk size:** triggers receive at most 200 records per invocation.
- **SOQL:** 100 queries per synchronous transaction, 200 per asynchronous transaction, shared by every trigger, flow, and class in the transaction.
- **DML:** 150 DML statements and 10,000 rows per transaction.
- **Field changes in after triggers:** records in `Trigger.new` are read-only in after triggers. Set field values on the same record in before triggers instead.
- **Recursion:** a single static Boolean guard skips records in later 200-record chunks of the same transaction. Track processed Ids in a static `Set<Id>` instead.

> [!WARNING]
> `Trigger.oldMap` is `null` in insert events and `Trigger.new` is `null` in delete events. Route each event to a method that only reads the variables that exist for it.

## Related Official Documentation

- [Apex Triggers](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm): trigger syntax, events, and order of execution.
- [Trigger Context Variables](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_context_variables.htm): availability of `Trigger.new`, `Trigger.oldMap`, and `Trigger.operationType` by event.
