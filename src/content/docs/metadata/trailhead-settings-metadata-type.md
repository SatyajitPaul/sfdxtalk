---
title: "TrailheadSettings Metadata Type in SFDX"
description: "Configure and deploy TrailheadSettings metadata in Salesforce to manage In-App Learning paths, badge tracking, and myTrailhead enablement configurations."
category: "metadata"
tags:
  - metadata
  - settings
  - trailhead
  - learning-paths
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "TrailheadSettings governs org-wide Trailhead and Sales Enablement integration, controlling In-App Learning panel visibility, badge synchronization, and myTrailhead content feeds."
faq:
  - q: "What does TrailheadSettings control in a Salesforce organization?"
    a: "It controls org-level configuration for Trailhead integration, including Learning Paths panel display, myTrailhead custom content synchronization, and user badge progress tracking."
  - q: "How do you retrieve TrailheadSettings using Salesforce CLI?"
    a: "Execute sf project retrieve start with the metadata flag set to Settings:Trailhead to generate the Trailhead.settings-meta.xml file in the settings directory."
  - q: "Can TrailheadSettings be configured inside scratch org definitions?"
    a: "Yes, define trailheadSettings inside the settings block of project-scratch-def.json to automatically activate Learning Paths during scratch org creation."
  - q: "What happens if Trailhead In-App Learning is disabled in production?"
    a: "The global Learning Paths panel and Trailhead recommendation widgets are hidden across Lightning Experience, preventing users from accessing assigned modules."
related:
  - metadata/permission-set-metadata-type
  - metadata/flexipage-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-trailheadsettings.md"
---

## Architectural Overview

The `TrailheadSettings` metadata type controls the administrative configuration of Trailhead and Sales Enablement (formerly myTrailhead) inside Salesforce Lightning Experience. As organizations embrace contextual onboarding and continuous learning, Salesforce exposes learning modules directly inside the CRM through the In-App Learning Paths panel and Guidance Center.

From an enterprise governance perspective, `TrailheadSettings` provides the programmatic switch to enable or restrict corporate learning feeds, track user badge progress against compliance requirements, and bind custom Trailhead subdomains to the CRM tenant. Automating these settings across sandbox and scratch org lifecycles ensures that end-user testing accurately reflects the guided training paths deployed to production.

```mermaid
flowchart TD
    A["Trailhead.settings-meta.xml"] --> B["enableTrailheadInAppLearning"]
    A --> C["enableBadgeTracking"]
    A --> D["enableTrailheadContentSync"]
    B --> E["Activates Learning Paths Panel in Lightning"]
    C --> F["Syncs User Badges to CRM User Profiles"]
    D --> G["Ingests myTrailhead / Enablement Modules"]
```

## Directory and File Conventions

In Salesforce DX project structure, `TrailheadSettings` is managed as a singleton setting file located in the `settings/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `Trailhead`) / `TrailheadSettings` |
| **SFDX Folder** | `force-app/main/default/settings/` |
| **File Name** | `Trailhead.settings-meta.xml` |
| **Scratch Org Setting Key** | `trailheadSettings` |

## Key Metadata Fields

The `TrailheadSettings` type exposes the following configuration elements in XML representation:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `enableTrailheadInAppLearning` | `boolean` | No | Activates the global Learning Paths side panel across all Lightning Experience pages. |
| `enableBadgeTracking` | `boolean` | No | Enables synchronization of completed badges and points to user identity records. |
| `enableTrailheadContentSync` | `boolean` | No | Authorizes automated synchronization of published custom trails and modules. |

> [!NOTE]
> Access to custom myTrailhead content also requires appropriate Sales Enablement license assignments and permission sets mapped to target user profiles.

## Declarative XML and Package Manifest Examples

Below is a standard declarative XML configuration for enterprise enablement environments:

```xml title="force-app/main/default/settings/Trailhead.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<TrailheadSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableBadgeTracking>true</enableBadgeTracking>
    <enableTrailheadContentSync>true</enableTrailheadContentSync>
    <enableTrailheadInAppLearning>true</enableTrailheadInAppLearning>
</TrailheadSettings>
```

### Scratch Org Configuration (`project-scratch-def.json`)

To enable learning panels automatically in ephemeral development environments, include the settings block:

```json title="config/project-scratch-def.json"
{
  "orgName": "Enablement Dev Org",
  "edition": "Developer",
  "settings": {
    "trailheadSettings": {
      "enableTrailheadInAppLearning": true,
      "enableBadgeTracking": true
    }
  }
}
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Trailhead</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `TrailheadSettings` using standard Salesforce CLI commands:

```bash
# Retrieve Trailhead settings from the target org
sf project retrieve start --metadata Settings:Trailhead

# Deploy Trailhead settings to production or staging sandbox
sf project deploy start --metadata Settings:Trailhead --target-org prod-ci
```

## Architect Best Practices and Gotchas

- **Dependency Ordering in CI/CD:** Deploy `Trailhead.settings-meta.xml` before deploying Lightning App Pages or FlexiPages that embed the Learning Paths panel or custom In-App Guidance components.
- **License Entitlement Gates:** If `enableTrailheadContentSync` is set to `true` in an org lacking active Sales Enablement licenses, the metadata deployment may succeed with a warning or fail depending on API release flags.
- **Testing Contextual Learning in Scratch Orgs:** Ensure that scratch orgs mirror production settings so that functional testers experience the same contextual help panel layout as standard business users.

> [!TIP]
> Combine `TrailheadSettings` with `UserEngagementSettings` to deliver a cohesive, end-to-end user onboarding journey across enterprise deployments.
