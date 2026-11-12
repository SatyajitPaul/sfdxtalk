---
title: "StandardValueSetTranslation Metadata Type in SFDX"
description: "Translate customized standard picklist fields like CaseStatus, LeadSource, and OpportunityStage using the StandardValueSetTranslation metadata type in SFDX."
category: "metadata"
tags:
  - metadata-api
  - translation-workbench
  - standard-value-set
  - picklist
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "StandardValueSetTranslation localizes custom and overridden picklist values on standard Salesforce fields (standardValueSetTranslations/<Name>-<lang>.standardValueSetTranslation-meta.xml)."
faq:
  - q: "Why do you need StandardValueSetTranslation if Salesforce already translates standard fields?"
    a: "While Salesforce provides out-of-the-box translations for default standard picklist values, any custom picklist values you add to standard fields like CaseStatus, LeadSource, OpportunityStage, or AccountType require StandardValueSetTranslation to appear localized."
  - q: "How are StandardValueSetTranslation files named in SFDX?"
    a: "Files are stored in force-app/main/default/standardValueSetTranslations/ using the format StandardValueSetName-lang.standardValueSetTranslation-meta.xml, such as CaseStatus-es.standardValueSetTranslation-meta.xml."
  - q: "Does a wildcard (*) in package.xml retrieve all StandardValueSetTranslation files?"
    a: "Depending on the API version, wildcard retrieval can skip standard value sets unless explicitly named. Best practice is to explicitly list customized sets like CaseStatus-es, LeadStatus-es, and OpportunityStage-es in package.xml."
related:
  - metadata/standard-value-set-metadata-type
  - metadata/global-value-set-translation-metadata-type
  - metadata/custom-object-translation-metadata-type
  - metadata/translations-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_standardvaluesettranslation.htm
---

## Why the `StandardValueSetTranslation` Metadata Type Matters

Salesforce automatically translates out-of-the-box standard picklist values (`New`, `Working`, `Closed` on `Case.Status`). However, as soon as you add custom business values to a [StandardValueSet](/docs/metadata/standard-value-set-metadata-type/)—such as `Awaiting Vendor RMA` on `CaseStatus` or `Partner Referral - Tier 1` on `LeadSource`—those custom values appear in English to international users unless you deploy a **`StandardValueSetTranslation`**.

```mermaid
flowchart LR
    SVS["StandardValueSet<br/>(standardValueSets/CaseStatus.standardValueSet-meta.xml)"] --> ES["StandardValueSetTranslation (Spanish)<br/>(CaseStatus-es.standardValueSetTranslation-meta.xml)"]
    SVS --> DE["StandardValueSetTranslation (German)<br/>(CaseStatus-de.standardValueSetTranslation-meta.xml)"]
    ES --> CASE["Localizes Case.Status in Service Console<br/>and Experience Cloud"]
    DE --> CASE
```

---

## SFDX Source Format & File Naming

Files reside in `force-app/main/default/standardValueSetTranslations/` and combine the official [StandardValueSet](/docs/metadata/standard-value-set-metadata-type/) name with a hyphen and the language code:

- `CaseStatus-es.standardValueSetTranslation-meta.xml`
- `OpportunityStage-fr.standardValueSetTranslation-meta.xml`
- `LeadSource-ja.standardValueSetTranslation-meta.xml`
- `AccountRating-de.standardValueSetTranslation-meta.xml`

---

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `valueTranslation` | `ValueTranslation[]` | No | List of translated standard picklist values. |
| `valueTranslation.masterLabel` | `string` | Yes | The exact **Master Label** of the value in the `StandardValueSet`. |
| `valueTranslation.translation` | `string` | Yes | The localized text for the target language. Leave empty string if untranslated. |

---

## Real-World XML Example (`standardValueSetTranslations/CaseStatus-es.standardValueSetTranslation-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<StandardValueSetTranslation xmlns="http://soap.sforce.com/2006/04/metadata">
    <valueTranslation>
        <masterLabel>Awaiting Customer Logs</masterLabel>
        <translation>Esperando registros del cliente</translation>
    </valueTranslation>
    <valueTranslation>
        <masterLabel>Escalated to Tier 3 Engineering</masterLabel>
        <translation>Escalado a Ingeniería Nivel 3</translation>
    </valueTranslation>
    <valueTranslation>
        <masterLabel>Resolved - Pending Verification</masterLabel>
        <translation>Resuelto - Pendiente de verificación</translation>
    </valueTranslation>
</StandardValueSetTranslation>
```

---

## Senior Architect Best Practices

> [!TIP]
> **Always Pair `StandardValueSet` and `StandardValueSetTranslation` in PRs:** Whenever a developer adds a new stage or status to `OpportunityStage.standardValueSet-meta.xml` or `CaseStatus.standardValueSet-meta.xml`, enforce a pull-request check ensuring the corresponding `StandardValueSetTranslation` files are updated in the same commit.

- **Deploy the `StandardValueSet` First (or Together):** If a `StandardValueSetTranslation` file contains a `<masterLabel>` that does not yet exist in the target org's `StandardValueSet`, the translation entry will fail or be dropped during deployment.
