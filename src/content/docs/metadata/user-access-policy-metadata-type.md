---
title: "UserAccessPolicy Metadata Type for Automated Provisioning"
description: "Automate Permission Set, Permission Set Group, Queue, Group, and Package License assignments using the UserAccessPolicy metadata type in Salesforce."
category: "metadata"
tags:
  - metadata-api
  - security
  - permission-set
  - user-management
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "UserAccessPolicy (useraccesspolicies/<Name>.useraccesspolicy-meta.xml) declaratively grants or revokes Permission Sets, Permission Set Groups, Package Licenses, Groups, and Queues when User records are created or updated."
faq:
  - q: "Why should architects use UserAccessPolicy instead of Apex triggers or Flows on the User object?"
    a: "Assigning Permission Sets, Public Groups, and Package Licenses in User triggers or Flows often hits MIXED_DML_OPERATION errors or requires @future jobs. UserAccessPolicy natively grants and revokes six access types without writing code or hitting Mixed DML limits."
  - q: "What happens when you deploy a UserAccessPolicy with status set to Active?"
    a: "For safety, Salesforce automatically converts the status of a newly deployed Active UserAccessPolicy to Design in the target org so an administrator can review and activate the policy in Setup."
  - q: "What access mechanisms can a UserAccessPolicy grant or revoke?"
    a: "The userAccessPolicyActions block can Grant or Revoke six target types: PermissionSet, PermissionSetGroup, PermissionSetLicense, PackageLicense, Group (Public Group), and Queue."
  - q: "How does Salesforce decide which UserAccessPolicy runs when a User matches multiple active policies?"
    a: "Active UserAccessPolicy definitions include an order integer (from 0 to 10000). When a User record event matches multiple active policies, only the single active policy with the lowest order number is applied."
related:
  - metadata/permission-set-group-metadata-type
  - metadata/permission-set-metadata-type
  - metadata/group-metadata-type
  - metadata/queue-metadata-type
  - metadata/profile-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_useraccesspolicy.htm
---

## Why the `UserAccessPolicy` Metadata Type Replaces User Provisioning Triggers

Historically, automating user onboarding in Salesforce required complex after-insert/after-update Apex triggers or asynchronous Platform Event Flows on the `User` object to assign `PermissionSetAssignment`, `PermissionSetLicenseAssign`, `GroupMember`, and `UserPackageLicense` records.

Introduced in API v57.0, **`UserAccessPolicy`** (`useraccesspolicies/<Name>.useraccesspolicy-meta.xml`) provides a native, declarative rules engine that evaluates user criteria (`userAccessPolicyFilters`) on `Create`, `Update`, or `CreateAndUpdate` and automatically executes `Grant` or `Revoke` actions (`userAccessPolicyActions`).

```mermaid
flowchart LR
    USER["User Record Created/Updated<br/>(Department = 'Commercial Sales', IsActive = true)"] --> FILTER["UserAccessPolicy Filters<br/>(booleanFilter: 1 AND 2)"]
    FILTER --> ACT1["Grant PermissionSetGroup:<br/>Commercial_Sales_PSG"]
    FILTER --> ACT2["Grant PackageLicense:<br/>SBQQ (Salesforce CPQ)"]
    FILTER --> ACT3["Grant Public Group:<br/>Commercial_Deal_Desk_Group"]
```

---

## Key Metadata Fields on `UserAccessPolicy`

| Field | Type | Required | Description |
|---|---|---|---|
| `masterLabel` | `string` | Yes | Display name of the User Access Policy in Setup. |
| `status` | `UserAccessPolicyStatus` | Yes | `Design`, `Active`, `Testing`, `Migrate`, `Updating`, `Completed`, or `Failed`. *(Deploying `Active` sets it to `Design` in the target org until activated in Setup.)* |
| `triggerType` | `UserAccessPolicyTriggerType` | No | `Create`, `Update`, or `CreateAndUpdate`. |
| `order` | `int` | Conditional | Priority order (`0`–`10000`, required when `status` is `Active`). **Only the matching policy with the lowest `order` value executes!** |
| `booleanFilter` | `string` | Yes | Filter logic combining `userAccessPolicyFilters` by `sortOrder` (e.g., `1 AND 2`). |
| `userAccessPolicyFilters` | `UserAccessPolicyFilter[]` | No | Criteria evaluating `User` fields (`columnName`, `operation`, `value`) or existing assignments (`Profile`, `UserRole`, `PermissionSet`, `Group`). |
| `userAccessPolicyActions` | `UserAccessPolicyAction[]` | No | List of `Grant` or `Revoke` actions targeting `PermissionSetGroup`, `PermissionSet`, `PermissionSetLicense`, `PackageLicense`, `Group`, or `Queue`. |

---

## Real-World XML Example (`useraccesspolicies/Commercial_AE_Onboarding.useraccesspolicy-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<UserAccessPolicy xmlns="http://soap.sforce.com/2006/04/metadata">
    <booleanFilter>1 AND 2 AND 3</booleanFilter>
    <description>Automatically provisions Commercial Account Executives with Sales PSG, CPQ Package License, and Deal Desk Group.</description>
    <masterLabel>Commercial AE Onboarding</masterLabel>
    <order>10</order>
    <status>Design</status>
    <triggerType>CreateAndUpdate</triggerType>
    <userAccessPolicyActions>
        <action>Grant</action>
        <target>Commercial_AE_PSG</target>
        <type>PermissionSetGroup</type>
    </userAccessPolicyActions>
    <userAccessPolicyActions>
        <action>Grant</action>
        <target>Commercial_Sales_Group</target>
        <type>Group</type>
    </userAccessPolicyActions>
    <userAccessPolicyFilters>
        <columnName>IsActive</columnName>
        <operation>equals</operation>
        <sortOrder>1</sortOrder>
        <target>User</target>
        <type>User</type>
        <value>true</value>
    </userAccessPolicyFilters>
    <userAccessPolicyFilters>
        <columnName>Department</columnName>
        <operation>equalsIgnoreCase</operation>
        <sortOrder>2</sortOrder>
        <target>User</target>
        <type>User</type>
        <value>Commercial Sales</value>
    </userAccessPolicyFilters>
    <userAccessPolicyFilters>
        <operation>in</operation>
        <sortOrder>3</sortOrder>
        <target>AE_AMER,AE_EMEA,AE_APAC</target>
        <type>UserRole</type>
    </userAccessPolicyFilters>
</UserAccessPolicy>
```

---

## Senior Architect Best Practices & Gotchas

> [!WARNING]
> **The "Lowest `order` Wins" Rule:** Unlike Record-Triggered Flows (where all matching flows run), when a `User` creation or update matches multiple active `UserAccessPolicy` definitions, **only the single active policy with the lowest `order` integer runs**. Design your `UserAccessPolicy` rules around mutually exclusive personas (such as Job Role / Department) and assign `order` numbers in increments of `10` (`10`, `20`, `30`).

- **Post-Deployment Activation Step:** Because Salesforce resets `<status>Active</status>` to `Design` upon Metadata API deployment to prevent accidental mass user permission changes, always document activating the `UserAccessPolicy` in your release runbook.

