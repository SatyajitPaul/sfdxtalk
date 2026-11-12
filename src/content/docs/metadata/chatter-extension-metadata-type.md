---
title: "ChatterExtension Metadata Type for Rich Feeds"
description: "Build and deploy ChatterExtension metadata in Salesforce SFDX to embed custom Lightning components and interactive Rich Publisher Apps in Chatter feeds."
category: "metadata"
tags:
  - metadata
  - chatter
  - lightning-components
  - publisher-apps
  - package-xml
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ChatterExtension defines Rich Publisher Apps that allow users to compose and render interactive Lightning components directly inside Chatter feed posts and comments."
faq:
  - q: "What is a ChatterExtension in Salesforce?"
    a: "ChatterExtension represents a Rich Publisher App that integrates custom Lightning components into the Chatter publisher and feed, allowing users to attach interactive payloads like polls, approval cards, or ERP order snapshots to a post."
  - q: "Which two Lightning components are required by a ChatterExtension?"
    a: "A ChatterExtension requires a compositionComponent (used when authoring the post in the publisher) and a renderComponent (used when displaying the published payload inside the Chatter feed)."
  - q: "Can ChatterExtension be used inside Experience Cloud sites?"
    a: "Yes, Rich Publisher Apps defined via ChatterExtension can be enabled for Experience Cloud feeds by associating them with the target Network configuration."
  - q: "Is ChatterExtension queryable via SOQL or Tooling API?"
    a: "Yes, ChatterExtension is exposed in both standard SOQL and Tooling API, allowing admins and architects to query active extensions, icons, and component bindings."
related:
  - metadata/network-metadata-type
  - metadata/experience-bundle-metadata-type
  - metadata/apex-class-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-chatterextension.md"
---

## Architectural Overview

Standard Chatter posts support text, links, polls, and files, but enterprise workflows often require embedding structured, interactive micro-applications—such as a live Jira issue card, an interactive incident severity selector, or a field service parts request—directly into a record or Experience Cloud feed. The `ChatterExtension` metadata type (known in the UI as **Rich Publisher Apps**) binds two Lightning components (`compositionComponent` and `renderComponent`) into the Chatter Publisher.

When a user clicks the extension icon in the Chatter publisher, Salesforce mounts the `compositionComponent` modal to capture structured JSON or record parameters. Once posted, the `FeedItem` renders the `renderComponent` directly inline for every user viewing the feed.

```mermaid
flowchart LR
    A["Chatter Publisher"] --> B["ChatterExtension Metadata"]
    B --> C["compositionComponent (Authoring UI)"]
    C --> D["FeedItem Payload Saved"]
    D --> E["renderComponent (Inline Feed UI)"]
```

## Directory Location and File Suffix

In Salesforce DX projects, `ChatterExtension` files are stored in the `chatterExtensions` folder.

| Property | Value |
| :--- | :--- |
| **Directory Path (SFDX)** | `force-app/main/default/chatterExtensions/` |
| **File Suffix (SFDX)** | `.chatterExtension-meta.xml` |
| **Classic Metadata Suffix** | `.chatterExtension` |
| **Metadata Type Name** | `ChatterExtension` |

## Key Metadata Fields

