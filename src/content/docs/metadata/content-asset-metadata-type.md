---
title: "ContentAsset Metadata Type for Lightning Asset Files"
description: "Package and deploy Salesforce Files as org setup assets (App logos, Experience Cloud branding, and Rich Text images) using the ContentAsset metadata type."
category: "metadata"
tags:
  - metadata-api
  - files
  - lightning
  - experience-cloud
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "ContentAsset (contentassets/<Name>.asset and .asset-meta.xml) wraps a Salesforce File (ContentDocument / ContentVersion) as deployable metadata for Lightning App logos, Experience Cloud themes, and LWC."
faq:
  - q: "What is the difference between a ContentAsset and a StaticResource?"
    a: "A StaticResource is a developer bundle for JS, CSS, and zip archives accessed via @salesforce/resourceUrl, whereas a ContentAsset wraps a Salesforce File (ContentDocument) so declarative builders like CustomApplication logos, Experience Cloud themes, and Email Templates can use it."
  - q: "What does isVisibleByExternalUsers control on a ContentAsset?"
    a: "When isVisibleByExternalUsers is set to true (API v44.0+), unauthenticated guest users on public Experience Cloud sites and public email recipients can view the asset image without logging in."
  - q: "What is the maximum file size for retrieving or deploying a ContentAsset?"
    a: "Salesforce enforces a 30 MB limit on the total file content size of a ContentAsset during Metadata API retrieve and deploy operations."
  - q: "Can you query ContentAsset records and their underlying ContentDocument using SOQL?"
    a: "Yes. You can query the ContentAsset standard object in SOQL to inspect DeveloperName, MasterLabel, IsVisibleByExternalUsers, ContentDocumentId, and ContentDocument.LatestPublishedVersionId."
related:
  - metadata/static-resource-metadata-type
  - metadata/custom-application-metadata-type
  - metadata/experience-bundle-metadata-type
  - metadata/lightning-component-bundle-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_contentasset.htm
---

## Why the `ContentAsset` Metadata Type Matters

In Salesforce Classic, custom application logos were stored in the legacy `Document` object. In Lightning Experience, standard Salesforce Files (`ContentDocument` / `ContentVersion`) are data records—meaning they cannot be deployed via `package.xml` on their own.

**`ContentAsset`** (`contentassets/<Name>.asset` and `.asset-meta.xml`) bridges Data and Metadata by wrapping a `ContentDocument` into a deployable **Asset File** that can be referenced by:

1. **[`CustomApplication`](/docs/metadata/custom-application-metadata-type/) Logos:** Referenced via `<logo>Acme_Brand_Logo</logo>` in `.app-meta.xml`.
2. **Experience Cloud Branding & Themes:** Company logos, login background images, and tile banners.
3. **Lightning Web Components:** Imported directly via `import MY_ASSET from '@salesforce/contentAssetUrl/Acme_Brand_Logo';`.

```mermaid
flowchart LR
    subgraph SFDX["force-app/main/default/contentassets/"]
        BIN["Acme_Logo.asset<br/>(Binary PNG / SVG File)"]
        META["Acme_Logo.asset-meta.xml<br/>(isVisibleByExternalUsers, relationships)"]
    end

    subgraph CONSUMERS["Platform Consumers"]
        APP["CustomApplication<br/>(&lt;logo&gt;Acme_Logo&lt;/logo&gt;)"]
        EXP["Experience Cloud BrandingSet"]
        LWC["LWC (@salesforce/contentAssetUrl/Acme_Logo)"]
    end

    BIN --> APP
    META --> EXP
    BIN --> LWC
```

---

## Key Metadata Fields on `ContentAsset`

| Field | Type | Required | Description |
|---|---|---|---|
| `masterLabel` | `string` | Yes | Display name of the Asset File in Setup (`Setup → Asset Files`). |
| `language` | `string` | Yes | Locale code of the asset label (e.g., `en_US`). |
| `isVisibleByExternalUsers` | `boolean` | No | *(API v44.0+)* Grants unauthenticated guest users public read access to the asset file. |
| `format` | `ContentAssetFormat` | No | `Original` (single file version, default) or `ZippedVersions` (multiple versions packaged in a zip). |
| `relationships.organization` | `ContentAssetLink` | No | Grants org-wide `VIEWER` access via an automatic `ContentDocumentLink`. |
| `versions.version` | `ContentAssetVersion[]` | Yes | Specifies `<number>1</number>` and `<pathOnClient>filename.ext</pathOnClient>`. |

---

## Real-World XML Example (`contentassets/Acme_Console_Logo.asset-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ContentAsset xmlns="http://soap.sforce.com/2006/04/metadata">
    <isVisibleByExternalUsers>true</isVisibleByExternalUsers>
    <language>en_US</language>
    <masterLabel>Acme Console Logo</masterLabel>
    <relationships>
        <organization>
            <access>VIEWER</access>
        </organization>
    </relationships>
    <versions>
        <version>
            <number>1</number>
            <pathOnClient>acme-console-logo.png</pathOnClient>
        </version>
    </versions>
</ContentAsset>
```

---

## Querying `ContentAsset` via SOQL

You can query `ContentAsset` in standard SOQL and traverse directly to its backing `ContentDocument`:

```sql
SELECT Id, DeveloperName, MasterLabel, IsVisibleByExternalUsers,
       ContentDocumentId, ContentDocument.Title,
       ContentDocument.FileExtension, ContentDocument.ContentSize
FROM ContentAsset
WHERE NamespacePrefix = null
ORDER BY DeveloperName ASC
```

---

## Senior Architect Best Practices

> [!WARNING]
> **Include `ContentAsset` When Deploying a `CustomApplication`:** If you customize the logo of a Lightning App in App Manager, Salesforce adds `<logo>My_App_Logo</logo>` to the `CustomApplication` XML and creates a `ContentAsset` in `contentassets/`. Deploying the `CustomApplication` without including the `ContentAsset` in your commit will fail with `In field: logo - no ContentAsset named My_App_Logo found`!
