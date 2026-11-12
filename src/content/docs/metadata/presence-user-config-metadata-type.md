---
title: "PresenceUserConfig Metadata Type for Omni-Channel"
description: "Configure Omni-Channel agent capacity, interruptible capacity, auto-accept, decline reasons, and push timeout statuses with PresenceUserConfig in SFDX."
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
tldr: "PresenceUserConfig (presenceUserConfigs/<Name>.presenceUserConfig-meta.xml) defines Omni-Channel agent behavior, including total workload capacity, interruptible capacity, auto-accept, and status transitions on decline or timeout."
faq:
  - q: "What is the purpose of interruptibleCapacity on PresenceUserConfig?"
    a: "Available in API v57.0+, interruptibleCapacity splits an agent's workload into primary (non-interruptible) and interruptible buckets so an agent working on asynchronous Cases or Leads can still receive real-time VoiceCall or MessagingSession requests."
  - q: "Can enableAutoAccept and enableDecline both be set to true on a PresenceUserConfig?"
    a: "No. Salesforce enforces that enableAutoAccept and enableDecline are mutually exclusive. If work items are automatically accepted when pushed to the agent, the agent cannot manually decline the push offer."
  - q: "Why should you avoid hardcoding usernames inside PresenceUserConfig in SFDX?"
    a: "Usernames inside the assignments.users block of a PresenceUserConfig are environment-specific and frequently fail deployment across Sandboxes. Assign PresenceUserConfig via profiles or automate user assignments separately."
  - q: "How do you query PresenceUserConfig settings in SOQL?"
    a: "You can query the PresenceUserConfig standard object in SOQL to inspect DeveloperName, MasterLabel, Capacity, InterruptibleCapacity, ShouldAutoAcceptEnabled, ShouldDeclineEnabled, and PresenceStatusOnPushTimeoutId."
related:
  - metadata/service-channel-metadata-type
  - metadata/queue-routing-config-metadata-type
  - metadata/skill-metadata-type
  - metadata/profile-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_presenceuserconfig.htm
---

## Why the `PresenceUserConfig` Metadata Type Controls the Agent Experience

While [ServiceChannel](/docs/metadata/service-channel-metadata-type/) defines *what* is routed and [QueueRoutingConfig](/docs/metadata/queue-routing-config-metadata-type/) defines *how* items are prioritized, **`PresenceUserConfig`** (`presenceUserConfigs/<Name>.presenceUserConfig-meta.xml`) governs the **agent's Omni-Channel console behavior and capacity limits**:

1. **Total & Interruptible Capacity (`capacity`, `interruptibleCapacity`):** Maximum workload units an agent can hold at once, plus separate capacity for background/interruptible work (`Case` / `Email`) vs. live synchronous channels (`Voice` / `Messaging`).
2. **Auto-Accept vs. Manual Decline (`enableAutoAccept`, `enableDecline`, `declineReasons`):** Whether work opens automatically or allows agents to reject offers with an audited reason.
3. **Automatic Away Status on Missed Push (`presenceStatusOnPushTimeout`, `presenceStatusOnDecline`):** Prevents "ghost agents" who walk away from their desk without logging out of Omni-Channel from stalling the routing queue.

```mermaid
flowchart LR
    PUC["PresenceUserConfig<br/>(Tier2_Blended_Agents.presenceUserConfig-meta.xml)"] --> CAP["Capacity Limits<br/>(capacity: 10, interruptibleCapacity: 6)"]
    PUC --> AUTO["Offer Handling<br/>(enableAutoAccept vs enableDecline)"]
    PUC --> TIMEOUT["Ghost-Agent Protection<br/>(presenceStatusOnPushTimeout: Away_No_Response)"]
    PUC --> ASSIGN["assignments<br/>(Profiles / Users)"]
```

---

