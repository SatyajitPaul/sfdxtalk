---
title: "CallCenterRoutingMap Metadata Type in SFDX"
description: "Map Salesforce Omni-Channel queues, skills, and users to external Amazon Connect or partner telephony ARNs using CallCenterRoutingMap in SFDX."
category: "metadata"
tags:
  - metadata-api
  - service-cloud-voice
  - omni-channel
  - telephony
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "CallCenterRoutingMap maps a Salesforce Queue, Skill, or User to its corresponding external telephony identifier (such as an Amazon Connect Queue ARN) in Service Cloud Voice."
faq:
  - q: "What is the role of CallCenterRoutingMap in Service Cloud Voice?"
    a: "It links a Salesforce routing entity—such as an Omni-Channel Queue, Skill, or User—to its external telephony routing identifier, like an Amazon Connect queue or routing profile ARN."
  - q: "Where are CallCenterRoutingMap files stored in SFDX source format?"
    a: "They are stored in the force-app/main/default/callCenterRoutingMaps/ directory with the .callCenterRoutingMap-meta.xml file extension."
  - q: "Why do CallCenterRoutingMap deployments often require environment variables?"
    a: "The externalId field stores telephony provider identifiers such as AWS Account and Connect Instance ARNs, which differ between sandbox and production telephony instances."
  - q: "Can I query CallCenterRoutingMap records in SOQL?"
    a: "Yes, CallCenterRoutingMap is queryable via SOQL and Tooling API to verify mappings between ReferenceRecordId, CallCenterId, and ExternalId."
related:
  - metadata/service-channel-metadata-type
  - metadata/connected-app-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-callcenterroutingmap.md"
---

## Architectural Overview

In **Service Cloud Voice** (both with Amazon Connect and Partner Telephony), routing decisions span two systems: Salesforce Omni-Channel (which evaluates CRM data, Omni-Channel Flows, Queues, and Skills) and the cloud telephony engine (which controls physical media streams and agent voice states). The `CallCenterRoutingMap` metadata type is the synchronization bridge between these two worlds.

Each `CallCenterRoutingMap` record binds a specific `callCenter` (`CallCenter`), an internal Salesforce entity (`referenceRecord` pointing to a `Queue`, `Skill`, or `User`), and the `externalId` (for example, an Amazon Connect Queue ARN or Agent ARN). When an Omni-Channel Voice Call Flow routes a `VoiceCall` to a Salesforce Queue, Service Cloud Voice looks up the `CallCenterRoutingMap` to translate that Queue into the target Amazon Connect Queue ARN.

```mermaid
flowchart LR
    A["Omni-Channel Flow Routes VoiceCall"] --> B["Salesforce Queue (Tier_1_Voice_Support)"]
    B --> C["CallCenterRoutingMap Lookup"]
    C --> D["externalId (Amazon Connect Queue ARN)"]
    D --> E["Telephony Engine Connects Agent"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `CallCenterRoutingMap` |
| **Classic Directory** | `callCenterRoutingMaps/` |
| **Classic File Suffix** | `.callCenterRoutingMap` |
| **SFDX Source Directory** | `force-app/main/default/callCenterRoutingMaps/` |
| **SFDX File Suffix** | `.callCenterRoutingMap-meta.xml` |

## Key Metadata Fields

The `CallCenterRoutingMap` metadata type exposes the following XML elements:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `callCenter` | `string` | Yes | The DeveloperName (`InternalName`) of the parent [CallCenter](/docs/metadata/call-center-metadata-type/) contact center. |
| `externalId` | `string` | Yes | The external telephony system's unique identifier (such as `arn:aws:connect:us-east-1:123456789012:instance/.../queue/...`). |
| `masterLabel` | `string` | Yes | Human-readable label for the routing map entry. |
| `quickConnect` | `string` | No | Optional external Quick Connect ARN used for warm transfers to this queue or agent. |
| `referenceRecord` | `string` | Yes | The DeveloperName or Username of the mapped Salesforce Queue, Skill, or User record. |

> [!WARNING]
> Because `externalId` and `quickConnect` contain environment-specific AWS ARNs or partner telephony UUIDs, never deploy hardcoded sandbox ARNs to production. Use SFDX `stringReplacements` in `sfdx-project.json` to inject the target environment's Connect instance ARN at deploy time.

## Declarative XML & `package.xml` Examples

### SFDX Source File Example

```xml title="force-app/main/default/callCenterRoutingMaps/Tier_1_Billing_Voice_Map.callCenterRoutingMap-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<CallCenterRoutingMap xmlns="http://soap.sforce.com/2006/04/metadata">
    <callCenter>ACME_US_Voice_Center</callCenter>
    <externalId>arn:aws:connect:us-east-1:111122223333:instance/a1b2c3d4-5678-90ab-cdef-111111111111/queue/f9e8d7c6-5432-10fe-dcba-222222222222</externalId>
    <masterLabel>Tier 1 Billing Voice Map</masterLabel>
    <quickConnect>arn:aws:connect:us-east-1:111122223333:instance/a1b2c3d4-5678-90ab-cdef-111111111111/transfer-destination/99998888-7777-6666-5555-444444444444</quickConnect>
    <referenceRecord>Tier_1_Billing_Voice_Queue</referenceRecord>
</CallCenterRoutingMap>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Tier_1_Billing_Voice_Map</members>
        <name>CallCenterRoutingMap</name>
    </types>
    <version>68.0</version>
</Package>
```

## Querying via SOQL & SFDX CLI

Audit existing contact center routing mappings in any org using standard SOQL:

```soql
SELECT Id, DeveloperName, MasterLabel, CallCenter.InternalName,
       ReferenceRecordId, ExternalId, QuickConnect
FROM CallCenterRoutingMap
ORDER BY CallCenter.InternalName, MasterLabel ASC
```

Retrieve and deploy `CallCenterRoutingMap` components with the Salesforce CLI:

```bash
# Retrieve all CallCenterRoutingMap records
sf project retrieve start --metadata CallCenterRoutingMap

# Deploy a specific CallCenterRoutingMap
sf project deploy start --metadata CallCenterRoutingMap:Tier_1_Billing_Voice_Map
```

## Senior Architect Best Practices & Gotchas

- **Deploy Queue and Skill Dependencies First:** The `referenceRecord` field must resolve to an existing `Queue`, `Skill`, or `User` in the target org. Always include your voice `Queue` (`queues/*.queue-meta.xml`) and `Skill` metadata in the deployment manifest alongside `CallCenterRoutingMap`.
- **Separate User Mappings from Queue/Skill Mappings in Git:** While Queue and Skill `CallCenterRoutingMap` files belong in source control, User-level `CallCenterRoutingMap` records (mapping individual agent `User` records to Amazon Connect agent ARNs) are dynamically generated when users are added to the Contact Center. Avoid committing hundreds of user-specific routing maps to Git; only version-control Queue and Skill routing maps.
- **Missing Mapping Fallback Behavior:** If an Omni-Channel [Flow](/docs/metadata/flow-metadata-type/) routes a `VoiceCall` to a Salesforce Queue that lacks a `CallCenterRoutingMap` for the active `CallCenter`, the call transfer or routing action fails at runtime in Amazon Connect and drops back to the default fallback queue.
