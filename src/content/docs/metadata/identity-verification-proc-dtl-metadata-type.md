---
title: "IdentityVerificationProcDtl in SFDX"
description: "Deploy IdentityVerificationProcDtl metadata in Salesforce Industries to configure search logic, verification steps, and record matching rules."
category: "metadata"
tags:
  - metadata
  - industries
  - identity-verification
  - fsc
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "IdentityVerificationProcDtl defines granular verification steps, search targets, and record matching logic within an identity verification flow."
faq:
  - q: "What is the role of IdentityVerificationProcDtl?"
    a: "It configures an individual verification step or search target within an IdentityVerificationProcDef process."
  - q: "Can multiple detail records belong to one process definition?"
    a: "Yes. A process definition can contain multiple detail records representing secondary callers or multiple search objects."
  - q: "Where is IdentityVerificationProcDtl stored in an SFDX repo?"
    a: "It is stored in force-app/main/default/identityVerificationProcDtls/ with the .identityVerificationProcDtl-meta.xml suffix."
  - q: "What objects can be configured as search targets?"
    a: "Common search targets include Account, Contact, and PersonAccount records in FSC or Health Cloud."
related:
  - metadata/custom-object-metadata-type
  - metadata/flow-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-identityverificationprocdtl.md"
---

## Architectural Overview

`IdentityVerificationProcDtl` (Identity Verification Process Detail) configures an individual step, search action, or verification group within a parent `IdentityVerificationProcDef`. In Salesforce Industries, verifying an identity often requires querying multiple entities (e.g., searching for an Account, then locating an authorized Contact or Power of Attorney representative).

`IdentityVerificationProcDtl` defines which object is searched, what matching logic is applied, the sequence in which steps execute, and how verification outcomes determine whether the customer service representative can proceed.

```mermaid
flowchart TD
    A["IdentityVerificationProcDef"] --> B["IdentityVerificationProcDtl (Step 1: Account Search)"]
    A --> C["IdentityVerificationProcDtl (Step 2: Authorized Signer Search)"]
    B --> D["IdentityVerificationProcFld (Tax ID, DOB)"]
    C --> E["IdentityVerificationProcFld (PIN, Maiden Name)"]
    D --> F["Console Verification Flow"]
    E --> F
```

## Directory and File Conventions

`IdentityVerificationProcDtl` files are stored in `identityVerificationProcDtls/`:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `IdentityVerificationProcDtl` |
| **SFDX Directory** | `force-app/main/default/identityVerificationProcDtls/` |
| **File Suffix** | `.identityVerificationProcDtl-meta.xml` |
| **API Version** | 68.0 |

## Key Metadata Fields

The XML schema for `IdentityVerificationProcDtl` defines step parameters:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Label describing this verification step. |
| `identityVerificationProcDef` | `string` | Yes | Parent `IdentityVerificationProcDef` API developer name. |
| `searchObject` | `string` | Yes | API name of the target sObject being queried (e.g., `Account` or `Contact`). |
| `sequence` | `integer` | Yes | Execution order of this step within the overall verification procedure. |

> [!NOTE]
> Ensure the parent `IdentityVerificationProcDef` and target `searchObject` exist before deploying process details.

## Declarative XML and Package Manifest Examples

Below is a detail record defining an Account search step for retail banking:

```xml title="force-app/main/default/identityVerificationProcDtls/Account_Search_Step.identityVerificationProcDtl-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<IdentityVerificationProcDtl xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>Account Search Step</masterLabel>
    <identityVerificationProcDef>Banking_Customer_Verification</identityVerificationProcDef>
    <searchObject>Account</searchObject>
    <sequence>1</sequence>
</IdentityVerificationProcDtl>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Banking_Customer_Verification</members>
        <name>IdentityVerificationProcDef</name>
    </types>
    <types>
        <members>Account_Search_Step</members>
        <name>IdentityVerificationProcDtl</name>
    </types>
    <version>68.0</version>
</Package>
```

## Retrieval and Deployment via SF CLI

Commands to retrieve and deploy verification step details:

```bash
# Retrieve verification process detail
sf project retrieve start --metadata "IdentityVerificationProcDtl:Account_Search_Step"

# Deploy details alongside parent process definition
sf project deploy start --manifest manifest/package.xml --target-org uat-sandbox
```

> [!TIP]
> Group process definitions, details, and fields into modular DX packages to simplify deployment across industry sandboxes.

## Senior Architect Best Practices and Gotchas

- **Circular Dependencies**: Detail components strictly depend on parent `IdentityVerificationProcDef`. Deploying detail records alone to a fresh org without their parent will fail.
- **Search Optimization**: Ensure fields configured for search indexing on the `searchObject` have appropriate custom indexes to guarantee sub-second verification response times.
- **Data Protection Compliance**: When configuring steps that query sensitive objects, ensure field-level security and profile access are properly restricted.
