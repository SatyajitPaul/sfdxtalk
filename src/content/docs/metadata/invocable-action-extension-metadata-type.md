---
title: "InvocableActionExtension in SFDX"
description: "Deploy InvocableActionExtension metadata in Salesforce to manage custom property editors, dynamic parameter schemas, and Flow UI extensions in CI/CD."
category: "metadata"
tags:
  - metadata
  - invocable-actions
  - flow-builder
  - lwc
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "InvocableActionExtension registers custom configuration experiences and UI property editors for invocable Apex actions in Salesforce Flow and Agentforce."
faq:
  - q: "What is InvocableActionExtension in Salesforce?"
    a: "It defines custom UI extensions and parameter schemas for Invocable Actions, enabling custom property editors in Flow Builder and Agentforce."
  - q: "Where are InvocableActionExtension files stored in SFDX?"
    a: "They are stored in force-app/main/default/invocableActionExtensions with the suffix invocableActionExtension-meta.xml."
  - q: "How does InvocableActionExtension connect with Lightning Web Components?"
    a: "It links an Invocable Action to a custom property editor LWC that renders interactive configuration controls in Flow Builder."
  - q: "Can InvocableActionExtension be versioned in Git repositories?"
    a: "Yes, it is standard XML metadata that should be tracked alongside its corresponding Apex class and custom property editor LWC."
related:
  - metadata/flow-metadata-type
  - metadata/apex-class-metadata-type
  - metadata/flexipage-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-invocableactionextension.md"
---

## Architectural Overview

The `InvocableActionExtension` metadata type enables developers and enterprise architects to author rich, customized configuration experiences for Invocable Actions within Flow Builder and Agentforce agent workflows. While standard invocable Apex methods provide basic parameter entry boxes, enterprise integrations often require dynamic dropdowns, dependent field selection, real-time external schema inspection, or graphical wizards.

Architecturally, `InvocableActionExtension` creates a declarative bridge between an `@InvocableMethod` Apex class and a custom property editor (CPE) Lightning Web Component (LWC). When an administrator configures the action inside Flow Builder, the platform loads the registered extension LWC, allowing dynamic client-side validation and rich parameter rendering.

```mermaid
flowchart LR
    A["Apex Class (@InvocableMethod)"] --> B["InvocableActionExtension XML"]
    C["Custom Property Editor (LWC)"] --> B
    B --> D["Flow Builder Action Inspector"]
    D --> E["Agentforce Agent Action Configuration"]
```

## Directory and File Conventions

In Salesforce DX source format, `InvocableActionExtension` files are organized in the `invocableActionExtensions` directory:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `InvocableActionExtension` |
| **SFDX Source Folder** | `force-app/main/default/invocableActionExtensions/` |
| **File Suffix** | `.invocableActionExtension-meta.xml` |
| **Packaging / Manifest Type** | `InvocableActionExtension` |

## Key Metadata Fields

The XML schema for `InvocableActionExtension` declares the targeted action, the extension component, and descriptive metadata:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Display label for the extension component in builder tooling. |
| `description` | `string` | No | Architectural description of the extension and UI behavior. |
| `actionName` | `string` | Yes | The API name of the target invocable action or Apex class name. |
| `actionType` | `string` | Yes | The type of action (e.g., `Apex`, `ExternalService`, `StandardAction`). |
| `extensionComponent` | `string` | Yes | The Lightning Web Component name used as the Custom Property Editor. |
| `isActive` | `boolean` | Yes | Indicates whether this extension is active and surfaced in builder tools. |

> [!NOTE]
> Custom property editor LWCs referenced in `extensionComponent` must implement standard builder custom property editor events (`configuration_editor_input`).

## Declarative XML and Package Manifest Examples

### Source XML (`SapPaymentActionExt.invocableActionExtension-meta.xml`)

```xml title="force-app/main/default/invocableActionExtensions/SapPaymentActionExt.invocableActionExtension-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<InvocableActionExtension xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>SAP Payment Invocable Action Extension</masterLabel>
    <description>Provides custom property editor LWC for SAP invoice payment action.</description>
    <actionName>SapPaymentProcessor</actionName>
    <actionType>Apex</actionType>
    <extensionComponent>c/sapPaymentPropertyEditor</extensionComponent>
    <isActive>true</isActive>
</InvocableActionExtension>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>InvocableActionExtension</name>
    </types>
    <version>68.0</version>
</Package>
```

## Retrieval and Deployment

To retrieve invocable action extensions from your org:

```bash
# Retrieve all invocable action extensions
sf project retrieve start --metadata InvocableActionExtension

# Retrieve specific extension
sf project retrieve start --metadata InvocableActionExtension:SapPaymentActionExt
```

To deploy the extension alongside its Apex and LWC dependencies:

```bash
# Deploy extension bundle to target org
sf project deploy start \
  --metadata InvocableActionExtension,ApexClass:SapPaymentProcessor,LightningComponentBundle:sapPaymentPropertyEditor \
  --target-org uat-org \
  --wait 10
```

## Senior Architect Deployment Best Practices and Gotchas

### Dependency Triad Sequencing

An `InvocableActionExtension` relies directly on both an Apex class (`ApexClass`) and a Lightning Web Component (`LightningComponentBundle`). Attempting to deploy the extension without its underlying Apex class or LWC will trigger validation failures during deployment:

1. **Prerequisite 1**: The Apex class annotated with `@InvocableMethod` must exist or be deployed in the same transaction.
2. **Prerequisite 2**: The LWC custom property editor bundle must exist or be deployed in the same transaction.

> [!WARNING]
> If the `actionName` does not match an active invocable Apex method or external service action in the target org, metadata deployment will fail with an invalid action target error.

### LWC Property Editor Best Practices

Ensure the custom property editor LWC is tagged with the appropriate targets in its `js-meta.xml`:

```xml
<targets>
    <target>lightning__FlowScreen</target>
</targets>
```

> [!TIP]
> Package the Apex action, LWC property editor, and `InvocableActionExtension` into a single unlocked package module to ensure atomic versioning and eliminate mismatched parameter bugs in production.
