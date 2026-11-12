---
title: "CustomValue Metadata Type in SFDX"
description: "Understand and configure Salesforce CustomValue metadata elements across GlobalValueSet, StandardValueSet, and Picklist fields in SFDX source format."
category: "metadata"
tags: [metadata, custom-value, picklists, global-value-set, schema, sf-cli]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "CustomValue is the foundational metadata subtype representing an individual picklist value inside a GlobalValueSet, StandardValueSet, or CustomField valueSetDefinition, controlling API value, label, active state, default status, and chart colors."
faq:
  - q: "Does CustomValue have its own standalone folder in SFDX?"
    a: "No. CustomValue is an embedded metadata subtype used inside GlobalValueSet, StandardValueSet, and CustomField XML files to define individual picklist entries."
  - q: "What is the difference between fullName and label on a CustomValue?"
    a: "The fullName field is the immutable API name stored in the database and used in SOQL and Apex, while label is the user-facing display text shown in the UI."
  - q: "How do I deactivate a picklist value using CustomValue in SFDX?"
    a: "Set the isActive tag to false inside the CustomValue XML block and deploy the parent CustomField or GlobalValueSet file."
  - q: "What happens if I remove a CustomValue XML block from a CustomField file and deploy?"
    a: "In unrestricted picklists or StandardValueSets, omitting a CustomValue from XML often leaves the value untouched or deactivated in the target org rather than deleting it."
related:
  - metadata/global-value-set-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-customvalue.md"
---

## Architectural Overview

The `CustomValue` metadata type is the base XML structure that represents a single value inside a picklist, [GlobalValueSet](/docs/metadata/global-value-set-metadata-type/), or `StandardValueSet`. It is also extended by specialized picklist subtypes such as `StandardValue` (for Opportunity `StageName`, Case `Status`, and Lead `Status`) and `ValueSetValuesDefinition`.

Understanding `CustomValue` is critical for Salesforce Architects because Salesforce strictly separates a picklist option's **API Name** (`fullName`) from its **Display Label** (`label`). Integration payloads, Apex logic, [Flow](/docs/metadata/flow-metadata-type/) conditions, and validation rules always evaluate `fullName`, whereas end users and Translation Workbench interact with `label`.

```mermaid
flowchart TD
    A["CustomValue Base Metadata Type"] --> B["GlobalValueSet (<customValue>)"]
    A --> C["CustomField Picklist (<value>)"]
    A --> D["StandardValueSet (<standardValue> extends CustomValue)"]
    B --> E["fullName (API Value)"]
    B --> F["label (UI Display Text)"]
    B --> G["isActive / default / color"]
```

## Where `CustomValue` Appears in SFDX Source Format

Because `CustomValue` is a nested metadata type, it does not have its own standalone `.customValue-meta.xml` file. Instead, it is embedded inside three parent metadata files:

| Parent Metadata Type | SFDX File Location | XML Element Tag |
| :--- | :--- | :--- |
| `GlobalValueSet` | `force-app/main/default/globalValueSets/<Name>.globalValueSet-meta.xml` | `<customValue>` |
| `CustomField` | `force-app/main/default/objects/<Obj>/fields/<Field>.field-meta.xml` | `<value>` inside `<valueSetDefinition>` |
| `StandardValueSet` | `force-app/main/default/standardValueSets/<Name>.standardValueSet-meta.xml` | `<standardValue>` |

## Key Metadata Fields

| Field Name | Type | Required | Description & Architectural Guidance |
| :--- | :--- | :--- | :--- |
| `fullName` | `string` | Yes | The API name of the picklist value stored in database records and queried via SOQL (up to 255 characters). |
| `label` | `string` | No | The user-facing UI label. In `GlobalValueSet` and `CustomField`, this is required whenever it differs from `fullName`. |
| `default` | `boolean` | Yes | Indicates whether this value is the default selection (`true` or `false`). Only one value in a single-select picklist can be `true`. |
| `isActive` | `boolean` | No | Controls whether the picklist value is active (`true`) or inactive (`false`). Defaults to `true` when omitted. |
| `color` | `string` | No | Hexadecimal RGB color code (for example, `#0B6FCE`) assigned to this value on Lightning dashboards and charts. |
| `description` | `string` | No | Architectural or business description of when this picklist value should be used. |

## Declarative XML Examples

### 1. `CustomValue` Inside a `GlobalValueSet`

```xml title="force-app/main/default/globalValueSets/ISO_Region.globalValueSet-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<GlobalValueSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <customValue>
        <fullName>AMER</fullName>
        <color>#0B6FCE</color>
        <default>true</default>
        <description>North, Central, and South America</description>
        <isActive>true</isActive>
        <label>Americas (AMER)</label>
    </customValue>
    <customValue>
        <fullName>EMEA</fullName>
        <color>#2E844A</color>
        <default>false</default>
        <isActive>true</isActive>
        <label>Europe, Middle East, and Africa (EMEA)</label>
    </customValue>
    <customValue>
        <fullName>APAC_LEGACY</fullName>
        <default>false</default>
        <description>Deactivated legacy code preserved for historical records.</description>
        <isActive>false</isActive>
        <label>Asia-Pacific (Legacy)</label>
    </customValue>
    <masterLabel>ISO Operating Region</masterLabel>
    <sorted>false</sorted>
</GlobalValueSet>
```

### 2. `CustomValue` Inside a `CustomField` Picklist

```xml title="force-app/main/default/objects/Invoice__c/fields/Approval_Tier__c.field-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Approval_Tier__c</fullName>
    <label>Approval Tier</label>
    <required>false</required>
    <trackHistory>true</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>TIER_1_AUTO</fullName>
                <default>true</default>
                <label>Tier 1 - Auto Approved</label>
            </value>
            <value>
                <fullName>TIER_2_VP</fullName>
                <default>false</default>
                <label>Tier 2 - VP Finance Sign-off</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

## Inspecting Picklist `CustomValue` Entries via SOQL

You can inspect active and inactive picklist values at runtime by querying `PicklistValueInfo` in SOQL or Tooling API:

```soql
SELECT Value, Label, IsActive, IsDefaultValue, DurableId
FROM PicklistValueInfo
WHERE EntityParticle.EntityDefinition.QualifiedApiName = 'Account'
  AND EntityParticle.DeveloperName = 'Type'
ORDER BY Value ASC
```

## Architect Best Practices and Gotchas

- **Use Stable Screaming-Snake or Code `fullName` Values:** Set `<fullName>` to a stable integration code (like `TIER_2_VP`) and `<label>` to the business phrase (`Tier 2 - VP Finance Sign-off`). When business stakeholders rename the label in the future, you can deploy the `<label>` change without breaking Apex, Flows, or external API integrations.
- **Deactivate Instead of Deleting:** Instead of removing a `<customValue>` or `<value>` block from Git, set `<isActive>false</isActive>` and deploy. This cleanly deactivates the option in the UI while keeping historical data intact.
- **RecordType Picklist Assignments:** Adding a new `CustomValue` to a `GlobalValueSet` or `CustomField` does **not** automatically assign that value to existing Record Types unless the Record Type XML (`<picklistValues>`) is also updated and deployed in the same transaction.

> [!TIP]
> Always include `RecordType` metadata alongside `GlobalValueSet` or `CustomField` changes in your pull requests so newly added `CustomValue` entries become selectable on record pages immediately after deployment.
