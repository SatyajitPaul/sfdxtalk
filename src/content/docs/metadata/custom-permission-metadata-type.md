---
title: "CustomPermission Metadata Type Reference"
description: "Configure and deploy CustomPermission (.customPermission-meta.xml) metadata to build decoupled feature flags, validation bypasses, and LWC access checks."
category: metadata
tags:
  - metadata-api
  - security
  - custom-permission
  - permission-set
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "CustomPermission (.customPermission-meta.xml) defines a custom security entitlement that can be granted via Permission Sets and checked dynamically in Apex, LWC, Flows, Validation Rules, and FlexiPage component visibility rules without hardcoding Profile names."
faq:
  - q: "Why should I use CustomPermission instead of checking Profile.Name in Validation Rules or Apex?"
    a: "Hardcoding Profile.Name breaks when organizations migrate to a Permission Set-led security model or rename profiles. Checking a CustomPermission decouples your code and formulas from specific Profiles and allows granular, time-bound assignment via Permission Sets."
  - q: "How do I check a CustomPermission in Apex without consuming a SOQL query?"
    a: "Call FeatureManagement.checkPermission('Permission_API_Name') in Apex. It evaluates the running user's active session permissions in memory and consumes zero SOQL queries."
  - q: "How do I check a CustomPermission inside a Lightning Web Component?"
    a: "Import the custom permission from the @salesforce/customPermission/Permission_API_Name module in your LWC JavaScript file. It returns true if the current user has the permission and undefined otherwise."
  - q: "What does the requiredPermission field on CustomPermission do?"
    a: "The requiredPermission array defines child or prerequisite CustomPermissions that must also be enabled whenever a parent CustomPermission is assigned in a Permission Set or Profile."
  - q: "How do I query which Permission Sets grant a specific CustomPermission?"
    a: "Query SetupEntityAccess where SetupEntityId matches the CustomPermission Id and SetupEntityType equals CustomPermission, joining ParentId to PermissionSet."
related:
  - metadata/permission-set-metadata-type
  - metadata/permission-set-group-metadata-type
  - metadata/profile-metadata-type
  - metadata/validation-rule-metadata-type
  - metadata/lightning-component-bundle-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_custompermission.htm
---

The `CustomPermission` metadata type defines a custom security capability or feature toggle that can be assigned to users through [PermissionSet](/docs/metadata/permission-set-metadata-type/) or [Profile](/docs/metadata/profile-metadata-type/) metadata. Introduced in API version 31.0, `CustomPermission` is the gold-standard architectural pattern for replacing hardcoded `$Profile.Name` checks across [ValidationRule](/docs/metadata/validation-rule-metadata-type/) formulas, [Flow](/docs/metadata/flow-metadata-type/) decisions, [ApexClass](/docs/metadata/apex-class-metadata-type/) logic, and [LightningComponentBundle](/docs/metadata/lightning-component-bundle-metadata-type/) UI controls.

In Salesforce DX projects, custom permissions are stored in `force-app/main/default/customPermissions/` with the `.customPermission-meta.xml` suffix.

```mermaid
flowchart LR
    CP["CustomPermission\n(Bypass_Order_Validation)"] --> PS["PermissionSet\n(Integration_Bypass_PS)"]
    CP --> VR["ValidationRule\n(NOT($Permission.Bypass_Order_Validation))"]
    CP --> Apex["ApexClass\n(FeatureManagement.checkPermission)"]
    CP --> LWC["LWC\n(@salesforce/customPermission/...)"]
    CP --> Flexi["FlexiPage\n(Component Visibility Filter)"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Human-readable label shown in Setup and Permission Set editors |
| `description` | `string` | No | Explains what business capability or bypass this permission grants |
| `isLicensed` | `boolean` | No | Indicates whether the permission requires a managed package license (v38.0+) |
| `connectedApp` | `string` | No | Associates the custom permission with a specific [ConnectedApp](/docs/metadata/connected-app-metadata-type/) |
| `requiredPermission` | `CustomPermissionDependencyRequired[]` | No | Declares prerequisite `<customPermission>` dependencies (`dependency` set to `true`) |

## Production-Grade XML Example

Below is a `CustomPermission` definition (`Bypass_Account_Validation.customPermission-meta.xml`) used to exempt data migration jobs from validation rules:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomPermission xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Exempts the running user from Account and Contact validation rules during bulk data loads.</description>
    <isLicensed>false</isLicensed>
    <label>Bypass Account Validation</label>
</CustomPermission>
```

## Checking `CustomPermission` Across the Stack

### 1. Validation Rules and Flows (`$Permission`)

```text
AND(
    NOT($Permission.Bypass_Account_Validation),
    ISBLANK(BillingCountry)
)
```

### 2. Apex (`FeatureManagement.checkPermission`)

```java
public with sharing class OrderApprovalService {
    public static void approveHighValueOrder(Order ord) {
        // Zero-SOQL, session-cached permission evaluation
        if (!FeatureManagement.checkPermission('Approve_Executive_Discounts')) {
            throw new AuraHandledException('You lack permission to approve executive discounts.');
        }
        ord.Status = 'Approved';
        update as user ord;
    }
}
```

### 3. Lightning Web Components (`@salesforce/customPermission`)

```javascript
import { LightningElement } from 'lwc';
import hasExecutiveDiscountPerm from '@salesforce/customPermission/Approve_Executive_Discounts';

export default class DiscountApprovalAction extends LightningElement {
    get isApproveButtonDisabled() {
        return !hasExecutiveDiscountPerm;
    }
}
```

## Auditing Custom Permissions with SOQL

Both `CustomPermission` and `SetupEntityAccess` are queryable in standard SOQL:

```sql
-- 1. List all Custom Permissions in the org
SELECT Id, DeveloperName, MasterLabel, NamespacePrefix, Description, IsLicensed
FROM CustomPermission
ORDER BY DeveloperName ASC

-- 2. Find every Permission Set that grants a specific Custom Permission
SELECT Id, Parent.Name, Parent.Label, Parent.IsOwnedByProfile, SetupEntityId
FROM SetupEntityAccess
WHERE SetupEntityType = 'CustomPermission'
  AND SetupEntityId IN (
      SELECT Id FROM CustomPermission WHERE DeveloperName = 'Bypass_Account_Validation'
  )
```

> [!TIP]
> **Testing Custom Permissions in Apex Unit Tests**: Instead of querying and assigning profiles in `@TestSetup`, assign a lightweight Permission Set containing your `CustomPermission` to a test user via `insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);` inside `System.runAs(u)`.

