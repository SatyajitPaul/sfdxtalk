---
title: "UiFormatSpecificationSet Metadata Type in SFDX"
description: "Configure and deploy UiFormatSpecificationSet metadata in Salesforce to standardize UI data formatting, currency masks, and date patterns across client views."
category: "metadata"
tags:
  - metadata
  - formatting
  - ui-format
  - omnistudio
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "UiFormatSpecificationSet defines declarative rules for formatting data values, currency representations, number masks, and localized displays in specialized Salesforce frontends."
faq:
  - q: "What is the purpose of UiFormatSpecificationSet in Salesforce?"
    a: "It defines reusable formatting specifications that dictate how numerical values, currencies, dates, and text strings render across OmniStudio and Industry Cloud user interfaces."
  - q: "How do you retrieve UiFormatSpecificationSet using Salesforce CLI?"
    a: "Use the command sf project retrieve start with the metadata flag set to UiFormatSpecificationSet to pull all format specification definitions into your project."
  - q: "How do format specification sets improve multi-national implementations?"
    a: "They allow teams to centralize localization rules, masking patterns, and decimal precision configurations without hardcoding JavaScript transform logic in each UI component."
  - q: "Can UiFormatSpecificationSet be deployed via standard CI/CD manifests?"
    a: "Yes, standard package manifests referencing the UiFormatSpecificationSet metadata type can deploy format sets across sandboxes and production orgs."
related:
  - metadata/custom-field-metadata-type
  - metadata/flexipage-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-uiformatspecificationset.md"
---

## Architectural Overview

The `UiFormatSpecificationSet` metadata type enables enterprise architects to define centralized data presentation rules, input masks, and localization display criteria for Salesforce client views. In complex implementations—such as Financial Services Cloud, Health Cloud, or OmniStudio-driven customer portals—presenting fiscal figures, policy numbers, or clinical measurements requires strict, compliant formatting rules.

Without centralized format definitions, developers often write duplicative JavaScript utility functions across dozens of Lightning Web Components, leading to inconsistent user experiences and difficult maintenance. `UiFormatSpecificationSet` establishes a single source of truth for UI formatting specifications, decoupling the raw data values stored in Salesforce custom fields from their visual presentation in user-facing components.

```mermaid
flowchart LR
    A["Raw Field Data"] --> B["UiFormatSpecificationSet"]
    B --> C["Currency Mask Rule"]
    B --> D["Date and Time Rule"]
    B --> E["Custom String Pattern"]
    C --> F["Localized Financial View"]
    D --> G["Standardized Clinical Timestamp"]
    E --> H["Masked Tax Identifier Display"]
```

## Directory and File Conventions

In the Salesforce DX project structure, `UiFormatSpecificationSet` records are stored as XML files in the `uiFormatSpecificationSets/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `UiFormatSpecificationSet` |
| **SFDX Folder** | `force-app/main/default/uiFormatSpecificationSets/` |
| **File Suffix** | `.uiFormatSpecificationSet-meta.xml` |

## Key Metadata Fields

The XML schema for `UiFormatSpecificationSet` includes the following core attributes:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Administrative label displayed in OmniStudio and Industries design canvases. |
| `developerName` | `string` | Yes | Unique API identifier utilized by components to reference the format ruleset. |
| `description` | `string` | No | Architectural documentation describing the format masks and target business domains. |
| `isActive` | `boolean` | Yes | Toggles whether the format specification set is available to runtime components. |
| `formatPattern` | `string` | No | Declarative regex or formatting pattern applied to transform the raw value. |

> [!NOTE]
> Format specification sets are evaluated at UI render time and do not alter the underlying data format stored in standard or custom object fields.

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition establishing format patterns for financial wealth management summaries:

```xml title="force-app/main/default/uiFormatSpecificationSets/WealthSummaryFormats.uiFormatSpecificationSet-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<UiFormatSpecificationSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Standardized currency and account masking rules for wealth client portals.</description>
    <developerName>WealthSummaryFormats</developerName>
    <formatPattern>#,##0.00</formatPattern>
    <isActive>true</isActive>
    <masterLabel>Wealth Summary Formats</masterLabel>
</UiFormatSpecificationSet>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>WealthSummaryFormats</members>
        <name>UiFormatSpecificationSet</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `UiFormatSpecificationSet` using standard Salesforce CLI commands:

```bash
# Retrieve all UI format specification sets
sf project retrieve start --metadata UiFormatSpecificationSet

# Retrieve a specific format specification set
sf project retrieve start --metadata UiFormatSpecificationSet:WealthSummaryFormats

# Deploy to target validation org
sf project deploy start --metadata UiFormatSpecificationSet:WealthSummaryFormats --target-org staging-sandbox
```

## Architect Best Practices and Gotchas

- **Cross-Locale Consistency:** Always test formatting specifications against multiple user locales (e.g., US English vs. German) to verify decimal and grouping separator behavior.
- **Upstream Dependencies:** Deploy `UiFormatSpecificationSet` components before deploying OmniStudio FlexCards or custom LWCs that bind to these format rules to prevent runtime template rendering failures.
- **Validation Fallbacks:** When defining custom regex masks, supply sensible fallback values to prevent empty or broken renders if an unexpected null or malformed data payload is received.

> [!TIP]
> Group related format patterns by business domain (e.g., Banking, Healthcare, Billing) into dedicated specification sets to simplify governance and release scoping.
