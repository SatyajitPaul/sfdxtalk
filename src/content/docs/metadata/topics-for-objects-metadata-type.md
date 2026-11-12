---
title: "TopicsForObjects Metadata Type in SFDX & Metadata API"
description: "Enable and deploy Chatter Topics on standard and custom objects using the TopicsForObjects metadata type. Learn Topic and TopicAssignment SOQL queries."
category: "metadata"
tags:
  - metadata-api
  - chatter
  - experience-cloud
  - custom-object
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "TopicsForObjects (topicsForObjects/<Object>.topicsForObjects-meta.xml) controls whether users can assign Chatter and Experience Cloud Topics to records of a specific standard or custom object."
faq:
  - q: "What does the TopicsForObjects metadata type control?"
    a: "TopicsForObjects enables or disables Topics for Objects on a specific standard or custom SObject (such as Account, Case, Knowledge__kav, or a custom object), allowing users to tag records with hashtags and filter lists or Experience Cloud feeds by Topic."
  - q: "Why is my Lightning Topics component failing to render on a custom object record page in Production?"
    a: "If you deploy a FlexiPage containing the standard Topics component (forceChatter:topicsOnRecordWrapper) without also deploying TopicsForObjects with enableTopics set to true for that object, the component cannot display or save record topics."
  - q: "How do you query which Topics are assigned to a specific record using SOQL?"
    a: "You query the TopicAssignment junction object filtering by EntityId (the record ID) or EntityType (the SObject name) and traverse Topic.Name to read the assigned topic names."
  - q: "How are TopicsForObjects files named in SFDX source format?"
    a: "Each file in force-app/main/default/topicsForObjects/ is named ObjectApiName.topicsForObjects-meta.xml, such as Case.topicsForObjects-meta.xml or Project__c.topicsForObjects-meta.xml."
related:
  - metadata/custom-object-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/network-metadata-type
  - metadata/navigation-menu-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_topicsforobjects.htm
---

## Why the `TopicsForObjects` Metadata Type Matters

In Salesforce Lightning Experience and Experience Cloud portals, **Topics** allow users and automation to tag records (`Case`, `Knowledge__kav`, `Account`, or custom objects) with structured taxonomy tags without creating dozens of multi-select picklists. Before any user or Apex trigger can insert a `TopicAssignment` on an SObject—or before the standard **Topics** component will render on a [FlexiPage](/docs/metadata/flexipage-metadata-type/)—that object must have **`TopicsForObjects`** (`topicsForObjects/<Object>.topicsForObjects-meta.xml`) enabled.

```mermaid
flowchart LR
    TFO["TopicsForObjects<br/>(topicsForObjects/Knowledge__kav.topicsForObjects-meta.xml)"] --> ENABLE["enableTopics: true"]
    ENABLE --> UI["Lightning Topics Component<br/>(FlexiPage & Experience Cloud)"]
    ENABLE --> DATA["TopicAssignment Junction Object<br/>(Links TopicId <-> EntityId)"]
```

---

## Key Metadata Fields on `TopicsForObjects`

| Field | Type | Required | Description |
|---|---|---|---|
| `entityApiName` | `string` | Yes | The API name of the standard or custom object (`Account`, `Case`, `Knowledge__kav`, `Deal_Registration__c`). |
| `enableTopics` | `boolean` | Yes | `true` to enable record topic tagging on the object; `false` to disable. |

---

## Real-World XML Example (`topicsForObjects/Knowledge__kav.topicsForObjects-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TopicsForObjects xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableTopics>true</enableTopics>
    <entityApiName>Knowledge__kav</entityApiName>
</TopicsForObjects>
```

---

## Querying `Topic` and `TopicAssignment` via SOQL

Once `TopicsForObjects` is enabled, topics and record-to-topic links are stored in the standard **`Topic`** and **`TopicAssignment`** objects. Note that in Experience Cloud, each site ([Network](/docs/metadata/network-metadata-type/)) maintains its own isolated topic namespace via `NetworkId`!

### 1. Query All Topics Assigned to a Specific Record (e.g., Case or Knowledge Article)

```sql
SELECT Id, TopicId, Topic.Name, EntityId, EntityType, NetworkId, CreatedDate
FROM TopicAssignment
WHERE EntityId = :recordId
ORDER BY Topic.Name ASC
```

### 2. Find All Cases Tagged with a Specific Topic in Internal Org (`NetworkId = null`)

```sql
SELECT Id, EntityId, EntityKeyPrefix, Topic.Name, CreatedBy.Name
FROM TopicAssignment
WHERE EntityType = 'Case'
  AND Topic.Name = 'Security Incident'
  AND NetworkId = null
ORDER BY CreatedDate DESC
```

---

## Senior Architect Best Practices

> [!WARNING]
> **Include `TopicsForObjects` in Your `package.xml` When Deploying FlexiPages:** One of the most common deployment omissions occurs when an admin enables Topics for a custom object in Setup (**Setup → Topics for Objects**), drops the **Topics** widget onto the Lightning Record Page (`FlexiPage`), and commits only the `FlexiPage`. Always include `TopicsForObjects` in your commit so the target Sandbox or Production org has topic tagging enabled on that object!
