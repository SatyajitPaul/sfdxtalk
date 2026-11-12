---
title: "AIApplicationConfig Metadata Type in SFDX"
description: "Manage runtime thresholds, scoring intervals, and operational configurations for Einstein AI apps using AIApplicationConfig in Salesforce DX."
category: "metadata"
tags: ["metadata", "ai-application-config", "einstein-ai", "predictive-ai", "sf-cli"]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "AIApplicationConfig defines operational runtime settings, scoring parameters, and feature configurations linked to a parent AIApplication in Salesforce."
faq:
  - q: "What is the purpose of AIApplicationConfig in Salesforce?"
    a: "AIApplicationConfig stores the operational and runtime configuration parameters for a parent AIApplication, such as scoring behavior, thresholds, and feature flags."
  - q: "Where are AIApplicationConfig files located in SFDX?"
    a: "They are stored in the force-app/main/default/aiApplicationConfigs directory with the .aiApplicationConfig-meta.xml file suffix."
  - q: "Can I deploy AIApplicationConfig without its parent AIApplication?"
    a: "No, the referenced AIApplication must already exist in the target org or be included in the same deployment transaction."
  - q: "How do I retrieve AIApplicationConfig components using Salesforce CLI?"
    a: "Run sf project retrieve start --metadata AIApplicationConfig to pull all AI application configuration files into your local project."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-aiapplicationconfig.md"
---

## Architectural Overview

While `AIApplication` defines the high-level identity and type of an Einstein AI solution, `AIApplicationConfig` governs how that application behaves at runtime—controlling scoring thresholds, top factor display limits, and feature-specific toggles.

Separating `AIApplicationConfig` from the base `AIApplication` allows architects to tune operational parameters (such as confidence thresholds or explanation display settings) in production or staging without redeploying the underlying machine learning data definitions.

```mermaid
flowchart LR
    A["AIApplication (Parent Container)"] --> B["AIApplicationConfig (Runtime Tuning)"]
    B --> C["Scoring Thresholds & Top Factors"]
    C --> D["Einstein Lightning Component UI"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `AIApplicationConfig` |
| **SFDX Directory** | `force-app/main/default/aiApplicationConfigs/` |
| **File Suffix** | `.aiApplicationConfig-meta.xml` |
| **API Version Introduced** | `51.0` (Verified on `68.0` / Winter '27) |

## Key Metadata Fields

| Field Name | Type | Required | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| `aiApplicationDeveloperName` | `string` | Yes | DeveloperName of the parent `AIApplication` that owns this configuration. |
| `developerName` | `string` | No | Unique API identifier for this configuration record. |
| `masterLabel` | `string` | Yes | Human-readable label displayed in Setup. |
| `applicationId` | `string` | No | Internal or external application identifier associated with the config. |

> [!NOTE]
> Always retrieve `AIApplication` and `AIApplicationConfig` together in the same `package.xml` manifest so parent-child `aiApplicationDeveloperName` references stay intact.

## Declarative XML & `package.xml` Examples

### Sample `.aiApplicationConfig-meta.xml`

```xml title="force-app/main/default/aiApplicationConfigs/Customer_Churn_App_Runtime_Config.aiApplicationConfig-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<AIApplicationConfig xmlns="http://soap.sforce.com/2006/04/metadata">
    <aiApplicationDeveloperName>Customer_Churn_Prediction_App</aiApplicationDeveloperName>
    <developerName>Customer_Churn_App_Runtime_Config</developerName>
    <masterLabel>Customer Churn App Runtime Config</masterLabel>
</AIApplicationConfig>
```

### Sample `package.xml` Manifest

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Customer_Churn_Prediction_App</members>
        <name>AIApplication</name>
    </types>
    <types>
        <members>Customer_Churn_App_Runtime_Config</members>
        <name>AIApplicationConfig</name>
    </types>
    <version>68.0</version>
</Package>
```

## SOQL Query & SFDX CLI Commands

### Inspect AIApplicationConfig Records via SOQL

```soql
SELECT Id, DeveloperName, MasterLabel, AIApplicationId, CreatedDate
FROM AIApplicationConfig
ORDER BY CreatedDate DESC
```

### Retrieve and Deploy via Salesforce CLI

```bash
# Retrieve all AIApplicationConfig records
sf project retrieve start --metadata "AIApplicationConfig:*"

# Deploy a specific AIApplicationConfig
sf project deploy start --metadata "AIApplicationConfig:Customer_Churn_App_Runtime_Config"
```

## Senior Architect Best Practices & Gotchas

- **Cross-Environment Portability:** Never hardcode 15- or 18-character Salesforce record IDs inside configuration XML; always reference the parent application by its portable `aiApplicationDeveloperName`.
- **UI Component Visibility:** When configuring Einstein prediction explanations or top factors via `AIApplicationConfig`, ensure end users have a [PermissionSet](/docs/metadata/permission-set-metadata-type/) granting read access to the target prediction fields on the [CustomObject](/docs/metadata/custom-object-metadata-type/).

> [!TIP]
> Audit changes to `AIApplicationConfig` in your Git pull requests whenever business stakeholders request changes to Einstein confidence cutoffs so you maintain a clear compliance trail of AI decision thresholds.
