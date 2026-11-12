---
title: "CustomObjectTranslation Metadata Type in SFDX"
description: "Translate custom object labels, fields, validation rules, record types, and quick actions using the CustomObjectTranslation metadata type in Salesforce."
category: "metadata"
tags:
  - metadata-api
  - translation-workbench
  - custom-object
  - custom-field
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "CustomObjectTranslation stores localized labels for custom and standard objects (objectTranslations/<Object>-<lang>/), decomposing in SFDX into an object translation file and individual .fieldTranslation-meta.xml files."
faq:
  - q: "How does SFDX decompose CustomObjectTranslation in source format?"
    a: "In SFDX source format, force-app/main/default/objectTranslations/ObjectName-lang/ contains one main ObjectName-lang.objectTranslation-meta.xml file for object-level translations and separate FieldName.fieldTranslation-meta.xml files for each custom field."
  - q: "Why does deploying a CustomObjectTranslation fail when updating nameFieldLabel?"
    a: "Salesforce requires at least one non-empty caseValues entry inside the .objectTranslation-meta.xml file whenever you deploy a translated nameFieldLabel. If caseValues has an empty value tag, the nameFieldLabel translation is silently ignored or rejected."
  - q: "Can CustomObjectTranslation translate Validation Rule error messages and Record Types?"
    a: "Yes. Beyond field labels and help text, CustomObjectTranslation includes child arrays for validationRules, recordTypes, quickActions, layouts, fieldSets, sharingReasons, webLinks, and workflowTasks."
  - q: "How are picklist values on a specific field translated when the field does not use a GlobalValueSet?"
    a: "Local custom picklist values are translated directly inside that field's .fieldTranslation-meta.xml file using picklistValues blocks with masterLabel and translation elements."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/global-value-set-translation-metadata-type
  - metadata/standard-value-set-translation-metadata-type
  - metadata/translations-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_customobjecttranslation.htm
---

## Why the `CustomObjectTranslation` Metadata Type Matters

In multi-language global Salesforce deployments, **`CustomObjectTranslation`** controls how every custom object (and custom metadata on standard objects) renders when a user changes their personal language locale. It translates not just the object's singular/plural name, grammatical gender, and case forms (`caseValues`), but also all child metadata attached to that object:

- **Custom Fields & Help Text** (`CustomFieldTranslation`)
- **Local Picklist & Lookup Filter Messages**
- **Validation Rule Error Messages** (`ValidationRuleTranslation`)
- **Record Type Labels & Descriptions** (`RecordTypeTranslation`)
- **Object-Specific Quick Actions, Layouts, Field Sets, and WebLinks**

```mermaid
flowchart TD
    DIR["objectTranslations/Invoice__c-de/"] --> OBJ["Invoice__c-de.objectTranslation-meta.xml"]
    DIR --> FLD1["Status__c.fieldTranslation-meta.xml"]
    DIR --> FLD2["Customer_Account__c.fieldTranslation-meta.xml"]

    OBJ --> CASE["caseValues (Nominative, Accusative, Dative, Genitive)"]
    OBJ --> VR["validationRules (Localized Error Messages)"]
    OBJ --> RT["recordTypes (Localized Labels)"]
    FLD1 --> PL["picklistValues (masterLabel -> translation)"]
    FLD2 --> REL["relationshipLabel (Child Related List Title)"]
```

---

## SFDX Source Decomposition (`objectTranslations/`)

In SFDX source format, `CustomObjectTranslation` is decomposed into one folder per `<ObjectName>-<locale>` inside `force-app/main/default/objectTranslations/`:

```text
force-app/main/default/objectTranslations/Invoice__c-de/
├── Invoice__c-de.objectTranslation-meta.xml
├── Amount__c.fieldTranslation-meta.xml
└── Status__c.fieldTranslation-meta.xml
```

---

## Real-World XML Examples

### 1. Object-Level Translation (`objectTranslations/Invoice__c-de/Invoice__c-de.objectTranslation-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObjectTranslation xmlns="http://soap.sforce.com/2006/04/metadata">
    <caseValues>
        <caseType>Nominative</caseType>
        <plural>false</plural>
        <value>Rechnung</value>
    </caseValues>
    <caseValues>
        <caseType>Nominative</caseType>
        <plural>true</plural>
        <value>Rechnungen</value>
    </caseValues>
    <gender>Feminine</gender>
    <nameFieldLabel>Rechnungsnummer</nameFieldLabel>
    <recordTypes>
        <description>Standardrechnung für Unternehmenskunden</description>
        <label>Unternehmensrechnung</label>
        <name>Commercial_Invoice</name>
    </recordTypes>
    <validationRules>
        <errorMessage>Der Rechnungsbetrag muss größer als 0 sein.</errorMessage>
        <name>Positive_Invoice_Amount</name>
    </validationRules>
</CustomObjectTranslation>
```

### 2. Field-Level Translation (`objectTranslations/Invoice__c-de/Status__c.fieldTranslation-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomFieldTranslation xmlns="http://soap.sforce.com/2006/04/metadata">
    <help>Aktueller Zahlungsstatus der Rechnung.</help>
    <label>Rechnungsstatus</label>
    <name>Status__c</name>
    <picklistValues>
        <masterLabel>Draft</masterLabel>
        <translation>Entwurf</translation>
    </picklistValues>
    <picklistValues>
        <masterLabel>Paid</masterLabel>
        <translation>Bezahlt</translation>
    </picklistValues>
</CustomFieldTranslation>
```

---

## Senior Architect Deployment Gotchas

> [!WARNING]
> **The `nameFieldLabel` Silent Failure:** If you populate `<nameFieldLabel>` in `.objectTranslation-meta.xml` while leaving `<caseValues><value></value></caseValues>` blank (which Salesforce CLI frequently generates when retrieving untranslated objects), Salesforce **ignores** the `nameFieldLabel` translation during deployment! Always provide at least the singular and plural `Nominative` `<caseValues>` when translating an object's `Name` field.

- **Global Value Set Picklists Are Not Translated Here:** If a picklist field uses a [GlobalValueSet](/docs/metadata/global-value-set-metadata-type/), do not put `<picklistValues>` inside its `.fieldTranslation-meta.xml` file. Translate those shared values once in [GlobalValueSetTranslation](/docs/metadata/global-value-set-translation-metadata-type/).
- **Enable Translation Workbench First:** Deploying `CustomObjectTranslation` to a new Scratch Org or Sandbox where Translation Workbench is disabled or the target language is inactive will fail unless `Translations` settings are enabled in the org definition.
