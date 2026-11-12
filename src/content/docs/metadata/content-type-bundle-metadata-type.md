---
title: "ContentTypeBundle Metadata Type in SFDX"
description: "Author and deploy ContentTypeBundle metadata in SFDX to define custom Salesforce CMS content types, JSON schemas, and structured digital experiences."
category: "metadata"
tags:
  - metadata
  - salesforce-cms
  - experience-cloud
  - content-types
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ContentTypeBundle defines custom Salesforce CMS content types as a metadata bundle containing a schema.json file and a .contentTypeBundle-meta.xml descriptor, enabling structured headless and Experience Cloud content authoring."
faq:
  - q: "What is a ContentTypeBundle in Salesforce CMS?"
    a: "ContentTypeBundle is a bundle-based Metadata API type that defines the field structure and validation rules of a custom content type in Salesforce CMS, Beyond standard News, Image, and Document types."
  - q: "What files make up a ContentTypeBundle directory in SFDX?"
    a: "Each ContentTypeBundle folder inside force-app/main/default/contentTypeBundles/ contains a .contentTypeBundle-meta.xml descriptor file and a schema.json file defining the CMS content nodes."
  - q: "How many custom CMS content types can an org have?"
    a: "An org can define up to 100 custom CMS content types across classic and enhanced CMS workspaces, with up to 15 nodes (fields) per custom content type."
  - q: "Can you delete or change the data type of a node in an existing ContentTypeBundle?"
    a: "Once managed content records exist for a ContentTypeBundle, you cannot change the nodeType of an existing node or remove required nodes without first archiving and deleting the dependent CMS content."
related:
  - metadata/experience-bundle-metadata-type
  - metadata/content-asset-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-contenttypebundle.md"
---

## Architectural Overview

Salesforce CMS powers headless digital experiences, Commerce Cloud storefronts, Marketing Cloud emails, and Experience Cloud portals. Out of the box, Salesforce CMS provides only basic content types (`cms_document`, `cms_image`, `news`). When enterprise content authors need structured domain models—such as **Product Announcements**, **Executive Bios**, **Clinical Trial Summaries**, or **Promotional Banners**—architects define custom CMS schemas using `ContentTypeBundle`.

Unlike flat XML metadata types, `ContentTypeBundle` is a **bundle metadata type** (similar to `LightningComponentBundle` or `ExperienceBundle`). It pairs an XML metadata descriptor (`<DeveloperName>.contentTypeBundle-meta.xml`) with a JSON schema definition (`schema.json`) that specifies each field's `nodeName`, `nodeType` (`TEXT`, `MTEXT`, `RTE`, `IMG`, `URL`, `DATE`, `DATETIME`, `NAMEFIELD`), and cardinality constraints.

```mermaid
flowchart LR
    A["contentTypeBundles/ProductPromo/"] --> B["ProductPromo.contentTypeBundle-meta.xml"]
    A --> C["schema.json (CMS Field Nodes)"]
    C --> D["Headline (NAMEFIELD)"]
    C --> E["HeroImage (IMG)"]
    C --> F["BodyCopy (RTE)"]
    C --> G["CTA_Url (URL)"]
    B --> H["Salesforce CMS Workspace & Experience Cloud"]
```

## SFDX Directory and File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `ContentTypeBundle` |
| **SFDX Source Directory** | `force-app/main/default/contentTypeBundles/<BundleName>/` |
| **XML Descriptor File** | `<BundleName>.contentTypeBundle-meta.xml` |
| **Schema Definition File** | `schema.json` |

## Key Metadata Fields

The XML descriptor defines bundle-level metadata, while `schema.json` defines the typed content nodes.

### `<BundleName>.contentTypeBundle-meta.xml` Fields

| Field Name | Type | Required | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| `description` | `string` | No | Explains the purpose and target channel of the custom CMS content type. |
| `masterLabel` | `string` | Yes | The label displayed to content authors when clicking **Add Content** in a Salesforce CMS workspace. |

### `schema.json` Node Properties

| Property Name | Type | Required | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| `nodeName` | `string` | Yes | Unique API identifier for the CMS field node (alphanumeric and underscores, max 80 chars). |
| `nodeLabel` | `string` | Yes | Author-facing field label in the Salesforce CMS editor UI. |
| `nodeType` | `string` | Yes | Field data type: `NAMEFIELD` (exactly one required per type), `TEXT`, `MTEXT` (multiline text), `RTE` (rich text), `IMG` (CMS image reference), `URL`, `DATE`, or `DATETIME`. |
| `required` | `boolean` | No | Whether content authors must populate this field before publishing the CMS item. |
| `placeholderText` | `string` | No | Instructional placeholder text inside the CMS input control. |
| `helpText` | `string` | No | Tooltip guidance shown next to the field label in the CMS authoring editor. |

