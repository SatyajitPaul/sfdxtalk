# Process Builder to Flow mapping

Process Builder processes are stored as Flow metadata, so their XML can be retrieved with `sf project retrieve start --metadata Flow:<ApiName>` and read like any flow. Check the `processType` value and element names in the XML you retrieved. Where this table says "check", confirm in the XML or Setup instead of assuming.

## Trigger

| Process Builder | Flow equivalent |
|---|---|
| Starts when a record changes: created | Record-triggered flow, trigger on create |
| Starts when a record changes: created or edited | Record-triggered flow, trigger on create and update; add entry conditions to match the criteria |
| Invoked by another process | Autolaunched flow called as a subflow, or a record-triggered flow, depending on the caller |
| Platform event start | Platform-event-triggered flow |
| Object | Same object on the flow's start element |

## Criteria nodes

| Process Builder | Flow equivalent |
|---|---|
| Criteria: conditions are met | Decision outcome with the same conditions |
| Criteria: formula evaluates to true | Decision outcome using a formula resource, or the start element's entry formula |
| Criteria: no criteria, just actions | Actions on the path with no decision |
| Stop the process after criteria | Decision outcome that connects to the end, not to the next decision |
| Evaluate the next criteria | Outcome continues to the next decision. Unlike a decision, which takes one outcome, evaluate-next means several nodes can fire on one record. Model each node as its own decision in sequence, or as separate branches |
| "Is changed" / prior value conditions | Entry conditions with the "when a record is updated to meet the conditions" option, or a decision comparing `$Record` and `$Record__Prior` |

## Actions

| Process Builder action | Flow equivalent |
|---|---|
| Update Records (the triggering record) | Update element on `$Record`: use before-save field updates with an assignment, or an after-save Update Records element |
| Update Records (related records) | Update Records element with a filter on the relationship, in an after-save flow. If it updates a collection, loop and update once after the loop |
| Create a Record | Create Records element (after save) |
| Email Alert | Action: send an email alert (use the existing email alert) |
| Apex (invocable) | Action: the same invocable Apex action |
| Post to Chatter | Action: post to Chatter |
| Quick Action | Action: the quick action, where supported; check the XML and Flow action list |
| Flow (call a flow) | Subflow element calling the autolaunched flow |
| Process (call another process) | Subflow element calling the replacement flow |
| Submit for approval | Action: submit for approval; check availability |
| Scheduled actions | Scheduled path on the record-triggered flow, or a scheduled flow; see below |

## Does not map cleanly

- **Scheduled actions.** Process Builder runs actions at a time relative to a date field. In Flow use a scheduled path on the record-triggered flow with an offset. Behavior when the record changes before the scheduled time differs: test it. Check the current Flow docs for how pending actions are handled.
- **Evaluate next vs one decision outcome.** A single Flow decision follows only one outcome. Several matching criteria nodes need sequential decisions or merged logic.
- **Formulas.** Process Builder formula syntax and function support can differ from Flow formulas; rewrite and test each. Fields from related records through relationships should be checked.
- **Multiple processes on one object.** Process Builder processes had no guaranteed order between them. Consolidating into one flow per object and timing makes the order explicit, which can change behavior. Review each interaction.
- **Order of execution.** Process Builder updates run after save and can re-fire workflow, triggers and flows. A before-save flow changes the timing: the update happens before validation and triggers. Re-check dependent triggers and validation rules.
- **Recursion.** Process Builder had a setting to re-evaluate the record after updates by the same process. Flow has no identical switch; use entry conditions and "only when changed" to prevent loops.
- **Updating a related record that the triggering record depends on,** or parent fields set by a child record, may need an after-save flow and a bulk-safe design.
- **Actions on multiple records or collections.** Bulkification differs: avoid data elements inside loops.
- **Hard-coded IDs** in criteria and values. Replace with a custom metadata, custom label or a lookup by name, and review in each sandbox.
- **Run context.** Check whether the process ran in system context and set the flow's run mode deliberately.

## Choosing before save or after save

- Before save: set fields on the same record. No extra DML and fast. Cannot create or update other records, send emails or call actions that need the record Id on create.
- After save: related records, email alerts, Chatter, Apex actions, subflows, scheduled paths.
- A process with both kinds of actions usually becomes one before-save flow plus one after-save flow for the object.

## Test plan template (per process)

1. Create a record that meets each criteria node, and confirm each action result.
2. Create a record that meets none, and confirm nothing happens.
3. Edit a record so a condition becomes true, and confirm the flow fires only on that change.
4. Edit a record that already met the condition, and confirm it does not fire again when it should not.
5. Load 200 records at once (Data Loader or an anonymous Apex test script in the sandbox) and confirm no limit errors.
6. Test as a user with limited permissions, and as an integration user.
7. Compare the field values, emails and created records against the old process on the same input data.
8. Test scheduled actions by changing the date field and waiting, or with a short offset in the sandbox.
9. Check other automation on the object (triggers, validation rules, flows) for interactions.
10. Keep the old process inactive in the sandbox during the test, so results come from the flow alone, and record the cutover and rollback steps.