The following table details the XML elements of `ChatterExtension` in API version `68.0` (Winter '27):

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `extensionName` | `string` | Yes | The display name of the Rich Publisher App shown to users in the Chatter publisher. |
| `masterLabel` | `string` | Yes | The internal Setup label for the `ChatterExtension` component. |
| `description` | `string` | Yes | Explains the purpose of the Rich Publisher App in Setup and hover tooltips. |
| `type` | `ChatterExtensionType` | Yes | The extension implementation type; set to `Lightning` for Lightning component Rich Publisher Apps. |
| `compositionComponent` | `string` | Yes | The developer name of the Lightning component implementing `lightning:availableForChatterExtensionComposer`. |
| `renderComponent` | `string` | Yes | The developer name of the Lightning component implementing `lightning:availableForChatterExtensionRenderer`. |
| `icon` | `string` | Yes | The developer name of the `ContentAsset` image displayed as the extension icon in the publisher bar. |
| `headerText` | `string` | No | The modal header title shown when the user opens the `compositionComponent`. |
| `hoverText` | `string` | No | Tooltip text displayed when a user hovers over the extension icon in the Chatter publisher. |
| `isProtected` | `boolean` | No | Indicates whether the extension is protected in a managed package (`true`) or public (`false`). |

## Declarative Metadata Example

The following `ChatterExtension` registers an Incident Escalation card app in the Chatter publisher, binding `IncidentCardComposer` for composition, `IncidentCardRenderer` for inline feed display, and `Incident_Badge_Icon` as the `ContentAsset` icon.

```xml title="force-app/main/default/chatterExtensions/Incident_Card_Extension.chatterExtension-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ChatterExtension xmlns="http://soap.sforce.com/2006/04/metadata">
    <compositionComponent>IncidentCardComposer</compositionComponent>
    <description>Allows support engineers to attach a live PagerDuty/Jira incident status card to a Case or Group feed.</description>
    <extensionName>Attach Incident Card</extensionName>
    <headerText>Select Active Incident to Attach</headerText>
    <hoverText>Attach a live incident status card</hoverText>
    <icon>Incident_Badge_Icon</icon>
    <isProtected>false</isProtected>
    <masterLabel>Incident Card Extension</masterLabel>
    <renderComponent>IncidentCardRenderer</renderComponent>
    <type>Lightning</type>
</ChatterExtension>
```

### Package Manifest (`package.xml`)

When deploying a `ChatterExtension`, always include its dependent `AuraDefinitionBundle` components and `ContentAsset` icon in the same manifest:

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>IncidentCardComposer</members>
        <members>IncidentCardRenderer</members>
        <name>AuraDefinitionBundle</name>
    </types>
    <types>
        <members>Incident_Badge_Icon</members>
        <name>ContentAsset</name>
    </types>
    <types>
        <members>Incident_Card_Extension</members>
        <name>ChatterExtension</name>
    </types>
    <version>68.0</version>
</Package>
```

## SOQL Queries and SFDX CLI Commands

Query `ChatterExtension` via SOQL or Tooling API to audit installed Rich Publisher Apps:

```soql
SELECT Id, DeveloperName, MasterLabel, ExtensionName, Type,
       CompositionComponentEnumOrId, RenderComponentEnumOrId, HeaderText
FROM ChatterExtension
ORDER BY ExtensionName ASC
```

Retrieve or deploy using the `sf` CLI:

```bash
# Retrieve all ChatterExtension definitions
sf project retrieve start --metadata ChatterExtension

# Deploy the ChatterExtension along with its icon and Lightning bundles
sf project deploy start --metadata ContentAsset:Incident_Badge_Icon,AuraDefinitionBundle:IncidentCardComposer,AuraDefinitionBundle:IncidentCardRenderer,ChatterExtension:Incident_Card_Extension
```

## Architect Best Practices and Gotchas

> [!WARNING]
> Both `compositionComponent` and `renderComponent` must implement their respective Chatter Extension interfaces (`lightning:availableForChatterExtensionComposer` and `lightning:availableForChatterExtensionRenderer`), and the `icon` must reference a valid `ContentAsset`—not a `StaticResource` or `Document`. Otherwise, the `ChatterExtension` deployment fails.

- **Wrap LWC Inside Thin Aura Wrappers:** If you build your UI in Lightning Web Components (LWC), wrap the LWC inside a minimal Aura component that declares `lightning:availableForChatterExtensionComposer` or `lightning:availableForChatterExtensionRenderer`, as `ChatterExtension` validates those specific Aura interfaces during deployment.
- **Feed Rendering Performance:** Because `renderComponent` is instantiated for **every** matching post visible in a Chatter feed stream, never perform uncached imperative [ApexClass](/docs/metadata/apex-class-metadata-type/) callouts inside `init` of each renderer instance. Use wire adapters or batch state management to avoid hitting Aura/LWC boxcar contention.
