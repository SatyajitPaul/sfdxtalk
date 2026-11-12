---
title: "MacroSettings Metadata Type in SFDX"
description: "Configure MacroSettings metadata to govern bulk macro execution, folder sharing, and console shortcuts across Sales and Service Cloud."
category: "metadata"
tags:
  - metadata
  - settings
  - macros
  - productivity
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "MacroSettings metadata controls enterprise automation features including bulk macro processing, enhanced folder sharing, and keyboard shortcuts in console apps."
faq:
  - q: "Where is MacroSettings stored in source format?"
    a: "It resides in the settings directory within the file Macro.settings-meta.xml."
  - q: "What does the enableBulkMacros setting do?"
    a: "It permits agents to execute a single macro across multiple records simultaneously from list views in Service and Sales Console."
  - q: "How does enableMacroFolderSharing improve governance?"
    a: "It replaces flat public sharing with hierarchical folder-based permissions for organizing and restricting macro access."
  - q: "Do macros require specific object permissions?"
    a: "Yes, users need Read and Create access on the Macro standard object in addition to org settings enablement."
related:
  - metadata/flexipage-metadata-type
  - metadata/permission-set-metadata-type
  - metadata/profile-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-macrosettings.md"
---

## Architectural Overview

`MacroSettings` configures organization-wide behaviors for Salesforce Macros. Macros automate repetitive agent workflows—such as inserting standard email templates, updating case statuses, logging call outcomes, and creating follow-up tasks—with a single click or keyboard shortcut in the Service and Sales Console.

From an architect's perspective, `MacroSettings` establishes enterprise productivity and governance policies. Activating bulk macros allows support reps to resolve dozens of related cases simultaneously, while enabling folder sharing prevents macro sprawl by allowing administrators to organize macros into role-restricted folders with fine-grained view and edit permissions.

```mermaid
flowchart TD
    A["Macro.settings-meta.xml"] --> B["Macro Execution Engine"]
    B --> C["Bulk Macro Execution on List Views"]
    B --> D["Hierarchical Folder Sharing & Security"]
    B --> E["Console Keyboard Shortcut Integration"]
```

## Directory and File Conventions

`MacroSettings` is a singleton Settings metadata asset stored in the `settings` directory:

| Property | Value |
| :--- | :--- |
| **Directory Name** | `settings` |
| **File Name** | `Macro.settings-meta.xml` |
| **Root XML Element** | `<MacroSettings>` |
| **API Version** | `68.0` |

## Key Metadata Fields

The `MacroSettings` schema provides governance controls:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `enableBulkMacros` | `boolean` | Allows agents to execute macros across multiple selected list view records at once. |
| `enableMacroFolderSharing` | `boolean` | Activates enhanced folder-based sharing and access control for macros. |
| `enableMacroSharing` | `boolean` | Permits individual users to share personal macros with other team members. |
| `enableMacroShortcuts` | `boolean` | Enables customizable hotkeys and keyboard shortcuts to launch macros in console apps. |

> [!TIP]
> Always enable `<enableMacroFolderSharing>true</enableMacroFolderSharing>` in enterprise environments. Folder sharing allows establishing departmental folders (such as Billing Support vs. Technical Support) so users only see macros relevant to their daily workflows.

## Declarative XML and Package Manifest Examples

Below is an enterprise configuration of `Macro.settings-meta.xml`:

```xml title="force-app/main/default/settings/Macro.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<MacroSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableBulkMacros>true</enableBulkMacros>
    <enableMacroFolderSharing>true</enableMacroFolderSharing>
    <enableMacroSharing>true</enableMacroSharing>
    <enableMacroShortcuts>true</enableMacroShortcuts>
</MacroSettings>
```

### Manifest Definition (`package.xml`)

Include the setting in `package.xml`:

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Macro</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Use the Salesforce CLI to deploy macro settings:

```bash
# Retrieve Macro settings
sf project retrieve start --metadata Settings:Macro

# Deploy macro settings across environments
sf project deploy start --source-dir force-app/main/default/settings/Macro.settings-meta.xml
```

## Senior Architect Deployment Best Practices and Gotchas

- **Bulk Macro Irreversibility:** Because bulk macros execute database modifications across up to 50 records in parallel, ensure adequate validation rules and apex triggers are in place to prevent bulk data corruption.
- **Folder Migration:** When migrating from flat macro sharing to enhanced folder sharing (`enableMacroFolderSharing = true`), existing unfiled public macros must be reorganized into folders, which can alter URL references in custom documentation.
- **Console Utility Bar Placement:** Enabling macro settings is only half the implementation. For users to access macros efficiently, add the **Macros** standard component to the Lightning Console Utility Bar in your target `CustomApplication` metadata.

> [!WARNING]
> Disabling `<enableBulkMacros>` will hide the "Run Macro" button from all standard list views, preventing agents from batch processing mass customer notifications.
