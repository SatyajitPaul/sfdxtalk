---
title: "ListView Metadata Type Reference"
description: "Configure and deploy ListView (.listView-meta.xml) metadata to define columns, filter scopes, boolean filter logic, and role or group visibility."
category: metadata
tags:
  - metadata-api
  - list-view
  - ui
  - sharing
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "ListView (.listView-meta.xml) defines a filtered, sortable list of records for an object, including displayed columns, filterScope (Everything, Mine, Queue), filter criteria, booleanFilter logic, and sharedTo audience visibility."
faq:
  - q: "Where are ListView files stored in SFDX source format?"
    a: "In SFDX source format, ListView files are decomposed inside the parent object's directory at force-app/main/default/objects/ObjectName/listViews/ListViewName.listView-meta.xml."
  - q: "What are the valid values for filterScope in a ListView?"
    a: "Common filterScope values are Everything (all accessible records), Mine (records owned by the running user), Queue (records owned by a specific Queue specified in the queue field), Delegated, and MyTerritory."
  - q: "How do I restrict who can see a deployed ListView?"
    a: "Include a sharedTo block in the ListView XML referencing specific groups, roles, rolesAndSubordinates, or allInternalUsers. Avoid deploying private single-user list views via CI/CD."
  - q: "What is the system field nomenclature used inside ListView columns and filters?"
    a: "ListView metadata uses legacy uppercase database column names for standard system fields, such as ACCOUNT.NAME, CORE.USERS.ALIAS, CREATED_DATE, LAST_UPDATE, and RECORDTYPE."
  - q: "Can I query existing ListViews using standard SOQL?"
    a: "Yes. The ListView object is queryable in standard SOQL and returns Id, Name, DeveloperName, SobjectType, IsSoqlCompatible, and LastViewedDate."
related:
  - metadata/custom-object-metadata-type
  - metadata/queue-metadata-type
  - metadata/group-metadata-type
  - metadata/role-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_listview.htm
---

The `ListView` metadata type defines the columns, record ownership scope (`filterScope`), filter criteria (`filters` and `booleanFilter`), and audience sharing (`sharedTo`) for an object's list view in Lightning Experience and Salesforce Mobile. Introduced in API version 14.0, version-controlling `ListView` files ensures support teams, sales reps, and queue managers get standardized operational views immediately upon deployment.

In Salesforce DX projects, list views live inside their parent object folder at `force-app/main/default/objects/<ObjectName>/listViews/<ListViewName>.listView-meta.xml`.

```mermaid
flowchart LR
    LV["ListView\n(High_Priority_Escalations.listView-meta.xml)"] --> Scope["filterScope\n(Everything / Mine / Queue)"]
    LV --> Filters["filters + booleanFilter\n(1 AND (2 OR 3))"]
    LV --> Cols["columns\n(Up to 15 Visible Columns)"]
    LV --> Shared["sharedTo\n(Groups / Roles / allInternalUsers)"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `fullName` | `string` | Yes | Developer API name of the list view |
| `label` | `string` | Yes | Display name shown in the List View dropdown |
| `filterScope` | `FilterScope` | Yes | Ownership filter: `Everything`, `Mine`, `Queue`, `Delegated`, `MyTerritory`, or `MyTeamTerritory` |
| `queue` | `string` | Conditional | Queue developer name (required when `filterScope` is `Queue`) |
| `columns` | `string[]` | No | Ordered list of field column names (up to 15 columns displayed in UI) |
| `filters` | `ListViewFilter[]` | No | Up to 10 filter rows (`field`, `operation`, `value`) |
| `booleanFilter` | `string` | No | Custom filter logic such as `1 AND (2 OR 3)` |
| `sharedTo` | `SharedTo` | No | Audience visibility (`allInternalUsers`, `group`, `role`, `roleAndSubordinatesInternal`) |

## Production-Grade XML Example

Below is a Queue-backed `Case` list view (`force-app/main/default/objects/Case/listViews/Tier_3_Escalation_Queue_View.listView-meta.xml`) shared with a Public Group and Role:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListView xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Tier_3_Escalation_Queue_View</fullName>
    <booleanFilter>1 AND (2 OR 3)</booleanFilter>
    <columns>CASES.CASE_NUMBER</columns>
    <columns>ACCOUNT.NAME</columns>
    <columns>CASES.SUBJECT</columns>
    <columns>CASES.STATUS</columns>
    <columns>CASES.PRIORITY</columns>
    <columns>CASES.CREATED_DATE</columns>
    <columns>CORE.USERS.ALIAS</columns>
    <filterScope>Queue</filterScope>
    <filters>
        <field>CASES.CLOSED</field>
        <operation>equals</operation>
        <value>0</value>
    </filters>
    <filters>
        <field>CASES.PRIORITY</field>
        <operation>equals</operation>
        <value>High,Critical</value>
    </filters>
    <filters>
        <field>CASES.ESCALATED</field>
        <operation>equals</operation>
        <value>1</value>
    </filters>
    <label>Tier 3 Escalation Queue</label>
    <queue>Tier_3_Engineering_Queue</queue>
    <sharedTo>
        <group>Tier_3_Support_Engineers</group>
        <roleAndSubordinatesInternal>VP_Customer_Support</roleAndSubordinatesInternal>
    </sharedTo>
</ListView>
```

> [!WARNING]
> **Standard Field Column Naming Quirk**: Standard object `ListView` metadata uses internal upper-snake-case column names (such as `CASES.CASE_NUMBER`, `ACCOUNT.NAME`, `OPPORTUNITY.STAGE_NAME`, `CORE.USERS.ALIAS`, and `CREATED_DATE`) rather than standard SOQL field API names. Always configure a list view on a standard object in a scratch org or sandbox first and run `sf project retrieve start -m ListView:Case.Tier_3_Escalation_Queue_View` to capture the exact column tokens.

## Querying `ListView` with SOQL

You can query `ListView` records directly in standard SOQL:

```sql
-- Find all ListViews on Case and check whether they are SOQL-compatible
SELECT Id, Name, DeveloperName, SobjectType, IsSoqlCompatible, LastViewedDate
FROM ListView
WHERE SobjectType = 'Case'
ORDER BY Name ASC
```

