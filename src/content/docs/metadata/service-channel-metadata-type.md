---
title: "ServiceChannel Metadata Type for Omni-Channel Routing"
description: "Configure Omni-Channel work item channels with the ServiceChannel metadata type. Learn status-based vs tab-based capacity, ACW timers, and SOQL queries."
category: "metadata"
tags:
  - metadata-api
  - omni-channel
  - service-cloud
  - routing
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ServiceChannel (serviceChannels/<Name>.serviceChannel-meta.xml) maps a Salesforce object—such as Case, MessagingSession, VoiceCall, or Lead—into Omni-Channel and configures capacity models and After Conversation Work."
faq:
  - q: "What is the purpose of the ServiceChannel metadata type in Omni-Channel?"
    a: "A ServiceChannel turns almost any standard or custom Salesforce object (such as Case, Lead, MessagingSession, VoiceCall, or a custom Order__c object) into a routable work item that Omni-Channel can push to agents."
  - q: "What is the difference between STATUS_BASED and TAB_BASED capacityModel on ServiceChannel?"
    a: "With TAB_BASED capacity, Omni-Channel releases agent capacity the moment the agent closes the console tab. With STATUS_BASED capacity ( configured via serviceChannelStatusFieldName and serviceChannelFieldValues), capacity remains consumed until the record status changes to a completed value."
  - q: "How do you configure After Conversation Work (ACW) wrap-up time in ServiceChannel metadata?"
    a: "You set isAfterConvoWorkTimerEnabled to true and specify afterConvoWorkMaxTime (in seconds, between 10 and 3600) to give agents dedicated wrap-up time before capacity is freed for the next conversation."
  - q: "Can you query ServiceChannel definitions in SOQL?"
    a: "Yes. You can query the ServiceChannel standard object in SOQL to retrieve DeveloperName, MasterLabel, RelatedEntity, SecondaryRoutingPriorityField, and CapacityModel."
related:
  - metadata/queue-routing-config-metadata-type
  - metadata/presence-user-config-metadata-type
  - metadata/skill-metadata-type
  - metadata/queue-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_servicechannel.htm
---

## Why the `ServiceChannel` Metadata Type Is the Entry Point to Omni-Channel

In Salesforce Omni-Channel architecture, Omni-Channel cannot route a record until its SObject type is registered as a **`ServiceChannel`** (`serviceChannels/<Name>.serviceChannel-meta.xml`). A `ServiceChannel` defines:

1. **Which SObject is routable** (`relatedEntityType`, such as `Case`, `Lead`, `MessagingSession`, `VoiceCall`, or a custom object).
2. **How agent capacity is measured and released** (`capacityModel`: `TAB_BASED` vs. `STATUS_BASED`).
3. **Secondary Routing Priority** (`secondaryRoutingPriorityField`): How Omni-Channel breaks ties among items in the same priority queue (for example, sorting by an SLA target date or customer lifetime value field).
4. **After Conversation Work (ACW) Timers** (`afterConvoWorkMaxTime`): Giving voice and messaging agents a structured wrap-up window after a conversation ends.

```mermaid
flowchart LR
    OBJ["Routable Record<br/>(Case / MessagingSession / Custom__c)"] --> SC["ServiceChannel<br/>(serviceChannels/Case_Channel.serviceChannel-meta.xml)"]
    SC --> CAP["Capacity Model<br/>(STATUS_BASED vs TAB_BASED)"]
    SC --> ACW["After Conversation Work<br/>(afterConvoWorkMaxTime)"]
    SC --> QRC["QueueRoutingConfig / Omni Flow"]
    QRC --> AGENT["Agent Console<br/>(PresenceUserConfig)"]
```

---

## Key Metadata Fields on `ServiceChannel`

