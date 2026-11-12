---
title: "DataCategoryGroup Metadata Type for Salesforce Knowledge"
description: "Configure hierarchical Data Category Groups for Salesforce Knowledge and Questions using DataCategoryGroup metadata. Learn SOQL WITH DATA CATEGORY."
category: "metadata"
tags:
  - metadata-api
  - knowledge
  - service-cloud
  - security
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "DataCategoryGroup (datacategorygroups/<Name>.datacategorygroup-meta.xml) defines a 5-level hierarchical taxonomy used to classify and control record visibility for Salesforce Knowledge articles and Questions."
faq:
  - q: "Why is deploying DataCategoryGroup changes to Production considered high-risk?"
    a: "When you deploy a DataCategoryGroup XML file to an org where that group already exists, the Metadata API permanently deletes any existing data category not listed in the XML file and moves categorized Knowledge articles up to the parent category!"
  - q: "What are the platform limits on a DataCategoryGroup hierarchy?"
    a: "Each DataCategoryGroup can contain up to 100 data categories arranged in up to 5 hierarchical levels (including the root All category), and an org can have up to 5 active DataCategoryGroups by default."
  - q: "How do Data Categories control Knowledge article visibility?"
    a: "Data Category visibility can be configured per Role, Permission Set, or Profile (All Categories, None, or Custom) or inherited from standard sharing when Lightning Knowledge standard sharing is enabled."
  - q: "How do you filter Knowledge articles by DataCategoryGroup in SOQL?"
    a: "In SOQL queries on Knowledge__kav, you append the WITH DATA CATEGORY clause using operators like AT, ABOVE, BELOW, or ABOVE_OR_BELOW (for example, WITH DATA CATEGORY Geography__c BELOW North_America__c)."
related:
  - metadata/role-metadata-type
  - metadata/permission-set-metadata-type
  - metadata/profile-metadata-type
  - metadata/topics-for-objects-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_datacategorygroup.htm
---

## Why the `DataCategoryGroup` Metadata Type Governs Knowledge Taxonomy & Visibility

In Salesforce Service Cloud and Experience Cloud help centers, **`DataCategoryGroup`** (`datacategorygroups/<Name>.datacategorygroup-meta.xml`) defines a hierarchical tree of categories (up to 5 levels deep and 100 categories per group) assigned to **Salesforce Knowledge** (`KnowledgeArticleVersion` / `Knowledge__kav`) and **Chatter Questions** (`Question`).

Data Categories serve a dual architectural role:
1. **Faceted Search & Navigation:** Filtering Knowledge searches by Product Line, Region, or Customer Segment.
2. **Article Visibility Security:** Restricting which internal agents, partner portal users, or customer community members can view specific Knowledge categories.

```mermaid
flowchart TD
    DCG["DataCategoryGroup<br/>(datacategorygroups/Products.datacategorygroup-meta.xml)"] --> ROOT["Root Category: All Products (All)"]
    ROOT --> CLOUD["Cloud_Platform (Cloud Platform)"]
    ROOT --> HW["Hardware_Appliances (Hardware Appliances)"]
    CLOUD --> BILL["Cloud_Billing (Cloud Billing)"]
    CLOUD --> SEC["Cloud_Security (Cloud Security)"]
```

---

## Key Metadata Fields on `DataCategoryGroup`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Display name of the Data Category Group in Setup and Knowledge UI. |
| `active` | `boolean` | Yes | Activates (`true`) or deactivates (`false`) the category group. |
| `description` | `string` | No | Explains the taxonomy purpose of the category group. |
| `dataCategory` | `DataCategory` | Yes | Top-level root category containing nested recursive `<dataCategory>` child nodes (`name` and `label`). |
| `objectUsage.object` | `string[]` | No | Objects associated with the category group: `KnowledgeArticleVersion` and/or `Question`. |

---

## Real-World XML Example (`datacategorygroups/Product_Taxonomy.datacategorygroup-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DataCategoryGroup xmlns="http://soap.sforce.com/2006/04/metadata">
    <active>true</active>
    <dataCategory>
        <dataCategory>
            <dataCategory>
                <label>SSO &amp; MFA</label>
                <name>SSO_MFA</name>
            </dataCategory>
            <dataCategory>
                <label>API Gateways</label>
                <name>API_Gateways</name>
            </dataCategory>
            <label>Identity &amp; Security</label>
            <name>Identity_Security</name>
        </dataCategory>
        <dataCategory>
            <label>Billing &amp; Subscriptions</label>
            <name>Billing_Subscriptions</name>
        </dataCategory>
        <label>All Products</label>
        <name>All</name>
    </dataCategory>
    <description>Classifies Knowledge articles by product line and module.</description>
    <label>Product Taxonomy</label>
    <objectUsage>
        <object>KnowledgeArticleVersion</object>
    </objectUsage>
</DataCategoryGroup>
```

---

## Filtering Knowledge Articles with `WITH DATA CATEGORY` in SOQL & Apex

While `DataCategoryGroup` itself is inspected in Apex using the `Schema.DescribeDataCategoryGroupResult` API, you filter published Knowledge articles and inspect article categorizations using `WITH DATA CATEGORY` and `Knowledge__DataCategorySelection`:

### 1. Query Published Knowledge Articles Using `WITH DATA CATEGORY` (`ABOVE_OR_BELOW`)

```sql
SELECT Id, KnowledgeArticleId, Title, UrlName, Summary, LastPublishedDate
FROM Knowledge__kav
WHERE PublishStatus = 'Online'
  AND Language = 'en_US'
WITH DATA CATEGORY Product_Taxonomy__c BELOW Identity_Security__c
```

### 2. Query Data Category Assignments on Specific Articles (`Knowledge__DataCategorySelection`)

```sql
SELECT Id, ParentId, DataCategoryGroupName, DataCategoryName
FROM Knowledge__DataCategorySelection
WHERE Parent.PublishStatus = 'Online'
```

---

## Senior Architect Warning: Destructive Category Overwrites

> [!WARNING]
> **Deploying `DataCategoryGroup` Permanently Deletes Omitted Categories:** If a Knowledge manager adds a new category in Production Setup that is not in your Git branch's `.datacategorygroup-meta.xml` file, deploying your XML file **permanently deletes** that category in Production and re-parents all its Knowledge articles to the parent category! Always retrieve `DataCategoryGroup` from Production immediately before modifying and deploying it.
