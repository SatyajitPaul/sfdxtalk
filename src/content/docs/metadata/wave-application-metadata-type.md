---
title: "WaveApplication Metadata Type in SFDX"
description: "Configure and deploy WaveApplication metadata in Salesforce to manage CRM Analytics apps, asset permissions, folder sharing, and lifecycle versioning."
category: "metadata"
tags:
  - metadata
  - crm-analytics
  - wave
  - wave-application
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "WaveApplication defines organizational folder containers and access controls for CRM Analytics dashboards, recipes, datasets, lenses, and components."
faq:
  - q: "What is the primary role of WaveApplication in CRM Analytics?"
    a: "It represents an Analytics Studio application folder that organizes related dashboards, recipes, and datasets, and controls user and role access permissions."
  - q: "How do you retrieve WaveApplication using Salesforce CLI?"
    a: "Run sf project retrieve start with the metadata flag set to WaveApplication:YourAppName to fetch the application definition into the wave folder."
  - q: "How does WaveApplication handle folder sharing and security?"
    a: "It defines granular sharing entries specifying View, Edit, or Manage access levels for users, public groups, and roles directly within its XML declaration."
  - q: "Can a WaveApplication be deployed as a template for packaging?"
    a: "Yes, WaveApplications can be converted into WaveTemplateBundle metadata to allow automated instantiation across customer subscriber orgs."
related:
  - metadata/flexipage-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-waveapplication.md"
---

## Architectural Overview

The `WaveApplication` metadata type represents an application container (folder) within Salesforce CRM Analytics (formerly Einstein Analytics and Tableau CRM). Similar to classic report and dashboard folders, `WaveApplication` provides the fundamental boundary for organizing related business intelligence assets—including CRM Analytics dashboards, lenses, datasets, recipes, and dataflows.

Beyond simple grouping, `WaveApplication` enforces governance and access boundaries. It dictates which user roles, public groups, or individual users possess `View`, `Edit`, or `Manage` permissions over the contained analytics artifacts. By version-controlling `WaveApplication` metadata within Salesforce DX repositories, architects ensure consistent security governance across development sandboxes, staging environments, and production.

```mermaid
flowchart TD
    A["WaveApplication: Revenue_Analytics"] --> B["Folder Sharing Policies"]
    A --> C["WaveDashboard Assets"]
    A --> D["WaveDataflow & Recipe Assets"]
    A --> E["WaveLens Assets"]
    B --> F["Grants View Access to Sales Reps"]
    B --> G["Grants Manage Access to Analytics Admins"]
    C --> H["Embedded in Lightning FlexiPages"]
```

## Directory and File Conventions

In Salesforce DX project source format, `WaveApplication` files are located inside the `wave/` directory alongside their child dashboards and recipes.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `WaveApplication` |
| **SFDX Folder** | `force-app/main/default/wave/` |
| **File Suffix** | `.waveApplication-meta.xml` or `.wave` |

## Key Metadata Fields

The `WaveApplication` XML schema incorporates the following core structural attributes:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Display title rendered in the CRM Analytics Studio navigation panel. |
| `description` | `string` | No | Architectural description detailing purpose, target metrics, and ownership. |
| `folder` | `string` | Yes | Developer name representing the unique folder API identifier. |
| `shares` | `WaveFolderShare[]` | No | Array of access control entries defining permissions for users, roles, or groups. |
| `templateVersion` | `string` | No | Version string if the application was instantiated from an analytics template. |

> [!NOTE]
> All users, roles, and public groups declared in the `shares` block must exist in the target environment or the deployment will encounter permission mapping errors.

## Declarative XML and Package Manifest Examples

Below is an enterprise XML definition establishing an analytics folder for revenue operations:

```xml title="force-app/main/default/wave/Revenue_Operations.waveApplication-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<WaveApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Centralized revenue performance and sales pipeline analytics folder.</description>
    <folder>Revenue_Operations</folder>
    <masterLabel>Revenue Operations</masterLabel>
    <shares>
        <accessLevel>Manage</accessLevel>
        <sharedType>RoleAndSubordinates</sharedType>
        <sharedWith>VP_Sales</sharedWith>
    </shares>
    <shares>
        <accessLevel>View</accessLevel>
        <sharedType>AllPrmUsers</sharedType>
    </shares>
</WaveApplication>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Revenue_Operations</members>
        <name>WaveApplication</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `WaveApplication` definitions with standard Salesforce CLI commands:

```bash
# Retrieve a specific WaveApplication
sf project retrieve start --metadata WaveApplication:Revenue_Operations

# Retrieve all WaveApplications in the org
sf project retrieve start --metadata WaveApplication

# Deploy the application to an analytics staging org
sf project deploy start --metadata WaveApplication:Revenue_Operations --target-org analytics-stage
```

## Architect Best Practices and Gotchas

- **Deployment Order in CI/CD:** Always deploy `WaveApplication` before deploying child assets like `WaveDashboard`, `WaveDataflow`, or `WaveLens` that reference the application folder in their XML definitions.
- **Role and Group Mapping Failures:** In multi-org architectures, avoid hardcoding user IDs or sandbox-specific roles inside `shares`; leverage standard public groups to keep metadata portable across scratch orgs.
- **De-provisioning Safeguards:** Deleting a `WaveApplication` deletes all contained dashboards and lenses. Ensure backups are stored in version control before performing teardowns.

> [!TIP]
> Use separate Wave applications for development work and executive production dashboards to prevent in-progress drafts from appearing in executive feeds.
