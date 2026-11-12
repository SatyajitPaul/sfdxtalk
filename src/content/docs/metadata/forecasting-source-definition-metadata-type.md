---
title: "ForecastingSourceDefinition in SFDX"
description: "Configure ForecastingSourceDefinition in Salesforce DX to connect custom objects or standard opportunities into Collaborative Forecast aggregation engines."
category: "metadata"
tags:
  - metadata
  - forecasting
  - sales-cloud
  - data-modeling
  - devops
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ForecastingSourceDefinition establishes the source entity, aggregation measures, and date fields that serve as the calculation basis for forecasting types."
faq:
  - q: "What source objects are supported by ForecastingSourceDefinition?"
    a: "Standard Opportunity, OpportunityLineItem, and OpportunitySplit objects are supported, as well as qualified custom objects with numeric and date fields."
  - q: "Why is the measureField important in ForecastingSourceDefinition?"
    a: "The measureField designates the numeric or currency field, such as Amount or TotalPrice, that the forecasting engine aggregates across the pipeline."
  - q: "How do scratch org definitions handle ForecastingSourceDefinition?"
    a: "Scratch orgs must have Collaborative Forecasts enabled in features or settings before custom ForecastingSourceDefinition files can be deployed."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-forecastingsourcedefinition.md"
---

## Architectural Overview

`ForecastingSourceDefinition` is a foundational metadata type within Salesforce Collaborative Forecasts that defines the underlying database entity and numerical aggregations feeding revenue projections. Historically, Salesforce forecasting was restricted strictly to the standard `Opportunity` object. In modern Sales Cloud architectures, however, enterprises can forecast on standard opportunity splits, product line items, and custom objects (such as renewable contracts, project milestone billings, or consumption commitments).

`ForecastingSourceDefinition` decouples the mathematical aggregation mechanics from the visual forecast presentation. By declaring the source object, target quantitative measure, date dimension, and user assignment relationship, architects establish a reusable calculation contract that feeds multiple downstream forecast models.

```mermaid
flowchart LR
    A["Source Table: Project_Milestone__c"] --> B["ForecastingSourceDefinition"]
    B -->|"measureField: Billings__c"| C["Aggregation Engine"]
    B -->|"dateField: Estimated_Completion__c"| C
    C --> D["ForecastingType: Professional Services Forecast"]
    C --> E["Executive Revenue Rollups"]
```

## Directory and File Conventions

In Salesforce DX source format (`apiVersion` 68.0), `ForecastingSourceDefinition` components are located in the `forecastingSourceDefinitions/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `ForecastingSourceDefinition` |
| **SFDX Folder** | `force-app/main/default/forecastingSourceDefinitions/` |
| **File Suffix** | `.forecastingSourceDefinition-meta.xml` |
| **XML Root Element** | `<ForecastingSourceDefinition xmlns="http://soap.sforce.com/2006/04/metadata">` |

## Key Metadata Fields

The XML schema defines the source entity, quantitative calculation metrics, and chronological fields:

| Field Name | Field Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable label displayed in Sales Cloud setup menus. |
| `developerName` | `string` | Yes | Unique programmatic identifier utilized across forecasting configurations. |
| `sourceObject` | `string` | Yes | API name of the source entity (e.g., `Opportunity`, `OpportunitySplit`, or `Custom_Invoice__c`). |
| `measureField` | `string` | Yes | Numeric or currency field aggregated across pipeline records (e.g., `Amount`, `TotalPrice`). |
| `dateField` | `string` | Yes | Date or DateTime field determining the forecast period allocation (e.g., `CloseDate`). |
| `userField` | `string` | Yes | Lookup field to `User` establishing ownership for role hierarchy rollups. |

> [!NOTE]
> When defining a source definition on a custom object, the source entity must have an indexed relationship to the `User` object to support management hierarchy rollups.

## Declarative XML and Package Manifest Examples

Below is a declarative `ForecastingSourceDefinition` mapping opportunity product schedule billings:

```xml title="force-app/main/default/forecastingSourceDefinitions/Opportunity_Product_Revenue.forecastingSourceDefinition-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ForecastingSourceDefinition xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Opportunity_Product_Revenue</developerName>
    <masterLabel>Opportunity Product Revenue</masterLabel>
    <sourceObject>OpportunityLineItem</sourceObject>
    <measureField>TotalPrice</measureField>
    <dateField>ServiceDate</dateField>
    <userField>Opportunity.OwnerId</userField>
</ForecastingSourceDefinition>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Opportunity_Product_Revenue</members>
        <name>ForecastingSourceDefinition</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `ForecastingSourceDefinition` components via the Salesforce CLI:

```bash
# Retrieve all forecasting source definitions
sf project retrieve start --metadata ForecastingSourceDefinition

# Deploy a specific source definition to the integration sandbox
sf project deploy start --metadata ForecastingSourceDefinition:Opportunity_Product_Revenue
```

## Architect Best Practices and Gotchas

- **Schema Precedence:** Ensure that the underlying `sourceObject` (such as a [CustomObject](/docs/metadata/custom-object-metadata-type/)) and target measure [CustomField](/docs/metadata/custom-field-metadata-type/) are deployed before deploying the source definition.
- **Date Dimension Consistency:** The designated `dateField` governs how pipeline items fall into monthly or quarterly forecast buckets. Never change the `dateField` on an active source definition without executing historical pipeline reconciliations.
- **Scratch Org Prerequisites:** Collaborative Forecasts must be enabled via `ForecastingSettings` in your scratch org definition prior to pushing source definition files.

> [!TIP]
> Use standard `OpportunityLineItem` or `OpportunitySplit` source definitions when sales models require split quotas across overlay specialists and territory account executives.
