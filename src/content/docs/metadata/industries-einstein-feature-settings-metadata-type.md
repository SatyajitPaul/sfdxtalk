---
title: "IndustriesEinsteinFeatureSettings in SFDX"
description: "Configure IndustriesEinsteinFeatureSettings metadata in Salesforce to manage Document Reader, OCR extraction, and industry-specific AI models."
category: "metadata"
tags:
  - metadata
  - settings
  - industries-ai
  - einstein
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "IndustriesEinsteinFeatureSettings governs Salesforce Industries AI tools including Intelligent Document Reader and OCR data extraction."
faq:
  - q: "What capabilities are controlled by IndustriesEinsteinFeatureSettings?"
    a: "It manages Intelligent Document Reader, OCR form processing, and automated document parsing across Salesforce Industries."
  - q: "Which industries utilize IndustriesEinsteinFeatureSettings?"
    a: "Financial Services Cloud, Health Cloud, and Public Sector Solutions leverage these AI document settings."
  - q: "Where is IndustriesEinsteinFeatureSettings stored in source code?"
    a: "It is stored in force-app/main/default/settings/IndustriesEinsteinFeature.settings-meta.xml."
  - q: "Does this metadata type require special licenses?"
    a: "Yes. Intelligent Document Reader or Industries Einstein add-on feature licenses are required."
related:
  - metadata/flow-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-industrieseinsteinfeaturesettings.md"
---

## Architectural Overview

`IndustriesEinsteinFeatureSettings` governs artificial intelligence capabilities tailored for Salesforce Industries (Financial Services Cloud, Health Cloud, and Public Sector). Most notably, this metadata type enables Intelligent Document Reader, an optical character recognition (OCR) and machine learning engine that extracts structured data from uploaded PDFs and images (e.g., driver's licenses, pay stubs, passport scans, and medical claim forms).

In modern industry workflows, deploying `IndustriesEinsteinFeatureSettings` activates the automated ingestion pipeline that parses applicant documents directly into standard and custom sObject fields, minimizing manual data entry for intake workers and loan underwriters.

```mermaid
flowchart LR
    A["Uploaded Document (PDF / Scan)"] --> B["Intelligent Document Reader (AI Engine)"]
    B --> C["IndustriesEinsteinFeatureSettings Active"]
    C --> D["Automated Field Extraction (OCR)"]
    D --> E["Lead, Account, or Claim Records"]
```

## Directory and File Conventions

`IndustriesEinsteinFeatureSettings` belongs to the standard `settings` directory:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `IndustriesEinsteinFeature`) |
| **SFDX Directory** | `force-app/main/default/settings/` |
| **File Name** | `IndustriesEinsteinFeature.settings-meta.xml` |
| **Scratch Org Key** | `industriesEinsteinFeatureSettings` |

## Key Metadata Fields

The `IndustriesEinsteinFeatureSettings` XML schema defines AI feature toggles:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `enableDocReader` | `boolean` | No | Master activation toggle for Intelligent Document Reader OCR extraction. |

> [!NOTE]
> Ensure the appropriate Industries license (e.g., `DocumentReaderPsl` or `HealthCloudPsl`) is active before deploying these settings to target environments.

## Declarative XML and Package Manifest Examples

Below is a production `IndustriesEinsteinFeature.settings-meta.xml` configuration:

```xml title="force-app/main/default/settings/IndustriesEinsteinFeature.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<IndustriesEinsteinFeatureSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableDocReader>true</enableDocReader>
</IndustriesEinsteinFeatureSettings>
```

### Scratch Org Definition (`config/project-scratch-def.json`)

```json title="config/project-scratch-def.json"
{
  "orgName": "Industries AI Document Processing Scratch Org",
  "edition": "Enterprise",
  "settings": {
    "industriesEinsteinFeatureSettings": {
      "enableDocReader": true
    }
  }
}
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>IndustriesEinsteinFeature</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## Retrieval and Deployment via SF CLI

Retrieve and deploy the settings using SF CLI:

```bash
# Retrieve Industries Einstein Feature settings
sf project retrieve start --metadata "Settings:IndustriesEinsteinFeature"

# Deploy settings to sandbox environment
sf project deploy start --metadata "Settings:IndustriesEinsteinFeature" --target-org sandbox-org
```

> [!TIP]
> Combine `IndustriesEinsteinFeatureSettings` with `OmniScript` and `Flow` metadata to build seamless document upload and real-time verification user interfaces.

## Senior Architect Best Practices and Gotchas

- **License Validation**: Attempting to deploy `enableDocReader` to an environment lacking Intelligent Document Reader licensing will cause deployment errors.
- **Document Model Mapping**: After enabling settings, configure document parsing templates in Setup or deploy custom metadata defining target field mappings.
- **Data Privacy and Retention**: Configure appropriate Shield Platform Encryption and file deletion policies for sensitive uploaded identity documents.
