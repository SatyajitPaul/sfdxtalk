---
title: "DecisionMatrixDefinition Metadata Type in SFDX"
description: "Deploy DecisionMatrixDefinition metadata in Salesforce DX to manage Business Rules Engine matrix definitions, input and output columns, and versioning."
category: "metadata"
tags:
  - "metadata"
  - "business-rules"
  - "omnistudio"
  - "industries"
  - "sfdx"
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "DecisionMatrixDefinition metadata defines Business Rules Engine lookup tables, specifying input criteria and output columns across versioned execution rules."
faq:
  - q: "What is the difference between standard and grouped decision matrices?"
    a: "Standard matrices evaluate individual values against input columns, whereas grouped matrices group ranges or related attributes to produce shared outcomes."
  - q: "Can multiple versions of a DecisionMatrixDefinition be active at once?"
    a: "No. Only one version can be active at a time, governed by its effective start and end dates and activation status."
  - q: "How are DecisionMatrixDefinition components invoked by business processes?"
    a: "They are called by Expression Sets, Salesforce Flows, or Apex BusinessRulesEngine API methods to resolve complex pricing or eligibility calculations."
related:
  - "metadata/flow-metadata-type"
  - "metadata/custom-object-metadata-type"
  - "metadata/apex-class-metadata-type"
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-decisionmatrixdefinition.md"
---

## Architectural Overview

The `DecisionMatrixDefinition` metadata type represents exact-match and range-lookup decision matrices within the Salesforce Business Rules Engine (BRE). Widely utilized across Salesforce Industries (Financial Services Cloud, Public Sector Solutions, Health Cloud, and Revenue Lifecycle Management), decision matrices evaluate multi-variable inputs against tabular rows to return calculated premiums, tax rates, fee schedules, or entitlement statuses.

From an enterprise governance perspective, encapsulating pricing and eligibility logic inside `DecisionMatrixDefinition` metadata externalizes volatile business rules from Apex code and declarative Flows. This enables non-developer rule authors to maintain logic tables while architects preserve continuous integration integrity via version control.

```mermaid
flowchart LR
    A["OmniStudio Flow or Apex"] --> B["Expression Set"]
    B --> C["DecisionMatrixDefinition"]
    C --> D["Input Columns: Tier, Region, AssetType"]
    D --> E["Lookup Engine"]
    E --> F["Output Columns: DiscountPct, Fee"]
```

## SFDX Directory and File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `DecisionMatrixDefinition` |
| **SFDX Directory Path** | `force-app/main/default/decisionMatrixDefinitions/` |
| **File Suffix** | `.decisionMatrixDefinition-meta.xml` |
| **API Version** | `68.0` (Winter '27) |

## Key Metadata Fields

| Field | Type | Required | Description & Architectural Considerations |
| :--- | :--- | :--- | :--- |
| `label` | `string` | Yes | Human-readable label for the decision matrix definition. |
| `description` | `string` | No | Architectural summary of the decision logic and calling consumers. |
| `decisionMatrixType` | `string` | Yes | Type of matrix: `Standard` (exact matches) or `Grouped` (grouped sub-keys). |
| `decisionMatrixDefinitionVersions` | `DecisionMatrixDefinitionVersion[]` | Yes | Array of versioned metadata envelopes managing lifecycle and column layouts. |
| `decisionMatrixDefinitionVersions.versionNumber` | `int` | Yes | Monotonically incrementing version identifier. |
| `decisionMatrixDefinitionVersions.status` | `string` | Yes | Lifecycle state: `Draft`, `Active`, or `Inactive`. |
| `decisionMatrixDefinitionVersions.startDate` | `dateTime` | No | Beginning of the validity window for execution. |
| `decisionMatrixDefinitionVersions.endDate` | `dateTime` | No | Expiration timestamp for automated matrix retirement. |
| `decisionMatrixDefinitionVersions.columns` | `DecisionMatrixColumnDefinition[]` | Yes | Definition of column schema, identifying `Input` vs `Output` parameters. |

> [!NOTE]
> The `DecisionMatrixDefinition` metadata type transfers the matrix column schema and version structure. Matrix row data records are often loaded as CSV files via the Business Rules Engine UI or ingested via the Tooling and Connect REST APIs.

## Declarative XML and Package.xml Examples

### `DecisionMatrixDefinition` Metadata File

```xml title="force-app/main/default/decisionMatrixDefinitions/Tiered_Pricing_Matrix.decisionMatrixDefinition-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<DecisionMatrixDefinition xmlns="http://soap.sforce.com/2006/04/metadata">
    <decisionMatrixType>Standard</decisionMatrixType>
    <description>Calculates tiered commercial discounts by tier level and customer jurisdiction.</description>
    <label>Tiered Pricing Matrix</label>
    <decisionMatrixDefinitionVersions>
        <versionNumber>1</versionNumber>
        <status>Active</status>
        <startDate>2026-01-01T00:00:00.000Z</startDate>
        <columns>
            <columnType>Input</columnType>
            <dataType>Text</dataType>
            <displaySequence>1</displaySequence>
            <name>AccountTier</name>
        </columns>
        <columns>
            <columnType>Input</columnType>
            <dataType>Text</dataType>
            <displaySequence>2</displaySequence>
            <name>RegionCode</name>
        </columns>
        <columns>
            <columnType>Output</columnType>
            <dataType>Number</dataType>
            <displaySequence>3</displaySequence>
            <name>DiscountRate</name>
        </columns>
    </decisionMatrixDefinitionVersions>
</DecisionMatrixDefinition>
```

### `package.xml` Manifest

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Tiered_Pricing_Matrix</members>
        <name>DecisionMatrixDefinition</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval and Deployment Commands

Retrieve and deploy decision matrices across environments using Salesforce CLI:

```bash
# Retrieve all DecisionMatrixDefinition components
sf project retrieve start --metadata "DecisionMatrixDefinition" --target-org dev-bre

# Deploy a specific matrix definition to target UAT environment
sf project deploy start \
  --metadata "DecisionMatrixDefinition:Tiered_Pricing_Matrix" \
  --target-org uat-bre

# Query active decision matrix definitions via SOQL
sf data query --query "SELECT Id, DeveloperName, DecisionMatrixType FROM DecisionMatrixDefinition" --target-org uat-bre
```

## Senior Architect Best Practices and Gotchas

> [!WARNING]
> **Active Version Mutability Restrictions:** Once a `DecisionMatrixDefinitionVersion` is marked `Active` and executed by downstream Expression Sets, its column schema cannot be altered in-place. You must deploy a new version in `Draft` status, upload matching row payloads, and subsequently flip the status to `Active`.

> [!TIP]
> **Coordinate Matrix Schema with Expression Sets:** Always deploy `DecisionMatrixDefinition` before or in the same transaction as dependent `ExpressionSetDefinition` components. If an expression set attempts to compile against an uncommitted matrix column name, the deployment fails with reference compilation errors.

- **Automate Row Ingestion in CI/CD:** Since metadata deployments only establish table headers, integrate an automated post-deployment step using `sf data import tree` or Python scripts calling `/services/data/v68.0/connect/business-rules/decision-matrices` to populate row values.
- **Set Explicit Expiry Dates:** Leverage `startDate` and `endDate` fields in matrix versions to facilitate fiscal-year tariff or rate transitions without requiring midnight manual deployments.
