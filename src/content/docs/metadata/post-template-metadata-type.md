---
title: "PostTemplate Metadata Type in SFDX"
description: "Configure PostTemplate metadata in Salesforce to customize Chatter approval feed posts, displayed field sets, and mobile actionable notifications."
category: "metadata"
tags:
  - metadata
  - chatter
  - approvals
  - collaboration
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "PostTemplate defines the field layout and summary information displayed inside Chatter feed posts for records submitted to approval processes."
faq:
  - q: "What is the primary architectural role of PostTemplate?"
    a: "It configures the custom field layout and context displayed inside Chatter approval feed posts so approvers can make informed decisions directly in the feed."
  - q: "Where are PostTemplate metadata files stored in SFDX projects?"
    a: "They are located in force-app/main/default/postTemplates/ with the .postTemplate-meta.xml file extension."
  - q: "What happens if an approver lacks field-level security for a field in PostTemplate?"
    a: "Salesforce respects field-level security at runtime; fields for which the user lacks read permission are omitted from the approval post."
  - q: "Can PostTemplate be used for custom objects?"
    a: "Yes, PostTemplate supports both standard and custom objects that participate in approval processes with feed tracking enabled."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/layout-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-posttemplate.md"
---

## Architectural Overview

In collaborative enterprise CRM environments, frictionless approval processes increase operational velocity. Salesforce Chatter Approvals enable managers and executive stakeholders to approve, reject, or comment on approval requests directly within the Chatter feed and Salesforce mobile app.

The `PostTemplate` metadata type defines the visual presentation, header information, and displayed fields for these approval feed posts. Without a configured `PostTemplate`, approvers only see basic record names and submitter details, forcing them to open the full record to view key decision factors such as Discount Percentage, Total Opportunity Amount, or SLA commitments.

```mermaid
flowchart LR
    A["Approval Process Submitted"] --> B["Chatter Approval Engine"]
    B --> C["PostTemplate Evaluates Field Layout"]
    C --> D["Renders Formatted Card in Chatter Feed"]
    D --> E["Approver Executes One-Click Approval"]
```

Architecturally, managing `PostTemplate` in source control standardizes approval experiences across departments and ensures that critical fields are exposed consistently across sandboxes and production orgs.

## Directory and File Conventions

In SFDX source format, `PostTemplate` metadata files are organized in the `postTemplates/` directory:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `PostTemplate` |
| **SFDX Directory** | `force-app/main/default/postTemplates/` |
| **File Suffix** | `.postTemplate-meta.xml` |
| **Full File Path Example** | `force-app/main/default/postTemplates/Opportunity_Discount_Approval.postTemplate-meta.xml` |
| **Parent Entity Dependency** | Requires parent sObject with Chatter Feed Tracking enabled |

## Key Metadata Fields

The XML schema of `PostTemplate` specifies the display properties and field list:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `description` | `string` | No | Architectural description of the approval post template and business rationale. |
| `fields` | `string[]` | Yes | Array of field API names displayed in the approval post card. |
| `label` | `string` | Yes | User-facing label displayed in Setup and administration tools. |
| `type` | `string` | Yes | The template category (typically `ApprovalPost`). |

> [!NOTE]
> Chatter Approvals must be globally enabled in Chatter Settings (`enableApprovalsInChatter: true`) for post templates to render in feeds.

## Declarative XML and Package Manifest Examples

Below is a declarative `PostTemplate` configured for Opportunity commercial discounting:

```xml title="force-app/main/default/postTemplates/Opportunity_Discount_Approval.postTemplate-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<PostTemplate xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Surfaces commercial discount thresholds and contract terms for executive approval.</description>
    <fields>Amount</fields>
    <fields>Discount_Percentage__c</fields>
    <fields>Payment_Terms__c</fields>
    <fields>StageName</fields>
    <fields>CloseDate</fields>
    <label>Opportunity Discount Approval</label>
    <type>ApprovalPost</type>
</PostTemplate>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Opportunity_Discount_Approval</members>
        <name>PostTemplate</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Retrieve and deploy `PostTemplate` records using the Salesforce CLI:

```bash
# Retrieve all post templates from the org
sf project retrieve start --metadata PostTemplate

# Deploy a specific post template
sf project deploy start --metadata "PostTemplate:Opportunity_Discount_Approval"

# Validate post template deployment against target org
sf project deploy validate --metadata PostTemplate
```

## Architect Best Practices and Gotchas

- **Field Dependency Validation:** Every field specified within `<fields>` must exist on the target [CustomObject](/docs/metadata/custom-object-metadata-type/) in the destination environment. Deploying a `PostTemplate` referencing missing custom fields causes compilation failures.
- **Field-Level Security (FLS) Enforcement:** Post templates do not bypass FLS. If an approver lacks read permissions on `Discount_Percentage__c`, that field is silently omitted from their view.
- **Mobile Card Real Estate:** Limit the number of fields in `PostTemplate` to 4 or 5 critical indicators. Exceeding this makes mobile feed approval cards cluttered and diminishes UX efficiency.

> [!TIP]
> Combine `PostTemplate` with Chatter feed tracking on the target object to ensure approval submission notifications broadcast immediately to subscribed management groups.
