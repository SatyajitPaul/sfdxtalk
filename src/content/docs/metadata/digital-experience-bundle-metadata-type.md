---
title: "DigitalExperienceBundle Metadata Type Reference"
description: "Configure and deploy DigitalExperienceBundle (.digitalExperience-meta.xml) metadata for Enhanced LWR Experience Cloud sites and Salesforce CMS workspaces."
category: metadata
tags:
  - metadata-api
  - experience-cloud
  - lwr
  - cms
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: advanced
tldr: "DigitalExperienceBundle (.digitalExperience-meta.xml) represents an Enhanced LWR Experience Cloud site or Salesforce CMS/Marketing workspace organized into sfdc_cms__* content items (views, routes, themes, brandingSets) with content.json and _meta.json files."
faq:
  - q: "When do I use DigitalExperienceBundle instead of ExperienceBundle?"
    a: "Use DigitalExperienceBundle for all Enhanced LWR sites (Build Your Own LWR and Microsites created on the enhanced CMS-backed platform in Winter '23 or later) as well as Salesforce CMS and Marketing workspaces. Use ExperienceBundle for Aura sites and legacy non-enhanced LWR sites."
  - q: "What are the three supported workspace types under the digitalExperiences directory?"
    a: "The three workspace type folders under force-app/main/default/digitalExperiences/ are site (for Enhanced LWR Experience Cloud sites), marketing (for Marketing Cloud workspaces), and general (for Salesforce CMS content workspaces)."
  - q: "What is the difference between content.json and _meta.json inside each content item folder?"
    a: "The _meta.json file defines the content item's apiName, type (such as sfdc_cms__view or sfdc_cms__route), parent item, and folder path. The content.json file contains the actual component tree, properties, and title of the page or route."
  - q: "Why does deploying a DigitalExperienceBundle fail if a target org has an extra translated language JSON file?"
    a: "Before deploying a DigitalExperienceBundle, any translated variant JSON file that exists in the target org must also exist in the source bundle, otherwise the deployment fails validation."
  - q: "How do I reference a DigitalExperienceBundle in package.xml?"
    a: "Reference the bundle using the format workspace_type/workspace_name inside the members tag, such as site/Customer_Portal1 or marketing/Global_Campaigns."
related:
  - metadata/experience-bundle-metadata-type
  - metadata/custom-site-metadata-type
  - metadata/csp-trusted-site-metadata-type
  - metadata/lightning-component-bundle-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_digitalexperiencebundle.htm
---

The `DigitalExperienceBundle` metadata type represents a workspace in **Enhanced LWR Experience Cloud sites**, **Salesforce CMS**, or **Marketing Cloud on Core**. Introduced in API version 56.0, `DigitalExperienceBundle` stores every page view (`sfdc_cms__view`), route (`sfdc_cms__route`), theme (`sfdc_cms__theme`), branding set (`sfdc_cms__brandingSet`), and CMS asset as a modular content item backed by `_meta.json` and `content.json` files.

## SFDX Four-Level Directory Structure

When retrieved into a Salesforce DX project, `DigitalExperienceBundle` organizes workspaces under `force-app/main/default/digitalExperiences/<workspace_type>/<Workspace_Name>/`:

```text
force-app/main/default/digitalExperiences/
└── site/
    └── Partner_Commerce_LWR1/
        ├── Partner_Commerce_LWR1.digitalExperience-meta.xml
        ├── sfdc_cms__appPage/
        │   └── mainAppPage/
        │       ├── _meta.json
        │       └── content.json
        ├── sfdc_cms__brandingSet/
        ├── sfdc_cms__route/
        │   └── Home/
        │       ├── _meta.json
        │       └── content.json
        ├── sfdc_cms__site/
        └── sfdc_cms__view/
            └── home/
                ├── _meta.json
                ├── content.json
                └── fr.json
```

```mermaid
flowchart TD
    Root["digitalExperiences/"] --> Type["Workspace Type:\nsite/ | marketing/ | general/"]
    Type --> Bundle["Workspace Folder\n(Partner_Commerce_LWR1.digitalExperience-meta.xml)"]
    Bundle --> CType["Content Type Folders:\n- sfdc_cms__view\n- sfdc_cms__route\n- sfdc_cms__theme\n- sfdc_cms__brandingSet"]
    CType --> Item["Content Item Folder:\n- _meta.json (apiName, type, parent, path)\n- content.json (Component Tree)\n- <lang>.json (Translations)"]
```

## Key Properties in `_meta.json`

Every content item subfolder contains a `_meta.json` descriptor with four fields:

| Property | Type | Required | Description |
|---|---|---|---|
| `apiName` | `string` | Yes | Unique alphanumeric/underscore identifier within that content type in the workspace |
| `type` | `string` | Yes | Content type prefixed with `sfdc_cms__` (for example, `sfdc_cms__view`, `sfdc_cms__route`) |
| `parent` | `string` | No | Developer name of the parent content item (for example, linking a view to its route) |
| `path` | `string` | No | Relative folder path within the workspace (`""` for root items like `sfdc_cms__site`) |

## Production-Grade Examples

### 1. Workspace Header (`Partner_Commerce_LWR1.digitalExperience-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DigitalExperienceBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Enhanced LWR Partner Commerce and Deal Registration portal.</description>
    <label>Partner Commerce LWR</label>
</DigitalExperienceBundle>
```

### 2. Content Item Metadata (`sfdc_cms__view/home/_meta.json`)

```json
{
  "apiName": "home",
  "type": "sfdc_cms__view",
  "path": "views"
}
```

### 3. Retrieving and Deploying via `package.xml`

When deploying an Enhanced LWR site, include `DigitalExperienceBundle`, `DigitalExperienceConfig`, `Network`, and [CustomSite](/docs/metadata/custom-site-metadata-type/):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>site/Partner_Commerce_LWR1</members>
        <name>DigitalExperienceBundle</name>
    </types>
    <types>
        <members>Partner_Commerce_LWR1</members>
        <name>DigitalExperienceConfig</name>
    </types>
    <types>
        <members>Partner Commerce LWR</members>
        <name>Network</name>
    </types>
    <types>
        <members>Partner_Commerce_LWR</members>
        <name>CustomSite</name>
    </types>
    <version>68.0</version>
</Package>
```

> [!WARNING]
> **Keep `<label>` Synchronized with `Network`**: For Enhanced LWR sites (`site/<WorkspaceName>`), the `<label>` in `.digitalExperience-meta.xml` must stay synchronized with the site's `Network` name, and any translated `<locale>.json` files present in the target org must also be retrieved into your source branch before deploying.

