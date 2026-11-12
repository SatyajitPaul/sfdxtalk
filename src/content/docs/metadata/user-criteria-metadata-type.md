---
title: "UserCriteria Metadata Type in SFDX"
description: "Configure and deploy UserCriteria metadata in Salesforce to govern Experience Cloud audience targeting, moderation rules, and member categorization."
category: "metadata"
tags:
  - metadata
  - experience-cloud
  - moderation
  - audience-targeting
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "UserCriteria defines membership, profile, and account age conditions for Experience Cloud moderation rules and dynamic community audience targeting."
faq:
  - q: "What does UserCriteria configure in Salesforce Experience Cloud?"
    a: "It establishes conditional logic based on user types, profiles, permission sets, and account creation age to identify specific groups of community members."
  - q: "How do moderation rules leverage UserCriteria?"
    a: "Moderation rules evaluate incoming posts against UserCriteria to flag or freeze suspicious content authored by newly created or unverified community accounts."
  - q: "How do you retrieve UserCriteria using the Salesforce CLI?"
    a: "Execute sf project retrieve start with the metadata flag set to UserCriteria to pull all criteria definitions into the userCriteria directory."
  - q: "Can UserCriteria reference custom user types or guest users?"
    a: "Yes, UserCriteria can target Guest users, Customer Community users, Partner Community members, or internal Standard profiles."
related:
  - metadata/profile-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-usercriteria.md"
---

## Architectural Overview

The `UserCriteria` metadata type defines declarative user filtering logic utilized across Salesforce Experience Cloud for content moderation, community protection, and dynamic audience personalization. High-traffic public portals and partner communities face significant threats from spam bots, malicious links, and unauthorized data disclosure.

Rather than authoring complex Apex triggers to inspect every community comment or feed item, architects deploy `UserCriteria` rules that classify members based on user profile, member type (Internal, Customer, Partner, Guest), and membership age in seconds. These criteria are attached directly to community moderation rules to automatically flag, hold for review, or block suspicious content before it becomes visible to other users.

```mermaid
flowchart TD
    A["Community Feed Post Created"] --> B["Moderation Engine Evaluates Rules"]
    B --> C["UserCriteria: New_External_Members"]
    C --> D{"Account Age < 86,400s?"}
    D -- Yes --> E["Hold Post for Moderator Review"]
    D -- No --> F["Publish Post Immediately"]
```

## Directory and File Conventions

In Salesforce DX projects, `UserCriteria` files are saved within the `userCriteria/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `UserCriteria` |
| **SFDX Folder** | `force-app/main/default/userCriteria/` |
| **File Suffix** | `.userCriteria-meta.xml` |

## Key Metadata Fields

The `UserCriteria` XML definition contains the following parameters:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable label displayed in Experience Workspaces moderation settings. |
| `description` | `string` | No | Architectural description outlining intended moderation or targeting scope. |
| `creationAgeInSeconds` | `integer` | No | Threshold age in seconds since member creation to identify newly onboarded users. |
| `userTypes` | `string[]` | No | Target member classifications, such as `Standard`, `Customer`, `Partner`, or `Guest`. |
| `profiles` | `string[]` | No | Array of Profile API names matching the criteria conditions. |

> [!NOTE]
> When defining profile names inside `UserCriteria`, ensure corresponding profiles exist in the deployment payload or target org.

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition designed to flag posts from external users whose accounts were created within the past 48 hours:

```xml title="force-app/main/default/userCriteria/New_External_Members.userCriteria-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<UserCriteria xmlns="http://soap.sforce.com/2006/04/metadata">
    <creationAgeInSeconds>172800</creationAgeInSeconds>
    <description>Identifies customer and partner community members registered within the past 48 hours.</description>
    <masterLabel>New External Members</masterLabel>
    <userTypes>Customer</userTypes>
    <userTypes>Partner</userTypes>
</UserCriteria>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>New_External_Members</members>
        <name>UserCriteria</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `UserCriteria` using standard Salesforce CLI commands:

```bash
# Retrieve all user criteria definitions
sf project retrieve start --metadata UserCriteria

# Retrieve a specific user criteria rule
sf project retrieve start --metadata UserCriteria:New_External_Members

# Deploy to a target community sandbox
sf project deploy start --metadata UserCriteria:New_External_Members --target-org experience-dev
```

## Architect Best Practices and Gotchas

- **Bot and Spam Mitigation:** Combine `creationAgeInSeconds` filters with keyword-based Content Rules to intercept spam campaigns initiated by automated bot registrations.
- **Dependency on Experience Workspaces:** `UserCriteria` cannot be created or deployed unless Digital Experiences (Communities) is enabled in the target org settings.
- **Granular Profiling:** Avoid attaching internal employee profiles to aggressive moderation criteria, as this can trigger unintended moderation holds on support agents participating in customer forums.

> [!TIP]
> Deploy `UserCriteria` definitions alongside your Network (Community) and moderation rule metadata to achieve consistent portal governance across release branches.