| Field | Type | Required | Description |
|---|---|---|---|
| `relatedEntityType` | `string` | Yes | API name of the object routed by this channel (`Case`, `Lead`, `MessagingSession`, `Custom_Ticket__c`). Only one `ServiceChannel` can exist per object type! |
| `label` | `string` | Yes | Human-readable channel name in Omni-Channel Setup and Omni Supervisor. |
| `capacityModel` | `OmniChannelCapacityModel` | No | *(API v65.0+)* `TAB_BASED` or `STATUS_BASED`. |
| `serviceChannelStatusFieldName` | `string` | Conditional | Field API name (`Status`) evaluated when `capacityModel` is `STATUS_BASED`. |
| `serviceChannelFieldValues` | `ServiceChannelStatusField[]` | Conditional | Maps field values (`Working`, `Waiting on Customer`) to `IN_PROGRESS`, `PAUSED`, or `COMPLETED` capacity states. |
| `secondaryRoutingPriorityField` | `string` | No | Field on the target object used to order queued items within the same primary routing priority. |
| `doesMinimizeWidgetOnAccept` | `boolean` | No | Automatically minimizes the Omni-Channel utility widget when the agent accepts a work item. |
| `isAfterConvoWorkTimerEnabled` | `boolean` | No | *(API v55.0+)* Enables After Conversation Work (ACW) timer for the channel. |
| `afterConvoWorkMaxTime` | `int` | No | *(API v55.0+)* Maximum ACW duration in seconds (`10` to `3600`). |

---

## Real-World XML Example: Status-Based Case Service Channel

File: `force-app/main/default/serviceChannels/Support_Cases_Channel.serviceChannel-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ServiceChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <capacityModel>STATUS_BASED</capacityModel>
    <doesMinimizeWidgetOnAccept>true</doesMinimizeWidgetOnAccept>
    <isCheckCapOnOwnerChange>true</isCheckCapOnOwnerChange>
    <isCheckCapOnStatusChange>true</isCheckCapOnStatusChange>
    <label>Support Cases Channel</label>
    <relatedEntityType>Case</relatedEntityType>
    <secondaryRoutingPriorityField>Case.SLA_Priority_Rank__c</secondaryRoutingPriorityField>
    <serviceChannelFieldValues>
        <StatusFieldValue>New</StatusFieldValue>
        <StatusFieldValueType>IN_PROGRESS</StatusFieldValueType>
    </serviceChannelFieldValues>
    <serviceChannelFieldValues>
        <StatusFieldValue>Working</StatusFieldValue>
        <StatusFieldValueType>IN_PROGRESS</StatusFieldValueType>
    </serviceChannelFieldValues>
    <serviceChannelFieldValues>
        <StatusFieldValue>Waiting on Customer</StatusFieldValue>
        <StatusFieldValueType>PAUSED</StatusFieldValueType>
    </serviceChannelFieldValues>
    <serviceChannelStatusFieldName>Status</serviceChannelStatusFieldName>
</ServiceChannel>
```

---

## Querying `ServiceChannel` via SOQL

In Apex (for example, when calling `OmniChannel` routing APIs or querying `PendingServiceRouting` / `AgentWork`), you frequently need the `ServiceChannelId`.

```sql
SELECT Id, DeveloperName, MasterLabel, RelatedEntity,
       SecondaryRoutingPriorityField, CapacityModel,
       DoesMinimizeWidgetOnAccept
FROM ServiceChannel
ORDER BY MasterLabel ASC
```

---

## Senior Architect Best Practices & Gotchas

> [!WARNING]
> **One `ServiceChannel` Per Object Rule:** Salesforce enforces a strict 1:1 relationship between `ServiceChannel` and `relatedEntityType`. If the target Sandbox already has a `ServiceChannel` for `Case` with a different `DeveloperName` (for example, `sfdc_liveagent` or `Cases`), deploying a second `ServiceChannel` with `<relatedEntityType>Case</relatedEntityType>` will fail with a duplicate entity error.

- **Use `STATUS_BASED` Capacity for Asynchronous Cases:** With `TAB_BASED` capacity, an agent who accidentally closes a Case console tab immediately looks "available" to Omni-Channel even though they still own 10 unfinished Cases. `STATUS_BASED` capacity combined with `PAUSED` values (`Waiting on Customer`) accurately reflects real workload.
