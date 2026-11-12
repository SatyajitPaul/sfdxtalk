---
title: "CustomTab Metadata Type Reference"
description: "Configure and deploy CustomTab (.tab-meta.xml) metadata for Custom Objects, Lightning Web Components (lwcComponent), FlexiPages, and App Launcher navigation."
category: metadata
tags:
  - metadata-api
  - custom-tab
  - lwc
  - ui
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "CustomTab (.tab-meta.xml) exposes a Custom Object, Lightning Web Component (lwcComponent), Lightning App Page (flexiPage), or Visualforce page as a navigation item in Lightning Apps and the App Launcher."
faq:
  - q: "How is a CustomTab for a Custom Object named?"
    a: "For a Custom Object tab, the file name and fullName must exactly match the API name of the custom object (for example, Invoice__c.tab-meta.xml) and the customObject boolean tag must be set to true."
  - q: "How do I expose a Lightning Web Component directly as a CustomTab?"
    a: "Add the lightning__Tab target to the LWC's .js-meta.xml file, then create a CustomTab file where the lwcComponent tag is set to the developer name of your LWC bundle."
  - q: "Can a single CustomTab reference both a customObject and a flexiPage?"
    a: "No. Exactly one target field can be populated on a CustomTab: customObject, lwcComponent, flexiPage, auraComponent, page (Visualforce), scontrol, or url."
  - q: "Why is my deployed CustomTab not visible in the App Launcher?"
    a: "Deploying a CustomTab creates the tab definition, but users cannot see it until tabVisibilities (PermissionSet) or tabSettings (Profile) is set to DefaultOn or Available (Visible) for that tab."
  - q: "What is the motif field on a CustomTab?"
    a: "The motif field is a required string (such as Custom53: Bell or Custom67: Gears) that specifies the icon and color theme for the tab."
related:
  - metadata/custom-application-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/lightning-component-bundle-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_tab.htm
---

The `CustomTab` metadata type creates a navigation entry in the **App Launcher** and [CustomApplication](/docs/metadata/custom-application-metadata-type/) navigation bars. Available in API version 10.0 and later, a `CustomTab` can expose a [CustomObject](/docs/metadata/custom-object-metadata-type/) home/list view, a standalone [LightningComponentBundle](/docs/metadata/lightning-component-bundle-metadata-type/) (`lwcComponent`), a Lightning App Page ([FlexiPage](/docs/metadata/flexipage-metadata-type/)), a Visualforce `page`, or an external web `url`.

In Salesforce DX projects, custom tabs are stored in `force-app/main/default/tabs/` with the `.tab-meta.xml` suffix.

```mermaid
flowchart TD
    Tab["CustomTab\n(.tab-meta.xml)"] --> Target{"Mutually Exclusive Target"}
    Target -->|"customObject: true"| Obj["CustomObject Tab\n(File name = Object__c.tab-meta.xml)"]
    Target -->|"lwcComponent"| LWC["LWC Tab\n(Requires lightning__Tab target)"]
    Target -->|"flexiPage"| FP["Lightning App Page Tab\n(AppPage FlexiPage)"]
    Tab --> Vis["Visibility:\n1. CustomApplication (<tabs>)\n2. PermissionSet (<tabSettings>)"]
```

## Key Metadata Fields

Exactly **one** of `customObject`, `lwcComponent`, `flexiPage`, `auraComponent`, `page`, `scontrol`, or `url` must be specified per `CustomTab`:

| Field | Type | Required | Description |
|---|---|---|---|
| `motif` | `string` | Yes | Required icon and color style (for example, `Custom67: Gears`, `Custom18: Form`) |
| `customObject` | `boolean` | Conditional | Set to `true` when the tab represents a Custom Object (filename must match `<Object>__c.tab-meta.xml`) |
| `lwcComponent` | `string` | Conditional | Developer name of a Lightning Web Component exposing the `lightning__Tab` target |
| `flexiPage` | `string` | Conditional | Developer name of an `AppPage` `FlexiPage` |
| `label` | `string` | Conditional | Display label in the navigation bar (used for LWC, FlexiPage, VF, and URL tabs; Custom Object tabs inherit the object's plural label) |
| `description` | `string` | No | Architectural notes on the tab's purpose |
| `actionOverrides` | `ActionOverride[]` | No | Tab-level overrides (one per `formFactor`) |

## Production-Grade XML Examples

### 1. Custom Object Tab (`Invoice__c.tab-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <description>Primary navigation tab for Customer Invoices.</description>
    <motif>Custom41: Cash</motif>
</CustomTab>
```

### 2. Standalone Lightning Web Component Tab (`Order_Command_Center.tab-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Full-screen LWC command center for monitoring real-time ERP order sync queues.</description>
    <label>Order Command Center</label>
    <lwcComponent>orderCommandCenterApp</lwcComponent>
    <motif>Custom67: Gears</motif>
</CustomTab>
```

> [!TIP]
> **Remember to Grant Tab Visibility in a Permission Set**: Deploying a `.tab-meta.xml` file creates the tab with a default visibility of `Hidden` across all profiles and permission sets unless you also include `<tabSettings>` in a [PermissionSet](/docs/metadata/permission-set-metadata-type/) (`<visibility>Visible</visibility>`) and add the tab's developer name to `<tabs>` in your [CustomApplication](/docs/metadata/custom-application-metadata-type/).

## Querying Tabs with SOQL (`TabDefinition`)

You can inspect all standard and custom tabs available in your org using the `TabDefinition` object:

```sql
-- List all Custom Tabs in the org and their SObject or URL bindings
SELECT Id, Name, Label, SobjectName, IsCustom, Url
FROM TabDefinition
WHERE IsCustom = true
ORDER BY Label ASC
```

