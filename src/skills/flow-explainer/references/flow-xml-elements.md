# Flow XML elements this skill maps

Flow metadata lives in `*.flow-meta.xml`. These element names are the ones the skill relies on. For anything not listed, read the XML and describe it by its label; do not guess.

## Header and start

| XML element | Plain-language meaning |
|---|---|
| `label` | The flow's display name |
| `processType` | Kind of flow (for example screen flow, autolaunched flow, or a record-triggered or scheduled flow); read the value and describe it |
| `status` | Active, Draft or Obsolete for this version |
| `apiVersion` | API version the flow was saved with |
| `runInMode` | Whether the flow runs in user or system context, when present. An absent value means the default; say the default and tell the user to confirm it in Setup |
| `start` | The entry point: trigger and entry conditions, and the first connector |
| `start` > `triggerType` | When a triggered flow fires, for example before save, after save, scheduled or platform event |
| `start` > `object` | The object a record-triggered flow listens to |
| `start` > `recordTriggerType` | Create, update, create and update, or delete |
| `start` > `filters` / `filterLogic` / `filterFormula` | Entry conditions |
| `start` > `scheduledPaths` | Paths that run after a time offset |
| `start` > `connector` | The first element executed |

## Logic and data elements

| XML element | Plain-language meaning |
|---|---|
| `decisions` | A branch: outcomes with conditions, plus a default outcome |
| `assignments` | Sets variable or record field values |
| `loops` | Iterates over a collection |
| `recordLookups` | Get Records |
| `recordCreates` | Create Records |
| `recordUpdates` | Update Records |
| `recordDeletes` | Delete Records |
| `subflows` | Calls another flow |
| `actionCalls` | Runs an action: Apex, email alert, post to Chatter, quick action, or another invocable action. Check `actionType` and `actionName` |
| `screens` | A screen shown to the user (screen flows) |
| `waits` | Pauses until an event or time |

## Resources

| XML element | Plain-language meaning |
|---|---|
| `variables` | Variables and collections, with input and output availability |
| `formulas` | Formula resources |
| `constants` | Fixed values |
| `textTemplates` | Text templates |
| `choices` | Choice resources for screens |

## Connectors

| XML element | Plain-language meaning |
|---|---|
| `connector` | The next element on the normal path |
| `faultConnector` | The path taken when the element fails. Absent means no fault handling on that element |
| `defaultConnector` | The path for a decision when no outcome matches |
| `nextValueConnector` / `noMoreValuesConnector` | Loop body and loop exit |

## Risk patterns

Report a risk only when you can point to the element.

- **Data element inside a loop.** A `recordLookups`, `recordCreates`, `recordUpdates` or `recordDeletes` (or an `actionCalls` that does DML or a query) reached from a `loops` body. Each pass can consume a query or DML statement. Suggest collecting records in an assignment and acting once after the loop, and tell the user to check governor limits.
- **No fault path.** A data element, Apex action or subflow with no `faultConnector`. Failures surface as an unhandled flow error.
- **Hard-coded IDs.** A 15 or 18 character record ID literal in a condition, assignment or filter. IDs differ between orgs and sandboxes.
- **No entry-condition filter.** A record-triggered `start` with no `filters` and no `filterFormula`, so the flow runs on every create or update of the object.
- **Update the triggering record in an after-save flow.** A `recordUpdates` on the record that triggered the flow can cause extra saves and re-evaluation of other automation. Before-save assignments avoid this.
- **Order-of-execution interactions.** Other record-triggered flows, Apex triggers, validation rules and workflow on the same object run in a defined order, and a flow's own updates can re-fire them. The XML cannot show this; list it as something to check.
- **Context.** Note `runInMode` if set. A flow in system context can read or change data the running user cannot. Say what the value is, or say it is unset and to confirm the setting.
- **Unfiltered Get Records.** A `recordLookups` with no `filters`, or with no limit on stored records, reading more than needed.
- **Unread Apex or subflow.** Called code that was not read, so its effects are unknown.
