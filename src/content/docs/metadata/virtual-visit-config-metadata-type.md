---
title: "VirtualVisitConfig Metadata Type in SFDX"
description: "Configure and deploy VirtualVisitConfig in Salesforce to manage telehealth video integrations, virtual care queues, and provider appointments."
category: "metadata"
tags:
  - metadata
  - health-cloud
  - virtual-visit
  - telehealth
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "VirtualVisitConfig connects telehealth video providers like Amazon Chime or Zoom with Salesforce Health Cloud clinical appointments and virtual care consoles."
faq:
  - q: "What does VirtualVisitConfig govern in Health Cloud?"
    a: "It governs virtual clinical visit configurations, connecting video platform providers with Salesforce Service Appointments, patient waiting rooms, and clinician consoles."
  - q: "How do you retrieve VirtualVisitConfig using Salesforce CLI?"
    a: "Execute sf project retrieve start with the metadata flag set to VirtualVisitConfig to retrieve the configuration XML files into your local repository."
  - q: "Which video communication platforms are supported?"
    a: "Supported platforms include Amazon Chime, Zoom for Healthcare, Cisco Webex, and custom WebRTC providers configured through connected endpoints."
  - q: "Does VirtualVisitConfig require Health Cloud licenses?"
    a: "Yes, Virtual Care and telehealth visit capabilities require active Health Cloud and Virtual Care or Telehealth add-on licenses in the target org."
related:
  - metadata/flexipage-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-virtualvisitconfig.md"
---

## Architectural Overview

The `VirtualVisitConfig` metadata type manages telehealth and virtual care session configurations within Salesforce Health Cloud. In modern healthcare ecosystems, remote clinical consultations, patient triage, and virtual follow-ups require seamless coordination between electronic health record (EHR) systems, scheduling engines, and real-time audio/video streaming infrastructure.

`VirtualVisitConfig` acts as the declarative bridge connecting Salesforce Service Appointments with video communication providers (such as Amazon Chime SDK or Zoom for Healthcare). It governs waiting room experiences, participant entry notifications, recording consents, and clinician console layouts. Managing this configuration as version-controlled metadata ensures consistent telehealth workflows across staging environments and clinical production orgs.

```mermaid
flowchart LR
    A["Patient Schedules Virtual Appointment"] --> B["VirtualVisitConfig Routing"]
    B --> C["Provisions Video Room (Amazon Chime / Zoom)"]
    B --> D["Places Patient in Virtual Waiting Room"]
    C --> E["Sends Secure Video Link via SMS / Portal"]
    D --> F["Alerts Clinician in Health Cloud Console"]
    E --> G["Clinician and Patient Connect via WebRTC"]
    F --> G
```

## Directory and File Conventions

In Salesforce DX project structures, `VirtualVisitConfig` definitions reside inside the `virtualVisitConfigs/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `VirtualVisitConfig` |
| **SFDX Folder** | `force-app/main/default/virtualVisitConfigs/` |
| **File Suffix** | `.virtualVisitConfig-meta.xml` |

## Key Metadata Fields

The XML schema for `VirtualVisitConfig` includes the following core attributes:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable title displayed in Health Cloud setup consoles. |
| `developerName` | `string` | Yes | Unique programmatic API name referenced by virtual care flows. |
| `videoProvider` | `string` | Yes | Telehealth video vendor (e.g., `AmazonChime`, `Zoom`, `Webex`, `Custom`). |
| `appointmentType` | `string` | No | Target service appointment category associated with this virtual visit flow. |
| `waitingRoomConfig` | `string` | No | Configuration reference specifying patient waiting room instructions and branding. |
| `isActive` | `boolean` | Yes | Indicates whether this virtual care configuration is active for scheduling. |

> [!NOTE]
> Prior to deploying `VirtualVisitConfig`, ensure Health Cloud and Telehealth feature licenses are active in the target org.

## Declarative XML and Package Manifest Examples

Below is a declarative XML definition configuring Amazon Chime-powered telehealth visits:

```xml title="force-app/main/default/virtualVisitConfigs/PrimaryCare_VirtualVisit.virtualVisitConfig-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<VirtualVisitConfig xmlns="http://soap.sforce.com/2006/04/metadata">
    <appointmentType>ClinicalTelehealth</appointmentType>
    <developerName>PrimaryCare_VirtualVisit</developerName>
    <isActive>true</isActive>
    <masterLabel>Primary Care Virtual Visit</masterLabel>
    <videoProvider>AmazonChime</videoProvider>
    <waitingRoomConfig>StandardWaitingRoom</waitingRoomConfig>
</VirtualVisitConfig>
```

### Manifest Definition (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>PrimaryCare_VirtualVisit</members>
        <name>VirtualVisitConfig</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `VirtualVisitConfig` using standard Salesforce CLI commands:

```bash
# Retrieve all virtual visit configurations
sf project retrieve start --metadata VirtualVisitConfig

# Retrieve a specific configuration
sf project retrieve start --metadata VirtualVisitConfig:PrimaryCare_VirtualVisit

# Deploy to a clinical validation sandbox
sf project deploy start --metadata VirtualVisitConfig:PrimaryCare_VirtualVisit --target-org clinical-dev
```

## Architect Best Practices and Gotchas

- **HIPAA and Data Privacy:** Telehealth video sessions must comply with HIPAA, GDPR, and regional patient privacy laws. Ensure provider accounts (e.g., AWS or Zoom) have executed Business Associate Agreements (BAAs).
- **Network Bandwidth Resilience:** Configure fallback options (such as direct telephone bridging) within scheduling flows to support patients residing in rural areas with limited broadband.
- **Console Integration:** Pair `VirtualVisitConfig` deployments with customized FlexiPages for the Health Cloud Patient Console, embedding the virtual care component alongside clinical charts and medication histories.

> [!TIP]
> Leverage Salesforce Flows to automate post-visit survey distribution and clinical note drafting immediately following session termination.
