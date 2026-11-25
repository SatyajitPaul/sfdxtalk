---
name: flow-explainer
description: Explains a Salesforce Flow in plain language by reading its metadata (retrieved with the sf CLI or supplied as flow-meta.xml). Covers trigger, entry conditions, element-by-element path, data read and written, fault handling and risks. Use when asked what a Flow does, why it fires, or whether it is safe. Read-only.
license: MIT
metadata:
  version: "1.0.0"
  publisher: SFDX Talk (sfdxtalk.com)
---

# Flow Explainer

Read a Salesforce Flow definition and explain what it does, what it touches and where it could go wrong. This skill never edits, deploys, activates or deactivates a Flow.

## Connection

Use the first source that works:

1. A Flow file already available: the user pastes the XML, gives a path, or the local SFDX project holds it at `force-app/main/default/flows/<ApiName>.flow-meta.xml`. Read it directly.
2. The Salesforce CLI, run inside an SFDX project and logged in to an org: `sf project retrieve start --metadata Flow:<ApiName> --target-org <alias>`. The file lands in the project's `flows` folder. Run `sf project retrieve start --help` if the flags differ in the installed version. Retrieval only reads from the org and writes a local file.
3. A Salesforce MCP server that can run queries: use it only to look up the flow's API name and active version, and to describe objects and fields the flow touches. Describe tools by what they do; names vary by server.
4. No connection: ask the user to paste the XML, and say what you could not check.

If `Flow:<ApiName>` returns nothing, check the exact API name in the org (Setup, Flows) and the file name in the `flows` folder. A retrieve returns the version the org's metadata API provides; confirm the status (`<status>`) in the XML so you know whether you are reading the active version.

## Workflow

1. **Identify the flow.** Get the API name, or list the `flows` folder. Ask one short question if several flows match.
2. **Obtain the XML.** Read the local file, or retrieve it (see Connection). Never modify it. If a flow has many versions, say which one you read.
3. **Read the header.** Note `label`, `processType`, `status`, `apiVersion`, `runInMode` if present, and the `start` element. Use `references/flow-xml-elements.md` to map element names to plain terms.
4. **Classify the trigger.** From `start`: `triggerType` (before save, after save, scheduled, platform event), `object`, `recordTriggerType`, `filters` or `filterFormula`, and any `scheduledPaths`. No `triggerType` means a screen, autolaunched or other invoked flow: say what calls it if you can tell (a subflow reference, an Apex invocation, a button) and mark it unknown otherwise.
5. **Walk the path.** Starting at the `start` element's `connector`, follow every `connector` and `faultConnector` and each decision outcome. Number the steps in execution order, branch by branch. Say in one line what each element does, quoting the label.
6. **Record data access.** List every object and field read (`recordLookups`), created, updated or deleted (`recordCreates`, `recordUpdates`, `recordDeletes`), with the filters used. Note fields set by `assignments` on the triggering record in a before-save flow.
7. **Check fault handling.** For each element that can fail (data elements, Apex and other actions, subflows), say whether a `faultConnector` exists and where it goes.
8. **Check risks.** Apply `references/flow-xml-elements.md` section "Risk patterns". Report only risks you can see in the XML, each with the element label.
9. **Resolve names.** If the user wants field meaning or object context, describe the objects through the connection. Do not guess what a custom field means.
10. **List unknowns.** Anything not visible in the XML: other flows, triggers and validation rules on the same object, who runs the flow, volume, called Apex behavior.

## Rules

- Read-only. Never run a deploy, activate, deactivate or delete command, and never write to the flow file.
- Explain only what the XML shows. Do not invent behavior of Apex classes, subflows or invocable actions you have not read; name them and mark them unread.
- Do not state order-of-execution interactions as fact. Flag them as risks to check against other automation on the object.
- Quote element labels and API names exactly. Do not rename them.
- Treat record data and hard-coded values in the flow as sensitive. Report that a hard-coded ID exists; do not paste personal data.
- If the XML is truncated or invalid, say so and stop short of conclusions.

## Output format

1. **Summary**: 2 to 4 sentences: what the flow is, when it runs, what it changes.
2. **Trigger and entry conditions**: type, object, timing, filters, run mode.
3. **Walkthrough**: a numbered list in execution order, with branches shown as sub-items and the fault path noted.
4. **Reads and writes**: a short table of object, fields, operation, element label.
5. **Risks**: a list, each with element label and a one-line reason.
6. **Unknowns**: what you could not verify and how the user can check it.
