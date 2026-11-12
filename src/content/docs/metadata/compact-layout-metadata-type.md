---
title: "CompactLayout Metadata Type Reference"
description: "Configure and deploy CompactLayout (.compactLayout-meta.xml) metadata to customize Lightning Highlights Panel fields, hover cards, and mobile summaries."
category: metadata
tags:
  - metadata-api
  - compact-layout
  - ui
  - lightning-experience
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "CompactLayout (.compactLayout-meta.xml) defines up to 10 key summary fields displayed in the Lightning Experience Highlights Panel, lookup hover cards, and the Salesforce mobile app header."
faq:
  - q: "How many fields can a CompactLayout display in the Lightning Experience Highlights Panel?"
    a: "While you can add up to 10 fields to a CompactLayout definition, the desktop Lightning Experience Highlights Panel displays the first field as the main record title and up to 6 additional fields in the summary bar."
  - q: "Which field types cannot be added to a CompactLayout?"
    a: "Text Area, Long Text Area, Rich Text Area, and Multi-Select Picklist fields cannot be added to a CompactLayout."
  - q: "Where are CompactLayout files stored in SFDX source format?"
    a: "In SFDX source format, CompactLayout files are decomposed inside the parent object's folder at force-app/main/default/objects/ObjectName/compactLayouts/LayoutName.compactLayout-meta.xml."
  - q: "How do I assign a CompactLayout as the primary default or per RecordType?"
    a: "Set the compactLayoutAssignment field on the parent CustomObject metadata for the org-wide primary compact layout, and set the compactLayoutAssignment field inside each RecordType metadata file for record-type-specific overrides."
  - q: "What happens if a user lacks Field-Level Security (FLS) for a field on a CompactLayout?"
    a: "Salesforce automatically suppresses any field the running user lacks Read FLS permission for and shifts the remaining visible fields to the left without throwing an error."
related:
  - metadata/custom-object-metadata-type
  - metadata/record-type-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/layout-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_compactlayout.htm
---

The `CompactLayout` metadata type controls which key summary fields appear in the **Lightning Experience Highlights Panel**, lookup hover cards, Global Search preview panels, Outlook/Gmail sidebars, and the Salesforce Mobile app record header. Introduced in API version 29.0, a well-designed `CompactLayout` lets users scan a record's identity, status, owner, and value at a glance without scrolling through tabs.

In Salesforce DX projects, compact layouts are decomposed inside their parent object folder at `force-app/main/default/objects/<ObjectName>/compactLayouts/<LayoutName>.compactLayout-meta.xml`.

```mermaid
flowchart LR
    CL["CompactLayout\n(Enterprise_Deal_Summary.compactLayout-meta.xml)"] --> Obj["CustomObject\n(compactLayoutAssignment)"]
    CL --> RT["RecordType\n(compactLayoutAssignment Override)"]
    CL --> UI1["Lightning Highlights Panel\n(Title + up to 6 Fields)"]
    CL --> UI2["Lookup Hover Cards &\nSalesforce Mobile Header"]
```

## Field Limits and Unsupported Field Types

- **Maximum Fields Defined**: Up to **10** `<fields>` per `CompactLayout`.
- **First Field Rule**: Always place the object's `Name` (or `CaseNumber` / `Subject` / `ContractNumber`) as the **first** `<fields>` entry, because Lightning Experience renders the first field in the large header font at the top-left of the Highlights Panel.
- **Unsupported Field Types**: You cannot include `TextArea`, `LongTextArea`, `Html` (Rich Text), or `MultiselectPicklist` fields in a `CompactLayout`.

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `fullName` | `string` | No | Developer API name of the compact layout |
| `label` | `string` | Yes | UI display label shown in Object Manager -> Compact Layouts |
| `fields` | `string[]` | No | Ordered array of field API names (up to 10 fields) |

## Production-Grade XML Example

Below is a `CompactLayout` for `Opportunity` (`force-app/main/default/objects/Opportunity/compactLayouts/Enterprise_Deal_Summary.compactLayout-meta.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CompactLayout xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Enterprise_Deal_Summary</fullName>
    <fields>Name</fields>
    <fields>AccountId</fields>
    <fields>StageName</fields>
    <fields>Amount</fields>
    <fields>CloseDate</fields>
    <fields>OwnerId</fields>
    <fields>NextStep</fields>
    <label>Enterprise Deal Summary</label>
</CompactLayout>
```

> [!TIP]
> **Assigning Compact Layouts in CI/CD**: Deploying a `.compactLayout-meta.xml` file creates the layout, but it does not activate it by itself. Always include the parent [CustomObject](/docs/metadata/custom-object-metadata-type/) `<compactLayoutAssignment>` (and any [RecordType](/docs/metadata/record-type-metadata-type/) `<compactLayoutAssignment>` overrides) in the same deployment so the new layout is immediately active in the target org.

## Querying Compact Layouts via Tooling API

You can inspect compact layouts and their assigned fields using the Tooling API:

```sql
-- 1. List Compact Layouts for a specific object (Tooling API)
SELECT Id, DeveloperName, MasterLabel, SobjectType, NamespacePrefix
FROM CompactLayout
WHERE SobjectType = 'Opportunity'

-- 2. Inspect CompactLayoutInfo via standard/Tooling SOQL
SELECT Id, DeveloperName, MasterLabel, EntityDefinition.QualifiedApiName
FROM CompactLayoutInfo
WHERE EntityDefinition.QualifiedApiName = 'Opportunity'
```

## Retrieval and Deployment (`package.xml`)

In `package.xml`, reference `CompactLayout` members using the `<ObjectName>.<CompactLayoutName>` syntax:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Opportunity.Enterprise_Deal_Summary</members>
        <name>CompactLayout</name>
    </types>
    <version>68.0</version>
</Package>
```

