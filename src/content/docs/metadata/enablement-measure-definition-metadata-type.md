---
title: "EnablementMeasureDefinition Metadata Guide"
description: "Configure EnablementMeasureDefinition metadata in Salesforce to measure sales outcomes, track milestones, and automate revenue enablement program progress."
category: "metadata"
tags:
  - metadata
  - enablement
  - revenue-intelligence
  - sales-cloud
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "EnablementMeasureDefinition specifies quantitative metrics and object filters that automatically assess milestone completion in Salesforce Enablement."
faq:
  - q: "What does EnablementMeasureDefinition track in Salesforce?"
    a: "It defines metrics and milestones such as deals closed or calls logged that evaluate user progress toward completing Salesforce Enablement programs."
  - q: "Which objects can be monitored by an EnablementMeasureDefinition?"
    a: "Standard sales objects like Opportunity, Lead, Task, and Event as well as custom business objects can serve as source tracking entities."
  - q: "How is EnablementMeasureDefinition deployed between environments?"
    a: "It is deployed via SFDX source format in the enablementMeasureDefinitions folder using sf project deploy start."
related:
  - metadata/custom-object-metadata-type
  - metadata/flow-metadata-type
  - metadata/flexipage-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-enablementmeasuredefinition.md"
---

## Architectural Overview

`EnablementMeasureDefinition` is a foundational metadata component in Salesforce Sales Enablement and Revenue Intelligence. It encapsulates the automated rules and criteria used to track whether users have achieved specific business outcomes, such as closing their first deal, completing five discovery calls, or generating qualifying pipeline.

Architecturally, `EnablementMeasureDefinition` decouples outcome assessment from program curriculum. By standardizing quantitative business measures across objects, organizations can reuse identical measure definitions across multiple onboarding and skill-building programs without rewriting aggregation logic.

```mermaid
flowchart LR
    A["Source Object (e.g. Opportunity)"] --> B["EnablementMeasureDefinition"]
    B --> C["Filter Criteria & Aggregation"]
    C --> D["Enablement Milestone Progress"]
    D --> E["Enablement Program Completion"]
```

## Directory and File Conventions

`EnablementMeasureDefinition` components reside in the `enablementMeasureDefinitions` folder of an SFDX repository.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `EnablementMeasureDefinition` |
| **SFDX Folder** | `force-app/main/default/enablementMeasureDefinitions/` |
| **File Suffix** | `.enablementMeasureDefinition-meta.xml` |
| **API Support** | Metadata API, Tooling API |

## Key Metadata Fields

The `EnablementMeasureDefinition` schema outlines how source entity records are evaluated:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable label for the enablement measure. |
| `sourceObject` | `string` | Yes | API name of the target entity (e.g., `Opportunity`, `Task`). |
| `measureType` | `string` (Picklist) | Yes | Defines metric mode such as `Count`, `Sum`, or `Percentage`. |
| `aggregationType` | `string` (Picklist) | No | Mathematical aggregation applied over the selected field. |
| `status` | `string` (Picklist) | Yes | Lifecycle status of the measure: `Draft`, `Active`, or `Archived`. |

> [!NOTE]
> Custom fields evaluated inside `EnablementMeasureDefinition` filter logic must exist and be deployed before activating the measure in target orgs.

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition measuring deals closed above a minimum threshold:

```xml title="force-app/main/default/enablementMeasureDefinitions/Deals_Closed_Measure.enablementMeasureDefinition-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<EnablementMeasureDefinition xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>Closed Won Deals</masterLabel>
    <measureType>Count</measureType>
    <sourceObject>Opportunity</sourceObject>
    <status>Active</status>
</EnablementMeasureDefinition>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Deals_Closed_Measure</members>
        <name>EnablementMeasureDefinition</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy with `sf` CLI commands:

```bash
# Retrieve an EnablementMeasureDefinition
sf project retrieve start --metadata EnablementMeasureDefinition:Deals_Closed_Measure

# Deploy the measure definition
sf project deploy start --metadata EnablementMeasureDefinition:Deals_Closed_Measure
```

## Architect Best Practices and Gotchas

- **Schema Dependencies:** Always ensure the referenced `sourceObject` and any fields used in filtering criteria are deployed prior to deploying the measure definition.
- **Historical Data Backfill:** Modifying measure definitions in active programs does not retroactively re-aggregate historical records prior to the program assignment window.
- **Permissions and Field-Level Security:** Enablement users must have read access to the evaluated fields on the target object to prevent milestone synchronization stalls.

> [!TIP]
> Standardize measure naming conventions (e.g., `Measure_Opp_ClosedWon_Count`) across your CI/CD repository to support reusable program templates across global sales teams.
