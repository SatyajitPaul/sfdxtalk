---
name: process-builder-to-flow-migration
description: Plans the migration of Salesforce Process Builder processes to Flow. Inventories processes, reads each definition, maps criteria and actions to Flow equivalents, flags what does not map cleanly, and produces a migration plan with a test plan. Use when moving off Process Builder or consolidating automation. Read-only; never changes the org.
license: MIT
metadata:
  version: "1.0.0"
  publisher: SFDX Talk (sfdxtalk.com)
---

# Process Builder to Flow Migration Planner

Produce a migration plan for moving Process Builder processes to Flow. This skill only reads and plans. It never modifies, activates, deactivates or deletes anything. Every change is made by a human in a sandbox first.

## Connection

Use the first source that works:

1. The Salesforce CLI logged in to an org: `sf data query --use-tooling-api --query "<SOQL>" --target-org <alias>` for inventory, and `sf project retrieve start --metadata Flow:<ApiName> --target-org <alias>` inside an SFDX project to read a definition. Run `sf data query --help` and `sf project retrieve start --help` if a flag differs in the installed version.
2. A Salesforce MCP server that can run SOQL or Tooling API queries: use it for inventory and object descriptions only. Tool names vary by server.
3. Process XML supplied by the user, or already in the project at `force-app/main/default/flows/`.
4. No connection: ask for the XML and a list of processes, and say what you could not check.

## Workflow

1. **Inventory.** Process Builder processes are stored as Flow records with process type Workflow. Query:
   `SELECT Id, DefinitionId, MasterLabel, ProcessType, Status, VersionNumber FROM Flow WHERE ProcessType = 'Workflow' AND Status = 'Active'`
   with the Tooling API. Check the result: if it is empty or errors, run `sf data query --help` and confirm field names with a describe of `Flow`, then fall back to Setup, Process Automation, Process Builder. Do not select the `Metadata` field in a multi-row query. Group the processes by object (read it from each definition).
2. **Retrieve each definition.** Retrieve by API name and read the XML. Use `FlowDefinitionView` or the Setup page to find the API name if only the label is known.
3. **Read each process.** For every process note: the object, the start condition (record created, or created or edited, or invoked by another process), each criteria node with its conditions and its "stop or evaluate next" setting, each immediate action and each scheduled action.
4. **Map criteria and actions.** Use `references/process-builder-to-flow-mapping.md`. Record the Flow equivalent for each node and action.
5. **Flag what does not map cleanly.** Use the "Does not map cleanly" section of the reference: scheduled actions, formulas, evaluate-next logic, actions on related records, recursion settings, order of execution changes.
6. **Choose the approach per process.** Offer both: Salesforce's Migrate to Flow tool in Setup where it supports the process (check Setup, Migrate to Flow, for what it reports as supported), or a manual rebuild. Say which you recommend and why. Do not claim what the tool supports beyond what the user sees in Setup.
7. **Design the target flows.** Group processes by object. Recommend one record-triggered flow per object and trigger timing, with entry conditions and decisions inside, instead of one flow per process. Choose before save for same-record field updates (no extra DML) and after save for related records, emails, Chatter, Apex and subflow calls.
8. **Write the plan.** Order the work: lowest risk first, dependencies (processes that call other processes) respected. Include the test plan.
9. **Say what to verify.** State the retirement timeline only as in Rules.

## Rules

- Read-only. Never run deploy, activate, deactivate, delete or any DML. Do not run the Migrate to Flow tool; it is a Setup action for a human.
- All changes happen in a sandbox first, with a human reviewing before production.
- Keep the old process active until the new flow is verified. The human decides when to deactivate it, and only one of the two should be active for a given behavior, to avoid double actions.
- Do not invent behavior. If a criteria node, formula or action cannot be read from the XML, mark it unknown.
- Retirement timeline: Salesforce announced end of support for Workflow Rules and Process Builder effective December 31, 2025, according to secondary sources. Existing processes were reported to keep running. Tell the user to check Salesforce's current announcement for what that means for them, and do not state a shutdown date.
- Do not paste record data or personal data from queries into the plan.

## Output format

1. **Inventory table**: process label, API name, object, active version, trigger, action counts.
2. **Per-process mapping**: criteria and actions with the Flow equivalent.
3. **Flags**: items that do not map cleanly, each with a recommended handling.
4. **Target design**: flows to build per object and timing, before or after save, with reasons.
5. **Migration plan**: ordered steps, who does what in the sandbox, cutover and rollback.
6. **Test plan**: cases per process (see the reference), and bulk and negative tests.
7. **Unknowns**: what was not readable or verified.
