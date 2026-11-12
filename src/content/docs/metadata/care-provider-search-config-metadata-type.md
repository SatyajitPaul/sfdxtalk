---
title: "CareProviderSearchConfig Metadata Type in SFDX"
description: "Configure and deploy Health Cloud Provider Search field mappings using CareProviderSearchConfig in SFDX to index custom Healthcare Provider attributes."
category: "metadata"
tags:
  - metadata-api
  - health-cloud
  - provider-search
  - data-indexing
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "CareProviderSearchConfig maps custom fields from HealthcareProvider or HealthcarePractitionerFacility onto the CareProviderSearchableField index for fast provider directory searches."
faq:
  - q: "What problem does CareProviderSearchConfig solve in Health Cloud?"
    a: "It maps custom fields from normalized provider objects (HealthcareProvider or HealthcarePractitionerFacility) onto the denormalized CareProviderSearchableField object used by Provider Search."
  - q: "Where are CareProviderSearchConfig files stored in SFDX source format?"
    a: "They are stored in the force-app/main/default/careProviderSearchConfigs/ directory with the .careProviderSearchConfig-meta.xml file extension."
  - q: "How many CareProviderSearchConfig mappings can an org have?"
    a: "Salesforce Health Cloud supports a strict limit on active CareProviderSearchConfig field mappings and triggers a background data sync job whenever mappings change."
  - q: "Can I query CareProviderSearchConfig via SOQL?"
    a: "Yes, CareProviderSearchConfig is queryable in SOQL to inspect SourceObject, SourceField, TargetField, and IsActive."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-careprovidersearchconfig.md"
---

## Architectural Overview

In Salesforce Health Cloud, the Provider Directory data model is highly normalized across `Account`, `Contact`, `HealthcareProvider`, `HealthcarePractitionerFacility`, `HealthcareFacilityNetwork`, and `CareProviderFacilitySpecialty`. Querying across six normalized junction tables in real time when a call center agent or patient portal user searches for an in-network cardiologist within 15 miles who speaks Spanish and accepts new patients would cause severe SOQL latency.

To solve this, Health Cloud maintains a flattened, indexed search table called `CareProviderSearchableField` synced automatically via a platform data pipeline. The `CareProviderSearchConfig` metadata type allows architects to map custom fields from `HealthcareProvider` or `HealthcarePractitionerFacility` onto custom fields on `CareProviderSearchableField` so the **Provider Search** engine can filter and display custom provider attributes at sub-second speeds.

```mermaid
flowchart LR
    A["Source Object (HealthcareProvider / HealthcarePractitionerFacility)"] --> B["CareProviderSearchConfig (.careProviderSearchConfig-meta.xml)"]
    B --> C["Health Cloud Provider Search Sync Pipeline"]
    C --> D["Target Object (CareProviderSearchableField)"]
    D --> E["Sub-Second Geo & Specialty Provider Search UI"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `CareProviderSearchConfig` |
| **Classic Directory** | `careProviderSearchConfigs/` |
| **Classic File Suffix** | `.careProviderSearchConfig` |
| **SFDX Source Directory** | `force-app/main/default/careProviderSearchConfigs/` |
| **SFDX File Suffix** | `.careProviderSearchConfig-meta.xml` |

## Key Metadata Fields

The `CareProviderSearchConfig` metadata type exposes the following XML elements:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `isActive` | `boolean` | No | Enables (`true`) or disables (`false`) synchronization of the mapped field into `CareProviderSearchableField`. |
| `isProtected` | `boolean` | No | Indicates whether the mapping is protected inside a managed package. |
| `mappedObject` | `MappedObject` | Yes | The source provider entity being mapped (`HealthcareProvider` or `HealthcarePractitionerFacility`). |
| `masterLabel` | `string` | Yes | Display name of the provider search field mapping in Setup -> Care Provider Search Config. |
| `sourceField` | `string` | Yes | API name of the custom field on the source object (`mappedObject`), such as `Telehealth_Certified__c`. |
| `targetField` | `string` | Yes | API name of the compatible custom field on `CareProviderSearchableField` that receives the synchronized value. |

> [!WARNING]
> The data types and field lengths of `sourceField` (on `HealthcareProvider` or `HealthcarePractitionerFacility`) and `targetField` (on `CareProviderSearchableField`) must be compatible, and **Restricted Picklists** are not supported on the target field.

## Declarative XML & `package.xml` Examples

### SFDX Source File Example

```xml title="force-app/main/default/careProviderSearchConfigs/Telehealth_Certification_Map.careProviderSearchConfig-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<CareProviderSearchConfig xmlns="http://soap.sforce.com/2006/04/metadata">
    <isActive>true</isActive>
    <isProtected>false</isProtected>
    <mappedObject>HealthcarePractitionerFacility</mappedObject>
    <masterLabel>Telehealth Certification Map</masterLabel>
    <sourceField>Telehealth_Certified__c</sourceField>
    <targetField>Telehealth_Certified__c</targetField>
</CareProviderSearchConfig>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>HealthcarePractitionerFacility.Telehealth_Certified__c</members>
        <members>CareProviderSearchableField.Telehealth_Certified__c</members>
        <name>CustomField</name>
    </types>
    <types>
        <members>Telehealth_Certification_Map</members>
        <name>CareProviderSearchConfig</name>
    </types>
    <version>68.0</version>
</Package>
```

## Querying via SOQL & SFDX CLI

Inspect active provider search field mappings in SOQL:

```soql
SELECT Id, DeveloperName, MasterLabel, MappedObject, SourceField, TargetField, IsActive
FROM CareProviderSearchConfig
ORDER BY MappedObject, DeveloperName ASC
```

Retrieve and deploy `CareProviderSearchConfig` along with its custom fields using the Salesforce CLI:

```bash
# Retrieve CareProviderSearchConfig definitions
sf project retrieve start --metadata CareProviderSearchConfig

# Deploy source/target CustomFields and the CareProviderSearchConfig together
sf project deploy start --manifest manifest/package.xml
```

## Senior Architect Best Practices & Gotchas

- **Deploy Custom Fields and FLS First:** Both the `sourceField` and `targetField` [CustomField](/docs/metadata/custom-field-metadata-type/) definitions must exist in the org and be readable by the Health Cloud integration context before `CareProviderSearchConfig` is deployed.
- **Asynchronous Data Sync Lag:** Deploying a new `CareProviderSearchConfig` does not immediately populate `CareProviderSearchableField` rows synchronously during the metadata deployment. Health Cloud runs an asynchronous Provider Search Data Sync batch job ( typically every 6 hours or triggered manually in Setup -> Provider Search Settings) to backfill `targetField`.
- **Formula Field Limitation:** While `sourceField` can be a formula field on `HealthcareProvider`, remember that changes to parent records referenced by a cross-object formula do not automatically trigger the `CareProviderSearchableField` delta sync unless the `HealthcareProvider` or `HealthcarePractitionerFacility` record itself is touched.
