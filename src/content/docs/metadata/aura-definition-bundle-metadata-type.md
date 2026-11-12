---
title: "AuraDefinitionBundle Metadata Type in SFDX & Metadata"
description: "Understand the AuraDefinitionBundle metadata type in Salesforce. Learn when Aura wrappers are still required for LWC, bundle file structures, and SOQL queries."
category: "metadata"
tags:
  - metadata-api
  - aura
  - lwc
  - lightning
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "AuraDefinitionBundle represents an Aura component, application, event, interface, or tokens bundle in the aura/ folder, still used today as thin wrapper containers around LWCs for specialised platform interfaces."
faq:
  - q: "Why do Salesforce architects still deploy AuraDefinitionBundle components in LWC orgs?"
    a: "A few platform interfaces still require a thin Aura wrapper around an LWC, including overriding the standard New or Edit object buttons (lightning:actionOverride), Standalone Lightning Out apps (ltng:outApp), and custom page template layouts (lightning:appHomeTemplate)."
  - q: "What files can exist inside an AuraDefinitionBundle directory?"
    a: "An Aura bundle folder in force-app/main/default/aura/BundleName/ can contain up to 8 resource files plus the .cmp-meta.xml sidecar: .cmp or .app, Controller.js, Helper.js, Renderer.js, .css, .auradoc, .design, and .svg."
  - q: "How do you query Aura components and their JavaScript code using SOQL?"
    a: "You query AuraDefinitionBundle to list component bundles and their ApiVersion, and you query its child object AuraDefinition via the Tooling API to inspect the source code of individual .cmp, CONTROLLER, or HELPER files."
  - q: "What is a Lightning Tokens bundle in AuraDefinitionBundle?"
    a: "A .tokens bundle (such as defaultTokens.tokens) defines reusable design tokens for colors, spacing, and typography that can be referenced across both Aura components and Lightning Web Components using var(--lwc-tokenName)."
related:
  - metadata/lightning-component-bundle-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/quick-action-metadata-type
  - metadata/apex-class-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_auradefinitionbundle.htm
---

## Why `AuraDefinitionBundle` Still Matters in LWC-First Architectures

Although Salesforce recommends [LightningComponentBundle](/docs/metadata/lightning-component-bundle-metadata-type/) (LWC) for all new UI development, **`AuraDefinitionBundle`** is far from dead. Several core Salesforce platform extension points still require a thin Aura container or bundle:

1. **Standard Action Overrides (`lightning:actionOverride`):** Overriding the standard **New**, **Edit**, or **View** button on an object requires an Aura component implementing `lightning:actionOverride` that wraps your LWC (`<c:myCustomNewForm>`).
2. **Lightning Out Applications (`ltng:outApp`):** Embedding an LWC inside a Visualforce page or an external web application requires an Aura `.app` bundle extending `ltng:outApp`.
3. **Custom FlexiPage Templates (`lightning:appHomeTemplate`, `lightning:recordHomeTemplate`):** Creating custom page layout regions for Lightning App Builder still uses an Aura `.cmp` + `.design` + `.svg` bundle.
4. **Design Tokens (`defaultTokens.tokens`):** Defining org-wide CSS design tokens shared across LWC and Aura.

```mermaid
flowchart LR
    BTN["Standard 'New' Button Override<br/>(ActionOverride)"] --> AURA["AuraDefinitionBundle<br/>(implements lightning:actionOverride)"]
    AURA --> LWC["LightningComponentBundle<br/>(&lt;c:orderWizardLwc&gt;)"]
    DESIGN["Custom FlexiPage Template<br/>(lightning:recordHomeTemplate)"] --> AURA
    LTOUT["Lightning Out App<br/>(extends ltng:outApp)"] --> AURA
```

---

## SFDX Source Format & Bundle Structure

