# Apex review checklist

Work through each section. Only report an item when you can point to a line. For limit numbers use /tools/governor-limits/ and the short verified list in SKILL.md; do not quote numbers that are not there.

## 1. Bulkification and governor limits

- **SOQL in a loop.** Any `[SELECT ...]` or `Database.query` inside `for`, `while` or a method called from a loop. Fix: collect IDs into a `Set<Id>` first, query once, and read from a `Map<Id, SObject>` (or `Map<Id, List<SObject>>` for children).
- **DML in a loop.** `insert`, `update`, `upsert`, `delete`, `undelete`, `merge` or `Database.*` inside a loop. Fix: add records to a `List` and run one statement after the loop.
- **Hidden loops.** Helper methods that query or run DML, called from a loop or from a trigger over `Trigger.new`. Follow the call chain.
- **Single-record assumptions.** `Trigger.new[0]`, `records[0]`, a method that takes one `Id` and is called per record. Triggers receive up to a batch of records, and the code must work for all of them.
- **Child subqueries and relationship queries** count as extra queries toward the SOQL query limit. Note it when many are combined.
- **Unbounded queries.** No `WHERE` or `LIMIT` on a large object, or `SELECT` of rows that are never used. Prefer filters on indexed fields. A non-selective query on a large object can fail even under the row limit.
- **Collections in loops.** `List.contains` in a loop, nested loops over two large lists (CPU cost). Fix: use a `Set` or `Map` for lookups.
- **Heap.** Holding whole query results or large strings in memory. Fix: process with a SOQL `for` loop (`for (Account a : [SELECT ...])`), select fewer fields, or move to batch.
- **Queries for data you already have.** Re-querying fields that are in `Trigger.new`/`Trigger.old`.
- **Limit awareness.** Where risk is plausible, name the limit (SOQL queries, DML rows, CPU time, heap, callouts) and link /tools/governor-limits/.

## 2. Sharing, CRUD and FLS

- **Sharing keyword.** Every class that does data access should declare `with sharing`, `without sharing` or `inherited sharing` deliberately. A class with no keyword runs with the sharing of the caller or, for an entry point, without enforcing sharing. Flag a missing keyword on an entry point (`@AuraEnabled`, `@RestResource`, `@InvocableMethod`, controller, web service). `without sharing` needs a comment saying why.
- **CRUD and FLS.** Sharing does not enforce object or field permissions. For code run on behalf of a user, prefer `WITH USER_MODE` in SOQL, `AccessLevel.USER_MODE` in `Database.query`, `Database.insert` and similar, or `Security.stripInaccessible` to strip fields the user cannot access before returning or saving. `WITH SECURITY_ENFORCED` is the older option; prefer `WITH USER_MODE` in new code. Check the current behavior of each for the code's API version, because they differ in what they do when a field is inaccessible (throw versus strip).
- **System-mode DML by design.** Triggers and background jobs often need system mode. Report only when the code serves a user request and returns or writes fields without any enforcement.
- **Returned data.** `@AuraEnabled` methods that return whole SObjects with every field, or fields the user should not see.
- **Hard-coded access.** Checks based on profile names, user names or `UserInfo.getUserId()` equals a literal. Prefer permission sets and custom permissions (`FeatureManagement.checkPermission`).

## 3. SOQL and SOSL injection

- **Concatenated dynamic SOQL.** `Database.query('... ' + userInput)`. Fix: use bind variables, either static SOQL or `Database.queryWithBinds` with a `Map<String, Object>` and `AccessLevel`. Check `queryWithBinds` availability for the API version.
- **`String.escapeSingleQuotes`.** It helps for a string value placed inside quotes. It does not protect field names, object names, `ORDER BY` columns, operators or numbers, and it is not a substitute for bind variables. For those, validate against an allowlist (for example the keys of `Schema.SObjectType.X.fields.getMap()`).
- **`LIKE` with user input.** Bind it: `String term = '%' + input + '%'; ... LIKE :term`. Note that wildcard characters in input still act as wildcards.
- **SOSL** built from user text: escape reserved characters or use `SOSL` binds.

## 4. Hard-coded values

- Record IDs, profile IDs, queue IDs, org-specific URLs, email addresses and secrets in code. Fix: custom metadata, custom settings, `Schema.SObjectType...getRecordTypeInfosByDeveloperName()`, Named Credentials and custom labels.
- Record types matched by label. Use `DeveloperName`.
- Credentials, tokens or API keys in code or in `System.debug`. High severity.
- `Test.isRunningTest()` branches in production code. Flag as a smell.

## 5. Trigger structure and recursion

