---
title: "ForecastingTypeSource in SFDX"
description: "Configure ForecastingTypeSource metadata in Salesforce DX to bind forecast types to source definitions, manage calculations, and orchestrate deployments."
category: "metadata"
tags:
  - metadata
  - forecasting
  - sales-cloud
  - devops
  - salesforce-dx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ForecastingTypeSource acts as the architectural bridge connecting a ForecastingType to its underlying ForecastingSourceDefinition aggregation rules."
faq:
  - q: "What is the architectural purpose of ForecastingTypeSource?"
    a: "It establishes the relational junction binding an active forecast model to the specific object measures and date boundaries defined in source definitions."
  - q: "What dependency errors arise if source definitions are missing during deployment?"
    a: "The deployment fails with unresolved reference errors because ForecastingTypeSource cannot bind to an uncommitted or missing source definition."
  - q: "Can multiple source definitions feed into a single forecasting type?"
    a: "Advanced multi-source forecast models can link multiple source definitions through sequential type sources to aggregate combined revenue streams."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-forecastingtypesource.md"
---

## Architectural Overview

`ForecastingTypeSource` serves as the explicit metadata junction that binds a `ForecastingType` model to its corresponding `ForecastingSourceDefinition`. In advanced Collaborative Forecast implementations, separating the forecast display model from the underlying source mapping creates immense architectural flexibility. For instance, an organization may define a single standardized forecast model for "Core Revenue" but bind it to different source objects across multiple business units or product lines.

In continuous integration and release engineering pipelines, `ForecastingTypeSource` ensures that the relationship between data collection and forecast presentation remains deterministic and version-controlled. By managing this association declaratively in SFDX, enterprise architects avoid manual configuration errors when migrating complex revenue configurations from developer sandboxes to production.

```mermaid
flowchart LR
    A["ForecastingType: North_America_Revenue"] --> B["ForecastingTypeSource (Junction)"]
    B --> C["ForecastingSourceDefinition: Opportunity_Core_Revenue"]
    C --> D["Underlying Opportunity Database Records"]
```

## Directory and File Conventions

In Salesforce DX source format (`apiVersion` 68.0), `ForecastingTypeSource` metadata resides in the `forecastingTypeSources/` directory or as a child structure of `forecastingTypes/`.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `ForecastingTypeSource` |
| **SFDX Folder** | `force-app/main/default/forecastingTypeSources/` |
| **File Suffix** | `.forecastingTypeSource-meta.xml` |
| **XML Root Element** | `<ForecastingTypeSource xmlns="http://soap.sforce.com/2006/04/metadata">` |

## Key Metadata Fields

The `ForecastingTypeSource` metadata definition captures junction references, evaluation sequences, and primary indicators:

| Field Name | Field Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `forecastingType` | `string` | Yes | Developer name of the associated parent `ForecastingType`. |
| `forecastingSourceDefinition` | `string` | Yes | Developer name of the target `ForecastingSourceDefinition` containing calculation rules. |
| `sourceOrder` | `integer` | No | Numeric sequence indicator for multi-source forecast models. |
| `isPrimary` | `boolean` | No | Indicates whether this source definition represents the primary data origin for the forecast. |

> [!NOTE]
> Both the referenced `ForecastingType` and `ForecastingSourceDefinition` must exist in the target environment or be included in the same deployment manifest.

## Declarative XML and Package Manifest Examples

Below is a declarative `ForecastingTypeSource` linking a subscription forecast type to its underlying revenue source definition:

```xml title="force-app/main/default/forecastingTypeSources/SaaS_Revenue_Mapping.forecastingTypeSource-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ForecastingTypeSource xmlns="http://soap.sforce.com/2006/04/metadata">
    <forecastingType>SaaS_Subscription_Forecast</forecastingType>
    <forecastingSourceDefinition>Opportunity_SaaS_Source</forecastingSourceDefinition>
    <sourceOrder>1</sourceOrder>
    <isPrimary>true</isPrimary>
</ForecastingTypeSource>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>SaaS_Revenue_Mapping</members>
        <name>ForecastingTypeSource</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `ForecastingTypeSource` components via modern Salesforce CLI commands:

```bash
# Retrieve all forecasting type sources from your org
sf project retrieve start --metadata ForecastingTypeSource

# Deploy the junction mapping along with its related forecast type
sf project deploy start --metadata ForecastingTypeSource:SaaS_Revenue_Mapping --metadata ForecastingType:SaaS_Subscription_Forecast
```

## Architect Best Practices and Gotchas

- **Deployment Graph Sequencing:** In multi-package repositories, structure dependencies so that `ForecastingSourceDefinition` and `ForecastingType` are deployed concurrently or in advance of `ForecastingTypeSource`.
- **Primary Source Cardinality:** Ensure exactly one source definition is flagged with `<isPrimary>true</isPrimary>` for each `ForecastingType` to prevent ambiguity in rollup summaries.
- **Custom Object Schema Integrity:** If the underlying source definition queries a [CustomObject](/docs/metadata/custom-object-metadata-type/), verify that the custom object and all referenced fields exist in the target org before deploying this junction.

> [!TIP]
> Use `ForecastingTypeSource` to consolidate subsidiary acquisitions onto standard corporate forecast models without altering the acquired unit's distinct opportunity schemas.
