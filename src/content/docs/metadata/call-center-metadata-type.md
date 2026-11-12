---
title: "CallCenter Metadata Type in SFDX & Open CTI"
description: "Configure and deploy Open CTI softphones and Service Cloud Voice contact centers using the CallCenter metadata type in SFDX and Metadata API."
category: "metadata"
tags:
  - metadata-api
  - service-cloud
  - open-cti
  - telephony
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "CallCenter represents an Open CTI softphone adapter or Service Cloud Voice telephony definition, configuring adapter URLs, softphone dimensions, and dialing rules."
faq:
  - q: "What does the CallCenter metadata type configure?"
    a: "It defines the computer-telephony integration (CTI) call center properties in Setup, including the Open CTI adapter URL, softphone height and width, and dialing options."
  - q: "Where are CallCenter files located in SFDX source format?"
    a: "They are stored in the force-app/main/default/callCenters/ directory with the .callCenter-meta.xml file extension."
  - q: "Why does CallCenter XML use customSettings as a serialized string or sections?"
    a: "CallCenter definitions originate from CTI XML import files where vendor-specific attributes are grouped into sections and items serialized inside customSettings."
  - q: "Can I query CallCenter records using SOQL?"
    a: "Yes, the CallCenter standard object is queryable in SOQL to inspect InternalName, Name, AdapterUrl, and Version, and to assign users via User.CallCenterId."
related:
  - metadata/service-channel-metadata-type
  - metadata/connected-app-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-callcenter.md"
---

## Architectural Overview

The `CallCenter` metadata type is the foundation of Computer-Telephony Integration (CTI) in Salesforce Service Cloud and Sales Engagement. Whether your organization uses an Open CTI third-party softphone (such as Genesys Cloud, Five9, NICE CXone, or Cisco Webex) or a Partner Telephony contact center in Service Cloud Voice, `CallCenter` defines the adapter endpoint (`adapterUrl`), softphone utility bar dimensions, and vendor-specific configuration sections.

At runtime, Salesforce checks the logged-in agent's `User.CallCenterId` lookup field. If populated, the Lightning Experience Softphone utility loads the `reqAdapterUrl` configured in that `CallCenter` metadata definition inside a secure iframe and initializes the Open CTI JavaScript SDK (`sforce.opencti`).

```mermaid
flowchart LR
    A["CallCenter (.callCenter-meta.xml)"] --> B["Assigned to Agent (User.CallCenterId)"]
    B --> C["Lightning Utility Bar Softphone"]
    C --> D["Loads reqAdapterUrl in Open CTI Iframe"]
    D --> E["Screen Pop & Click-to-Dial via Open CTI API"]
```

## SFDX Directory & File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `CallCenter` |
| **Classic Directory** | `callCenters/` |
| **Classic File Suffix** | `.callCenter` |
| **SFDX Source Directory** | `force-app/main/default/callCenters/` |
| **SFDX File Suffix** | `.callCenter-meta.xml` |

## Key Metadata Fields

The `CallCenter` metadata type exposes the following XML fields:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `adapterUrl` | `string` | No | The URL (or relative Visualforce page path `/apex/SoftphonePage`) hosting the Open CTI softphone adapter. |
| `customSettings` | `string` | No | JSON-encoded or key-value string storing the call center's section and item attributes (such as `reqStandAloneUrl`, `reqSoftphoneHeight`, `reqSoftphoneWidth`, and `reqUseApi`). |
| `displayName` | `string` | Yes | The human-readable name of the Call Center displayed in Setup -> Call Centers. |
| `displayNameLabel` | `string` | Yes | Label for the Display Name field (typically `Display Name` or `InternalNameLabel`). |
| `internalNameLabel` | `string` | Yes | Label for the Internal Name field (typically `InternalNameLabel` or `Internal Name`). |
| `sections` | `CallCenterSection[]` | No | Structured representation of call center configuration sections (`items` with `label`, `name`, `value`). |
| `version` | `string` | No | Version number of the CTI adapter specification. |

> [!TIP]
> When deploying Open CTI call centers across sandboxes and production, use a relative path or environment-specific SFDX string replacement for `reqAdapterUrl` so sandbox agents connect to your UAT telephony environment rather than production trunks.

## Declarative XML & `package.xml` Examples

### SFDX Source File Example

```xml title="force-app/main/default/callCenters/Global_OpenCTI_Center.callCenter-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<CallCenter xmlns="http://soap.sforce.com/2006/04/metadata">
    <adapterUrl>https://cti-adapter.acme.enterprise/softphone/index.html</adapterUrl>
    <customSettings>{&quot;reqSoftphoneHeight&quot;:&quot;550&quot;,&quot;reqUseApi&quot;:&quot;true&quot;,&quot;reqSoftphoneWidth&quot;:&quot;380&quot;,&quot;reqSalesforceCompatibilityMode&quot;:&quot;Lightning&quot;}</customSettings>
    <displayName>Global Open CTI Contact Center</displayName>
    <displayNameLabel>Display Name</displayNameLabel>
    <internalNameLabel>Internal Name</internalNameLabel>
    <sections>
        <items>
            <label>CTI Adapter URL</label>
            <name>reqAdapterUrl</name>
            <value>https://cti-adapter.acme.enterprise/softphone/index.html</value>
        </items>
        <items>
            <label>Use CTI API</label>
            <name>reqUseApi</name>
            <value>true</value>
        </items>
        <items>
            <label>Softphone Height</label>
            <name>reqSoftphoneHeight</name>
            <value>550</value>
        </items>
        <items>
            <label>Softphone Width</label>
            <name>reqSoftphoneWidth</name>
            <value>380</value>
        </items>
        <items>
            <label>Salesforce Compatibility Mode</label>
            <name>reqSalesforceCompatibilityMode</name>
            <value>Lightning</value>
        </items>
        <label>General Info</label>
        <name>reqGeneralInfo</name>
    </sections>
    <version>6.0</version>
</CallCenter>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Global_OpenCTI_Center</members>
        <name>CallCenter</name>
    </types>
    <version>68.0</version>
</Package>
```

## Querying via SOQL & SFDX CLI

You can query the `CallCenter` standard object in SOQL to inspect deployed call centers or audit how many agents are assigned to each call center:

```soql
SELECT Id, Name, InternalName, AdapterUrl, Version, CreatedDate
FROM CallCenter
ORDER BY Name ASC
```

Retrieve and deploy `CallCenter` metadata with the Salesforce CLI:

```bash
# Retrieve CallCenter metadata
sf project retrieve start --metadata CallCenter:Global_OpenCTI_Center

# Deploy CallCenter metadata
sf project deploy start --metadata CallCenter:Global_OpenCTI_Center
```

## Senior Architect Best Practices & Gotchas

- **Keep `customSettings` and `sections` Synchronized:** In `CallCenter` XML, both `<customSettings>` (escaped JSON) and `<sections>` hold softphone attributes like `reqSoftphoneHeight` and `reqSalesforceCompatibilityMode`. Always update both when modifying dimensions or URLs in source control.
- **CSP and Framing Security:** If `adapterUrl` points to an external domain, add that domain to `CspTrustedSite` and verify that the external telephony web server sends a `Content-Security-Policy: frame-ancestors https://*.my.salesforce.com https://*.lightning.force.com` header so browsers do not block the softphone iframe.
- **User Assignment Automation:** `CallCenter` metadata does not store the list of assigned users. Automate `User.CallCenterId` population in post-deployment scripts or user-provisioning [Flow](/docs/metadata/flow-metadata-type/) logic by querying `CallCenter WHERE InternalName = 'Global_OpenCTI_Center'`.
