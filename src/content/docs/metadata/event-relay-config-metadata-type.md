---
title: "EventRelayConfig Metadata Type for Amazon EventBridge"
description: "Stream Salesforce Platform Events and Change Data Capture (CDC) events to AWS EventBridge using the EventRelayConfig metadata type and Named Credentials."
category: "metadata"
tags:
  - metadata-api
  - platform-events
  - integration
  - event-driven
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "EventRelayConfig (eventRelays/<Name>.eventRelay-meta.xml) configures native, serverless streaming of Platform Events and Change Data Capture events from Salesforce directly to Amazon EventBridge."
faq:
  - q: "What metadata components are required to set up an EventRelayConfig to AWS EventBridge?"
    a: "An EventRelayConfig requires three prerequisites: a NamedCredential containing the 12-digit AWS account ID and region (such as callout:AWS_EventBridge_Partner), a custom PlatformEventChannel (__chn), and one or more PlatformEventChannelMember definitions."
  - q: "Why must state be set to STOP when first deploying a new EventRelayConfig?"
    a: "When creating a new EventRelayConfig via the Metadata API, Salesforce requires state to be omitted or set to STOP so the AWS partner event source can be provisioned first. Once created and associated in AWS EventBridge, you update state to RUN."
  - q: "What is the difference between LATEST and EARLIEST in the relayOption field?"
    a: "If the relay recovers from an unrecoverable replay error, ReplayRecovery set to LATEST resumes from new incoming events only, whereas EARLIEST replays all retained events stored on the Salesforce event bus (up to the 72-hour retention window)."
  - q: "How do you monitor the runtime health of an EventRelayConfig using SOQL?"
    a: "You can query the EventRelayFeedback standard object in SOQL to inspect Status (RUN, PAUSE, STOP, ERROR), RemoteResource (the AWS partner event source ARN), ErrorMessage, ErrorCode, and LastRelayedEventTime."
related:
  - metadata/platform-event-channel-metadata-type
  - metadata/platform-event-channel-member-metadata-type
  - metadata/named-credential-metadata-type
  - metadata/platform-event-subscriber-config-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_eventrelayconfig.htm
---

## Why the `EventRelayConfig` Metadata Type Eliminates Custom CometD/PubSub Middleware

Traditionally, streaming Salesforce **Platform Events** and **Change Data Capture (CDC)** events into AWS required building, hosting, and monitoring stateful Pub/Sub API (gRPC) or CometD subscriber workers on ECS/Lambda to track `ReplayId` checkpoints.

Introduced in API v56.0, **`EventRelayConfig`** (`eventRelays/<Name>.eventRelay-meta.xml`) provides a **100% managed, serverless event bridge** managed by Salesforce. Salesforce pushes every event on your custom [PlatformEventChannel](/docs/metadata/platform-event-channel-metadata-type/) directly into an **Amazon EventBridge Partner Event Bus**, handling replay checkpoints and error recovery automatically.

```mermaid
flowchart LR
    MEM["PlatformEventChannelMember<br/>(AccountChangeEvent / Order_Event__e)"] --> CHN["PlatformEventChannel<br/>(AWS_Order_Sync_Channel__chn)"]
    NC["NamedCredential<br/>(callout:AWS_Prod_EventBridge)"] --> RELAY["EventRelayConfig<br/>(eventRelays/AWS_Order_Relay.eventRelay-meta.xml)"]
    CHN --> RELAY
    RELAY -->|Managed Push| AWS["Amazon EventBridge<br/>Partner Event Bus"]
```

---

## Key Metadata Fields on `EventRelayConfig`

| Field | Type | Required | Description |
|---|---|---|---|
| `eventChannel` | `string` | Yes | Developer name of the custom [PlatformEventChannel](/docs/metadata/platform-event-channel-metadata-type/) (e.g., `AWS_Sync_Channel__chn`). Cannot be changed after creation! |
| `destinationResourceName` | `string` | Yes | Reference to the AWS [NamedCredential](/docs/metadata/named-credential-metadata-type/) prefixed with `callout:` (e.g., `callout:AWS_Account_US_East_1`). Cannot be changed after creation! |
| `label` | `string` | No | Meaningful UI label displayed in Setup Event Relays. |
| `state` | `EventRelayAdminState` | No | `STOP` (required on initial creation), `RUN` (actively relaying events), or `PAUSE` (paused while preserving replay state). |
| `relayOption` | `string` | No | Escaped JSON string configuring replay recovery: `{"ReplayRecovery":"LATEST"}` or `{"ReplayRecovery":"EARLIEST"}`. |

---

## Real-World XML Example (`eventRelays/AWS_ERP_Sync_Relay.eventRelay-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<EventRelayConfig xmlns="http://soap.sforce.com/2006/04/metadata">
    <destinationResourceName>callout:AWS_EventBridge_US_East_1</destinationResourceName>
    <eventChannel>AWS_ERP_Sync_Channel__chn</eventChannel>
    <label>AWS ERP Sync Relay</label>
    <relayOption>{&quot;ReplayRecovery&quot;:&quot;EARLIEST&quot;}</relayOption>
    <state>STOP</state>
</EventRelayConfig>
```

---

## Monitoring `EventRelayConfig` & `EventRelayFeedback` via SOQL

In Production, you can monitor the live operational state, AWS Partner Event Source name, and last relayed timestamp by querying **`EventRelayFeedback`** in standard SOQL:

```sql
SELECT Id, EventRelayConfigId, EventRelayConfig.DeveloperName,
       Status, RemoteResource, LastRelayedEventTime,
       ErrorCode, ErrorMessage, ErrorTime
FROM EventRelayFeedback
ORDER BY LastRelayedEventTime DESC
```

---

## Senior Architect Two-Step Deployment Pattern

> [!WARNING]
> **Why Deploying `<state>RUN</state>` Fails on First Deploy:** Salesforce does not allow creating a brand-new `EventRelayConfig` with `<state>RUN</state>`. Follow this two-step deployment sequence:
> 1. Deploy the `NamedCredential`, `PlatformEventChannel`, `PlatformEventChannelMember`, and `EventRelayConfig` with `<state>STOP</state>`.
> 2. Activate the Partner Event Source in your AWS EventBridge console (matching the `RemoteResource` returned in `EventRelayFeedback`), then update `<state>RUN</state>`!

