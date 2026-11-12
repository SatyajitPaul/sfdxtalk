---
title: "IndustriesPricingSettings in SFDX"
description: "Configure IndustriesPricingSettings metadata in Salesforce to manage Enterprise Pricing, Context Service, and Pricing Procedures execution."
category: "metadata"
tags:
  - metadata
  - settings
  - industries-pricing
  - revenue-cloud
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "IndustriesPricingSettings governs Salesforce Industries Pricing and Revenue Cloud engines, managing Context Service and calculation matrices."
faq:
  - q: "What is the primary role of IndustriesPricingSettings?"
    a: "It activates the modern Enterprise Pricing engine and Context Service integration for Industries CPQ and Revenue Cloud."
  - q: "Where is IndustriesPricingSettings stored in an SFDX project?"
    a: "It is stored in force-app/main/default/settings/IndustriesPricing.settings-meta.xml under the Settings type."
  - q: "How does Industries Pricing differ from legacy Salesforce CPQ?"
    a: "Industries Pricing uses high-performance Context Service, Decision Matrices, and Pricing Procedures for ultra-low latency."
  - q: "What happens if IndustriesPricingSettings is disabled during deployment?"
    a: "Deployments containing Pricing Procedures, Context Definitions, or Pricing Waterfall recipes will fail compilation."
related:
  - metadata/custom-object-metadata-type
  - metadata/flow-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-industriespricingsettings.md"
---

## Architectural Overview

`IndustriesPricingSettings` is the foundational settings metadata type for Salesforce Industries Pricing and next-generation Revenue Cloud. High-volume B2B quoting, telecommunications, insurance, and manufacturing require calculating complex pricing waterfalls (discounts, tier volume breaks, contract rates, and attribute-based pricing) in milliseconds.

`IndustriesPricingSettings` activates integration with Salesforce Context Service and Business Rules Engine (BRE) Pricing Procedures. Enabling this metadata allows declarative pricing designers to create calculation matrices and pricing recipes that run deterministically across Cart, Asset, and Contract lifecycles.

```mermaid
flowchart LR
    A["Cart / Quote Line Items"] --> B["Context Service (Normalized Context)"]
    B --> C["Pricing Procedure (BRE)"]
    C --> D["IndustriesPricingSettings Active"]
    D --> E["Decision Matrix Lookups & Discounts"]
    E --> F["Final Calculated Price Waterfall"]
```

## Directory and File Conventions

`IndustriesPricingSettings` is stored in the standard `settings` directory:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `IndustriesPricing`) |
| **SFDX Directory** | `force-app/main/default/settings/` |
| **File Name** | `IndustriesPricing.settings-meta.xml` |
| **Scratch Org Key** | `industriesPricingSettings` |

## Key Metadata Fields

The `IndustriesPricingSettings` XML schema defines pricing engine toggles:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `enableIndustriesPricing` | `boolean` | No | Master activation toggle for the Industries Pricing runtime engine. |

> [!NOTE]
> Industries Pricing requires Revenue Cloud, Industries CPQ, or Communications/Energy/Insurance Cloud licensing.

## Declarative XML and Package Manifest Examples

Below is a production `IndustriesPricing.settings-meta.xml` configuration:

```xml title="force-app/main/default/settings/IndustriesPricing.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<IndustriesPricingSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableIndustriesPricing>true</enableIndustriesPricing>
</IndustriesPricingSettings>
```

### Scratch Org Definition (`config/project-scratch-def.json`)

```json title="config/project-scratch-def.json"
{
  "orgName": "Enterprise Pricing Engine Scratch Org",
  "edition": "Enterprise",
  "settings": {
    "industriesPricingSettings": {
      "enableIndustriesPricing": true
    }
  }
}
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>IndustriesPricing</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## Retrieval and Deployment via SF CLI

Retrieve and deploy settings via Salesforce CLI:

```bash
# Retrieve Industries Pricing settings
sf project retrieve start --metadata "Settings:IndustriesPricing"

# Deploy settings to staging environment
sf project deploy start --metadata "Settings:IndustriesPricing" --target-org staging-org
```

> [!TIP]
> Always deploy `IndustriesPricingSettings` before deploying `ContextDefinition` or `PricingProcedure` metadata.

## Senior Architect Best Practices and Gotchas

- **Pipeline Ordering**: Strict deployment sequence: `IndustriesPricingSettings` -> `ContextDefinition` -> `CalculationMatrix` -> `PricingProcedure`.
- **Context Cache Optimization**: Enable Context Service caching in setup to avoid redundant queries when pricing large line-item carts.
- **Testing Waterfall Logic**: Use apex or REST testing endpoints to validate pricing procedure outputs against representative contract scenarios before promoting to production.
