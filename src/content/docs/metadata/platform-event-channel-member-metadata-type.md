---
title: "PlatformEventChannelMember Metadata Type Reference"
description: "Configure and deploy PlatformEventChannelMember (.platformEventChannelMember-meta.xml) metadata for CDC object selection, enrichedFields, and stream filters."
category: metadata
tags:
  - metadata-api
  - change-data-capture
  - platform-events
  - integration
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: advanced
tldr: "PlatformEventChannelMember (.platformEventChannelMember-meta.xml) binds a Change Data Capture entity (AccountChangeEvent, Custom__ChangeEvent) or Platform Event to a standard or custom channel, supporting enrichedFields and SOQL-like filterExpression rules."
faq:
  - q: "How do I enable Change Data Capture on an object via SFDX metadata?"
    a: "Create a PlatformEventChannelMember file targeting the standard ChangeEvents channel (for example, ChangeEvents_AccountChangeEvent.platformEventChannelMember-meta.xml) with eventChannel set to ChangeEvents and selectedEntity set to AccountChangeEvent."
  - q: "Why must double underscores (__chn or __c) be replaced with a single underscore in the PlatformEventChannelMember file name?"
    a: "Salesforce Metadata API forbids two consecutive underscores in a component fullName except for a namespace prefix or type suffix. Therefore, SalesEvents__chn + MyObj__ChangeEvent must be named SalesEvents_chn_MyObj_ChangeEvent.platformEventChannelMember-meta.xml."
  - q: "What is the purpose of enrichedFields on a PlatformEventChannelMember?"
    a: "By default, CDC update events only include fields whose values changed in that transaction. Adding a field (such as External_ERP_ID__c) to enrichedFields guarantees that field's current value is always included in every update and delete event payload."
  - q: "How does filterExpression reduce event delivery consumption?"
    a: "A filterExpression (introduced in API v56.0) evaluates SOQL-like criteria on the Salesforce server before publishing to the channel, ensuring non-matching CDC or Platform Events are never delivered and do not count against daily CometD/PubSub delivery limits."
  - q: "How do I remove an object from Change Data Capture in a target org?"
    a: "Deploy a destructiveChanges.xml manifest targeting the specific PlatformEventChannelMember fullName, such as ChangeEvents_LeadChangeEvent."
related:
  - metadata/platform-event-channel-metadata-type
  - metadata/custom-object-metadata-type
  - apis/pubsub-api-eventbus
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_platformeventchannelmember.htm
---

The `PlatformEventChannelMember` metadata type links a Change Data Capture (CDC) entity (such as `AccountChangeEvent` or `Invoice__ChangeEvent`) or a custom Platform Event to either the standard `ChangeEvents` channel or a custom [PlatformEventChannel](/docs/metadata/platform-event-channel-metadata-type/) (`MyChannel__chn`). Introduced in API version 47.0, it also configures **CDC Field Enrichment** (`enrichedFields`) and **Server-Side Stream Filtering** (`filterExpression`).

In Salesforce DX projects, channel members live in `force-app/main/default/platformEventChannelMembers/` with the `.platformEventChannelMember-meta.xml` suffix.

```mermaid
flowchart TD
    DML["Database Update on Account"] --> CDC["AccountChangeEvent Generated"]
    CDC --> Member["PlatformEventChannelMember\n(ERP_Order_Sync_chn_AccountChangeEvent)"]
    Member --> Filter{"filterExpression:\nERP_Sync_Enabled__c = true"}
    Filter -->|"Matches"| Enrich["Appends Always-Present\nenrichedFields (External_ERP_Id__c)"]
    Enrich --> Stream["Delivered to /data/ERP_Order_Sync__chn"]
```

## Critical Naming Rule: Single Underscores in `fullName`

Because Salesforce reserves double underscores (`__`) in `fullName` strictly for namespace prefixes and type suffixes, you **must** collapse `__chn` and `__ChangeEvent` into single underscores in the filename and `package.xml` `<members>` entry:

| Target Channel (`eventChannel`) | Selected Entity (`selectedEntity`) | Required File / Member `fullName` |
|---|---|---|
| `ChangeEvents` (Standard CDC) | `AccountChangeEvent` | `ChangeEvents_AccountChangeEvent` |
| `ChangeEvents` (Standard CDC) | `Invoice__ChangeEvent` | `ChangeEvents_Invoice_ChangeEvent` |
| `ERP_Order_Sync__chn` (Custom) | `AccountChangeEvent` | `ERP_Order_Sync_chn_AccountChangeEvent` |
| `ERP_Order_Sync__chn` (Custom) | `Invoice__ChangeEvent` | `ERP_Order_Sync_chn_Invoice_ChangeEvent` |

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `eventChannel` | `string` | Yes | `ChangeEvents` (for standard Setup -> Change Data Capture) or `<CustomChannel>__chn` |
| `selectedEntity` | `string` | Yes | Event API name (`AccountChangeEvent`, `Custom_Obj__ChangeEvent`, or `Custom_Event__e`) |
| `enrichedFields` | `EnrichedField[]` | No | Up to 10 non-empty fields (`<name>`) always included in `UPDATE` and `DELETE` CDC payloads (v51.0+) |
| `filterExpression` | `string` | No | SOQL-like server-side filter expression (v56.0+) |

## Production-Grade XML Example (Enriched + Filtered CDC Stream)

Below is a `PlatformEventChannelMember` (`ERP_Order_Sync_chn_AccountChangeEvent.platformEventChannelMember-meta.xml`) that enriches every Account CDC event with `ERP_Customer_Number__c` and filters the stream to only Accounts in the `AMER` region:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PlatformEventChannelMember xmlns="http://soap.sforce.com/2006/04/metadata">
    <enrichedFields>
        <name>ERP_Customer_Number__c</name>
    </enrichedFields>
    <enrichedFields>
        <name>Tax_Identification_Number__c</name>
    </enrichedFields>
    <eventChannel>ERP_Order_Sync__chn</eventChannel>
    <filterExpression><![CDATA[Region__c = 'AMER']]></filterExpression>
    <selectedEntity>AccountChangeEvent</selectedEntity>
</PlatformEventChannelMember>
```

> [!TIP]
> **Why `enrichedFields` Eliminates Middleware Lookups**: Without `enrichedFields`, a CDC `UPDATE` or `DELETE` event only contains the Salesforce 18-character `RecordIds` header and the specific fields that changed in that transaction—forcing your middleware to make a REST API callback just to look up the record's external ERP key (`ERP_Customer_Number__c`). Adding `ERP_Customer_Number__c` to `enrichedFields` includes the external key in every single update and delete event automatically.

## Querying `PlatformEventChannelMember` via Tooling API

```sql
-- Inspect all CDC and Platform Event channel memberships and filter expressions (Tooling API)
SELECT Id, DeveloperName, EventChannel, SelectedEntity, FilterExpression
FROM PlatformEventChannelMember
ORDER BY EventChannel, SelectedEntity
```

