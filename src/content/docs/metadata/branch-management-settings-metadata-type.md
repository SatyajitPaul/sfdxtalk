---
title: "BranchManagementSettings Metadata Type in SFDX"
description: "Configure and deploy Financial Services Cloud Branch Management settings in SFDX to track branch performance, banker assignments, and record associations."
category: "metadata"
tags:
  - metadata-api
  - financial-services-cloud
  - branch-management
  - settings
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "BranchManagementSettings configures Financial Services Cloud Branch Management features, including automatic branch association rules for Accounts and Opportunities."
faq:
  - q: "What does BranchManagementSettings control in Salesforce?"
    a: "It configures Financial Services Cloud Branch Management capabilities, controlling whether records such as Accounts are automatically associated with branches based on assignment rules."
  - q: "Where is BranchManagementSettings stored in SFDX source format?"
    a: "It is stored in force-app/main/default/settings/BranchManagement.settings-meta.xml in SFDX source format."
  - q: "What license is required to deploy BranchManagementSettings?"
    a: "Your org must have Financial Services Cloud (FSC) or the Branch Management add-on license provisioned, otherwise deploying BranchManagementSettings fails."
  - q: "How do I retrieve BranchManagementSettings in package.xml?"
    a: "Include a Settings type block with BranchManagement listed inside the members tag."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-branchmanagementsettings.md"
---

## Architectural Overview

In retail banking, wealth management, and insurance architectures built on Salesforce Financial Services Cloud (FSC), tracking how physical or virtual branches (`BranchUnit`), bankers (`BranchUnitBusinessMember`), and customers (`BranchUnitCustomer`) interact is essential for attribution and regional compliance. The `BranchManagementSettings` metadata type controls the org-wide behavior of the Branch Management data model and its automated record association engine.

Architecturally, deploying `BranchManagementSettings` enables the platform's branch attribution rules (`AssociationCriteria`), ensuring that when a banker working in a specific branch creates or updates an Account or onboarding record, Salesforce automatically stamps the corresponding `BranchUnitCustomer` junction without requiring custom Apex triggers.

```mermaid
flowchart LR
    A["BranchManagementSettings"] --> B["Enable Branch Management Data Model"]
    B --> C["BranchUnit & BranchUnitBusinessMember"]
    B --> D["associateAccountWithBranch = true"]
    D --> E["Auto-Create BranchUnitCustomer Records"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `BranchManagementSettings` |
| **Classic Directory** | `settings/` |
| **Classic File Suffix** | `.settings` (`BranchManagement.settings`) |
| **SFDX Source Directory** | `force-app/main/default/settings/` |
| **SFDX File Suffix** | `.settings-meta.xml` (`BranchManagement.settings-meta.xml`) |

## Key Metadata Fields

The `BranchManagementSettings` metadata type exposes the following org-wide configuration flags:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `associateAccountWithBranch` | `boolean` | No | Automatically associates newly created or updated Account records with the current user's active `BranchUnit` via `BranchUnitCustomer` records (`true` or `false`). |

> [!NOTE]
> Standard objects supporting Branch Management (`BranchUnit`, `BranchUnitBusinessMember`, `BranchUnitCustomer`, and `BranchUnitRelatedRecord`) become accessible in SOQL and Setup once the Branch Management feature license and permission sets are enabled in the org.

## Declarative XML & `package.xml` Examples

### SFDX Source File Example

```xml title="force-app/main/default/settings/BranchManagement.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<BranchManagementSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <associateAccountWithBranch>true</associateAccountWithBranch>
</BranchManagementSettings>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>BranchManagement</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI & SOQL Auditing Commands

Use the Salesforce CLI to retrieve and deploy `BranchManagementSettings`:

```bash
# Retrieve BranchManagementSettings from an FSC org
sf project retrieve start --metadata Settings:BranchManagement

# Deploy BranchManagementSettings to a target environment
sf project deploy start --metadata Settings:BranchManagement
```

Once Branch Management is enabled, you can query active branches and their operating hours using SOQL:

```soql
SELECT Id, Name, BranchCode, IsActive, OperatingHoursId, ParentBranchUnitId
FROM BranchUnit
WHERE IsActive = true
ORDER BY Name ASC
```

## Senior Architect Best Practices & Gotchas

- **Scratch Org Feature Requirement:** In CI/CD pipelines using scratch orgs, you must include `"FinancialServicesCommunity"` or `"BranchManagement"` in the `"features"` list of `project-scratch-def.json` before deploying `BranchManagement.settings-meta.xml`.
- **High-Volume Data Load Impact:** When `associateAccountWithBranch` is set to `true`, bulk data loads executed by a user assigned to a `BranchUnit` will automatically generate `BranchUnitCustomer` records. Always run bulk ETL data migrations under a dedicated integration user that is **not** assigned as a `BranchUnitBusinessMember` to avoid unintended branch associations and row lock contention.
- **Sharing Model Alignment:** `BranchUnit` has its own Organization-Wide Default sharing model (`CustomObject:BranchUnit`). Review [CustomObject](/docs/metadata/custom-object-metadata-type/) sharing settings alongside `BranchManagementSettings` so regional branch managers only view performance metrics for their hierarchy.