- **One trigger per object**, no business logic in the trigger body: delegate to a handler class and branch on `Trigger.operationType`. See the site's trigger handler pattern article.
- **Context variables.** Use `Trigger.old` in delete triggers, `Trigger.newMap`/`oldMap` to compare changes, and do not read `Trigger.new` in `before delete` or `Trigger.old` in `before insert`.
- **Before triggers** should change `Trigger.new` records directly, not run DML on them. After triggers cannot change `Trigger.new` records and should run DML on separate copies or other records.
- **Run only when needed.** Compare old and new values and skip unchanged records, to avoid needless work and re-entry.
- **Recursion guards.** A `static Boolean` flag stops later chunks in the same transaction from running logic (a bulk load runs the trigger once per batch of records). Prefer a static `Set<Id>` of processed records. Update-in-trigger loops are limited by trigger stack depth (see the tool for the number).
- **Error handling in triggers.** Use `addError` on the record or field for validation. Do not swallow exceptions.
- **Order of execution.** Note when logic depends on flows, workflow or other triggers running in a particular order, because trigger order on one object is not guaranteed.

## 6. Async Apex

- **Wrong tool.** `@future` with sObject parameters (not allowed: pass IDs), `@future` called from a loop, a future call from a future or batch context, or a queueable enqueued per record in a loop. See the tool for the exact counts. The async chooser tool at /tools/async-apex-chooser/ helps pick between future, queueable, batch and scheduled.
- **Batch Apex.** Large `Database.Stateful` state, queries in `execute` that should be in `start`, no `finish` error handling, and a batch started from a trigger without checking limits.
- **Queueable.** Chaining without a stop condition, passing large state, missing `Database.AllowsCallouts` when it makes callouts.
- **Scheduled Apex.** Logic in `execute` that should hand off to batch or queueable, hard-coded cron jobs.
- **Assumptions about timing.** Code that expects async work to have finished in the same transaction.

## 7. Error handling and logging

- Empty `catch` blocks, catching `Exception` and continuing silently, or exceptions that lose the original message.
- Limit exceptions cannot be caught: do not rely on try/catch to protect against them.
- `Database.insert(records, false)` without reading the `SaveResult` list (partial failures ignored).
- `System.debug` of personal data or secrets.
- `@AuraEnabled` methods should throw `AuraHandledException` with a user-safe message, not raw system errors.
- `@AuraEnabled(cacheable=true)` methods must not perform DML.

## 8. Callouts and Named Credentials

- **Endpoint and auth.** Hard-coded URLs or credentials in `HttpRequest`. Use a Named Credential: `req.setEndpoint('callout:My_Credential/path')`. See the site's Named Credentials article.
- **Callout after DML.** A callout after uncommitted DML in the same transaction fails with an uncommitted work pending error. Fix: callout first, or move the callout to async.
- **Callouts from triggers** must run asynchronously (`@future(callout=true)` or `Queueable` with `Database.AllowsCallouts`).
- **Callouts in loops.** See the tool for the per-transaction callout limit; batch requests where the API allows.
- **Response handling.** Missing status-code checks, no timeout (`setTimeout`), unguarded `JSON.deserialize` of untrusted shapes, and secrets in logs.
- **Retries** and idempotency for writes to external systems.

## 9. Test class quality

- **Annotations.** `@IsTest` on the class and methods. `@IsTest(SeeAllData=true)` is a finding (tests should create their own data); allow it only for the few cases that need org data and say which.
- **Assertions.** Tests that run code but assert nothing, or only assert `!= null`. Use `Assert.areEqual`, `Assert.isTrue`, `Assert.isNotNull` and similar (or `System.assertEquals`) with a message. Assert on results, not on "no exception".
- **Shared data.** Use `@TestSetup` to create common records once. Remember each test method gets a fresh copy of setup data.
- **Bulk.** At least one test with a batch of records larger than a single trigger batch (the trigger batch size is in the tool) to prove bulk safety, plus single-record and zero-record cases.
- **Negative and permission tests.** Expected failures (`addError`, thrown exceptions) and `System.runAs` with a user who has the least privilege the feature needs.
- **Governor boundaries.** Use `Test.startTest()` and `Test.stopTest()` to reset limits and to force async work to finish before asserting.
- **Callouts** need `Test.setMock` with an `HttpCalloutMock`. Do not make real callouts.
- **No coverage chasing.** Flag tests that exist only to reach a coverage percentage.
- **Data.** Use a test data factory instead of copy-pasted inserts. No hard-coded IDs.

## 10. General quality (usually Low)

- Methods that are very long or deeply nested, dead code, unused variables and imports of constants.
- Old API version in the `-meta.xml` file compared with the org's current API version (68.0 at Winter '27). Mention it, do not demand an upgrade without testing.
- Magic strings and numbers. Use constants, custom labels or custom metadata.
- Naming that hides intent, and missing ApexDoc on public methods.
- `Database.query` where static SOQL would do (static SOQL is compiler-checked and tracked in dependencies).
- Code that the Salesforce Code Analyzer would flag. The site's article on the Salesforce Code Analyzer covers running it.

## Severity guide

- **High:** security exposure (injection, missing CRUD/FLS on a user-facing path, secrets in code), SOQL or DML in a loop in code that runs in a trigger or bulk path, callout after DML in the same transaction, data loss risk.
- **Medium:** likely failure at larger volume, missing recursion control, `without sharing` without reason, hard-coded IDs, async misuse, tests that assert nothing.
- **Low:** style, naming, documentation, minor inefficiency, old API version.
