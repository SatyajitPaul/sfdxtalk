---
title: "SalesWorkQueueSettings Metadata in SFDX"
description: "Configure SalesWorkQueueSettings metadata in SFDX to manage Sales Engagement work queues, cadence action prioritization, and automated queue refreshes."
category: "metadata"
tags:
  - metadata
  - sales-engagement
  - work-queue
  - settings
  - inside-sales
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "SalesWorkQueueSettings configures Sales Engagement Work Queue behaviors, controlling Cadence task sequencing, automated refreshes, and rep prioritization."
faq:
  - q: "What does SalesWorkQueueSettings control in Salesforce?"
    a: "It controls org-level settings for the Sales Engagement Work Queue, including cadence step prioritization, auto-refresh triggers, and action displays."
  - q: "Where is SalesWorkQueueSettings stored in source format?"
    a: "It is stored in the settings directory under the file name SalesWorkQueue.settings-meta.xml."
  - q: "What is the primary benefit of enabling cadence auto-refresh?"
    a: "It ensures that inside sales representatives automatically receive newly assigned or escalated cadence tasks without having to manually reload their browser queue."
  - q: "What licenses are required to deploy SalesWorkQueueSettings?"
    a: "It requires Sales Engagement or High Velocity Sales user licenses to be provisioned in the target Salesforce org."
related:
  - metadata/flow-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-salesworkqueuesettings.md"
---

## Architectural Overview

`SalesWorkQueueSettings` configures the organizational behavior of the **Sales Engagement (formerly High Velocity Sales / HVS) Work Queue**. Modern inside sales and business development teams manage high velocity outreach across thousands of inbound leads, prospect accounts, and renewal contacts via structured Sales Cadences.

The Work Queue serves as the mission control center docked in the Lightning Sales Console, guiding sales representatives through their next best steps: phone calls via Lightning Dialer/CTI, automated emails, LinkedIn InMail touches, and custom follow-up tasks. Through `SalesWorkQueueSettings`, Technical Architects declaratively manage real-time queue synchronization, task sorting algorithms, and automated completion behaviors across multi-environment deployment pipelines.

```mermaid
flowchart TD
    A["Sales Cadence Engine / Lead Assignment"] --> B["Sales Engagement Processing Layer"]
    B --> C["SalesWorkQueueSettings Policy"]
    C --> D["Auto-Refresh Triggers & Sorting Engine"]
    D --> E["Lightning Work Queue Component (Console Dock)"]
    E --> F["Call, Email, and Follow-Up Actions Executed"]
    F --> G["Cadence Advancement & Next Step Queued"]
```

## Directory and File Conventions

`SalesWorkQueueSettings` is maintained as a singleton file in the `settings` directory.

| Property | Value |
| :--- | :--- |
| **Directory Path** | `force-app/main/default/settings/` |
| **File Name** | `SalesWorkQueue.settings-meta.xml` |
| **XML Root Element** | `<SalesWorkQueueSettings>` |
| **API Version** | `68.0` |

## Key Metadata Fields

The settings file exposes switches governing cadence queue responsiveness and task presentation.

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `enableSalesWorkQueue` | `boolean` | No | Enables the Sales Engagement Work Queue across the organization. |
| `enableCadenceAutoRefresh` | `boolean` | No | Automatically updates the queue as prospects reach their next cadence step. |
| `enablePrioritizedList` | `boolean` | No | Sorts outreach tasks according to Einstein Lead Scoring or custom priority rules. |
| `enableSplitViewQueue` | `boolean` | No | Enables split-view navigation sidebars for rapid queue item cycling. |

## Declarative XML and Package Manifest Examples

The following sample configures an optimized Sales Engagement queue with auto-refresh and prioritized lists enabled:

```xml title="force-app/main/default/settings/SalesWorkQueue.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<SalesWorkQueueSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableCadenceAutoRefresh>true</enableCadenceAutoRefresh>
    <enablePrioritizedList>true</enablePrioritizedList>
    <enableSalesWorkQueue>true</enableSalesWorkQueue>
    <enableSplitViewQueue>true</enableSplitViewQueue>
</SalesWorkQueueSettings>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>SalesWorkQueue</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `SalesWorkQueueSettings` with the Salesforce CLI:

```bash
# Retrieve SalesWorkQueue settings
sf project retrieve start --metadata "Settings:SalesWorkQueue"

# Deploy settings to target org
sf project deploy start --source-dir force-app/main/default/settings/SalesWorkQueue.settings-meta.xml

# Validate settings deployment in staging
sf project deploy validate --metadata "Settings:SalesWorkQueue"
```

## Architect Best Practices and Gotchas

- **Sales Engagement License Dependency:** Target sandboxes must have the Sales Engagement feature provisioned. Deploying into an org without active Sales Engagement licenses produces a deployment failure (`Feature SalesWorkQueue is not enabled`).
- **Browser Performance Optimization:** While `enableCadenceAutoRefresh` keeps reps up to date, very high-volume orgs with hundreds of concurrent reps should monitor client-side browser performance to ensure frequent background polling does not interfere with CTI audio streams.
- **Console Layout Integration:** Ensure that console FlexiPage layouts have the Work Queue component placed in a prominent subtab or utility bar so reps can access their daily action list seamlessly.

> [!TIP]
> Combine `enablePrioritizedList` with Einstein Lead Scoring so high-converting prospects automatically float to the top of daily sales queues.
