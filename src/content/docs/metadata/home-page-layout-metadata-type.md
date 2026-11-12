---
title: "HomePageLayout Metadata Type in SFDX & Metadata API"
description: "Understand the Classic HomePageLayout metadata type vs Lightning HomePage FlexiPages. Learn narrowComponents, wideComponents, and profile assignments."
category: "metadata"
tags:
  - metadata-api
  - page-layout
  - flexipage
  - profile
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "HomePageLayout (homePageLayouts/<Name>.homePageLayout-meta.xml) defines a Salesforce Classic home page layout with narrow and wide sidebar/body components, whereas Lightning Experience uses HomePage FlexiPages."
faq:
  - q: "What is the difference between HomePageLayout and a Lightning Home Page?"
    a: "HomePageLayout configures the Salesforce Classic home tab (using narrowComponents and wideComponents), whereas Lightning Experience home pages are stored as FlexiPage metadata files with type set to HomePage."
  - q: "Why do HomePageLayout references still cause Profile deployment failures in Lightning orgs?"
    a: "User Profiles store a homePageLayoutAssignments block that maps the profile to a HomePageLayout. If a Profile in your repository references a HomePageLayout that does not exist in the target org, deploying the Profile fails even if your users only use Lightning Experience."
  - q: "What are the valid values for narrowComponents and wideComponents on HomePageLayout?"
    a: "Valid standard component names include standard-Calendar, standard-Tasks, standard-Dashboard, standard-RecentItems, standard-CreateNew, standard-MessagesAndAlerts, standard-StandardSearch, and custom HomePageComponent names."
related:
  - metadata/flexipage-metadata-type
  - metadata/profile-metadata-type
  - metadata/custom-application-metadata-type
  - metadata/layout-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_homepagelayout.htm
---

## Why `HomePageLayout` Still Appears in Modern CI/CD Pipelines

In Lightning Experience, home pages are built in Lightning App Builder and stored as [FlexiPage](/docs/metadata/flexipage-metadata-type/) metadata (`<type>HomePage</type>`). However, **`HomePageLayout`** (`homePageLayouts/<Name>.homePageLayout-meta.xml`) represents the **Salesforce Classic Home Page Layout**, and it frequently surfaces in modern DevOps pipelines for one critical reason:

- **[`Profile`](/docs/metadata/profile-metadata-type/) Dependencies (`homePageLayoutAssignments`):** Every `Profile` metadata file can contain a `<homePageLayoutAssignments>` element referencing a `HomePageLayout` (such as `DE Default`). If you deploy a `Profile` to a Scratch Org or Sandbox where that `HomePageLayout` is missing, the deployment fails unless you either deploy the `HomePageLayout` or strip the assignment.

```mermaid
flowchart LR
    subgraph CLASSIC["Salesforce Classic Home"]
        HPL["HomePageLayout<br/>(homePageLayouts/DE Default.homePageLayout-meta.xml)"]
        PROF["Profile<br/>(layoutAssignments / homePageLayoutAssignments)"]
        PROF --> HPL
    end

    subgraph LEX["Lightning Experience Home"]
        FP["FlexiPage (type: HomePage)<br/>(flexipages/Sales_Home.flexipage-meta.xml)"]
        APP["CustomApplication<br/>(profileActionOverrides)"]
        APP --> FP
    end
```

---

## Key Metadata Fields on `HomePageLayout`

| Field | Type | Required | Description |
|---|---|---|---|
| `narrowComponents` | `string[]` | No | Components displayed in the left narrow sidebar column (e.g., `standard-CreateNew`, `standard-RecentItems`, `standard-MessagesAndAlerts`). |
| `wideComponents` | `string[]` | No | Components displayed in the main wide body column (e.g., `standard-Dashboard`, `standard-Calendar`, `standard-Tasks`). |

---

## Real-World XML Example (`homePageLayouts/DE Default.homePageLayout-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<HomePageLayout xmlns="http://soap.sforce.com/2006/04/metadata">
    <narrowComponents>standard-StandardSearch</narrowComponents>
    <narrowComponents>standard-CreateNew</narrowComponents>
    <narrowComponents>standard-RecentItems</narrowComponents>
    <wideComponents>standard-Dashboard</wideComponents>
    <wideComponents>standard-Tasks</wideComponents>
    <wideComponents>standard-Calendar</wideComponents>
</HomePageLayout>
```

---

## Classic `HomePageLayout` vs. Lightning `FlexiPage` (`HomePage`)

| Feature | `HomePageLayout` (Classic) | `FlexiPage` (`type: HomePage`) |
|---|---|---|
| **Metadata Folder** | `homePageLayouts/` | `flexipages/` |
| **Target UI** | Salesforce Classic only | Lightning Experience & Mobile |
| **Component Types** | `HomePageComponent` & `standard-*` widgets | LWC (`LightningComponentBundle`), Aura, Dashboards, Flows |
| **Assignment Mechanism** | `Profile` (`homePageLayoutAssignments`) | Org Default, `CustomApplication` (`actionOverrides`), or App + Profile (`profileActionOverrides`) |

> [!TIP]
> **How to Assign Lightning Home Pages in Metadata:** If you want to deploy a Lightning Experience Home Page assignment via SFDX, do **not** use `HomePageLayout`. Instead, deploy a [FlexiPage](/docs/metadata/flexipage-metadata-type/) with `<type>HomePage</type>` and reference it inside your [CustomApplication](/docs/metadata/custom-application-metadata-type/) (`<profileActionOverrides><actionName>Tab</actionName><content>Sales_Home</content><pageOrSobjectType>standard-home</pageOrSobjectType>...</profileActionOverrides>`).