In SFDX source format, each Aura bundle resides in `force-app/main/default/aura/<BundleName>/`. Unlike LWC (which uses camelCase folder names), Aura bundles typically use PascalCase (`OrderNewOverride/`):

```text
force-app/main/default/aura/OrderNewOverride/
├── OrderNewOverride.cmp
├── OrderNewOverride.cmp-meta.xml
├── OrderNewOverrideController.js
├── OrderNewOverrideHelper.js
├── OrderNewOverride.css
└── OrderNewOverride.design
```

### Supported Aura Bundle Flavors

| Root File Extension | Bundle Type | Purpose |
|---|---|---|
| `.cmp` + `.cmp-meta.xml` | Component | UI component, action override wrapper, or custom FlexiPage template. |
| `.app` + `.app-meta.xml` | Application | Standalone Aura app or Lightning Out host (`extends="ltng:outApp"`). |
| `.evt` + `.evt-meta.xml` | Event | Component or Application Aura event (`type="COMPONENT"` or `type="APPLICATION"`). |
| `.intf` + `.intf-meta.xml` | Interface | Marker or attribute contract interface (`<aura:interface>`). |
| `.tokens` + `.tokens-meta.xml` | Tokens | Design tokens bundle (`<aura:tokens>`). |

---

## Real-World Example: Thin Aura Wrapper for Standard `New` Button Override

### 1. Metadata Sidecar (`aura/OrderNewOverride/OrderNewOverride.cmp-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<AuraDefinitionBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>68.0</apiVersion>
    <description>Thin Aura wrapper delegating the Order standard New action override to the orderCreationWizard LWC.</description>
</AuraDefinitionBundle>
```

### 2. Component Markup (`aura/OrderNewOverride/OrderNewOverride.cmp`)

```xml
<aura:component implements="lightning:actionOverride,lightning:hasPageReference" access="global">
    <c:orderCreationWizard
        recordTypeId="{!v.pageReference.state.recordTypeId}"
        onclose="{!c.handleClose}" />
</aura:component>
```

> [!TIP]
> **Keep Zero Business Logic in Aura Wrappers:** When using `AuraDefinitionBundle` as an adapter for `lightning:actionOverride` or Workspace API tabs (`lightning:workspaceAPI`), pass the `pageReference` state directly to your child LWC and emit standard CustomEvents (`onclose`) back up to the Aura controller only to close or navigate the tab.

---

## Querying `AuraDefinitionBundle` & `AuraDefinition` via Tooling API

You can audit all Aura bundles and even search inside their `.cmp` and `.js` source files using two objects: `AuraDefinitionBundle` (the parent folder) and `AuraDefinition` (the individual files).

### 1. List All Custom Aura Bundles in the Org

```sql
SELECT Id, DeveloperName, MasterLabel, ApiVersion, Description, LastModifiedDate
FROM AuraDefinitionBundle
WHERE NamespacePrefix = null
ORDER BY DeveloperName ASC
```

### 2. Inspect Individual Aura Files (`COMPONENT`, `CONTROLLER`, `HELPER`) via Tooling API

```sql
SELECT Id, AuraDefinitionBundle.DeveloperName, DefType, Format, Source
FROM AuraDefinition
WHERE AuraDefinitionBundle.NamespacePrefix = null
  AND DefType IN ('COMPONENT', 'APPLICATION', 'CONTROLLER', 'HELPER')
```

---

## Senior Architect Gotchas

- **Case-Sensitivity Collisions with LWC:** An `AuraDefinitionBundle` and a `LightningComponentBundle` **cannot share the same name** in the same namespace—even if their casing differs (for example, `aura/OrderCard` and `lwc/orderCard` both claim the `c:orderCard` tag and will fail deployment with a duplicate component name error).
- **API Version Alignment:** Always keep `<apiVersion>` at `40.0` or higher (ideally `68.0`) so Lightning Locker / Lightning Web Security rules apply consistently between your Aura wrapper and child LWC.
