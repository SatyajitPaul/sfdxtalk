---
title: "ActvPfrmDataConnectorS3 Metadata Type in SFDX"
description: "Configure and deploy ActvPfrmDataConnectorS3 metadata in Salesforce Data Cloud to define Amazon S3 bucket egress connectors for Activation Platforms."
category: "metadata"
tags:
  - metadata
  - data-cloud
  - amazon-s3
  - activation-platform
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "ActvPfrmDataConnectorS3 defines the Amazon S3 storage connector configuration associated with a Data Cloud ActivationPlatform for batch segment file delivery."
faq:
  - q: "What is ActvPfrmDataConnectorS3 used for in Salesforce Data Cloud?"
    a: "It configures the Amazon S3 storage connector details—such as bucket name, directory path, and parent ActivationPlatform link—for file-based Data Cloud segment activations."
  - q: "How does ActvPfrmDataConnectorS3 connect to ActivationPlatform?"
    a: "The ActivationPlatform metadata component references the ActvPfrmDataConnectorS3 developer name in its dataConnector field when connectorType is set to AmazonS3."
  - q: "Where are ActvPfrmDataConnectorS3 files stored in SFDX source format?"
    a: "They are stored in force-app/main/default/actvPfrmDataConnectorS3s with the .actvPfrmDataConnectorS3-meta.xml file extension."
  - q: "Are secret AWS keys stored in plain text inside ActvPfrmDataConnectorS3 XML?"
    a: "No. Sensitive secret keys are encrypted or managed securely at the Activation Target / Named Credential layer and are never exported in plain text in source control."
related:
  - metadata/connected-app-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-actvpfrmdataconnectors3.md"
---

## Architectural Overview

The `ActvPfrmDataConnectorS3` metadata type configures the **Amazon S3 Egress Connector** for an `ActivationPlatform` in **Salesforce Data Cloud**. Many external demand-side platforms (DSPs), direct-mail fulfillment houses, and enterprise data lakes ingest audience segments via scheduled batch drops (JSON, CSV, or Parquet) into a dedicated Amazon S3 bucket and folder prefix.

In Data Cloud architecture, `ActvPfrmDataConnectorS3` encapsulates the S3 endpoint contract—bucket location, export folder path, and connector metadata—so it can be packaged alongside `ActivationPlatform` in SFDX repositories or AppExchange Data Kits.

```mermaid
flowchart LR
    A["ActivationPlatform (connectorType = AmazonS3)"] --> B["ActvPfrmDataConnectorS3"]
    B --> C["Bucket & Folder Path Configuration"]
    C --> D["Data Cloud Segment Export Engine"]
    D --> E["Amazon S3 Egress Bucket (/segments/YYYY-MM-DD/)"]
```

## Directory and File Conventions

In SFDX source format (`apiVersion` 68.0), `ActvPfrmDataConnectorS3` files reside in the `actvPfrmDataConnectorS3s` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `ActvPfrmDataConnectorS3` |
| **SFDX Folder** | `force-app/main/default/actvPfrmDataConnectorS3s/` |
| **File Suffix** | `.actvPfrmDataConnectorS3-meta.xml` |
| **Wildcard Support (`*`)** | Supported in `package.xml` |

## Key Metadata Fields

The `ActvPfrmDataConnectorS3` XML schema includes the following core properties:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable label of the S3 data connector configuration. |
| `bucketName` | `string` | No | Target Amazon S3 bucket name where segment files are written. |
| `exportFolderName` | `string` | No | Subdirectory prefix inside the S3 bucket for exported segment files (for example, `outbound/audiences`). |
| `s3AccessKey` | `string` | No | Public AWS Access Key ID or placeholder reference configured for the platform connector. |
| `s3SecretKey` | `string` | No | Encrypted/masked secret key reference (never commit raw production AWS secrets to Git). |

> [!WARNING]
> Never commit live AWS IAM `s3AccessKey` or `s3SecretKey` credentials into Git inside `.actvPfrmDataConnectorS3-meta.xml`. Use environment replacement tokens in CI/CD or configure tenant credentials directly on the runtime **Activation Target** in Data Cloud Setup.

## Declarative XML and Package Manifest Examples

Below is an `ActvPfrmDataConnectorS3` metadata file defining the S3 egress folder structure for `Enterprise_DSP_Platform`:

```xml title="force-app/main/default/actvPfrmDataConnectorS3s/Enterprise_DSP_S3_Connector.actvPfrmDataConnectorS3-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<ActvPfrmDataConnectorS3 xmlns="http://soap.sforce.com/2006/04/metadata">
    <bucketName>enterprise-dsp-audience-ingress</bucketName>
    <exportFolderName>datacloud/segments</exportFolderName>
    <masterLabel>Enterprise DSP S3 Connector</masterLabel>
</ActvPfrmDataConnectorS3>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Enterprise_DSP_S3_Connector</members>
        <name>ActvPfrmDataConnectorS3</name>
    </types>
    <types>
        <members>Enterprise_DSP_Platform</members>
        <name>ActivationPlatform</name>
    </types>
    <version>68.0</version>
</Package>
```

## SOQL Queries and CLI Automation

Inspect `ActvPfrmDataConnectorS3` records via SOQL or deploy them using Salesforce CLI:

```soql
SELECT Id, DeveloperName, MasterLabel, BucketName, ExportFolderName
FROM ActvPfrmDataConnectorS3
ORDER BY DeveloperName ASC
```

```bash
# Retrieve all ActvPfrmDataConnectorS3 definitions
sf project retrieve start --metadata "ActvPfrmDataConnectorS3:*"

# Deploy a specific S3 connector configuration
sf project deploy start --metadata ActvPfrmDataConnectorS3:Enterprise_DSP_S3_Connector
```

## Architect Best Practices and Gotchas

- **Least-Privilege S3 Bucket Policies:** Configure the target AWS S3 bucket policy and IAM role with least-privilege permissions (`s3:PutObject`, `s3:ListBucket`, `s3:GetBucketLocation`) scoped strictly to the `<exportFolderName>` prefix, and enforce server-side encryption (`SSE-S3` or `SSE-KMS`).
- **Environment Isolation:** Ensure sandbox Data Cloud orgs point to a non-production `bucketName` (such as `enterprise-dsp-audience-ingress-uat`) so UAT segment runs do not trigger live ad-spend campaigns in your production DSP.

> [!TIP]
> Deploy `ActvPfrmDataConnectorS3` before or in the same deployment transaction as its parent `ActivationPlatform` so the `<dataConnector>` reference resolves without error.
