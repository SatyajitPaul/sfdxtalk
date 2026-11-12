---
title: "OrchestrationPlanCtxMapping Metadata Guide"
description: "Configure and deploy OrchestrationPlanCtxMapping metadata in Salesforce to map context data into dynamic Industries Order Management orchestration plans."
category: "metadata"
tags:
  - metadata
  - orchestration
  - order-management
  - industries
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "OrchestrationPlanCtxMapping injects operational record context (orders, assets, accounts) into decomposed Industry Order Management orchestration plans."
faq:
  - q: "What is the role of OrchestrationPlanCtxMapping in Salesforce?"
    a: "It maps dynamic operational context fields from commercial orders or assets into decomposed orchestration plan execution instances."
  - q: "Which industry solution uses OrchestrationPlanCtxMapping?"
    a: "It is used primarily in Communications Cloud, Media Cloud, and Energy and Utilities Cloud within Industries Order Management."
  - q: "Where is OrchestrationPlanCtxMapping stored in an SFDX project?"
    a: "It is stored in the force-app/main/default/orchestrationPlanCtxMappings/ folder with the .orchestrationPlanCtxMapping-meta.xml suffix."
related:
  - metadata/flow-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-orchestrationplanctxmapping.md"
---

## Architectural Overview

`OrchestrationPlanCtxMapping` (Orchestration Plan Context Mapping) is a mission-critical metadata type in Salesforce Industries Order Management (OM), predominantly utilized in Communications Cloud, Media Cloud, and Energy & Utilities Cloud. It defines the mapping schema that transfers operational context from commercial entities (such as commercial Orders, Order Line Items, Quotes, or Assets) into technical orchestration plan instances.

When an incoming enterprise order decomposes into downstream fulfillment tasks (e.g., SIM card provisioning, fiber installation dispatch, billing system activation), technical tasks require contextual data—such as customer premises address, MSISDN, bandwidth tier, or technical account ID. `OrchestrationPlanCtxMapping` binds these runtime data points into the orchestration plan without requiring custom procedural code.

```mermaid
flowchart LR
    A["Commercial Order & Line Items"] --> B["Orchestration Decomposition Engine"]
    B --> C["OrchestrationPlanCtxMapping"]
    C --> D["Injects Technical Context Attributes"]
    D --> E["Decomposed Orchestration Plan Instance"]
    E --> F["Downstream Callout / Manual Tasks (ERP/Billing/Network)"]
```

## Directory and File Conventions

`OrchestrationPlanCtxMapping` metadata records are stored in the `orchestrationPlanCtxMappings/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `OrchestrationPlanCtxMapping` |
| **SFDX Folder** | `force-app/main/default/orchestrationPlanCtxMappings/` |
| **File Suffix** | `.orchestrationPlanCtxMapping-meta.xml` |

## Key Metadata Fields

The XML schema defines source contexts, target orchestration plans, and mapped fields:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `developerName` | `string` | Yes | Programmatic API identifier for the context mapping definition. |
| `masterLabel` | `string` | Yes | Human-readable label displayed in Industries Order Management designers. |
| `orchestrationPlanDefinition` | `string` | Yes | Developer name of the associated `OrchestrationPlanDefinition` receiving the context. |
| `contextObject` | `string` | Yes | API name of the source entity supplying runtime context (e.g., `OrderItem`, `Order`). |
| `sourceContextField` | `string` | Yes | Field on the source entity providing data. |
| `targetContextField` | `string` | Yes | Field on the orchestration context record storing the mapped value. |

> [!NOTE]
> Custom context fields and objects must include the appropriate namespace prefix (such as `vlocity_cmt__` or industry equivalent) or `__c` in custom implementations.

## Declarative XML and Package Manifest Examples

An architectural definition mapping activation dates and service identifiers from order line items into fulfillment plans:

```xml title="force-app/main/default/orchestrationPlanCtxMappings/Fiber_Activation_Ctx_Map.orchestrationPlanCtxMapping-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<OrchestrationPlanCtxMapping xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Fiber_Activation_Ctx_Map</developerName>
    <masterLabel>Fiber Activation Context Mapping</masterLabel>
    <orchestrationPlanDefinition>Broadband_Fulfillment_Plan</orchestrationPlanDefinition>
    <contextObject>OrderItem</contextObject>
    <sourceContextField>Service_Identifier__c</sourceContextField>
    <targetContextField>Technical_Service_Id__c</targetContextField>
</OrchestrationPlanCtxMapping>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Fiber_Activation_Ctx_Map</members>
        <name>OrchestrationPlanCtxMapping</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage context mappings with the Salesforce CLI:

```bash
# Retrieve orchestration context mappings
sf project retrieve start --metadata OrchestrationPlanCtxMapping

# Deploy a specific orchestration context mapping
sf project deploy start --metadata OrchestrationPlanCtxMapping:Fiber_Activation_Ctx_Map
```

## Architect Best Practices and Gotchas

- **Dependency Sequencing:** Ensure `OrchestrationPlanDefinition`, the context source object (`contextObject`), and any referenced custom fields exist in the target environment before deploying `OrchestrationPlanCtxMapping`.
- **Order Decomposition Performance:** Minimize extraneous context field mappings. Mapping dozens of unneeded fields onto every orchestration item increases execution latency and state storage consumption during high-volume decomposition.
- **Decomposition State Immutability:** Context attributes mapped into an active orchestration plan become frozen at decomposition time. If commercial order data is amended via In-Flight Amendment (MACD) flows, ensure amendment handlers refresh downstream orchestration contexts.

> [!TIP]
> Group orchestration definitions, item definitions, and context mappings into dedicated Industries OM package directories to maintain modularity in enterprise multi-repo setups.
