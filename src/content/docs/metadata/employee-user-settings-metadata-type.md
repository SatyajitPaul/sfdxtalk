---
title: "EmployeeUserSettings Metadata in SFDX"
description: "Configure EmployeeUserSettings metadata in Salesforce to govern automated provisioning, employee record synchronization, and user identity lifecycles."
category: "metadata"
tags:
  - metadata
  - settings
  - employee-user
  - identity
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "EmployeeUserSettings governs automated user provisioning and profile synchronization between Employee data records and standard Salesforce User accounts."
faq:
  - q: "What is the purpose of EmployeeUserSettings in Salesforce?"
    a: "It controls synchronization and user provisioning between the standard Employee object and Salesforce User records for internal HR workflows."
  - q: "How is EmployeeUserSettings organized in source format?"
    a: "It is stored under force-app/main/default/settings/ as EmployeeUser.settings-meta.xml and retrieved as Settings:EmployeeUser."
  - q: "Does EmployeeUserSettings require Work.com or HR Service Center?"
    a: "It is commonly used with Work.com and HR Service Center, but applies anywhere the standard Employee data model integrates with core Salesforce Users."
related:
  - metadata/profile-metadata-type
  - metadata/permission-set-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-employeeusersettings.md"
---

## Architectural Overview

`EmployeeUserSettings` is an enterprise settings metadata type that bridges human resources data management with Salesforce identity and access management (IAM). It governs how standard `Employee` object records synchronize changes and automatically provision or update standard `User` accounts across the platform.

In modern enterprise architectures, human capital management (HCM) systems like Workday or SAP SuccessFactors replicate worker records into the Salesforce `Employee` standard object. `EmployeeUserSettings` provides declarative controls ensuring that worker onboarding, role changes, contact updates, and terminations cascade cleanly into Salesforce user accounts without bespoke batch Apex triggers.

```mermaid
flowchart LR
    A["HR / HCM Ingestion"] --> B["Employee Standard Object"]
    B --> C["EmployeeUserSettings Sync Engine"]
    C --> D["Salesforce User Account"]
    C --> E["Permission & Profile Alignment"]
```

## Directory and File Conventions

`EmployeeUserSettings` follows standard Salesforce settings conventions. It is saved in the `settings` directory using the `EmployeeUser` name prefix.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `EmployeeUser`) / `EmployeeUserSettings` |
| **SFDX Folder** | `force-app/main/default/settings/` |
| **File Name** | `EmployeeUser.settings-meta.xml` |
| **Scratch Org Key** | `employeeUserSettings` |

## Key Metadata Fields

The `EmployeeUserSettings` XML structure contains settings that regulate provisioning rules and automatic synchronization:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `enableEmployeeUserSync` | `boolean` | Yes | Controls bi-directional synchronization between Employee records and Users. |
| `enableAutoUserProvisioning` | `boolean` | No | Automatically provisions a corresponding User record when an Employee is created. |
| `profileName` | `string` | No | Default Profile assigned to newly auto-provisioned users. |

> [!NOTE]
> Auto-provisioning consumes available Salesforce user licenses. Ensure your scratch org definitions or target environments have sufficient active user licenses before enabling automatic provisioning.

## Declarative XML and Package Manifest Examples

Below is an example declarative settings XML configuration:

```xml title="force-app/main/default/settings/EmployeeUser.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<EmployeeUserSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableAutoUserProvisioning>false</enableAutoUserProvisioning>
    <enableEmployeeUserSync>true</enableEmployeeUserSync>
</EmployeeUserSettings>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>EmployeeUser</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `EmployeeUserSettings` using the `sf` CLI:

```bash
# Retrieve EmployeeUser settings
sf project retrieve start --metadata Settings:EmployeeUser

# Deploy EmployeeUser settings
sf project deploy start --metadata Settings:EmployeeUser
```

## Architect Best Practices and Gotchas

- **Identity Lifecycle Integrity:** Avoid enabling `enableAutoUserProvisioning` without strict email address validation on the inbound HCM data feed to prevent duplicate user account generation.
- **Deactivation Handling:** When an employee record is marked inactive or terminated, verify that your synchronization settings downgrade user access or deactivate the corresponding User record in compliance with SOC2 access governance.
- **Profile Dependencies:** If `profileName` is specified in the settings metadata, the referenced Profile must exist in the target org prior to deployment.

> [!TIP]
> Pair `EmployeeUserSettings` with [PermissionSet](/docs/metadata/permission-set-metadata-type/) group assignments driven by automation to manage fine-grained functional rights rather than monolithic Profiles.
