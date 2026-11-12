---
title: "VoiceSettings Metadata Type in SFDX"
description: "Configure and deploy VoiceSettings in Salesforce to manage Service Cloud Voice, partner telephony integration, real-time audio, and agent routing."
category: "metadata"
tags:
  - metadata
  - settings
  - service-cloud-voice
  - telephony
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "VoiceSettings controls organization-level parameters for Service Cloud Voice, partner telephony integration, live call transcription, and contact center voice routing."
faq:
  - q: "What does VoiceSettings configure in Salesforce Service Cloud?"
    a: "It configures Service Cloud Voice telephony capabilities, live call transcription engines, call recording policies, and agent softphone integration controls."
  - q: "How do you retrieve VoiceSettings using the Salesforce CLI?"
    a: "Run sf project retrieve start with the metadata flag set to Settings:Voice to pull Voice.settings-meta.xml into your project settings directory."
  - q: "Does Service Cloud Voice require Amazon Connect or partner telephony?"
    a: "Yes, Service Cloud Voice integrates with Amazon Connect natively or partner telephony vendors such as Genesys Cloud, Vonage, and Five9 through BYOT connectors."
  - q: "What happens if VoiceSettings is deployed to an org without Voice licenses?"
    a: "The deployment will fail with an error indicating that Service Cloud Voice feature licenses are missing or unentitled in the destination environment."
related:
  - metadata/flexipage-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-voicesettings.md"
---

## Architectural Overview

The `VoiceSettings` metadata type manages organization-level telephony configurations for Salesforce Service Cloud Voice. Traditionally, computer telephony integration (CTI) relied on fragile browser popups and disjointed third-party softphones. Service Cloud Voice unifies phone channels natively inside the Salesforce console, integrating directly with telephony providers like Amazon Connect or Bring Your Own Telephony (BYOT) partners.

From an enterprise contact center architecture perspective, `VoiceSettings` serves as the programmatic foundation that activates audio streaming, enables real-time speech-to-text transcription for Einstein Conversation Insights, and governs compliance recording controls. Automating these settings across CI/CD environments ensures that omni-channel routing and telephony behaviors remain uniform across all developer and staging environments.

```mermaid
flowchart LR
    A["Voice.settings-meta.xml"] --> B["enableServiceCloudVoice"]
    A --> C["enableRealtimeCallTranscription"]
    A --> D["enableVoiceCallRecording"]
    B --> E["Activates Native Softphone in Omni-Channel"]
    C --> F["Feeds Real-Time Audio to Einstein AI"]
    D --> G["Stores Encrypted Audio Streams in AWS / S3"]
```

## Directory and File Conventions

In Salesforce DX project structures, `VoiceSettings` is stored as a singleton settings file in the `settings/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `Voice`) / `VoiceSettings` |
| **SFDX Folder** | `force-app/main/default/settings/` |
| **File Name** | `Voice.settings-meta.xml` |
| **Scratch Org Setting Key** | `voiceSettings` |

## Key Metadata Fields

The `VoiceSettings` XML schema defines the following core telephony parameters:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `enableServiceCloudVoice` | `boolean` | No | Master switch enabling Service Cloud Voice telephony capabilities org-wide. |
| `enableRealtimeCallTranscription` | `boolean` | No | Enables real-time audio transcription streaming into the VoiceCall record. |
| `enableVoiceCallRecording` | `boolean` | No | Authorizes automated recording and storage of inbound and outbound customer calls. |
| `enableVoiceConferencing` | `boolean` | No | Allows contact center agents to initiate multi-party telephony conferences and transfers. |

> [!NOTE]
> Service Cloud Voice requires active Contact Center and Service Cloud Voice add-on licenses in the target Salesforce organization.

## Declarative XML and Package Manifest Examples

Below is an enterprise XML declaration configured for real-time contact center intelligence:

```xml title="force-app/main/default/settings/Voice.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<VoiceSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableRealtimeCallTranscription>true</enableRealtimeCallTranscription>
    <enableServiceCloudVoice>true</enableServiceCloudVoice>
    <enableVoiceCallRecording>true</enableVoiceCallRecording>
    <enableVoiceConferencing>true</enableVoiceConferencing>
</VoiceSettings>
```

### Scratch Org Configuration (`project-scratch-def.json`)

To enable telephony features in partner or developer scratch orgs:

```json title="config/project-scratch-def.json"
{
  "orgName": "Voice Contact Center Dev",
  "edition": "Enterprise",
  "features": ["ServiceCloudVoice"],
  "settings": {
    "voiceSettings": {
      "enableServiceCloudVoice": true,
      "enableRealtimeCallTranscription": true,
      "enableVoiceCallRecording": true
    }
  }
}
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Voice</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `VoiceSettings` using standard Salesforce CLI commands:

```bash
# Retrieve Voice settings from the target org
sf project retrieve start --metadata Settings:Voice

# Deploy Voice settings to a staging or production org
sf project deploy start --metadata Settings:Voice --target-org prod-voice
```

## Architect Best Practices and Gotchas

- **Contact Center Certificate Dependencies:** Deploying `VoiceSettings` enables the platform; however, contact centers must be paired with Amazon Connect instances and AWS Identity and Access Management (IAM) role trusts.
- **Data Residency and Recording Privacy:** Telephony call recordings frequently contain sensitive customer audio. Verify that audio storage buckets comply with regional data sovereignty standards (e.g., GDPR, CCPA).
- **Omni-Channel Flow Orchestration:** Pair `VoiceSettings` with Omni-Channel Flows to dynamically route inbound phone calls based on customer tier and agent skill matrices.

> [!TIP]
> Enable real-time transcription to unlock Einstein Next Best Action recommendations and automated call summarization for frontline service agents.
