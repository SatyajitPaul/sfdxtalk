---
title: "CatalogedApiVersion Metadata Type in SFDX"
description: "Manage and deploy CatalogedApiVersion metadata in Salesforce API Catalog to control semantic API versions, lifecycle states, and External Services."
category: "metadata"
tags:
  - metadata
  - api-catalog
  - mulesoft
  - openapi
  - package-xml
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "CatalogedApiVersion defines a specific version of a CatalogedApi in the Salesforce API Catalog, linking the parent API asset to its specification artifacts and downstream External Service registrations."
faq:
  - q: "What is the relationship between CatalogedApi and CatalogedApiVersion?"
    a: "CatalogedApi represents the top-level API entry in the Salesforce API Catalog, while CatalogedApiVersion represents a specific semantic version (such as v1 or v2) of that API."
  - q: "Why should architects maintain multiple CatalogedApiVersion records?"
    a: "Maintaining separate CatalogedApiVersion records allows existing Flows and Agentforce actions to continue calling v1 of an external API while new automations are built and tested against v2."
  - q: "Where are CatalogedApiVersion files stored in an SFDX project?"
    a: "They are stored in force-app/main/default/catalogedApiVersions/ with the file extension .catalogedApiVersion-meta.xml."
  - q: "What happens if the parent CatalogedApi is missing during deployment?"
    a: "Deploying a CatalogedApiVersion without its referenced parent CatalogedApi in the target org or deployment manifest fails with a missing dependency error."
related:
  - metadata/flow-metadata-type
  - metadata/apex-class-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-catalogedapiversion.md"
---

## Architectural Overview

Enterprise APIs evolve through major and minor versions (`v1`, `v2`) as request payloads and endpoints change. Within the Salesforce API Catalog, the `CatalogedApiVersion` metadata type represents a specific version of a parent `CatalogedApi` asset.

Architecturally, `CatalogedApiVersion` acts as the bridge between the high-level API catalog entry (`CatalogedApi`), its underlying OpenAPI or RAML specification artifact (`CatalogedApiArtifactVersionInfo`), and the generated Salesforce `ExternalServiceRegistration` that exposes invocable actions to [Flow](/docs/metadata/flow-metadata-type/), [ApexClass](/docs/metadata/apex-class-metadata-type/), and Agentforce.

```mermaid
flowchart LR
    A["CatalogedApi (ERP_Order_Status_API)"] --> B["CatalogedApiVersion (v1.0)"]
    A --> C["CatalogedApiVersion (v2.0)"]
    B --> D["CatalogedApiArtifactVersionInfo (1.0.2)"]
    C --> E["CatalogedApiArtifactVersionInfo (2.0.0)"]
    C --> F["Active ExternalServiceRegistration"]
```

## Directory Location and File Suffix

In Salesforce DX source format, `CatalogedApiVersion` components are stored in the `catalogedApiVersions` directory.

| Property | Value |
| :--- | :--- |
| **Directory Path (SFDX)** | `force-app/main/default/catalogedApiVersions/` |
| **File Suffix (SFDX)** | `.catalogedApiVersion-meta.xml` |
| **Classic Metadata Suffix** | `.catalogedApiVersion` |
| **Metadata Type Name** | `CatalogedApiVersion` |

## Key Metadata Fields

The following table lists the key fields on `CatalogedApiVersion` as of API version `68.0` (Winter '27):

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | The display label of the API version shown in the Salesforce API Catalog. |
| `catalogedApi` | `string` | Yes | The developer name of the parent `CatalogedApi` record to which this version belongs. |
| `apiVersion` | `string` | Yes | The semantic or major version identifier of the API (for example, `v1` or `1.0.0`). |
| `status` | `string` | No | The lifecycle state of the API version in the catalog, such as `Active` or `Deprecated`. |
| `description` | `string` | No | Release notes or architectural description of the changes introduced in this API version. |

## Declarative Metadata Example

The following example defines version `v1` of the `ERP_Order_Status_API` cataloged API:

```xml title="force-app/main/default/catalogedApiVersions/ERP_Order_Status_API_v1.catalogedApiVersion-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<CatalogedApiVersion xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>v1</apiVersion>
    <catalogedApi>ERP_Order_Status_API</catalogedApi>
    <description>Initial production version of the ERP Order Status REST API supporting order lookup by number.</description>
    <masterLabel>ERP Order Status System API v1</masterLabel>
    <status>Active</status>
</CatalogedApiVersion>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>ERP_Order_Status_API</members>
        <name>CatalogedApi</name>
    </types>
    <types>
        <members>ERP_Order_Status_API_v1</members>
        <name>CatalogedApiVersion</name>
    </types>
    <version>68.0</version>
</Package>
```

## Tooling API Queries and SFDX CLI Commands

Use the Salesforce CLI (`sf`) to retrieve and deploy `CatalogedApiVersion` metadata:

```bash
# Retrieve all CatalogedApiVersion components
sf project retrieve start --metadata CatalogedApiVersion

# Deploy a specific CatalogedApiVersion alongside its parent CatalogedApi
sf project deploy start --metadata CatalogedApi:ERP_Order_Status_API,CatalogedApiVersion:ERP_Order_Status_API_v1
```

You can also query `CatalogedApiVersion` via the Tooling API (`sf data query --use-tooling-api`):

```soql
SELECT Id, DeveloperName, MasterLabel, ApiVersion, Status
FROM CatalogedApiVersion
ORDER BY DeveloperName ASC
```

## Architect Best Practices and Gotchas

> [!TIP]
> When introducing a breaking change to an external API, register a new `CatalogedApiVersion` (for example, `ERP_Order_Status_API_v2`) rather than overwriting `v1` in-place. This allows you to migrate [Flow](/docs/metadata/flow-metadata-type/) actions incrementally without breaking active transactions.

- **Parent-Child Deployment Integrity:** Always include the parent `CatalogedApi` and child `CatalogedApiArtifactVersionInfo` in the same deployment package when promoting a new `CatalogedApiVersion` across sandboxes.
- **Lifecycle Hygiene:** Mark older `CatalogedApiVersion` entries as deprecated once all dependent Flows and Apex classes have been cut over to the new version, before attempting destructive removal.
