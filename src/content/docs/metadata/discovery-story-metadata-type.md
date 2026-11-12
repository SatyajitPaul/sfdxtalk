---
title: "DiscoveryStory Metadata Type in SFDX"
description: "Configure and deploy DiscoveryStory metadata in Salesforce DX to manage CRM Analytics and Einstein Discovery predictive story definitions and payloads."
category: metadata
tags: [metadata, einstein-discovery, crm-analytics, sf-cli, package-xml]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: advanced
tldr: "The DiscoveryStory metadata type represents an Einstein Discovery story configuration and its accompanying JSON setup payload. It links CRM Analytics datasets to predictive outcome variables, classification thresholds, and automated model training specifications."
faq:
  - q: "What files make up a DiscoveryStory component in Salesforce DX?"
    a: "A DiscoveryStory component consists of a pair of files in the discovery directory: a .story file containing the JSON story configuration payload and a .story-meta.xml file containing the outer metadata properties such as application, masterLabel, and outcome."
  - q: "Does deploying a DiscoveryStory automatically train the predictive model in the target org?"
    a: "Deploying DiscoveryStory creates the story configuration and metadata bindings, but the target org must already contain the referenced WaveDataset with populated data before Einstein Discovery can execute story analysis and generate a DiscoveryAIModel."
  - q: "How does DiscoveryStory relate to WaveApplication in Metadata API?"
    a: "Every DiscoveryStory must belong to a CRM Analytics folder represented by a WaveApplication developer name in the application field. If the target WaveApplication does not exist, the deployment fails with a missing dependency error."
  - q: "What outcome types are supported in the DiscoveryStory outcome element?"
    a: "The DiscoveryStory outcome element supports Count,Binary,Continuous,and Multiclass classification types,corresponding to regression,two-class classification,and multi-class predictive modeling use cases."
related:
  - metadata/custom-object-metadata-type
  - metadata/flow-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-discoverystory.md"
---

## Overview

The `DiscoveryStory` metadata type represents an Einstein Discovery story definition in CRM Analytics (formerly Tableau CRM / Wave Analytics). Architecturally, a `DiscoveryStory` bridges curated analytical datasets (`WaveDataset`) and deployable predictive models (`DiscoveryAIModel`). It defines the target outcome variable (`outcome`), optimization direction (`goal` such as `Maximize` or `Minimize`), model algorithm preferences, and explanatory variables analyzed during automated machine learning.

In Salesforce DX projects, `DiscoveryStory` is stored as a paired metadata component inside the `force-app/main/default/discovery/` directory: a `.story-meta.xml` descriptor file and a companion `.story` file containing the raw JSON analytical specification.

```mermaid
flowchart LR
    A["WaveApplication (CRM Analytics App)"] --> B["WaveDataset (Source Data)"]
    B --> C["DiscoveryStory (.story + .story-meta.xml)"]
    C --> D["DiscoveryAIModel (Trained Model)"]
    D --> E["DiscoveryGoal (Prediction Definition)"]
    E --> F["Flow & Lightning Record Pages"]
```

