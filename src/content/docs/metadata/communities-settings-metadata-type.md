---
title: "CommunitiesSettings Metadata Type in SFDX"
description: "Deploy and manage CommunitiesSettings metadata in Salesforce SFDX to enable Experience Cloud sites, partner user visibility, and guest user security."
category: "metadata"
tags:
  - metadata
  - experience-cloud
  - communities-settings
  - security
  - package-xml
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "CommunitiesSettings represents org-wide Experience Cloud configuration, controlling master network enablement, OWD external sharing visibility, partner user role hierarchies, and guest security policies."
faq:
  - q: "How is CommunitiesSettings referenced in package.xml and SFDX source format?"
    a: "In package.xml, specify Settings as the type and Communities as the member, which maps to force-app/main/default/settings/Communities.settings-meta.xml."
  - q: "Can enableNetworksEnabled be disabled once Experience Cloud is turned on?"
    a: "No. Once enableNetworksEnabled is set to true in an org, it is permanent and cannot be disabled via Metadata API or Setup."
  - q: "What does numberOfPartnerUserRoles control in CommunitiesSettings?"
    a: "Wait—in Experience Cloud, partner account role hierarchy depth (1, 2, or 3 roles: Executive, Manager, User) is governed at the org level, directly impacting total role count governor limits."
  - q: "How does CommunitiesSettings affect Guest User record ownership and security?"
    a: "CommunitiesSettings includes org-wide guest user security flags such as enableGuestRecordReassignOrgPref, which automatically reassigns records created by guest users to a default internal owner."
related:
  - metadata/network-metadata-type
  - metadata/experience-bundle-metadata-type
  - metadata/profile-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-communitiessettings.md"
---

## Architectural Overview

The `CommunitiesSettings` metadata type (`Communities.settings-meta.xml`) is the org-wide foundation for **Salesforce Experience Cloud** (formerly Communities). Before a single [Network](/docs/metadata/network-metadata-type/) or [ExperienceBundle](/docs/metadata/experience-bundle-metadata-type/) can be deployed to an org, `enableNetworksEnabled` in `CommunitiesSettings` must be `true`.

Beyond basic Experience Cloud enablement, `CommunitiesSettings` controls critical security and sharing architecture boundaries across all sites in the org—including whether records created by unauthenticated Guest Users are automatically reassigned to an internal owner (`enableGuestRecordReassignOrgPref`), whether external users are restricted by Account Role Optimization (ARO) and role depth, and whether Partner Super User access (`enablePartnerSuperUserAccess`) is permitted.

```mermaid
flowchart TD
    A["CommunitiesSettings (Communities.settings-meta.xml)"] --> B["enableNetworksEnabled = true"]
    B --> C["Guest User Security (enableGuestRecordReassignOrgPref)"]
    B --> D["Partner Hierarchy & Super User Access"]
    B --> E["Unlocks Network & ExperienceBundle Deployments"]
```

## Directory Location and File Suffix

In Salesforce DX projects, `CommunitiesSettings` is stored in the `settings` directory as `Communities.settings-meta.xml`.

| Property | Value |
| :--- | :--- |
| **Directory Path (SFDX)** | `force-app/main/default/settings/` |
| **File Name (SFDX)** | `Communities.settings-meta.xml` |
| **Classic Metadata File** | `settings/Communities.settings` |
| **Package.xml Type & Member** | `<name>Settings</name>` with `<members>Communities</members>` |

## Key Metadata Fields

The following table highlights the most architecturally significant fields on `CommunitiesSettings` in API version `68.0` (Winter '27):

| Field Name | Field Type | Architectural Description |
| :--- | :--- | :--- |
| `enableNetworksEnabled` | `boolean` | Master switch that enables Digital Experiences (Experience Cloud) in the org. Required before deploying any `Network` or `CustomSite`. |
| `enableGuestRecordReassignOrgPref` | `boolean` | Security best practice: automatically reassigns any record created by an unauthenticated Guest User to a designated default internal owner. |
| `enableOwdBasedExtUserVisibility` | `boolean` | Enforces Organization-Wide Default (OWD) external user visibility rules across Experience Cloud sites. |
| `enablePartnerSuperUserAccess` | `boolean` | Allows designated partner users with Partner Super User permission to view data owned by peers at the same role level or below on their Partner Account. |
| `canModerateAllFeedPosts` | `boolean` | Allows community moderators to moderate all feed posts visible in the site. |
| `enableCommunityWorkspaces` | `boolean` | Enables the modern Experience Workspaces management interface in Setup. |
| `enableSubdomain` | `boolean` | Enables Experience Cloud enhanced domains/subdomains for site URLs. |

## Declarative Metadata Example

The following `Communities.settings-meta.xml` enables Experience Cloud, enforces Guest User record reassignment (`<enableGuestRecordReassignOrgPref>true</enableGuestRecordReassignOrgPref>`), and enables OWD-based external user visibility:

```xml title="force-app/main/default/settings/Communities.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<CommunitiesSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <canModerateAllFeedPosts>true</canModerateAllFeedPosts>
    <enableCommunityWorkspaces>true</enableCommunityWorkspaces>
    <enableGuestRecordReassignOrgPref>true</enableGuestRecordReassignOrgPref>
    <enableNetworksEnabled>true</enableNetworksEnabled>
    <enableOwdBasedExtUserVisibility>true</enableOwdBasedExtUserVisibility>
    <enablePartnerSuperUserAccess>true</enablePartnerSuperUserAccess>
</CommunitiesSettings>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Communities</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval and Deployment

Retrieve and deploy `CommunitiesSettings` using the Salesforce CLI (`sf`):

```bash
# Retrieve CommunitiesSettings into force-app/main/default/settings/Communities.settings-meta.xml
sf project retrieve start --metadata Settings:Communities

# Deploy CommunitiesSettings to the target org
sf project deploy start --metadata Settings:Communities
```

## Architect Best Practices and Gotchas

> [!WARNING]
> Never set `<enableGuestRecordReassignOrgPref>false</enableGuestRecordReassignOrgPref>` in production. Unauthenticated Guest Users should never remain the persistent `OwnerId` of records in Salesforce, as doing so complicates sharing calculations and violates Guest User security hardening standards.

- **Deployment Order in CI/CD:** Always ensure `Settings:Communities` is enabled in your `project-scratch-def.json` (`"communitiesSettings": { "enableNetworksEnabled": true }`) or deployed before [Network](/docs/metadata/network-metadata-type/), `CustomSite`, `CMSConnectSource`, and [ExperienceBundle](/docs/metadata/experience-bundle-metadata-type/) metadata.
- **External Sharing & User Visibility:** Enabling `enableOwdBasedExtUserVisibility` recalculates external user visibility across portals. Schedule changes to this setting during off-peak maintenance windows in orgs with ratusan thousands of Customer Community Plus or Partner Community users.
