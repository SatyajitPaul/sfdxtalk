---
name: salesforce-org-explorer
description: Read-only exploration of a Salesforce org's data model and configuration. Use when the user asks what objects exist, what fields, relationships, record types or picklist values an object has, which validation rules, Apex triggers or flows run on an object, or where a field is used. Uses MCP schema discovery first, then the sf CLI, and returns a plain-language map plus what could not be seen. Never writes.
license: MIT
metadata:
  version: "1.0.0"
  publisher: SFDX Talk (sfdxtalk.com)
---

# Salesforce Org Explorer

Build an accurate, plain-language map of part of a Salesforce org: the objects, the fields that matter, how they relate, and the automation that fires on them. Read only. Report what you could not see.

## Connection

Use whichever connection is available, in this order:

1. A Salesforce MCP server with schema tools (for example the hosted `platform/sobject-reads` server). `getUserInfo` returns the identity, profile and org details of the connected user. `getObjectSchema` is two-phase: call it with no object name for a lightweight index of accessible objects, then with an object name for that object's fields, record types and relationships. `soqlQuery` runs read-only queries. If a Headless 360 server is connected, `discover`, `describe` and `dispatch_readonly` (GET only) can reach other read endpoints. Tool names differ between servers: pick tools by what they do.
2. The Salesforce CLI logged in to an org, using `--target-org <alias>`. Check the login first with `sf org list`. Commands are in the workflow and query sections below.
3. No connection: say so, ask the user to paste describe output or retrieved metadata, and work only from that.

Never call a tool that creates, updates or deletes records or metadata, deploys, or runs anonymous Apex. If the connection could write, still only read.

## Workflow

1. **Get the org context.** With MCP call `getUserInfo`. With the CLI run `sf org display --target-org <alias>`. Note the org type (production, sandbox or scratch), the API version and the user's profile. Say if this is production.
2. **Pin down the question.** Is it one object, a whole area (for example "everything about quoting"), or one field? Ask one short question if the object name is ambiguous. Never guess an API name.
3. **Find the object.** MCP: `getObjectSchema` with no object name, then match the user's words to API names. CLI: `sf sobject list --sobject custom --target-org <alias>` (the `--sobject` value is `all`, `standard` or `custom`).
4. **Describe the object.** MCP: `getObjectSchema` with the object name. CLI: `sf sobject describe --sobject <Object> --target-org <alias> --json`. Record: label, key prefix, whether it is custom, field count, required fields, lookup and master-detail fields (and the object each points to), child relationships, record types, and picklist values with their active status. Summarize; do not paste hundreds of fields. Show the 10 to 20 fields that explain the object.
5. **Find the automation on the object.** Run the read-only Tooling API queries in the section below. Count active and inactive items separately.
6. **Find where a field is used (when asked).** Use the dependency query below, then confirm important hits by reading the component. Say the result may be incomplete.
7. **Optionally retrieve metadata.** When the user needs the actual formula, Apex or flow definition, retrieve into a scratch folder with `sf project retrieve start --metadata "<Type>:<Name>" --target-org <alias>` (the `--metadata` and `--manifest` flags select what to retrieve; check `sf project retrieve start --help`). This downloads files to the local project and does not change the org. Ask before writing files into the user's project folder; prefer a temporary project.
8. **Assess risk and write the map** using the output format below.

## Read-only queries

Run these with `sf data query --query "<SOQL>" --use-tooling-api --target-org <alias>` unless noted. Replace `Account` with the object. For custom objects use the API name ending in `__c`. If a query fails, run `sf sobject describe --sobject <ToolingObject> --use-tooling-api` to see the real fields, and adjust. Do not assume a field exists.

- **Apex triggers on the object:** `SELECT Name, Status, TableEnumOrId, UsageBeforeInsert, UsageAfterInsert, UsageBeforeUpdate, UsageAfterUpdate, UsageBeforeDelete, UsageAfterDelete, UsageAfterUndelete, ApiVersion FROM ApexTrigger WHERE TableEnumOrId = 'Account'`. For custom objects `TableEnumOrId` may hold the object ID rather than its name; if no rows return, look up the ID (`SELECT DurableId FROM EntityDefinition WHERE QualifiedApiName = 'Obj__c'`) and filter on it.
- **Validation rules on the object:** `SELECT ValidationName, Active, ErrorDisplayField, ErrorMessage FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = 'Account'`. The rule formula lives in the `Metadata` field, which Tooling API only returns when you query a single record by `Id`. Retrieve the rule with `sf project retrieve start` if the formula is needed.
- **Flows:** `FlowDefinitionView` lists flows with their status and type. Describe it first (`sf sobject describe --sobject FlowDefinitionView`; add `--use-tooling-api` if that fails) and select the fields you see, such as `ApiName`, `Label`, `ProcessType`, `TriggerType` and `ActiveVersionId`. Filter to the object using the trigger-object field if the describe shows one. Otherwise list record-triggered flows and open the likely ones, because the object a flow runs on is stored in the flow's own metadata.
- **Other metadata by type:** `sf org list metadata --metadata-type <Type> --target-org <alias>` lists components of a type (for example `CustomObject`, `Flow`, `ApexTrigger`, `ValidationRule`, `WorkflowRule`). Listing metadata needs the Modify Metadata Through Metadata API Functions permission or Modify All Data.
- **Fields on an object (alternative to describe):** `SELECT QualifiedApiName, DataType, IsCalculated FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = 'Account'`. `FieldDefinition` needs a filter on the object. Use `sf sobject describe` first when you can, since it is the more complete source.
- **Where a field is used:** `SELECT MetadataComponentName, MetadataComponentType FROM MetadataComponentDependency WHERE RefMetadataComponentName = 'My_Field__c'` through the Tooling API. This object is documented as beta, caps a Tooling query at 2,000 records, may not cover every component type (reports are not included), and filters on `RefMetadataComponentName` may be rejected on some API versions. Treat the answer as "found at least these". Also search the local project with text search for the field API name when the project is available.

## Rules

- Read only. No DML, no deploy, no anonymous Apex, no metadata deploy or delete commands, no `sf org create` or login changes.
- Use only object and field names you have seen in a tool result.
- Do not make claims about what you could not query. Missing access, an empty result and "does not exist" are three different things. Say which.
- Do not run unbounded queries on large objects. Do not count records with a full scan on huge objects without telling the user; `SELECT COUNT() FROM Obj` is fine when asked.
- Do not read or repeat record data. This skill is about structure and configuration. If the user wants data, hand over to a query skill.
- Treat metadata as sensitive: it can reveal business rules and integrations. Do not paste it into other tools.
- Say plainly when you are in production.

## Output format

1. **Object summary:** label, API name, custom or standard, record types, rough field count.
2. **Key fields:** a short table (label, API name, type, notes such as required, unique, formula).
3. **Relationships:** parents (lookup or master-detail), important children, and the record types.
4. **Picklists:** active values of the picklists that drive behavior.
5. **Automation on the object:** triggers (events, active or not), flows (type, active), validation rules (active, plain-language meaning), with counts.
6. **Risks and observations:** for example several triggers on one object (ordering is not guaranteed), a trigger and several record-triggered flows on the same event, many active validation rules that can block integrations and data loads, old API versions, inactive automation that looks forgotten. Mention the site's governor limits tool at /tools/governor-limits/ when automation stacking could hit limits.
7. **Could not see:** every query that failed or returned nothing because of permissions, beta status or API gaps, and what that leaves unknown (for example, flows or managed package logic you could not inspect).
8. **Suggested next step:** one or two follow-up questions or commands the user could run.
