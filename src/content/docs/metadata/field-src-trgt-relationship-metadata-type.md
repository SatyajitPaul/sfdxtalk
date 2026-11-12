---
title: "FieldSrcTrgtRelationship Metadata Reference"
description: "Configure FieldSrcTrgtRelationship metadata in Salesforce to establish deterministic field-level mapping rules and relational data integrity pipelines."
category: "metadata"
tags:
  - metadata
  - field-mapping
  - data-pipelines
  - integrations
  - schema
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "FieldSrcTrgtRelationship metadata defines explicit field-level source-to-target relationships, transformation operators, and directional mappings for data pipelines."
faq:
  - q: "What is the role of FieldSrcTrgtRelationship metadata in Salesforce?"
    a: "FieldSrcTrgtRelationship defines explicit relational links between source and target fields in automated data mapping engines and pipelines."
  - q: "How does FieldSrcTrgtRelationship ensure data integrity during transformations?"
    a: "It enforces data type compatibility and validates conversion logic between source and target fields prior to executing batch data pipelines."
  - q: "Where is FieldSrcTrgtRelationship metadata stored in source format?"
    a: "It is stored in the fieldSrcTrgtRelationships directory using the fieldSrcTrgtRelationship-meta.xml file extension."
  - q: "How do you deploy FieldSrcTrgtRelationship across environments?"
    a: "Deploy using sf project deploy start with metadata FieldSrcTrgtRelationship after the target custom fields and objects have been provisioned."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-fieldsrctrgtrelationship.md"
---

## Architectural Overview

`FieldSrcTrgtRelationship` represents explicit, granular field-to-field relationship links within the Salesforce data transformation architecture. While higher-level metadata types like `FieldMappingConfig` define entity-level mappings between source and target schemas, `FieldSrcTrgtRelationship` establishes the granular relational semantics for individual fields.

In high-throughput enterprise pipelines—such as streaming external customer interactions into Data Cloud, executing automated financial ledger reconciliations, or handling master data management (MDM) synchronizations—field transformations require unambiguous specifications. `FieldSrcTrgtRelationship` specifies source field API identifiers, destination field API identifiers, transformation expressions, and foreign key reference resolution rules.

```mermaid
flowchart LR
    A["Source Field (e.g. Inbound_Amount__c)"] --> B["FieldSrcTrgtRelationship"]
    B --> C["Transformation Expression / Rounding"]
    C --> D["Target Field (e.g. TotalPrice)"]
    D --> E["Relational Referential Integrity Verified"]
```

Maintaining these relationships as version-controlled metadata enables enterprise architects to review and automate data lineage tracking, preventing breaking schema shifts across integration releases.

## Directory and File Conventions

`FieldSrcTrgtRelationship` metadata files reside within the `fieldSrcTrgtRelationships` folder:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `FieldSrcTrgtRelationship` |
| **SFDX Folder** | `force-app/main/default/fieldSrcTrgtRelationships/` |
| **File Suffix** | `.fieldSrcTrgtRelationship-meta.xml` |
| **API Version** | 68.0 |

## Key Metadata Fields

The `FieldSrcTrgtRelationship` schema defines field-to-field binding parameters:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `developerName` | `string` | Yes | Unique programmatic identifier for the relationship definition. |
| `masterLabel` | `string` | Yes | Human-readable label displayed in mapping interfaces. |
| `sourceField` | `string` | Yes | API name of the source field on the originating entity. |
| `targetField` | `string` | Yes | API name of the target field on the destination entity. |
| `relationshipType` | `string` | No | Relational cardinality: `Direct`, `LookupReference`, or `ExpressionTransformed`. |
| `transformationLogic` | `string` | No | Expression or formula applied during transformation (e.g., date formatting, math operations). |

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition of `FieldSrcTrgtRelationship` mapping an external ledger transaction identifier to a core Salesforce billing record:

```xml title="force-app/main/default/fieldSrcTrgtRelationships/Txn_Id_To_Billing_Ref.fieldSrcTrgtRelationship-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<FieldSrcTrgtRelationship xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Txn_Id_To_Billing_Ref</developerName>
    <masterLabel>Transaction ID to Billing Reference</masterLabel>
    <relationshipType>Direct</relationshipType>
    <sourceField>External_Transaction_ID__c</sourceField>
    <targetField>Billing_Reference_Number__c</targetField>
</FieldSrcTrgtRelationship>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Txn_Id_To_Billing_Ref</members>
        <name>FieldSrcTrgtRelationship</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `FieldSrcTrgtRelationship` metadata using the Salesforce CLI:

```bash
# Retrieve a specific field relationship definition
sf project retrieve start --metadata FieldSrcTrgtRelationship:Txn_Id_To_Billing_Ref

# Deploy all field source-target relationships
sf project deploy start --metadata FieldSrcTrgtRelationship

# Validate relationship metadata in target environment
sf project deploy start --metadata FieldSrcTrgtRelationship --dry-run
```

## Architect Best Practices and Gotchas

- **Strict Type Validation:** Salesforce validates type compatibility at deployment time. Attempting to bind a source Picklist field to a target Boolean field without a transformation formula will trigger deployment errors.
- **Deployment Wave Sequencing:** Deploy underlying Custom Objects and Custom Fields before deploying `FieldSrcTrgtRelationship` components. Any missing field reference will abort the deployment transaction.
- **Reference Integrity on Lookups:** When mapping foreign key reference fields, ensure the external identifiers used in source systems are indexed and configured as External ID fields in the target Salesforce schema.

> [!TIP]
> Use explicit `Direct` relationship mappings where possible to minimize runtime processing overhead during high-volume ETL synchronizations.

> [!WARNING]
> Renaming either the source or target custom field in a subsequent sprint requires refactoring all associated `FieldSrcTrgtRelationship` files concurrently.