## Declarative Bundle Example

A complete `ContentTypeBundle` named `Product_Launch_Banner` requires two files inside `force-app/main/default/contentTypeBundles/Product_Launch_Banner/`:

### 1. Metadata XML Descriptor
```xml title="force-app/main/default/contentTypeBundles/Product_Launch_Banner/Product_Launch_Banner.contentTypeBundle-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ContentTypeBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Structured promotional banner with hero image, rich text body, and call-to-action link for Commerce and Experience Cloud sites.</description>
    <masterLabel>Product Launch Banner</masterLabel>
</ContentTypeBundle>
```

### 2. CMS Node Definition (`schema.json`)
```json title="force-app/main/default/contentTypeBundles/Product_Launch_Banner/schema.json"
{
  "contentType": {
    "developerName": "Product_Launch_Banner",
    "masterLabel": "Product Launch Banner",
    "description": "Structured promotional banner for Commerce and Experience Cloud.",
    "nodes": [
      {
        "nodeName": "BannerTitle",
        "nodeLabel": "Banner Headline",
        "nodeType": "NAMEFIELD",
        "required": true,
        "placeholderText": "Enter the primary campaign headline"
      },
      {
        "nodeName": "SubtitleText",
        "nodeLabel": "Subtitle Summary",
        "nodeType": "MTEXT",
        "required": false,
        "helpText": "Short summary displayed beneath the headline (under 200 characters)."
      },
      {
        "nodeName": "HeroBackground",
        "nodeLabel": "Hero Background Image",
        "nodeType": "IMG",
        "required": true
      },
      {
        "nodeName": "PromoDetails",
        "nodeLabel": "Promotional Body Copy",
        "nodeType": "RTE",
        "required": false
      },
      {
        "nodeName": "CallToActionUrl",
        "nodeLabel": "Call to Action URL",
        "nodeType": "URL",
        "required": true,
        "placeholderText": "https://www.example.com/products/new"
      },
      {
        "nodeName": "EmbargoReleaseDate",
        "nodeLabel": "Embargo Release Date",
        "nodeType": "DATETIME",
        "required": false
      }
    ]
  }
}
```

### `package.xml` Manifest

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Product_Launch_Banner</members>
        <name>ContentTypeBundle</name>
    </types>
    <version>68.0</version>
</Package>
```

## Querying via Tooling API and SFDX CLI

You can inspect deployed custom content types via the Tooling API `ManagedContentType` object or retrieve the bundle files using the `sf` CLI.

### 1. Query Deployed Custom CMS Content Types via Tooling API
```soql
SELECT Id, DeveloperName, MasterLabel, Description, ManageableState, CreatedDate
FROM ManagedContentType
ORDER BY DeveloperName ASC
```

### 2. SFDX CLI Retrieve and Deploy Commands
```bash
# Retrieve a specific ContentTypeBundle
sf project retrieve start --metadata ContentTypeBundle:Product_Launch_Banner

# Deploy the ContentTypeBundle directory to a target org
sf project deploy start --source-dir force-app/main/default/contentTypeBundles/Product_Launch_Banner
```

## Architect Best Practices and Gotchas

> [!WARNING]
> **Schema Immutability Once Content Exists:** Treat `ContentTypeBundle` node definitions like published database columns. Once CMS authors create `ManagedContent` records using `Product_Launch_Banner`, Salesforce blocks deployments that attempt to change a node's `nodeType`, delete an existing node, or flip `required` from `false` to `true`.

- **Exactly One `NAMEFIELD` Node Required:** Every `schema.json` file must include **exactly one** node with `"nodeType": "NAMEFIELD"` and `"required": true`. Omitting `NAMEFIELD` or defining two `NAMEFIELD` nodes fails deployment immediately.
- **15-Node Governor Limit:** A custom `ContentTypeBundle` supports at most **15 nodes** per content type and **100 custom content types** per org. Design cohesive, channel-agnostic content models rather than bloated 40-field schemas.

> [!TIP]
> After deploying a `ContentTypeBundle`, map its fields to Experience Builder repeater/collection components or retrieve published items headlessly via the Connect REST API (`/connect/cms/delivery/channels/<channelId>/contents/query?contentTypeFQN=Product_Launch_Banner`).
