---
title: "Role Metadata Type Reference"
description: "Configure and deploy Role (.role-meta.xml) metadata to manage the Salesforce Role Hierarchy, parentRole inheritance, and implicit Account child access."
category: metadata
tags:
  - metadata-api
  - role-hierarchy
  - sharing
  - security
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "Role (.role-meta.xml) defines a node in the Salesforce Role Hierarchy, controlling vertical record sharing via parentRole and implicit access to Account child records (Opportunities, Cases, Contacts)."
faq:
  - q: "What is the difference between a Role and a Profile or Permission Set?"
    a: "Profiles and Permission Sets control object-level and field-level permissions (what types of data a user can see and edit). Roles control record-level visibility (which specific records a user can see based on ownership and hierarchy)."
  - q: "What do opportunityAccessLevel, caseAccessLevel, and contactAccessLevel control on a Role?"
    a: "They control the implicit access that the owner of an Account (and users above that owner in the Role Hierarchy) automatically receives on child Opportunities, Cases, and Contacts linked to that Account, even if someone else owns those child records."
  - q: "What is the recommended maximum depth and total count for Roles in an enterprise org?"
    a: "Salesforce recommends keeping the Role Hierarchy to no more than 10 levels deep and staying well below the default 5,000 Role limit to prevent slow sharing recalculations and Account Owner data skew locks."
  - q: "How do I query Role metadata in SOQL?"
    a: "In SOQL, Role metadata is represented by the standard UserRole object, which exposes Id, Name, DeveloperName, ParentRoleId, OpportunityAccessForAccountOwner, and CaseAccessForAccountOwner."
  - q: "Why did my Role deployment fail with invalid ContactAccessLevel?"
    a: "If Contact Organization-Wide Default (OWD) sharing is set to Controlled by Parent, contactAccessLevel on Role must be set to Edit (or omitted when Account access is Edit) because Contacts cannot have narrower access than their parent Account."
related:
  - metadata/sharing-rules-metadata-type
  - metadata/group-metadata-type
  - metadata/queue-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_role.htm
---

The `Role` metadata type represents a single node in your organization's **Role Hierarchy**. Introduced in API version 24.0 (extending `RoleOrTerritory`), `Role` governs vertical record-level visibility: any user assigned to a parent role (`parentRole`) automatically inherits read/edit access to records owned by or shared with users in subordinate roles (for all standard objects and custom objects with `Grant Access Using Hierarchies` enabled).

In Salesforce DX projects, role definitions are stored in `force-app/main/default/roles/` with the `.role-meta.xml` suffix.

```mermaid
flowchart TD
    CRO["Role: Chief_Revenue_Officer\n(Top Level - No parentRole)"] --> VP["Role: VP_Enterprise_Sales\n(parentRole: Chief_Revenue_Officer)"]
    VP --> AE["Role: Enterprise_Account_Executive\n(parentRole: VP_Enterprise_Sales)"]
    AE --> Implicit["Implicit Account Owner Access:\n- opportunityAccessLevel\n- caseAccessLevel\n- contactAccessLevel"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | UI display label of the Role in the Role Hierarchy tree |
| `parentRole` | `string` | No | Developer `fullName` of the role immediately above this role in the hierarchy |
| `description` | `string` | No | Description of the role's scope |
| `opportunityAccessLevel` | `string` | No | Account owner's implicit access to child Opportunities (`None`, `Read`, or `Edit`) |
| `caseAccessLevel` | `string` | No | Account owner's implicit access to child Cases (`None`, `Read`, or `Edit`) |
| `contactAccessLevel` | `string` | No | Account owner's implicit access to child Contacts (`None`, `Read`, or `Edit`) |
| `mayForecastManagerShare` | `boolean` | No | Indicates whether the forecast manager can share forecast data |

## Production-Grade XML Example

Below is a `Role` definition (`VP_Enterprise_Sales.role-meta.xml`) reporting to `Chief_Revenue_Officer`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Role xmlns="http://soap.sforce.com/2006/04/metadata">
    <caseAccessLevel>Read</caseAccessLevel>
    <contactAccessLevel>Edit</contactAccessLevel>
    <description>Vice President of Enterprise Sales overseeing North America AEs.</description>
    <mayForecastManagerShare>false</mayForecastManagerShare>
    <name>VP, Enterprise Sales</name>
    <opportunityAccessLevel>Edit</opportunityAccessLevel>
    <parentRole>Chief_Revenue_Officer</parentRole>
</Role>
```

> [!TIP]
> **PreventingImplicit Sharing Recalculation Locks**: Setting `opportunityAccessLevel` and `caseAccessLevel` to `None` on roles that do not require automatic visibility into every child Opportunity or Case on their Accounts reduces implicit `OpportunityShare` and `CaseShare` table volume and speeds up Account ownership transfers.

## Querying the Role Hierarchy with SOQL (`UserRole`)

In SOQL, roles are stored in the standard `UserRole` object:

```sql
-- 1. Inspect the Role Hierarchy structure and implicit Account child access
SELECT Id, DeveloperName, Name, ParentRoleId, PortalType,
       OpportunityAccessForAccountOwner, CaseAccessForAccountOwner, ContactAccessForAccountOwner
FROM UserRole
WHERE PortalType = 'None'
ORDER BY Name ASC

-- 2. Count active users per Role to identify unpopulated or skewed roles
SELECT UserRole.DeveloperName, UserRole.Name, COUNT(Id) activeUsers
FROM User
WHERE IsActive = true AND UserRoleId != null
GROUP BY UserRole.DeveloperName, UserRole.Name
ORDER BY COUNT(Id) DESC
```

