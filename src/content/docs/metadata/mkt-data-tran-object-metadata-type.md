---
title: "MktDataTranObject in Salesforce Data Cloud"
description: "Master MktDataTranObject metadata in Salesforce Data Cloud to model data transport schemas, connectors, and landing layers from external source streams."
category: "metadata"
tags:
  - metadata
  - data-cloud
  - ingestion
  - data-streams
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "MktDataTranObject defines data transport objects in Data Cloud, structuring the incoming schema wrapper between external connectors and Data Lake Objects."
faq:
  - q: "What role does MktDataTranObject play in Data Cloud?"
    a: "It defines the data transport schema wrapper for incoming data streams from external connectors like Amazon S3, Google Cloud, or CRM connectors."
  - q: "Where are MktDataTranObject files stored in SFDX format?"
    a: "They are located in force-app/main/default/mktDataTranObjects/ with the .mktDataTranObject-meta.xml file suffix."
  - q: "What are the common object categories for transport objects?"
    a: "Valid categories include Profile, Engagement, and Other, classifying how incoming stream records relate to customer identity and time-series events."
  - q: "Can MktDataTranObject be deployed using package.xml?"
    a: "Yes, include the MktDataTranObject metadata type in package.xml, and optionally use the asterisk wildcard for full directory deployment."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/connected-app-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-mktdatatranobject.md"
---

## Architectural Overview

In the data ingestion architecture of Salesforce Data Cloud, `MktDataTranObject` (Market Data Transport Object) represents the intermediate schema specification that receives raw data from an external source connector before it lands in a Data Lake Object (DLO). Whether ingesting clickstream events from Amazon S3, customer profiles from Google Cloud Storage, or enterprise ERP tables via MuleSoft, Data Cloud relies on transport objects to structure raw inbound files.

Managing `MktDataTranObject` metadata in version control ensures that field types, primary keys, and data categories (`Profile`, `Engagement`, `Other`) remain deterministic across multi-tenant environments. Automated pipelines deploy these definitions alongside `DataStreamDefinition` and `mktDataLakeObject` records to instantiate automated data pipelines seamlessly.

```mermaid
flowchart LR
    A["External Data Source: S3, GCS, MuleSoft"] --> B["Data Cloud Ingestion Connector"]
    B --> C["MktDataTranObject (Transport Schema)"]
    C --> D["Data Lake Object (DLO Landing Layer)"]
    D --> E["Data Model Object (DMO Unified Model)"]
```

## Directory and File Conventions

`MktDataTranObject` components reside within the `mktDataTranObjects` directory in the standard SFDX source layout.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `MktDataTranObject` |
| **SFDX Directory** | `force-app/main/default/mktDataTranObjects/` |
| **File Suffix** | `.mktDataTranObject-meta.xml` |
| **Manifest Member Name** | `<DeveloperName>` or `*` |
| **Wildcard Support** | Supported |

## Key Metadata Fields

The `MktDataTranObject` XML schema contains key attributes establishing the connector relationship and schema categorization:

| Field Name | Field Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `connector` | `string` | Yes | The technical identifier of the Data Cloud connector providing the inbound stream. |
| `dataSource` | `string` | Yes | Identifier specifying the origin data source (e.g., external ERP or CRM instance). |
| `dataSourceObject` | `string` | Yes | The source object or file name from where data originates (e.g., `ecommerce_orders`). |
| `masterLabel` | `string` | Yes | The UI label identifying the data transport object. |
| `objectCategory` | `string` | Yes | Classification category. Valid values: `Profile`, `Engagement`, or `Other`. |
| `creationType` | `string` | Yes | Origin indicator, such as `Custom` or `Standard`. |

> [!NOTE]
> `MktDataTranObject` works in conjunction with child field definitions that declare column types, date formatting patterns, and primary key designations for the incoming stream.

## Declarative XML and Package Manifest Examples

The following example defines an `MktDataTranObject` for ingesting e-commerce customer transactions from an external cloud storage bucket:

```xml title="force-app/main/default/mktDataTranObjects/Ecommerce_Transactions.mktDataTranObject-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<MktDataTranObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>Ecommerce Transactions</masterLabel>
    <connector>AmazonS3Connector</connector>
    <dataSource>CloudEcommerceStore</dataSource>
    <dataSourceObject>orders_daily_feed</dataSourceObject>
    <objectCategory>Engagement</objectCategory>
    <creationType>Custom</creationType>
</MktDataTranObject>
```

### Package Manifest (`package.xml`)

Include `MktDataTranObject` in your deployment manifest:

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>MktDataTranObject</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `MktDataTranObject` metadata with the Salesforce CLI:

```bash
# Retrieve all transport objects
sf project retrieve start --metadata MktDataTranObject

# Deploy a specific transport object definition
sf project deploy start --metadata MktDataTranObject:Ecommerce_Transactions

# Query existing transport objects via Tooling API
sf data query --use-tooling-api --query "SELECT Id, DeveloperName, MasterLabel, ObjectCategory FROM MktDataTranObject"
```

## Architect Best Practices and Gotchas

- **Connector Provisioning:** A transport object references an underlying connector (`connector`). The associated connector credentials (e.g., Amazon S3 bucket ARN or Google Cloud credentials) must be provisioned in the target org before deploying the metadata.
- **Category Alignment:** Select `objectCategory` carefully. Setting `Engagement` implies time-series data with mandatory event timestamp fields, whereas `Profile` objects expect unique entity keys for identity resolution.
- **Pipeline Synchronization:** When orchestrating Data Cloud deployments, deploy `MktDataTranObject` before `DataStreamDefinition` components that reference it as their landing target.

> [!TIP]
> Group `MktDataTranObject` files alongside their related `mktDataLakeObject` descriptors in a modular package directory (e.g., `data-cloud-streams/`) to facilitate isolated testing.
