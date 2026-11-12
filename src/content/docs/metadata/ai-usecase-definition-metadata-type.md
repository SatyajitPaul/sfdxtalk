---
title: "AIUsecaseDefinition Metadata Type in SFDX"
description: "Define and deploy industry and CRM AI use case blueprints, target objects, and model bindings using AIUsecaseDefinition in Salesforce DX."
category: "metadata"
tags: ["metadata", "ai-usecase-definition", "einstein-ai", "industry-cloud", "sf-cli"]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "AIUsecaseDefinition defines the declarative blueprint for an AI business use case, mapping target objects, prediction goals, and scoring model definitions."
faq:
  - q: "What is AIUsecaseDefinition in Salesforce?"
    a: "AIUsecaseDefinition is a metadata type that encapsulates a specific AI business use case, linking the target Salesforce object, prediction goal, and AIScoringModelDefinition."
  - q: "Where are AIUsecaseDefinition files stored in SFDX?"
    a: "They are stored in the force-app/main/default/aiUsecaseDefinitions directory with the .aiUsecaseDefinition-meta.xml file suffix."
  - q: "What dependencies are required when deploying AIUsecaseDefinition?"
    a: "Any referenced custom objects, custom fields, and associated AIScoringModelDefinition components must exist in the target org or be included in the deployment."
  - q: "How do I retrieve AIUsecaseDefinition metadata with Salesforce CLI?"
    a: "Run sf project retrieve start --metadata AIUsecaseDefinition to download all configured AI use case definitions into your local workspace."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-aiusecasedefinition.md"
---

## Architectural Overview

Enterprise AI initiatives succeed when every machine learning model is anchored to a measurable business outcome and target entity. The `AIUsecaseDefinition` metadata type provides the declarative business wrapper for predictive and industry AI solutions—connecting the target [CustomObject](/docs/metadata/custom-object-metadata-type/) (such as `Account`, `Asset`, or `Claim`) with its underlying `AIScoringModelDefinition` and writeback fields.

Managing `AIUsecaseDefinition` in SFDX allows architects to package complete, domain-specific AI accelerators (e.g., *Subscriber Churn Risk*, *Warranty Claim Fraud Detection*, or *Donor Lapsed Likelihood*) and deploy them reproducibly across business units.

```mermaid
flowchart TD
    A["AIUsecaseDefinition (Business Blueprint)"] --> B["Target Entity (Account / Asset / CustomObject)"]
    A --> C["AIScoringModelDefinition (Scoring Logic)"]
    A --> D["Score Writeback CustomField"]
    B & C & D --> E["Industry Cloud / CRM Actionable Insights"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `AIUsecaseDefinition` |
| **SFDX Directory** | `force-app/main/default/aiUsecaseDefinitions/` |
| **File Suffix** | `.aiUsecaseDefinition-meta.xml` |
| **API Version Introduced** | `58.0` (Verified on `68.0` / Winter '27) |

## Key Metadata Fields

| Field Name | Type | Required | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable name of the AI use case definition in Setup. |
| `developerName` | `string` | No | Unique API identifier for the use case definition. |
| `description` | `string` | No | Describes the business problem, target persona, and expected operational workflow. |
| `isActive` | `boolean` | No | Controls whether this AI use case definition is active in the org. |

> [!NOTE]
> Industry Cloud templates frequently ship prebuilt `AIUsecaseDefinition` records that you can clone, customize, and track in your SFDX repository.

## Declarative XML & `package.xml` Examples

### Sample `.aiUsecaseDefinition-meta.xml`

```xml title="force-app/main/default/aiUsecaseDefinitions/Enterprise_Contract_Renewal_Usecase.aiUsecaseDefinition-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<AIUsecaseDefinition xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Identifies B2B accounts at high risk of non-renewal 90 days prior to contract expiration.</description>
    <isActive>true</isActive>
    <masterLabel>Enterprise Contract Renewal Usecase</masterLabel>
</AIUsecaseDefinition>
```

### Sample `package.xml` Manifest

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Enterprise_Contract_Renewal_Usecase</members>
        <name>AIUsecaseDefinition</name>
    </types>
    <types>
        <members>B2B_Renewal_Propensity_Model</members>
        <name>AIScoringModelDefinition</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval & Deployment

Retrieve and deploy `AIUsecaseDefinition` components using the Salesforce CLI:

```bash
# Retrieve all AIUsecaseDefinition records from the org
sf project retrieve start --metadata "AIUsecaseDefinition:*"

# Deploy a specific AIUsecaseDefinition
sf project deploy start --metadata "AIUsecaseDefinition:Enterprise_Contract_Renewal_Usecase"
```

## Senior Architect Best Practices & Gotchas

- **Bundle Schema, Model, and Automation:** An `AIUsecaseDefinition` is only valuable when its predictions drive action. Package the target [CustomField](/docs/metadata/custom-field-metadata-type/), `AIScoringModelDefinition`, `AIUsecaseDefinition`, and downstream [Flow](/docs/metadata/flow-metadata-type/) in the same SFDX package directory.
- **License Verification in CI:** Ensure your scratch org definition (`project-scratch-def.json`) includes the required Einstein or Industry Cloud add-on features before validating `AIUsecaseDefinition` deployments in automated pipelines.

> [!TIP]
> Link your `AIUsecaseDefinition` outputs to Agentforce [GenAiFunction](/docs/metadata/genai-function-metadata-type/) actions so autonomous agents can query the predicted score and recommended next steps during live customer conversations.