## Key Metadata Fields on `PresenceUserConfig`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Display name of the Presence Configuration in Setup. |
| `capacity` | `int` | Yes | Maximum primary capacity units an agent assigned to this configuration can hold simultaneously. |
| `interruptibleCapacity` | `int` | No | *(API v57.0+)* Maximum capacity units allowed for interruptible work items (where `QueueRoutingConfig.isInterruptible = true`). |
| `enableAutoAccept` | `boolean` | No | Automatically accepts pushed work items without requiring the agent to click Accept (cannot be combined with `enableDecline = true`). |
| `enableDecline` | `boolean` | No | Allows agents to decline pushed work offers. |
| `enableDeclineReason` | `boolean` | No | Requires agents to pick a reason (`declineReasons`) when declining a work item. |
| `presenceStatusOnDecline` | `string` | No | `ServicePresenceStatus` developer name automatically applied when an agent declines an offer. |
| `presenceStatusOnPushTimeout` | `string` | No | `ServicePresenceStatus` developer name automatically applied when a push offer times out (`QueueRoutingConfig.pushTimeout`). |
| `acwExtensionEnabled` | `boolean` | No | *(API v60.0+)* Allows agents to extend their After Conversation Work (ACW) wrap-up timer. |
| `maxExtensions` / `acwExtensionDuration` | `int` | No | *(API v60.0+)* Number of allowed ACW extensions and seconds per extension. |

---

## Real-World XML Example (`presenceUserConfigs/Blended_Voice_And_Case_Agents.presenceUserConfig-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PresenceUserConfig xmlns="http://soap.sforce.com/2006/04/metadata">
    <acwExtensionDuration>60</acwExtensionDuration>
    <acwExtensionEnabled>true</acwExtensionEnabled>
    <capacity>10</capacity>
    <declineReasons>On_Customer_Escalation_Call</declineReasons>
    <declineReasons>Shift_Ending_Within_10_Mins</declineReasons>
    <enableAutoAccept>false</enableAutoAccept>
    <enableDisconnectSound>true</enableDisconnectSound>
    <enableDecline>true</enableDecline>
    <enableDeclineReason>true</enableDeclineReason>
    <enableRequestSound>true</enableRequestSound>
    <interruptibleCapacity>6</interruptibleCapacity>
    <label>Blended Voice and Case Agents</label>
    <maxExtensions>2</maxExtensions>
    <presenceStatusOnPushTimeout>Busy_Missed_Offer</presenceStatusOnPushTimeout>
</PresenceUserConfig>
```

---

## Querying `PresenceUserConfig` and Assigned Users via SOQL

Both `PresenceUserConfig` and `PresenceUserConfigUser` / `PresenceUserConfigProfile` are queryable in SOQL.

### 1. Audit All Presence Configurations and Their Capacity Limits

```sql
SELECT Id, DeveloperName, MasterLabel, Capacity, InterruptibleCapacity,
       ShouldAutoAcceptEnabled, ShouldDeclineEnabled,
       PresenceStatusOnPushTimeoutId, PresenceStatusOnDeclineId
FROM PresenceUserConfig
ORDER BY MasterLabel ASC
```

### 2. List Users Assigned to a Specific `PresenceUserConfig`

```sql
SELECT Id, PresenceUserConfig.DeveloperName, User.Name, User.Username
FROM PresenceUserConfigUser
WHERE User.IsActive = true
ORDER BY PresenceUserConfig.DeveloperName, User.Name
```

---

## Senior Architect Best Practices & Gotchas

> [!WARNING]
> **Never Commit `<assignments><users>` to Git:** If you assign individual users to a `PresenceUserConfig` in Setup and retrieve the metadata, Salesforce populates `<assignments><users>jane@acme.com.sandbox</users></assignments>`. Deploying that file to Production or another Sandbox will fail because the sandbox username does not exist. Always strip `<assignments><users>` from version control!

- **Always Configure `presenceStatusOnPushTimeout`:** Without `presenceStatusOnPushTimeout` mapped to a busy/away `ServicePresenceStatus`, an agent who steps away from their computer with their Omni-Channel status set to `Available` will continuously receive and time out on every high-priority work item in the queue.