## Directory and File Suffix Reference

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `DiscoveryStory` |
| **SFDX Source Directory** | `force-app/main/default/discovery/` |
| **Content File Suffix** | `.story` (JSON story configuration payload) |
| **Metadata File Suffix** | `.story-meta.xml` |
| **Package Manifest Type** | `DiscoveryStory` |
| **API Version Introduced** | v41.0 (Updated through `68.0` in Winter '27) |

## Key Metadata Fields

The `.story-meta.xml` file defines the high-level container, dataset reference, and outcome variable, while the `.story` file holds the JSON body (`content`).

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `application` | `string` | Yes | The developer name of the CRM Analytics app (`WaveApplication`) that contains the story. |
| `masterLabel` | `string` | Yes | The user-facing name of the Einstein Discovery story displayed in Analytics Studio (up to 80 characters). |
| `outcome` | `DiscoveryStoryOutcome` | Yes | Nested configuration specifying the target variable (`field`), label, data `type` (`Binary`, `Continuous`, `Count`, `Multiclass`), `goal` (`Maximize`, `Minimize`, `None`), and `successValue` / `failureValue`. |
| `sourceType` | `DiscoveryStorySourceType` | Yes | Origin of the story training data, typically `AnalyticsDataset` or `Report`. |
| `sourceContainer` | `string` | No | The developer name of the source `WaveDataset` or `Report` used to train the story. |
| `classificationThreshold` | `double` | No | Probability cutoff between `0.0` and `1.0` used to classify binary outcomes into positive or negative predictions. |
| `autoselectColumns` | `boolean` | No | When `true`, Einstein Discovery automatically selects the most statistically correlated columns from the dataset. |
| `validationType` | `DiscoveryStoryValidationType` | No | Validation strategy applied during model evaluation (`None`, `RandomRatio`, or `CrossValidation`). |
| `content` | `base64Binary` | No | Base64-encoded JSON payload stored directly inside the companion `.story` file in SFDX format. |

### `DiscoveryStoryOutcome` Subfields

| Subfield | Type | Description |
| :--- | :--- | :--- |
| `field` | `string` | API name of the dataset column being predicted (for example, `Is_Churned` or `Deal_Cycle_Days`). |
| `label` | `string` | Human-readable display label for the outcome variable. |
| `type` | `DiscoveryOutcomeType` | Statistical type of the target variable: `Binary`, `Continuous`, `Count`, or `Multiclass`. |
| `goal` | `DiscoveryGoalOutcomeType` | Optimization objective: `Maximize`, `Minimize`, or `None`. |
| `successValue` | `string` | Value representing the positive class when `type` is `Binary` (for example, `true` or `Closed Won`). |
| `failureValue` | `string` | Value representing the negative class when `type` is `Binary` (for example, `false` or `Closed Lost`). |

## Declarative XML and Source Examples

### 1. Metadata Descriptor (`Customer_Churn_Story.story-meta.xml`)

```xml title="force-app/main/default/discovery/Customer_Churn_Story.story-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<DiscoveryStory xmlns="http://soap.sforce.com/2006/04/metadata">
    <application>Revenue_Intelligence_App</application>
    <autoselectColumns>false</autoselectColumns>
    <classificationThreshold>0.62</classificationThreshold>
    <masterLabel>Enterprise Customer Churn Story</masterLabel>
    <outcome>
        <failureValue>Retained</failureValue>
        <field>Churn_Status</field>
        <goal>Minimize</goal>
        <label>Customer Churn Status</label>
        <successValue>Churned</successValue>
        <type>Binary</type>
    </outcome>
    <sourceContainer>Enterprise_Account_Health_DS</sourceContainer>
    <sourceType>AnalyticsDataset</sourceType>
    <validationType>CrossValidation</validationType>
</DiscoveryStory>
```

### 2. Companion Story Payload (`Customer_Churn_Story.story`)

```json title="force-app/main/default/discovery/Customer_Churn_Story.story"
{
  "setup": {
    "algorithmType": "Xgboost",
    "maxCorrelation": 0.85,
    "fields": [
      {
        "name": "Annual_Contract_Value",
        "type": "Continuous"
      },
      {
        "name": "Support_Escalations_90d",
        "type": "Continuous"
      },
      {
        "name": "Executive_Sponsor_Present",
        "type": "Categorical"
      },
      {
        "name": "Product_Adoption_Tier",
        "type": "Categorical"
      }
    ]
  }
}
```

### 3. Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Revenue_Intelligence_App</members>
        <name>WaveApplication</name>
    </types>
    <types>
        <members>Enterprise_Account_Health_DS</members>
        <name>WaveDataset</name>
    </types>
    <types>
        <members>Customer_Churn_Story</members>
        <name>DiscoveryStory</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval and Deployment Commands

Use the Salesforce CLI (`sf`) to retrieve and deploy `DiscoveryStory` metadata across environments:

```bash
# Retrieve a specific Einstein Discovery story and its JSON payload
sf project retrieve start --metadata DiscoveryStory:Customer_Churn_Story

# Retrieve all Einstein Discovery stories in the org
sf project retrieve start --metadata "DiscoveryStory:*"

# Validate deployment of the story alongside its parent WaveApplication
sf project deploy start \
  --source-dir force-app/main/default/discovery/Customer_Churn_Story.story-meta.xml \
  --dry-run
```

> [!NOTE]
> `DiscoveryStory` requires CRM Analytics / Einstein Predictions licenses (`EinsteinAnalyticsPlus` or `EinsteinDiscovery` permission set licenses) enabled in the target scratch org or sandbox.

## Architect Best Practices and Deployment Gotchas

- **Dataset Data vs. Metadata Dependency:** Deploying a `WaveDataset` via Metadata API only deploys the dataset container, not the underlying parquet/edgemart rows. If you deploy a `DiscoveryStory` to a freshly provisioned sandbox before running the CRM Analytics Dataflow or Recipe (`WaveRecipe`) that populates `sourceContainer`, the story will open in Analytics Studio with an unpopulated dataset warning.
- **Avoid Hardcoded Dataset Version IDs in `.story` JSON:** When exporting a `.story` file from a sandbox, inspect the JSON payload to ensure it does not contain org-specific `0Fb` (`WaveDataset`) or `0Fc` version record IDs. Rely on `sourceContainer` in `.story-meta.xml` so the platform resolves the dataset by developer name.
- **Decouple Story Exploration from Model Deployment:** In enterprise CI/CD pipelines, data scientists iterate on `DiscoveryStory` in a dedicated Analytics Staging sandbox with masked production data, while production deployments promote the resulting `DiscoveryAIModel` and `DiscoveryGoal` (Prediction Definition) used by [Flow](/docs/metadata/flow-metadata-type/) and Apex scoring.

> [!TIP]
> Set `<validationType>CrossValidation</validationType>` (k-fold cross-validation) rather than `RandomRatio` when training stories on datasets with fewer than 50,000 rows to reduce variance in model accuracy metrics.

