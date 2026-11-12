---
title: "ReportType Metadata Type Reference"
description: "Configure and deploy ReportType (.reportType-meta.xml) metadata for custom report types, up to 4 object joins (inner and outerJoin), and lookup fields."
category: metadata
tags:
  - metadata-api
  - report-type
  - analytics
  - reports
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "ReportType (.reportType-meta.xml) defines a Custom Report Type schema—joining up to 4 objects via inner or left outer joins (outerJoin) and organizing selectable report columns into layout sections."
faq:
  - q: "How many objects can be joined in a Custom ReportType?"
    a: "A Custom ReportType can join up to 4 objects hierarchically starting from baseObject through up to 3 nested join (ObjectRelationship) levels."
  - q: "Why can I not place an inner join after an outerJoin in a ReportType?"
    a: "In Salesforce Custom ReportTypes, once you select a left outer join (outerJoin = true, meaning With or Without related records) at one level of the object hierarchy, every subsequent child join below it must also have outerJoin set to true."
  - q: "How do I include fields from a parent Lookup object in a ReportType without using one of the 4 object joins?"
    a: "Add a columns entry inside a ReportLayoutSection where the field tag uses dot-notation spanning up to 4 lookup levels (such as Account.Owner.Manager.Name or Custom_Lookup__c.Status__c)."
  - q: "Why are new CustomFields not automatically visible in existing Custom ReportTypes?"
    a: "Unless Auto-Add New Custom Fields to Custom Report Type Layouts is enabled in Reports and Dashboards Settings, new CustomFields must be explicitly added as columns inside the .reportType-meta.xml file to appear in the Report Builder."
  - q: "What does the deployed boolean field control on a ReportType?"
    a: "When deployed is false (In Development), only administrators and users with Manage Custom Report Types can see and run reports built on that ReportType. Set deployed to true to make it available to end users."
related:
  - metadata/report-metadata-type
  - metadata/dashboard-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_reporttype.htm
---

The `ReportType` metadata type represents a **Custom Report Type**—the underlying data model template that determines which objects, join types (`outerJoin`), and field columns are available to users in the Lightning Report Builder. Available in API version 14.0 and later, `ReportType` supports standard, custom, external (`__x`), and Data Cloud (`data_cloud`, `semantic_model`) objects.

In Salesforce DX projects, custom report types are stored in `force-app/main/default/reportTypes/` with the `.reportType-meta.xml` suffix.

```mermaid
flowchart LR
    Base["baseObject: Account\n(Primary Object)"] --> J1["join #1: Contacts\n(outerJoin: false = INNER JOIN)"]
    J1 --> J2["join #2: Cases\n(outerJoin: true = LEFT OUTER JOIN)"]
    Base --> Lookup["Cross-Object Lookup Columns\n(Owner.Manager.Name via dot-notation)"]
    J2 --> Sec["sections (ReportLayoutSection)\nControls Report Builder Field Drawer"]
```

## Key Architectural Advantage: Lookup Field Spanning vs. Object Joins

A `ReportType` can join at most **4 objects** top-down (Parent -> Child -> Grandchild -> Great-Grandchild). However, inside `<sections><columns>`, you can traverse **upward** across lookup relationships up to 4 levels deep using dot notation (for example, `<field>Account__c.Parent.Owner.Department</field>`). Always use **Add Fields Related via Lookup** (dot-notation `<field>` entries) for parent/sibling lookups so you save your 4 `<join>` slots for true 1-to-many child collections.

## Key Metadata Fields

| Field | Location | Required | Description |
|---|---|---|---|
| `baseObject` | Root | Yes | **Not updateable**. Primary root object API name (`Account`, `Invoice__c`, etc.) |
| `label` | Root | Yes | Display name shown when choosing a Report Type |
| `category` | Root | Yes | Report Type folder category (`accounts`, `opportunities`, `cases`, `other`, `data_cloud`, `flow`) |
| `deployed` | Root | Yes | `true` (Deployed to end users) or `false` (In Development) |
| `description` | Root | No | Explains which object joins and lookup fields are included |
| `join` | Root / `ObjectRelationship` | No | Recursive child relationship join (`relationship` plural name + `outerJoin` boolean) |
| `outerJoin` | `ObjectRelationship` | Yes | `true` ("A with or without B" left outer join) or `false` ("A with B" inner join) |
| `sections` | Root | No | Drawer categories (`masterLabel` + `columns`) |
| `field` | `columns` | Yes | Field API name (or dot-notation lookup path) |
| `table` | `columns` | Yes | Object path (`Account`, `Account.Contacts`, `Account.Contacts.Cases`) |
| `checkedByDefault` | `columns` | Yes | Automatically adds the column to newly created reports when `true` |
| `displayNameOverride` | `columns` | No | Custom column alias shown in Report Builder |

## Production-Grade XML Example

Below is a `ReportType` (`Accounts_With_Contacts_And_Open_Cases.reportType-meta.xml`) joining `Account` -> `Contacts` (inner join) -> `Cases` (left outer join) with cross-object lookup columns:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ReportType xmlns="http://soap.sforce.com/2006/04/metadata">
    <baseObject>Account</baseObject>
    <category>accounts</category>
    <deployed>true</deployed>
    <description>Accounts with Contacts and optional Cases, including Account Owner Manager lookup fields.</description>
    <join>
        <join>
            <outerJoin>true</outerJoin>
            <relationship>Cases</relationship>
        </join>
        <outerJoin>false</outerJoin>
        <relationship>Contacts</relationship>
    </join>
    <label>Accounts with Contacts and Optional Cases</label>
    <sections>
        <columns>
            <checkedByDefault>true</checkedByDefault>
            <field>Name</field>
            <table>Account</table>
        </columns>
        <columns>
            <checkedByDefault>false</checkedByDefault>
            <displayNameOverride>Account Executive Manager</displayNameOverride>
            <field>Owner.Manager.Name</field>
            <table>Account</table>
        </columns>
        <masterLabel>Account Details</masterLabel>
    </sections>
    <sections>
        <columns>
            <checkedByDefault>true</checkedByDefault>
            <field>Name</field>
            <table>Account.Contacts</table>
        </columns>
        <columns>
            <checkedByDefault>true</checkedByDefault>
            <field>Email</field>
            <table>Account.Contacts</table>
        </columns>
        <masterLabel>Contacts</masterLabel>
    </sections>
    <sections>
        <columns>
            <checkedByDefault>true</checkedByDefault>
            <field>CaseNumber</field>
            <table>Account.Contacts.Cases</table>
        </columns>
        <columns>
            <checkedByDefault>false</checkedByDefault>
            <field>Status</field>
            <table>Account.Contacts.Cases</table>
        </columns>
        <masterLabel>Support Cases</masterLabel>
    </sections>
</ReportType>
```

> [!TIP]
> **Redeploying Deleted ReportTypes Preserves IDs**: If a `ReportType` is accidentally deleted in an org, redeploying its `.reportType-meta.xml` with the same `fullName` via Metadata API restores the original `ReportType` record with its original `Id`—preventing broken report dependencies.

