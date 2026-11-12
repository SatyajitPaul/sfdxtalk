---
title: "EntitlementSettings Metadata Architecture"
description: "Configure EntitlementSettings metadata in Salesforce to manage Service Cloud SLAs, milestone tracking, business hours, and case entitlement workflows."
category: "metadata"
tags:
  - metadata
  - settings
  - entitlements
  - service-cloud
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "EntitlementSettings controls Service Cloud Entitlement Management, enabling milestone timers, versioned entitlement processes, and case SLA validation."
faq:
  - q: "What does EntitlementSettings configure in Salesforce?"
    a: "It configures Entitlement Management in Service Cloud, controlling milestone timers, SLA tracking on Cases, and entitlement process versioning."
  - q: "Why is EntitlementSettings critical for CI/CD deployments?"
    a: "Service Cloud Case milestones and entitlement page layouts fail deployment if Entitlement Management is disabled in the destination environment."
  - q: "Where is EntitlementSettings located in an SFDX project?"
    a: "It is located at force-app/main/default/settings/Entitlement.settings-meta.xml and retrieved as Settings:Entitlement."
related:
  - metadata/custom-object-metadata-type
  - metadata/layout-metadata-type
  - metadata/flexipage-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-entitlementsettings.md"
---

## Architectural Overview

`EntitlementSettings` activates and governs Entitlement Management in Service Cloud. In enterprise customer support centers with strict service-level agreements (SLAs), entitlement features ensure that support tiers, contract terms, response times, and resolution milestones are systematically measured and enforced on Case records.

Deploying `EntitlementSettings` enables the `Entitlement`, `Milestone`, and `CaseMilestone` standard objects, allowing administrators to attach countdown timers, SLA breach alerts, and milestone automation to customer cases. Without this setting enabled, attempting to deploy page layouts, Lightning record pages, or Apex classes that reference Entitlement objects will result in deployment failures.

```mermaid
flowchart LR
    A["Entitlement.settings-meta.xml"] --> B["enableEntitlements = true"]
    B --> C["Entitlement Standard SObject"]
    B --> D["CaseMilestone SLA Countdown"]
    B --> E["Entitlement Process Versioning"]
    D --> F["Case FlexiPage Milestone Tracker"]
```

## Directory and File Conventions

`EntitlementSettings` follows standard Salesforce settings naming and directory conventions.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `Entitlement`) / `EntitlementSettings` |
| **SFDX Folder** | `force-app/main/default/settings/` |
| **File Name** | `Entitlement.settings-meta.xml` |
| **Scratch Org Key** | `entitlementSettings` |

## Key Metadata Fields

The `EntitlementSettings` XML exposes key configuration options for SLA governance:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `enableEntitlements` | `boolean` | Yes | Globally turns on Entitlement Management in the org. |
| `enableEntitlementVersioning` | `boolean` | No | Enables multi-version entitlement processes for gradual SLA updates. |
| `enableMilestoneStoppedTime` | `boolean` | No | Pauses milestone clocks when cases enter on-hold or customer-waiting status. |
| `enableMilestoneFeed` | `boolean` | No | Posts milestone updates and breach notifications to the Case Chatter feed. |

> [!NOTE]
> Setting `enableMilestoneStoppedTime` to `true` requires configuring Case statuses that represent stopped-time states (e.g., "Pending Customer Action").

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition enabling Entitlement Management with milestone paused-time tracking:

```xml title="force-app/main/default/settings/Entitlement.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<EntitlementSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableEntitlementVersioning>true</enableEntitlementVersioning>
    <enableEntitlements>true</enableEntitlements>
    <enableMilestoneFeed>true</enableMilestoneFeed>
    <enableMilestoneStoppedTime>true</enableMilestoneStoppedTime>
</EntitlementSettings>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Entitlement</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy with `sf` CLI commands:

```bash
# Retrieve Entitlement settings
sf project retrieve start --metadata Settings:Entitlement

# Deploy Entitlement settings to destination org
sf project deploy start --metadata Settings:Entitlement
```

## Architect Best Practices and Gotchas

- **Deployment Prerequisites:** Always deploy `Settings:Entitlement` in the initial deployment wave before deploying Entitlement Processes (`EntitlementProcess`), Case Milestones, or Case [Layout](/docs/metadata/layout-metadata-type/) components.
- **Milestone Clock Accuracies:** Pair `enableMilestoneStoppedTime` with well-defined Case Status picklist values in Business Hours configurations to prevent false SLA breaches across global timezones.
- **Entitlement Process Versioning:** Always turn on `enableEntitlementVersioning` to allow releasing new SLA definitions without forcibly migrating in-flight customer cases.

> [!TIP]
> Include `entitlementSettings: { "enableEntitlements": true }` in your scratch org definitions to support automated continuous integration testing for Service Cloud repositories.
