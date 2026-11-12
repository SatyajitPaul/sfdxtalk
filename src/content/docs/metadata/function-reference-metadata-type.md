---
title: "FunctionReference Metadata Type in SFDX"
description: "Configure FunctionReference metadata in Salesforce DX to bind serverless compute functions into Apex and Flow execution contexts with strict CI/CD control."
category: "metadata"
tags:
  - metadata
  - functions
  - serverless
  - apex
  - integrations
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "FunctionReference metadata registers elastic, serverless compute microservices with the core Salesforce platform, allowing secure invocation from Apex and Flow."
faq:
  - q: "How does FunctionReference connect Salesforce to serverless compute logic?"
    a: "FunctionReference stores the registered namespace, project binding, and endpoint identifiers needed to invoke functions securely from Apex or Flow."
  - q: "Can Apex code invoke a function if FunctionReference is not deployed?"
    a: "No. The Salesforce compute runtime validates the function reference at compile and invocation time, blocking calls to unregistered function names."
  - q: "How should function deployments be sequenced in multi-tier pipelines?"
    a: "The compute function code should be built and deployed to the compute infrastructure before deploying the FunctionReference metadata to core Salesforce."
related:
  - metadata/apex-class-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-functionreference.md"
---

## Architectural Overview

`FunctionReference` is an advanced metadata component that binds elastic, serverless compute functions (such as Node.js or Java microservices) to the core Salesforce CRM platform. When enterprise business requirements exceed standard transaction limits—such as complex PDF generation, intensive cryptography, high-volume matrix calculations, or machine learning payload pre-processing—architects offload processing to elastic compute workloads.

`FunctionReference` provides the declarative gateway that registers the compute function inside the core Salesforce organization. Through this metadata asset, Salesforce administrators and developers can invoke external serverless microservices directly from [ApexClass](/docs/metadata/apex-class-metadata-type/) code or declarative [Flow](/docs/metadata/flow-metadata-type/) actions while inheriting platform identity, mutual TLS authentication, and unified audit logs.

```mermaid
flowchart LR
    A["Apex Trigger or Screen Flow"] -->|"functions.Function.get('Tax_Engine')"| B["FunctionReference: Tax_Engine"]
    B --> C["Salesforce Compute Runtime Boundary"]
    C --> D["Elastic Microservice (Node.js / Java)"]
    D -->|"Returns Processed JSON Payload"| A
```

## Directory and File Conventions

In Salesforce DX source format (`apiVersion` 68.0), `FunctionReference` definitions reside in the `functionReferences/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `FunctionReference` |
| **SFDX Folder** | `force-app/main/default/functionReferences/` |
| **File Suffix** | `.functionReference-meta.xml` |
| **XML Root Element** | `<FunctionReference xmlns="http://soap.sforce.com/2006/04/metadata">` |

## Key Metadata Fields

The XML schema for `FunctionReference` links project containers, function names, and invocation policies:

| Field Name | Field Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable title displayed in Flow Builder and setup consoles. |
| `developerName` | `string` | Yes | Programmatic identifier utilized when querying the function in Apex (`functions.Function.get`). |
| `functionName` | `string` | Yes | Name of the discrete function handler defined in the serverless project repository. |
| `project` | `string` | Yes | Logical project or service namespace grouping related compute functions. |
| `description` | `string` | No | Architectural summary of the function purpose, expected inputs, and computational limits. |

> [!NOTE]
> Apex code invokes registered functions using `functions.Function.get('project.developerName')` to establish an authenticated, asynchronous execution session.

## Declarative XML and Package Manifest Examples

Below is a declarative `FunctionReference` registering a high-volume pricing calculation microservice:

```xml title="force-app/main/default/functionReferences/Complex_Pricing_Engine.functionReference-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<FunctionReference xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Complex_Pricing_Engine</developerName>
    <masterLabel>Complex Pricing Engine</masterLabel>
    <description>Calculates tier-based CPQ matrix discounts exceeding standard Apex CPU limits.</description>
    <functionName>pricingcalculator</functionName>
    <project>EnterpriseBillingServices</project>
</FunctionReference>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Complex_Pricing_Engine</members>
        <name>FunctionReference</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `FunctionReference` components using the Salesforce CLI:

```bash
# Retrieve all function references from your target environment
sf project retrieve start --metadata FunctionReference

# Deploy a specific function reference to your integration sandbox
sf project deploy start --metadata FunctionReference:Complex_Pricing_Engine
```

## Architect Best Practices and Gotchas

- **Multi-Pipeline Orchestration:** In automated CI/CD environments, always deploy the serverless compute bundle (e.g. via container deployment pipelines) and register the project before deploying `FunctionReference` to core Salesforce.
- **Apex Compile Dependencies:** Any [ApexClass](/docs/metadata/apex-class-metadata-type/) or unit test referencing a function by string name should verify function availability dynamically or handle invocation exceptions gracefully.
- **Sandbox Environment Isolation:** Ensure sandbox instances reference lower-environment compute endpoints rather than production functions to prevent accidental data contamination during testing.

> [!TIP]
> Use `FunctionReference` when complex algorithms threaten to breach the 10-second synchronous Apex CPU limit, shifting heavy computation to elastic infrastructure.
