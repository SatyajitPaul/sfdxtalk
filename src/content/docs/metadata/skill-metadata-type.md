---
title: "Skill Metadata Type for Omni-Channel & Field Service"
description: "Define agent and technician capabilities using the Skill metadata type. Learn skills-based routing, skillType grouping, and SOQL queries for SkillRequirement."
category: "metadata"
tags:
  - metadata-api
  - omni-channel
  - field-service
  - routing
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "Skill (skills/<Name>.skill-meta.xml) defines a capability—such as French Language, High-Voltage Certification, or Billing Tier 2—used by Omni-Channel Skills-Based Routing and Salesforce Field Service."
faq:
  - q: "Where is the Skill metadata type used in Salesforce?"
    a: "The Skill metadata type is shared across Omni-Channel Skills-Based Routing, Salesforce Field Service (WorkOrder and WorkType SkillRequirements), and Salesforce Scheduler (matching appointment topics to ServiceResourceSkill records)."
  - q: "Why should you avoid deploying user and profile assignments inside Skill metadata files?"
    a: "While Skill metadata supports an assignments block for profiles and users, modern Omni-Channel and Field Service implementations assign skills dynamically using ServiceResource and ServiceResourceSkill records rather than hardcoded metadata usernames."
  - q: "What is the skillType field on Skill metadata?"
    a: "Added in API version 58.0, skillType links a Skill to a parent SkillType category (for example, grouping Spanish, French, and German under a Language SkillType) to organize large skill catalogs."
  - q: "How do you query Skills and agent skill proficiencies using SOQL?"
    a: "You query the Skill object for DeveloperName and MasterLabel, query ServiceResourceSkill to inspect which agents hold each skill and their SkillLevel (0 to 99.99), and query SkillRequirement on PendingServiceRouting or WorkOrder."
related:
  - metadata/queue-routing-config-metadata-type
  - metadata/service-channel-metadata-type
  - metadata/presence-user-config-metadata-type
  - metadata/flow-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_skill.htm
---

## Why the `Skill` Metadata Type Powers Intelligent Routing

When simple queue membership is too rigid—for example, when a single Case requires **Spanish Language** + **Enterprise Billing** + **AWS Certification**—creating a separate Queue for every permutation leads to "queue explosion." Instead, **`Skill`** (`skills/<Name>.skill-meta.xml`) defines discrete capabilities that are dynamically matched across:

1. **Omni-Channel Skills-Based Routing:** Matching `SkillRequirement` records created by an Omni-Channel Flow or `SkillMappingConfig` against online agents' `ServiceResourceSkill` records.
2. **Salesforce Field Service (FSL):** Matching technician certifications (`ServiceResourceSkill`) with `WorkOrder` and `WorkType` skill requirements.
3. **Salesforce Scheduler:** Matching customer appointment topics to qualified bankers, clinicians, or advisors.

```mermaid
flowchart LR
    SKILL["Skill Metadata<br/>(skills/Spanish_Fluent.skill-meta.xml)"] --> SRS["ServiceResourceSkill (Data)<br/>(Agent Proficiency: 8.0 / Effective Dates)"]
    SKILL --> SR["SkillRequirement (Runtime)<br/>(Attached to PendingServiceRouting or WorkOrder)"]
    SRS --> MATCH["Omni-Channel / Field Service Engine<br/>(Matches Required Skill & Level)"]
    SR --> MATCH
```

---

## Key Metadata Fields on `Skill`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Display name of the Skill in Omni Supervisor, Field Service Dispatcher Console, and Setup. |
| `description` | `string` | No | Explains the certification criteria or proficiency scale for the skill. |
| `skillType` | `string` | No | *(API v58.0+)* Categorizes the skill under a `SkillType` group. |
| `assignments` | `SkillAssignments` | No | Legacy Live Agent skill assignments (`profiles` and `users`). Omit in modern `ServiceResourceSkill` architectures. |

---

## Real-World XML Example (`skills/Enterprise_Cloud_Architecture.skill-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Skill xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Certified to troubleshoot multi-region enterprise cloud infrastructure and VPN peering.</description>
    <label>Enterprise Cloud Architecture</label>
</Skill>
```

---

## Querying `Skill`, `ServiceResourceSkill`, and `SkillRequirement` via SOQL

In Apex and Omni-Channel Flows, you regularly query `Skill` to look up `SkillId` values and inspect which agents (`ServiceResource`) hold active certifications.

### 1. List All Skills Configured in the Org

```sql
SELECT Id, DeveloperName, MasterLabel, Description, LastModifiedDate
FROM Skill
ORDER BY MasterLabel ASC
```

### 2. Query Active Agents and Their Skill Proficiency Levels (`ServiceResourceSkill`)

```sql
SELECT Id, ServiceResource.Name, ServiceResource.RelatedRecord.Username,
       Skill.DeveloperName, Skill.MasterLabel, SkillLevel,
       EffectiveStartDate, EffectiveEndDate
FROM ServiceResourceSkill
WHERE ServiceResource.IsActive = true
  AND (EffectiveEndDate = null OR EffectiveEndDate >= TODAY)
ORDER BY Skill.MasterLabel, SkillLevel DESC
```

### 3. Inspect Pending Omni-Channel Skill Requirements in Queue

```sql
SELECT Id, RelatedRecordId, Skill.DeveloperName, SkillLevel, IsAdditionalSkill, SkillPriority
FROM SkillRequirement
ORDER BY CreatedDate DESC
LIMIT 50
```

---

## Senior Architect Best Practices

> [!TIP]
> **Cache `Skill` IDs in a Singleton Apex Map:** When building dynamic Skills-Based Routing in Apex (creating `PendingServiceRouting` and `SkillRequirement` records), query `[SELECT Id, DeveloperName FROM Skill]` once per transaction (or cache in Platform Cache) rather than querying inside a loop.

- **Use `ServiceResourceSkill` Instead of `<assignments>`:** Do not assign users to skills via the Metadata API `<assignments>` block inside `.skill-meta.xml`. That legacy mechanism only applies to Classic Live Agent chat; Omni-Channel Skills-Based Routing, Field Service, and Scheduler all evaluate `ServiceResourceSkill` records!
