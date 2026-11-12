---
title: "PlatformEventChannel Metadata Type Reference"
description: "Configure and deploy PlatformEventChannel (.platformEventChannel-meta.xml) metadata for custom Change Data Capture and Platform Event Pub/Sub channels."
category: metadata
tags:
  - metadata-api
  - platform-events
  - change-data-capture
  - integration
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: advanced
tldr: "PlatformEventChannel (.platformEventChannel-meta.xml) defines a custom streaming channel (__chn) that groups either Change Data Capture (CDC) events, custom Platform Events, or Real-Time Event Monitoring events for Pub/Sub API subscribers."
faq:
  - q: "Why should I create a custom PlatformEventChannel instead of subscribing to the standard ChangeEvents channel?"
    a: "Subscribing to the default /data/ChangeEvents channel delivers all CDC events across every enabled object in the org. Creating a custom PlatformEventChannel (such as SalesEvents__chn) lets you isolate specific entities, apply server-side stream filtering, and enrich events with extra fields."
  - q: "What is the required naming suffix for a custom PlatformEventChannel?"
    a: "Every custom PlatformEventChannel fullName and file name must end with the __chn suffix, such as ERP_Sync_Channel__chn.platformEventChannel-meta.xml."
  - q: "Why was the channelMembers field removed from PlatformEventChannel in API version 47.0?"
    a: "Starting in API version 47.0, Salesforce decoupled channel membership into a separate metadata type called PlatformEventChannelMember so individual object streams, enriched fields, and filter expressions can be deployed and deleted independently."
  - q: "What are the valid combinations of channelType and eventType on a PlatformEventChannel?"
    a: "Set channelType to data (with optional eventType data) for Change Data Capture channels. Set channelType to event (with eventType set to custom or monitoring in API v61.0+) for grouping custom Platform Events or Real-Time Event Monitoring events."
  - q: "Can I retrieve or delete the standard ChangeEvents channel using PlatformEventChannel?"
    a: "No. In API version 47.0 and later, the standard ChangeEvents channel cannot be retrieved, deployed, or deleted as a PlatformEventChannel. Instead, retrieve and deploy its member objects using PlatformEventChannelMember."
related:
  - metadata/platform-event-channel-member-metadata-type
  - metadata/custom-object-metadata-type
  - apis/pubsub-api-eventbus
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_platformeventchannel.htm
---

The `PlatformEventChannel` metadata type defines a **custom event channel** (`__chn`) that external middleware (subscribing via the [Pub/Sub API](/docs/apis/pubsub-api-eventbus/) or CometD) can subscribe to in order to receive a dedicated, filtered stream of **Change Data Capture (CDC)** events, **Custom Platform Events**, or **Real-Time Event Monitoring** events.

In Salesforce DX projects, custom channels are stored in `force-app/main/default/platformEventChannels/` with the `.platformEventChannel-meta.xml` suffix (for example, `ERP_Order_Sync__chn.platformEventChannel-meta.xml`).

```mermaid
flowchart LR
    PEC["PlatformEventChannel\n(ERP_Order_Sync__chn)"] --> Mem1["PlatformEventChannelMember\n(AccountChangeEvent + enrichedFields)"]
    PEC --> Mem2["PlatformEventChannelMember\n(OrderChangeEvent + filterExpression)"]
    PEC --> Sub["Pub/Sub API gRPC Subscriber\n(/data/ERP_Order_Sync__chn)"]
```

## Why Custom `PlatformEventChannel` Architecture Matters

If you enable Change Data Capture on 15 objects in Setup, every subscriber listening to the default `/data/ChangeEvents` topic receives change events for all 15 objects—quickly exhausting daily event delivery allocations when multiple downstream systems (ERP, Data Warehouse, Billing) listen simultaneously. By provisioning dedicated `PlatformEventChannel` streams per downstream subscriber and pairing them with [PlatformEventChannelMember](/docs/metadata/platform-event-channel-member-metadata-type/) filters, each consumer receives only the objects and rows it actually cares about.

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `channelType` | `PlatformEventChannelType` | Yes | `data` (for Change Data Capture channels) or `event` (for custom Platform Events or RTEM events) |
| `eventType` | `PlatformEventChannelEventType` | No | Introduced in API v61.0: `data` (with `channelType: data`), `custom`, or `monitoring` (with `channelType: event`) |
| `label` | `string` | Yes | Human-readable label of the custom channel |

## Production-Grade XML Examples

### 1. Custom Change Data Capture Channel (`ERP_Order_Sync__chn.platformEventChannel-meta.xml`)

Subscribed via `/data/ERP_Order_Sync__chn`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PlatformEventChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <channelType>data</channelType>
    <label>ERP Order Sync CDC Channel</label>
</PlatformEventChannel>
```

### 2. Custom Platform Event Grouping Channel (`Billing_Events__chn.platformEventChannel-meta.xml`)

Subscribed via `/event/Billing_Events__chn` (API version 61.0+):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PlatformEventChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <channelType>event</channelType>
    <eventType>custom</eventType>
    <label>Consolidated Billing Platform Events Channel</label>
</PlatformEventChannel>
```

> [!WARNING]
> **Upgrading Legacy API v45.0–46.0 Files**: In API version 47.0 and later, `<channelMembers>` is no longer valid inside `PlatformEventChannel`. Always define channel entities in separate [PlatformEventChannelMember](/docs/metadata/platform-event-channel-member-metadata-type/) files.

## Querying `PlatformEventChannel` via Tooling API

```sql
-- List all custom PlatformEventChannels in the org (Tooling API)
SELECT Id, DeveloperName, MasterLabel, ChannelType, EventType
FROM PlatformEventChannel
ORDER BY MasterLabel ASC
```

