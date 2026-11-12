---
title: "PathAssistant Metadata Type Reference"
description: "Configure and deploy PathAssistant (.pathAssistant-meta.xml) metadata to customize Lightning Path stages, key fields, and Guidance for Success per RecordType."
category: metadata
tags:
  - metadata-api
  - path-assistant
  - lightning-experience
  - record-types
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "PathAssistant (.pathAssistant-meta.xml) configures the visual chevron Path component on Lightning Record Pages, mapping each picklist stage to up to 5 key fields and rich-text Guidance for Success."
faq:
  - q: "How many PathAssistant definitions can exist per Object and RecordType?"
    a: "Salesforce allows at most one PathAssistant per RecordType on a given object (including the __MASTER__ record type when an object has no custom RecordTypes)."
  - q: "Can entityName, fieldName, or recordTypeName be updated on an existing PathAssistant?"
    a: "No. The entityName, fieldName, and recordTypeName fields on PathAssistant are non-updateable after creation. To change the driving picklist field or record type, delete and recreate the PathAssistant."
  - q: "How many key fields can be added to each PathAssistantStep?"
    a: "Each pathAssistantSteps entry supports up to 5 fields in its fieldNames array, along with a rich-text info block (up to 1,000 characters) for Guidance for Success."
  - q: "What value do I use for recordTypeName if my object does not use custom RecordTypes?"
    a: "Set recordTypeName to __MASTER__ when configuring a PathAssistant on an object that does not have custom RecordTypes."
  - q: "What dependencies must be included in package.xml when deploying a PathAssistant?"
    a: "Ensure the target CustomObject, the driving picklist CustomField (or StandardValueSet/BusinessProcess), and the referenced RecordType are either already in the target org or included in the same deployment package."
related:
  - metadata/record-type-metadata-type
  - metadata/business-process-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/custom-field-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_pathassistant.htm
---

The `PathAssistant` metadata type configures **Lightning Path**—the interactive chevron progress bar rendered on a [FlexiPage](/docs/metadata/flexipage-metadata-type/) record page that guides users through the lifecycle stages of an `Opportunity`, `Lead`, `Case`, `Quote`, `Order`, `WorkOrder`, or custom object. Introduced in API version 34.0, `PathAssistant` binds a specific `entityName`, `recordTypeName`, and driving picklist `fieldName` to stage-specific key fields (`fieldNames`) and **Guidance for Success** coaching text (`info`).

In Salesforce DX projects, path definitions live in `force-app/main/default/pathAssistants/` with the `.pathAssistant-meta.xml` suffix.

```mermaid
flowchart LR
    PA["PathAssistant\n(Enterprise_Sales_Path.pathAssistant-meta.xml)"] --> Bind["Immutable Binding:\n- entityName\n- recordTypeName\n- fieldName"]
    PA --> Step1["pathAssistantSteps:\n- picklistValueName\n- fieldNames (Up to 5 Fields)\n- info (Guidance for Success HTML)"]
    PA --> UI["FlexiPage Component:\nruntime_sales_pathassistant:pathAssistant"]
```

## Key Metadata Fields

| Field | Location | Required | Description |
|---|---|---|---|
| `masterLabel` | Root | Yes | Display name of the Path in Setup -> Path Settings |
| `active` | Root | Yes | Whether the Path is active (`true`) or inactive (`false`) |
| `entityName` | Root | Yes | **Not updateable**. API name of the object (`Opportunity`, `Lead`, `Invoice__c`, etc.) |
| `fieldName` | Root | Yes | **Not updateable**. API name of the driving picklist field (`StageName`, `Status`, etc.) |
| `recordTypeName` | Root | Yes | **Not updateable**. Developer name of the [RecordType](/docs/metadata/record-type-metadata-type/) (or `__MASTER__` if no record types exist) |
| `picklistValueName` | `pathAssistantSteps` | Yes | Exact API name of the picklist value for that stage |
| `fieldNames` | `pathAssistantSteps` | No | Up to 5 field API names displayed under the chevron for this stage |
| `info` | `pathAssistantSteps` | No | HTML coaching instructions (**Guidance for Success**) shown alongside key fields |

## Production-Grade XML Example

Below is a `PathAssistant` (`Enterprise_Sales_Path.pathAssistant-meta.xml`) for `Opportunity` (`Enterprise_Sales` RecordType):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PathAssistant xmlns="http://soap.sforce.com/2006/04/metadata">
    <active>true</active>
    <entityName>Opportunity</entityName>
    <fieldName>StageName</fieldName>
    <masterLabel>Enterprise Sales Path</masterLabel>
    <pathAssistantSteps>
        <fieldNames>Amount</fieldNames>
        <fieldNames>CloseDate</fieldNames>
        <fieldNames>LeadSource</fieldNames>
        <fieldNames>NextStep</fieldNames>
        <info>&lt;p&gt;&lt;strong&gt;Discovery Checklist:&lt;/strong&gt;&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Identify executive sponsor and budget owner.&lt;/li&gt;&lt;li&gt;Document current-state pain points and target go-live quarter.&lt;/li&gt;&lt;/ul&gt;</info>
        <picklistValueName>Discovery</picklistValueName>
    </pathAssistantSteps>
    <pathAssistantSteps>
        <fieldNames>Amount</fieldNames>
        <fieldNames>CloseDate</fieldNames>
        <fieldNames>NextStep</fieldNames>
        <info>&lt;p&gt;&lt;strong&gt;Technical Validation:&lt;/strong&gt; Complete Solutions Architect security review and attach signed POC success criteria.&lt;/p&gt;</info>
        <picklistValueName>Technical Validation</picklistValueName>
    </pathAssistantSteps>
    <recordTypeName>Enterprise_Sales</recordTypeName>
</PathAssistant>
```

> [!WARNING]
> **Missing Steps in `.pathAssistant-meta.xml`**: If a picklist value exists in the driving `RecordType` or [BusinessProcess](/docs/metadata/business-process-metadata-type/) but has no Key Fields or Guidance configured, Salesforce simply omits its `<pathAssistantSteps>` block from the XML file. The chevron step still renders in the UI—it just has no expandable drawer.

