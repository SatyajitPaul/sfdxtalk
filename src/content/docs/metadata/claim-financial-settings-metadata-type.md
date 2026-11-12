---
title: "ClaimFinancialSettings Metadata Type Guide"
description: "Configure and deploy ClaimFinancialSettings metadata in Salesforce Financial Services and Insurance Cloud to control claim reserve and payment rules."
category: "metadata"
tags:
  - metadata
  - insurance-cloud
  - financial-services
  - claims
  - package-xml
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ClaimFinancialSettings manages org-wide financial processing rules for Insurance Claims in Salesforce, governing claim reserve adjustments, authority limits, and payment settlement workflows."
faq:
  - q: "What does ClaimFinancialSettings control in Salesforce Insurance and Financial Services Cloud?"
    a: "It controls org-wide claim financial management behavior, such as enabling claim financial tracking, reserve calculation modes, and payment authority enforcement on Claim and ClaimCoverage objects."
  - q: "How is ClaimFinancialSettings referenced in package.xml?"
    a: "In package.xml, use the Settings metadata type with the member name ClaimFinancial, which maps to force-app/main/default/settings/ClaimFinancial.settings-meta.xml in SFDX source format."
  - q: "Why does deploying ClaimFinancial.settings-meta.xml fail in a standard Sales Cloud org?"
    a: "ClaimFinancialSettings requires Insurance Cloud or Financial Services Cloud Claims management licenses to be provisioned in the target org."
  - q: "Can ClaimFinancialSettings be used alongside Flow and Apex for claim adjudication?"
    a: "Yes, ClaimFinancialSettings enables the underlying platform financial engine, while Flow and Apex orchestrate custom adjudication rules and external payment gateway callouts."
related:
  - metadata/custom-object-metadata-type
  - metadata/flow-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-claimfinancialsettings.md"
---

## Architectural Overview

In property and casualty (P&C), life, and health insurance carriers running on Salesforce Financial Services Cloud / Insurance Cloud, claims adjudication involves strict financial accounting around **Loss Reserves**, **Expense Reserves**, and **Claim Payment Summaries**. The `ClaimFinancialSettings` metadata type enables and configures the platform's native claim financials engine.

Storing `ClaimFinancial.settings-meta.xml` in SFDX version control ensures that scratch orgs, SIT/UAT sandboxes, and production environments enforce identical financial reserve and payment processing rules before deploying dependent `Claim`, `ClaimCoverage`, and `ClaimPaymentSummary` [Flow](/docs/metadata/flow-metadata-type/) automations.

```mermaid
flowchart LR
    A["ClaimFinancialSettings"] --> B["Enable Claim Financial Engine"]
    B --> C["Claim & ClaimCoverage Reserve Tracking"]
    C --> D["ClaimCoveragePaymentDetail Processing"]
    D --> E["General Ledger / ERP Settlement Sync"]
```

## Directory Location and File Suffix

In Salesforce DX projects, `ClaimFinancialSettings` is stored in the `settings` directory as `ClaimFinancial.settings-meta.xml`.

| Property | Value |
| :--- | :--- |
| **Directory Path (SFDX)** | `force-app/main/default/settings/` |
| **File Name (SFDX)** | `ClaimFinancial.settings-meta.xml` |
| **Classic Metadata File** | `settings/ClaimFinancial.settings` |
| **Package.xml Type & Member** | `<name>Settings</name>` with `<members>ClaimFinancial</members>` |

## Key Metadata Fields

The following table describes the configuration flags on `ClaimFinancialSettings` in API version `68.0` (Winter '27):

| Field Name | Field Type | Architectural Description |
| :--- | :--- | :--- |
| `enableClaimFinancialSettings` | `boolean` | Master toggle that activates Claim Financial Management features and objects in the org. |
| `claimActualAmountCalcMode` | `string` | Specifies how actual claim amounts and reserves are calculated and rolled up across coverages. |

## Declarative Metadata Example

The following `ClaimFinancial.settings-meta.xml` file enables Claim Financial Management in a target Insurance Cloud environment:

```xml title="force-app/main/default/settings/ClaimFinancial.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ClaimFinancialSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableClaimFinancialSettings>true</enableClaimFinancialSettings>
</ClaimFinancialSettings>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>ClaimFinancial</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval and Deployment

Use the Salesforce CLI (`sf`) to retrieve and deploy `ClaimFinancialSettings`:

```bash
# Retrieve ClaimFinancialSettings from an Insurance Cloud org
sf project retrieve start --metadata Settings:ClaimFinancial

# Deploy ClaimFinancialSettings to a target org
sf project deploy start --metadata Settings:ClaimFinancial
```

## Architect Best Practices and Gotchas

> [!WARNING]
> Always deploy `Settings:ClaimFinancial` **before** deploying custom fields, validation rules, or [Flow](/docs/metadata/flow-metadata-type/) definitions that reference financial claim objects (`ClaimCoverageReserveDetail`, `ClaimCoveragePaymentDetail`). If the setting is not enabled first, those dependent objects will not be visible to the Metadata API compiler.

- **Scratch Org Definition Alignment:** When building automated CI/CD pipelines with scratch orgs, include the corresponding Insurance Claims feature and `claimFinancialSettings` block inside `config/project-scratch-def.json` so scratch org creation provisions the underlying standard objects automatically.
- **Permission Set Assignment:** Enabling `ClaimFinancialSettings` exposes the feature at the org level, but claims adjusters still require the appropriate Insurance Claims permission set license and [PermissionSet](/docs/metadata/permission-set-metadata-type/) CRUD access to create reserve adjustments and payment summaries.
