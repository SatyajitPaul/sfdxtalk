---
title: "PrivacySettings Metadata Type in SFDX"
description: "Configure PrivacySettings metadata in Salesforce DX to enforce GDPR and CCPA compliance, automated Individual creation, and real-time consent streaming."
category: "metadata"
tags:
  - metadata
  - settings
  - privacy
  - gdpr
  - compliance
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "PrivacySettings governs compliance automation, Individual object auto-creation, and consent event streams for GDPR, CCPA, and enterprise privacy regulations."
faq:
  - q: "What regulatory frameworks are supported by PrivacySettings?"
    a: "It supports data privacy compliance under GDPR, CCPA, CPRA, and HIPAA by governing consent management and Individual records."
  - q: "Where is PrivacySettings stored in an SFDX project repository?"
    a: "It resides at force-app/main/default/settings/Privacy.settings-meta.xml and is retrieved using the Settings:Privacy identifier."
  - q: "What happens when enableIndividualAutoCreate is set to true?"
    a: "Salesforce automatically provisions and links a corresponding Individual record whenever a new Lead, Contact, or Person Account is created."
  - q: "What is the purpose of the ConsentEventStream feature?"
    a: "It broadcasts real-time consent changes to external integration systems and data lakes via the high-volume streaming event bus."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-privacysettings.md"
---

## Architectural Overview

Data privacy regulations—including the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA)—require enterprises to manage consumer consent, track communication channels, and honor "Right to be Forgotten" requests. Salesforce addresses these requirements natively through data privacy objects anchored by the `Individual` entity.

The `PrivacySettings` metadata type controls organization-wide automation for data privacy and consent management. It governs automated creation of `Individual` records, enables data privacy masking policies, and activates `ConsentEventStream` to broadcast consent modifications across the enterprise architecture.

```mermaid
flowchart TD
    A["PrivacySettings: Privacy.settings-meta.xml"] --> B["enableIndividualAutoCreate"]
    A --> C["enableConsentEventStream"]
    B --> D["Automatically Creates Individual on Lead/Contact DML"]
    C --> E["Broadcasts Real-Time Consent Changes to Event Bus"]
    E --> F["Downstream Marketing & Data Lake Synchronization"]
```

Deploying `PrivacySettings` through automated CI/CD pipelines ensures that privacy compliance controls are immutably replicated across all staging and production environments.

## Directory and File Conventions

In SFDX source format, `PrivacySettings` is managed as a settings singleton:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `Privacy`) / `PrivacySettings` |
| **SFDX Directory** | `force-app/main/default/settings/` |
| **File Suffix** | `.settings-meta.xml` |
| **Full File Path** | `force-app/main/default/settings/Privacy.settings-meta.xml` |
| **Scratch Org Setting Key** | `privacySettings` |

## Key Metadata Fields

The XML schema of `PrivacySettings` contains key regulatory switches:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `enableIndividualAutoCreate` | `boolean` | No | Automatically provisions an `Individual` record whenever a Lead or Contact is inserted. |
| `enableConsentEventStream` | `boolean` | No | Publishes real-time streaming events when consent records are updated or revoked. |
| `enablePrivacyDataManagement` | `boolean` | No | Activates core privacy data governance tooling and record-level tracking. |

> [!NOTE]
> When `enableIndividualAutoCreate` is true, Lead conversion automatically preserves the linked `Individual` record on the converted Contact.

## Declarative XML and Package Manifest Examples

Below is a production `Privacy.settings-meta.xml` configuration:

```xml title="force-app/main/default/settings/Privacy.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<PrivacySettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableConsentEventStream>true</enableConsentEventStream>
    <enableIndividualAutoCreate>true</enableIndividualAutoCreate>
    <enablePrivacyDataManagement>true</enablePrivacyDataManagement>
</PrivacySettings>
```

### Scratch Org Definition Configuration

```json title="config/project-scratch-def.json"
{
  "orgName": "Privacy & Compliance Scratch Org",
  "edition": "Enterprise",
  "settings": {
    "privacySettings": {
      "enableIndividualAutoCreate": true,
      "enableConsentEventStream": true,
      "enablePrivacyDataManagement": true
    }
  }
}
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Privacy</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `PrivacySettings` via the Salesforce CLI:

```bash
# Retrieve Privacy settings from the org
sf project retrieve start --metadata Settings:Privacy

# Deploy Privacy settings to target org
sf project deploy start --metadata Settings:Privacy

# Validate deployment into staging environment
sf project deploy validate --metadata Settings:Privacy
```

## Architect Best Practices and Gotchas

- **DML Trigger Side-Effects:** Enabling `enableIndividualAutoCreate` causes Salesforce to fire an implicit insert DML on `Individual` during Lead and Contact creation. Custom triggers and [Flow](/docs/metadata/flow-metadata-type/) definitions on `Individual` must be bulkified to prevent governor limit failures during bulk data imports.
- **Event Bus Consumer Scalability:** When `enableConsentEventStream` is active, mass consent updates (e.g., preference center batch updates) can generate large volumes of streaming events. Ensure external consumers handle high throughput without message loss.
- **Storage Considerations:** Individual records consume standard data storage. Large B2C orgs with millions of Leads should account for the additional record storage overhead.

> [!TIP]
> Subscribe to `ConsentEventStream` using Salesforce Pub/Sub API or Amazon EventBridge to keep external data warehouses and marketing engines synchronized with user opt-outs.
