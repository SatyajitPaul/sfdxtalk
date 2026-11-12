---
title: "CustomApplication Metadata Type Reference"
description: "Configure and deploy CustomApplication (.app-meta.xml) metadata for Lightning Experience standard and console apps, utility bars, and page overrides."
category: metadata
tags:
  - metadata-api
  - lightning-app
  - console
  - ui
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "CustomApplication (.app-meta.xml) defines a Lightning or Classic application, including navigation style (Standard vs Console), included tabs, utilityBar FlexiPage, formFactors, and app-level record page actionOverrides."
faq:
  - q: "Can I convert a Lightning app from Standard navigation to Console navigation by updating navType?"
    a: "No. Both navType (Standard vs Console) and uiType (Lightning vs Aloha) are non-updateable once a CustomApplication is created. You must create a new CustomApplication if you need to switch between Standard and Console navigation."
  - q: "How do I reference standard Salesforce tabs versus custom tabs in the tabs array?"
    a: "Standard tabs are prefixed with standard-, such as standard-Account, standard-Contact, standard-Opportunity, or standard-report. Custom object tabs and LWC tabs use their exact developer name without a prefix, such as Invoice__c."
  - q: "What is the precedence order when assigning a Lightning Record Page (FlexiPage) to an App?"
    a: "A profileActionOverrides entry (App + Record Type + Profile) takes highest precedence, followed by an App-level actionOverrides entry (App Default), and finally the Org Default specified on the CustomObject."
  - q: "Why does Salesforce warn against sharing the same utilityBar across multiple Lightning Apps?"
    a: "Utility bars are stored as shared FlexiPage components. Modifying the utility bar inside one Lightning App in App Manager automatically alters that same utility bar in every other app that references its developer name."
  - q: "How do I grant users access to a deployed CustomApplication?"
    a: "Assign applicationVisibilities inside a PermissionSet or Profile metadata file, setting visible to true for the CustomApplication developer name."
related:
  - metadata/custom-tab-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/permission-set-metadata-type
  - metadata/profile-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_customapplication.htm
---

The `CustomApplication` metadata type represents a custom or standard Salesforce application accessible from the **App Launcher**. Available in API version 10.0 and later (with Lightning Experience extensions introduced in API version 38.0), `CustomApplication` controls the app's branding (`brand`), navigation model (`navType`: `Standard` vs `Console`), navigation bar items (`tabs`), bottom `utilityBar`, and app-specific Lightning Record Page assignments (`actionOverrides` and `profileActionOverrides`).

In Salesforce DX projects, applications are stored in `force-app/main/default/applications/` with the `.app-meta.xml` suffix.

```mermaid
flowchart TD
    App["CustomApplication\n(Enterprise_Service_Console.app-meta.xml)"] --> Nav["uiType: Lightning\nnavType: Console | Standard"]
    App --> Tabs["tabs\n(standard-Case, standard-Account, CustomTab)"]
    App --> Util["utilityBar\n(UtilityBar FlexiPage)"]
    App --> Overrides["actionOverrides & profileActionOverrides\n(App-Specific Record Page Assignments)"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | No | Display name of the application in the App Launcher |
| `uiType` | `UiType` | No | **Not updateable**. `Lightning` (Lightning Experience) or `Aloha` (Classic) |
| `navType` | `NavType` | No | **Not updateable**. `Standard` (horizontal tab bar) or `Console` (workspace tabs + subtabs) |
| `formFactors` | `FormFactor[]` | No | `Large` (Desktop) and/or `Small` (Salesforce Mobile app) |
| `tabs` | `string[]` | No | Ordered list of navigation items (`standard-Account`, `Invoice__c`, etc.) |
| `utilityBar` | `string` | No | Developer name of the `UtilityBar` [FlexiPage](/docs/metadata/flexipage-metadata-type/) |
| `actionOverrides` | `AppActionOverride[]` | No | App-default record page overrides (`actionName: View`, `content: FlexiPage_Name`) |
| `profileActionOverrides` | `AppProfileActionOverride[]` | No | Granular `App + RecordType + Profile` record page overrides |
| `workspaceConfig` | `AppWorkspaceConfig` | No | Maps which child records open as subtabs of parent workspace tabs in `Console` apps |
| `isNavPersonalizationDisabled` | `boolean` | No | Prevents end users from reordering or adding personal tabs to the navigation bar |
| `isNavTabPersistenceDisabled` | `boolean` | No | Clears open workspace tabs on every new console session when `true` (v54.0+) |

## Production-Grade XML Example (Lightning Console App)

Below is a Lightning Service Console application (`Enterprise_Service_Console.app-meta.xml`) that opens `Case` records as subtabs of `Account`, assigns an App Default record page for `Case`, and locks navigation bar personalization:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <actionOverrides>
        <actionName>View</actionName>
        <comment>App default Case record page for Enterprise Service Console</comment>
        <content>Enterprise_Case_Console_Record_Page</content>
        <formFactor>Large</formFactor>
        <skipRecordTypeSelect>false</skipRecordTypeSelect>
        <type>Flexipage</type>
        <pageOrSobjectType>Case</pageOrSobjectType>
    </actionOverrides>
    <brand>
        <headerColor>#0176D3</headerColor>
        <shouldOverrideOrgTheme>false</shouldOverrideOrgTheme>
    </brand>
    <description>Workspace console for Tier 2 and Tier 3 support engineers.</description>
    <formFactors>Large</formFactors>
    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>
    <isNavPersonalizationDisabled>true</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <label>Enterprise Service Console</label>
    <navType>Console</navType>
    <tabs>standard-Case</tabs>
    <tabs>standard-Account</tabs>
    <tabs>standard-Contact</tabs>
    <tabs>standard-Dashboard</tabs>
    <uiType>Lightning</uiType>
    <utilityBar>Enterprise_Service_Console_UtilityBar</utilityBar>
    <workspaceConfig>
        <mappings>
            <tab>standard-Account</tab>
        </mappings>
        <mappings>
            <fieldName>AccountId</fieldName>
            <tab>standard-Case</tab>
        </mappings>
    </workspaceConfig>
</CustomApplication>
```

> [!WARNING]
> **Profile Bloat in `profileActionOverrides`**: Every `<profileActionOverrides>` entry inside a `.app-meta.xml` file creates a hard dependency on a specific `<profile>` name and `<recordType>` name. Prefer **App Default** (`<actionOverrides>`) combined with Dynamic Forms visibility rules inside your [FlexiPage](/docs/metadata/flexipage-metadata-type/) so your `CustomApplication` deploys cleanly without requiring every Profile in your `package.xml`.

## Querying Installed Applications with SOQL

```sql
-- 1. Query Lightning and Classic apps via AppDefinition
SELECT DurableId, DeveloperName, Label, UiType, NavType, Description, UtilityBar
FROM AppDefinition
ORDER BY Label ASC

-- 2. Inspect App Launcher ordering and visibility via AppMenuItem
SELECT Id, Name, Label, Type, ApplicationId, SortOrder, IsVisible
FROM AppMenuItem
WHERE Type = 'TabSet'
ORDER BY SortOrder ASC
```

