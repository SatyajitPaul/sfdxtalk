---
title: "ChoiceList Metadata Type for Dynamic Forms"
description: "Deploy and manage ChoiceList metadata in Salesforce SFDX to configure reusable picklist and choice options across Dynamic Assessments and Discovery."
category: "metadata"
tags:
  - metadata
  - choice-list
  - discovery-framework
  - industry-clouds
  - package-xml
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "ChoiceList defines reusable sets of selectable choice values used in Salesforce Industry Cloud assessments, dynamic questionnaires, and guided intake workflows."
faq:
  - q: "How does ChoiceList differ from a GlobalValueSet in Salesforce?"
    a: "GlobalValueSet backs standard and custom object picklist fields in the core database schema, whereas ChoiceList defines selectable option lists specifically for dynamic questionnaires, assessments, and guided form components."
  - q: "Where are ChoiceList metadata files stored in an SFDX project?"
    a: "ChoiceList files are stored in the force-app/main/default/choiceLists/ directory with the .choiceList-meta.xml file extension."
  - q: "Can multiple assessment questions share the same ChoiceList?"
    a: "Yes, defining a single ChoiceList allows multiple assessment questions or dynamic form elements to reference the same standardized list of values without duplicating option entries."
  - q: "How do I retrieve all ChoiceList records from an org using Salesforce CLI?"
    a: "Run sf project retrieve start --metadata ChoiceList to pull all choice lists into your local SFDX project."
related:
  - metadata/flow-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-choicelist.md"
---

## Architectural Overview

Across Salesforce Industry Clouds (such as Health Cloud, Financial Services Cloud, and Public Sector Solutions) and dynamic questionnaire engines, intake forms and assessments require hundreds of standardized single-select or multi-select answer sets (for example, *Yes / No / Unable to Assess* or *Low / Moderate / High / Critical*). Creating database-level [CustomField](/docs/metadata/custom-field-metadata-type/) picklists for every questionnaire prompt quickly exhausts object field governor limits.

The `ChoiceList` metadata type decouples form answer options from physical database columns. It defines a reusable collection of choice values (`choiceListValue`) that dynamic assessments, Discovery Framework questions, and guided [Flow](/docs/metadata/flow-metadata-type/) screens can reference declaratively.

```mermaid
flowchart LR
    A["ChoiceList Metadata"] --> B["choiceListValue Items (Label, Value, Default)"]
    B --> C["Assessment / Discovery Question 1"]
    B --> D["Assessment / Discovery Question 2"]
    C --> E["Captured Assessment Response Record"]
    D --> E
```

## Directory Location and File Suffix

In Salesforce DX source format, `ChoiceList` components are stored in the `choiceLists` directory.

| Property | Value |
| :--- | :--- |
| **Directory Path (SFDX)** | `force-app/main/default/choiceLists/` |
| **File Suffix (SFDX)** | `.choiceList-meta.xml` |
| **Classic Metadata Suffix** | `.choiceList` |
| **Metadata Type Name** | `ChoiceList` |

## Key Metadata Fields

The following table describes the fields available on `ChoiceList` and its nested `ChoiceListValue` items in API version `68.0` (Winter '27):

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | The display name or label of the choice list in Setup. |
| `description` | `string` | No | Documents the intended clinical, financial, or regulatory context for this option list. |
| `choiceListValue` | `ChoiceListValue[]` | No | Collection of individual selectable options belonging to the choice list. |
| `choiceListValue.valueName` | `string` | Yes | The stored API value recorded when the user selects this choice option. |
| `choiceListValue.label` | `string` | Yes | The user-facing display label rendered in the assessment or dynamic form UI. |
| `choiceListValue.isDefaultValue` | `boolean` | No | Specifies whether this option is pre-selected by default when the form loads. |
| `choiceListValue.displayOrder` | `int` | No | Controls the numeric sort sequence (`1`, `2`, `3`) of options in the dropdown or radio group. |

## Declarative Metadata Example

The following `ChoiceList` defines a standardized Clinical Risk Severity scale (`Low`, `Moderate`, `High`, `Critical`) for patient intake assessments.

```xml title="force-app/main/default/choiceLists/Clinical_Risk_Severity_Scale.choiceList-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ChoiceList xmlns="http://soap.sforce.com/2006/04/metadata">
    <choiceListValue>
        <displayOrder>1</displayOrder>
        <isDefaultValue>true</isDefaultValue>
        <label>Low Risk</label>
        <valueName>LOW</valueName>
    </choiceListValue>
    <choiceListValue>
        <displayOrder>2</displayOrder>
        <isDefaultValue>false</isDefaultValue>
        <label>Moderate Risk</label>
        <valueName>MODERATE</valueName>
    </choiceListValue>
    <choiceListValue>
        <displayOrder>3</displayOrder>
        <isDefaultValue>false</isDefaultValue>
        <label>High Risk</label>
        <valueName>HIGH</valueName>
    </choiceListValue>
    <choiceListValue>
        <displayOrder>4</displayOrder>
        <isDefaultValue>false</isDefaultValue>
        <label>Critical Risk</label>
        <valueName>CRITICAL</valueName>
    </choiceListValue>
    <description>Standardized four-tier risk severity choices for patient and member intake assessments.</description>
    <name>Clinical Risk Severity Scale</name>
</ChoiceList>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Clinical_Risk_Severity_Scale</members>
        <name>ChoiceList</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval and Deployment

Manage `ChoiceList` metadata across environments with the Salesforce CLI (`sf`):

```bash
# Retrieve all ChoiceList components from the org
sf project retrieve start --metadata ChoiceList

# Deploy a specific ChoiceList component
sf project deploy start --metadata ChoiceList:Clinical_Risk_Severity_Scale
```

## Architect Best Practices and Gotchas

> [!TIP]
> Keep `valueName` uppercase and machine-friendly (such as `LOW`, `MODERATE`, `HIGH`) while modifying `label` for user-facing wording changes. This prevents downstream [Flow](/docs/metadata/flow-metadata-type/) decision elements or scoring formulas from breaking when business stakeholders request label copy updates.

- **Avoid Duplicate `ChoiceList` Definitions:** Before creating a new `ChoiceList` for an assessment, audit existing `force-app/main/default/choiceLists/` files to reuse common scales (such as Yes/No/NA or Likert 1–5 scales).
- **Preserve Historical `valueName` Entries:** Never rename an active `valueName` that has already been captured in production assessment responses; add a new `choiceListValue` instead so historical reporting remains consistent.
