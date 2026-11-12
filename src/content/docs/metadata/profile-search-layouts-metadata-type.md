---
title: "ProfileSearchLayouts Metadata in SFDX"
description: "Configure ProfileSearchLayouts metadata in Salesforce to customize search results and lookup dialog columns by user profile across standard and custom objects."
category: "metadata"
tags:
  - metadata
  - profiles
  - search-layouts
  - global-search
  - ui-config
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "ProfileSearchLayouts configures the specific columns displayed in search results and lookup dialogs tailored to individual user profiles and roles."
faq:
  - q: "What is the purpose of ProfileSearchLayouts in Salesforce?"
    a: "It specifies which fields appear in search results, lookup dialogs, and instant search results for users belonging to a specific profile."
  - q: "Where are ProfileSearchLayouts managed in SFDX projects?"
    a: "They are managed in search layout configurations or embedded within Profile metadata definitions."
  - q: "Do ProfileSearchLayouts bypass field-level security?"
    a: "No, if a user lacks read access to a field included in the search layout, that column is rendered blank or omitted."
  - q: "Can ProfileSearchLayouts be configured for custom objects?"
    a: "Yes, profile-specific search layouts are supported for both standard and custom objects in Salesforce."
related:
  - metadata/profile-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-profilesearchlayouts.md"
---

## Architectural Overview

Global Search and lookup dialogues represent the primary discovery interface for Salesforce users. However, different organizational roles prioritize different data points: Sales representatives searching for Accounts need to see Annual Revenue, Industry, and Owner, while Compliance officers need Tax ID, Legal Entity Type, and Sanction Status.

The `ProfileSearchLayouts` metadata type defines profile-specific column presentations for search results, lookup dialogues, and filter fields across standard and custom objects.

```mermaid
flowchart LR
    A["User Submits Global Search Query"] --> B["Salesforce Search Engine Matches Records"]
    B --> C["ProfileSearchLayouts Evaluates User Profile"]
    C --> D["Applies Profile-Specific Field Columns"]
    D --> E["Displays Tailored Search Results Grid"]
```

Customizing search layouts by profile reduces time-to-record discovery, streamlines user workflows, and optimizes data visibility across business functions.

## Directory and File Conventions

In SFDX source projects, `ProfileSearchLayouts` metadata is stored in search layout definitions or profile structures:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `ProfileSearchLayouts` |
| **SFDX Directory** | `force-app/main/default/profileSearchLayouts/` / `profiles/` |
| **File Suffix** | `.profileSearchLayouts-meta.xml` / `.profile-meta.xml` |
| **Parent Objects** | Binds to standard or custom sObjects and a target `Profile` |

## Key Metadata Fields

The XML schema of `ProfileSearchLayouts` defines layout types and displayed fields:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `profile` | `string` | Yes | Developer name of the [Profile](/docs/metadata/profile-metadata-type/) receiving this search view. |
| `fields` | `string[]` | Yes | List of field API names displayed in search results columns. |
| `searchLayoutType` | `string` | Yes | Type of layout: `SearchResults`, `LookupDialog`, or `LookupPhoneDialog`. |

> [!NOTE]
> Search layout fields must be accessible to users; otherwise, fields will appear blank or be hidden by field-level security.

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition configuring Case search results for a Service profile:

```xml title="force-app/main/default/profileSearchLayouts/Case_Support_Search.profileSearchLayouts-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ProfileSearchLayouts xmlns="http://soap.sforce.com/2006/04/metadata">
    <fields>CaseNumber</fields>
    <fields>Subject</fields>
    <fields>Status</fields>
    <fields>Priority</fields>
    <fields>Contact.Name</fields>
    <profile>Custom_Support_Agent</profile>
</ProfileSearchLayouts>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Case_Support_Search</members>
        <name>ProfileSearchLayouts</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `ProfileSearchLayouts` via the Salesforce CLI:

```bash
# Retrieve search layout metadata
sf project retrieve start --metadata ProfileSearchLayouts

# Deploy search layouts to target environment
sf project deploy start --metadata ProfileSearchLayouts

# Validate deployment into sandbox
sf project deploy validate --metadata ProfileSearchLayouts
```

## Architect Best Practices and Gotchas

- **Field Existence Validation:** Every field API name specified in `<fields>` must exist on the target [CustomObject](/docs/metadata/custom-object-metadata-type/). Renaming or deleting a custom field without updating search layouts causes deployment failures.
- **Column Density and Readability:** Limit search results columns to 6 or 7 key fields. Excessive columns cause horizontal scrolling and degrade readability on compact screens.
- **Secondary Fields for Instant Search:** Ensure key identifying fields (such as Account Name or Phone) are positioned early in the field list so instant search popovers display meaningful identifiers.

> [!TIP]
> Ensure polymorphic relationship fields (such as `WhoId` or `WhatId` on Tasks) are explicitly tested across search dialogs to confirm lookup resolution.
