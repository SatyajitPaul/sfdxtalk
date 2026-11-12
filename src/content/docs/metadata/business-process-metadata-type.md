---
title: "BusinessProcess Metadata Type Reference"
description: "Configure and deploy BusinessProcess (.businessProcess-meta.xml) metadata for Opportunity Sales Processes, Case Support Processes, and Lead Processes."
category: metadata
tags:
  - metadata-api
  - business-process
  - record-types
  - picklist
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "BusinessProcess (.businessProcess-meta.xml) defines a Sales Process (Opportunity), Support Process (Case), Lead Process (Lead), or Solution Process, controlling which StandardValueSet lifecycle status/stage values are available to a RecordType."
faq:
  - q: "Which four objects in Salesforce use BusinessProcess metadata?"
    a: "BusinessProcess applies to exactly four standard objects: Opportunity (Sales Processes controlling StageName), Case (Support Processes controlling Status), Lead (Lead Processes controlling Status), and Solution (Solution Processes controlling Status)."
  - q: "Why can I not create a RecordType on Opportunity, Case, or Lead without a BusinessProcess?"
    a: "Unlike custom objects and other standard objects where RecordTypes control all picklists directly, Opportunity, Case, and Lead require every RecordType to reference a BusinessProcess in its businessProcess field to govern the primary lifecycle picklist."
  - q: "Where are BusinessProcess files stored in SFDX source format?"
    a: "In SFDX source format, BusinessProcess files are decomposed inside the parent object's folder at force-app/main/default/objects/ObjectName/businessProcesses/ProcessName.businessProcess-meta.xml."
  - q: "What is the relationship between StandardValueSet and BusinessProcess?"
    a: "StandardValueSet (such as OpportunityStage or CaseStatus) defines the org-wide master list of picklist values and their probabilities or closed flags. BusinessProcess selects a subset of those master values to display on a specific RecordType."
  - q: "Can I query active BusinessProcesses using standard SOQL?"
    a: "Yes. Query the standard BusinessProcess object in SOQL for Id, Name, Description, TableEnumOrId (Opportunity, Case, Lead), and IsActive."
related:
  - metadata/record-type-metadata-type
  - metadata/standard-value-set-metadata-type
  - metadata/path-assistant-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_businessprocess.htm
---

The `BusinessProcess` metadata type defines a **Sales Process** (`Opportunity`), **Support Process** (`Case`), **Lead Process** (`Lead`), or **Solution Process** (`Solution`). Introduced in API version 17.0, `BusinessProcess` acts as the mandatory bridge between the org-wide master lifecycle picklist ([StandardValueSet](/docs/metadata/standard-value-set-metadata-type/): `OpportunityStage`, `CaseStatus`, `LeadStatus`) and an object's [RecordType](/docs/metadata/record-type-metadata-type/).

In Salesforce DX projects, business processes are decomposed inside their parent object folder at `force-app/main/default/objects/<ObjectName>/businessProcesses/<ProcessName>.businessProcess-meta.xml`.

```mermaid
flowchart LR
    SVS["StandardValueSet\n(OpportunityStage.standardValueSet-meta.xml)"] -->|"Defines Master Stages,\nProbabilities & Forecast Categories"| BP["BusinessProcess\n(Enterprise_Sales_Process.businessProcess-meta.xml)"]
    BP -->|"Selects Subset of Stages"| RT["RecordType\n(Enterprise_Sales.recordType-meta.xml)"]
    RT -->|"Renders Chevron Steps"| Path["PathAssistant\n(Enterprise_Sales_Path.pathAssistant-meta.xml)"]
```

## Key Metadata Fields

| Field | Location | Required | Description |
|---|---|---|---|
| `fullName` | Root | Yes | Developer name of the business process (qualified as `Object.ProcessName` in `package.xml`) |
| `isActive` | Root | No | Whether the business process is active (`true` or `false`) |
| `description` | Root | No | Explains which sales, support, or lead lifecycle this process models |
| `values` | Root | No | Ordered subset of picklist values (`fullName` and `default`) selected from the master `StandardValueSet` |
| `default` | `values` | Yes | Marks the default status (`true` for Case/Lead/Solution processes; `false` on `Opportunity` stages) |

## Production-Grade XML Example (`Opportunity` Sales Process)

Below is a `BusinessProcess` for `Opportunity` (`force-app/main/default/objects/Opportunity/businessProcesses/Enterprise_Sales_Process.businessProcess-meta.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<BusinessProcess xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Enterprise_Sales_Process</fullName>
    <description>Multi-stage sales process for B2B Enterprise direct sales opportunities.</description>
    <isActive>true</isActive>
    <values>
        <fullName>Discovery</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Technical Validation</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Contract Negotiation</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Closed Won</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Closed Lost</fullName>
        <default>false</default>
    </values>
</BusinessProcess>
```

> [!WARNING]
> **Deploy Order for New Stage Values**: If you introduce a brand-new stage (such as `Technical Validation`) in a `BusinessProcess`, that value **must** already exist in the target org's `StandardValueSet` (`OpportunityStage`) or be deployed in the same `package.xml` transaction—otherwise the `BusinessProcess` deployment will fail with `Picklist value: Technical Validation in picklist: StageName not found`.

## Querying `BusinessProcess` with SOQL

```sql
-- 1. List all active Sales, Support, and Lead Processes in the org
SELECT Id, Name, TableEnumOrId, Description, IsActive, LastModifiedDate
FROM BusinessProcess
WHERE IsActive = true
ORDER BY TableEnumOrId, Name ASC

-- 2. Inspect which BusinessProcess is linked to each RecordType
SELECT Id, DeveloperName, Name, SobjectType, BusinessProcessId
FROM RecordType
WHERE SobjectType IN ('Opportunity', 'Case', 'Lead') AND IsActive = true
ORDER BY SobjectType, Name ASC
```

