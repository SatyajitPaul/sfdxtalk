---
title: "AIReplyRecommendationsSettings Metadata in SFDX"
description: "Configure and deploy Einstein Reply Recommendations settings for Service Cloud chat and messaging using AIReplyRecommendationsSettings in SFDX."
category: "metadata"
tags: ["metadata", "einstein-reply-recommendations", "service-cloud", "settings", "sf-cli"]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "AIReplyRecommendationsSettings controls org-wide enablement toggles for Einstein Reply Recommendations in Service Cloud via AIReplyRecommendations.settings-meta.xml."
faq:
  - q: "What does AIReplyRecommendationsSettings control in Salesforce?"
    a: "It controls the org-wide enablement and operational toggles for Einstein Reply Recommendations, which suggests real-time responses to Service Cloud support agents."
  - q: "Where is AIReplyRecommendationsSettings stored in SFDX?"
    a: "It is stored at force-app/main/default/settings/AIReplyRecommendations.settings-meta.xml and referenced in package.xml under Settings with member AIReplyRecommendations."
  - q: "Does enabling AIReplyRecommendationsSettings immediately show replies to agents?"
    a: "No, enabling the setting activates the feature in Setup, after which you must build or activate the reply model, publish Quick Text responses, and assign permission sets."
  - q: "How do I retrieve AIReplyRecommendationsSettings using Salesforce CLI?"
    a: "Run sf project retrieve start --metadata Settings:AIReplyRecommendations to retrieve the settings file into your project."
related:
  - metadata/permission-set-metadata-type
  - metadata/profile-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-aireplyrecommendationssettings.md"
---

## Architectural Overview

Einstein Reply Recommendations analyzes past chat and messaging transcripts to suggest relevant Quick Text responses to Service Cloud agents in real time. The `AIReplyRecommendationsSettings` metadata type (`AIReplyRecommendations.settings-meta.xml`) governs the org-level feature switch for this capability.

By including `AIReplyRecommendationsSettings` in your SFDX repository, you ensure that Service Cloud sandboxes and scratch orgs have the feature enabled before deploying downstream Lightning Record Pages or Quick Text folders that depend on the Einstein Replies component.

```mermaid
flowchart LR
    A["AIReplyRecommendations.settings-meta.xml"] --> B["Feature Enabled in Service Cloud"]
    B --> C["Einstein Reply Model & Quick Text Store"]
    C --> D["Einstein Replies Console Component"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `AIReplyRecommendationsSettings` (`Settings:AIReplyRecommendations`) |
| **SFDX Directory** | `force-app/main/default/settings/` |
| **File Name & Suffix** | `AIReplyRecommendations.settings-meta.xml` |
| **API Version Introduced** | `50.0` (Verified on `68.0` / Winter '27) |

## Key Metadata Fields

| Field Name | Type | Required | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| `enableReplyRecommendations` | `boolean` | No | Enables (`true`) or disables (`false`) Einstein Reply Recommendations across the org. |

> [!NOTE]
> The target org must have the Service Cloud Einstein or Einstein Reply Recommendations add-on license provisioned, or deploying `<enableReplyRecommendations>true</enableReplyRecommendations>` will fail.

## Declarative XML & `package.xml` Examples

### Sample `AIReplyRecommendations.settings-meta.xml`

```xml title="force-app/main/default/settings/AIReplyRecommendations.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<AIReplyRecommendationsSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableReplyRecommendations>true</enableReplyRecommendations>
</AIReplyRecommendationsSettings>
```

### Sample `package.xml` Manifest

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>AIReplyRecommendations</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## SFDX CLI Retrieval & Deployment

Retrieve and deploy `AIReplyRecommendationsSettings` via the Salesforce CLI:

```bash
# Retrieve Einstein Reply Recommendations settings
sf project retrieve start --metadata "Settings:AIReplyRecommendations"

# Deploy the settings to enable Einstein Reply Recommendations
sf project deploy start --metadata "Settings:AIReplyRecommendations"
```

## Senior Architect Best Practices & Gotchas

- **Quick Text Folder Sharing:** Recommended replies are stored as standard `QuickText` records. After enabling `AIReplyRecommendationsSettings`, ensure your support agents have read access to the published Quick Text folder and the `Einstein Reply Recommendations` system permission via a [PermissionSet](/docs/metadata/permission-set-metadata-type/).
- **Transcript Volume Prerequisite:** Predictive reply models require at least 1,000 closed chat/messaging transcripts with 4+ turns to train in a new org; for orgs with lower transcript history, consider generative Einstein Service Replies instead.

> [!TIP]
> Deploy `Settings:AIReplyRecommendations` prior to deploying Service Console FlexiPages that embed the `Einstein Replies` standard component so page activation does not fail in CI.
