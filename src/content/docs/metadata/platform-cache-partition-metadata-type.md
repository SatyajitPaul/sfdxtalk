---
title: "PlatformCachePartition Metadata Type in SFDX & Metadata"
description: "Configure Org Cache and Session Cache partitions with the PlatformCachePartition metadata type. Learn capacity allocation, CacheBuilder, and SOQL queries."
category: "metadata"
tags:
  - metadata-api
  - platform-cache
  - performance
  - apex
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "PlatformCachePartition (cachePartitions/<Name>.cachePartition-meta.xml) defines a memory partition in Salesforce Platform Cache, allocating megabytes across Session Cache and Org Cache to accelerate Apex and LWC performance."
faq:
  - q: "What is the difference between Session and Organization cacheType in PlatformCachePartition?"
    a: "Session cache stores data tied to an individual user's active session (up to 8 hours) for user-specific state or auth tokens. Organization cache stores shared data accessible to any user in the org (up to 48 hours) for reference data, exchange rates, or product catalogs."
  - q: "Why should you deploy a PlatformCachePartition with 0 MB allocatedCapacity in Scratch Orgs or CI/CD?"
    a: "Wait-free Apex unit tests and Cache.Org.getPartition('local.MyPartition') calls require the PlatformCachePartition metadata record to exist, even if 0 MB is allocated! Deploying with 0 MB ensures your code compiles and executes in Developer or Scratch Orgs that lack purchased cache capacity."
  - q: "What does isDefaultPartition do on PlatformCachePartition?"
    a: "When isDefaultPartition is set to true (only one partition per org can be the default), Apex code can call shorthand methods like Cache.Org.put('key', value) without explicitly specifying the partition name."
  - q: "Can you query PlatformCachePartition allocations using SOQL?"
    a: "Yes. Both standard SOQL and the Tooling API allow querying PlatformCachePartition and PlatformCachePartitionType to inspect DeveloperName, IsDefaultPartition, CacheType, AllocatedCapacity, and AllocatedPurchasedCapacity."
related:
  - metadata/apex-class-metadata-type
  - metadata/custom-metadata-records-type
  - metadata/lightning-component-bundle-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_platformcachepartition.htm
---

## Why the `PlatformCachePartition` Metadata Type Is Essential for High-Scale Orgs

Repeatedly running SOQL queries for static or semi-static data—such as complex pricing matrices, user territory hierarchies, external OAuth access tokens, or API feature flags—consumes SOQL governor limits and adds latency to every transaction.

**`PlatformCachePartition`** (`cachePartitions/<Name>.cachePartition-meta.xml`) divides your org's in-memory Redis-backed **Platform Cache** into isolated logical buckets (`local.<PartitionName>`) so critical integrations and UI components never evict each other's cached keys.

```mermaid
flowchart LR
    PCP["PlatformCachePartition<br/>(cachePartitions/CommerceCache.cachePartition-meta.xml)"] --> ORG["cacheType: Organization<br/>(Shared Across All Users - TTL up to 48h)"]
    PCP --> SESS["cacheType: Session<br/>(Scoped Per User Session - TTL up to 8h)"]
    ORG --> BUILDER["Cache.CacheBuilder Apex Interface<br/>(Auto-loads on Cache Miss)"]
```

---

## Key Metadata Fields on `PlatformCachePartition`

| Field | Type | Required | Description |
|---|---|---|---|
| `masterLabel` | `string` | Yes | Display label of the partition in Setup. |
| `isDefaultPartition` | `boolean` | Yes | Marks this partition as the org's default partition (only one partition can be `true`). |
| `description` | `string` | No | Documents which features or Apex classes own this partition. |
| `platformCachePartitionTypes.cacheType` | `PlatformCacheType` | Yes | `Organization` (Org Cache) or `Session` (Session Cache). |
| `platformCachePartitionTypes.allocatedCapacity` | `int` | Yes | Total MB allocated to this cache type (sum of purchased, trial, and partner capacity). |
| `platformCachePartitionTypes.allocatedPurchasedCapacity` | `int` | Yes | MB of purchased org-wide cache allocated to this partition. |
| `platformCachePartitionTypes.allocatedTrialCapacity` | `int` | Yes | MB of trial cache allocated to this partition. |
| `platformCachePartitionTypes.allocatedPartnerCapacity` | `int` | Yes | *(API v51.0+)* MB of free partner capacity allocated in Developer Edition / ISV orgs. |

---

## Real-World XML Example (`cachePartitions/CoreIntegrationCache.cachePartition-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PlatformCachePartition xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Dedicated Org and Session cache partition for ERP pricing tables and per-user session state.</description>
    <isDefaultPartition>false</isDefaultPartition>
    <masterLabel>Core Integration Cache</masterLabel>
    <platformCachePartitionTypes>
        <allocatedCapacity>10</allocatedCapacity>
        <allocatedPartnerCapacity>0</allocatedPartnerCapacity>
        <allocatedPurchasedCapacity>10</allocatedPurchasedCapacity>
        <allocatedTrialCapacity>0</allocatedTrialCapacity>
        <cacheType>Organization</cacheType>
    </platformCachePartitionTypes>
    <platformCachePartitionTypes>
        <allocatedCapacity>5</allocatedCapacity>
        <allocatedPartnerCapacity>0</allocatedPartnerCapacity>
        <allocatedPurchasedCapacity>5</allocatedPurchasedCapacity>
        <allocatedTrialCapacity>0</allocatedTrialCapacity>
        <cacheType>Session</cacheType>
    </platformCachePartitionTypes>
</PlatformCachePartition>
```

---

## Querying `PlatformCachePartition` and `PlatformCachePartitionType` via SOQL

You can inspect all cache partitions and their megabyte allocations in standard SOQL:

```sql
SELECT Id, DeveloperName, MasterLabel, IsDefaultPartition, Description,
       (SELECT CacheType, AllocatedCapacity, AllocatedPurchasedCapacity,
               AllocatedTrialCapacity, AllocatedPartnerCapacity
        FROM PlatformCachePartitionTypes)
FROM PlatformCachePartition
WHERE NamespacePrefix = null
ORDER BY DeveloperName ASC
```

---

## Senior Architect Best Practices & Gotchas

> [!TIP]
> **Commit `0` MB Allocation in Git for Scratch Org Portability:** If you commit `<allocatedPurchasedCapacity>10</allocatedPurchasedCapacity>` to Git, deploying to a Developer Edition or Scratch Org that only has `0` or `3` MB of free cache will fail with `Exceeded maximum cache allocation`. Commit `0` MB in your base SFDX repository so the partition always deploys cleanly, and allocate MB capacity in Production or via environment-specific replacements.

- **Always Use `Cache.CacheBuilder` Instead of Manual `get`/`put`:** Implementing the `Cache.CacheBuilder` Apex interface (`Cache.Org.get(PricingCacheBuilder.class, 'USD_Rates')`) automatically handles cache misses when keys expire or are evicted—even when a partition has `0` MB allocated!
