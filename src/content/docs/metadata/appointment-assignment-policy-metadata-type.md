---
title: "AppointmentAssignmentPolicy Metadata Guide"
description: "Configure and deploy AppointmentAssignmentPolicy metadata in Salesforce DX to govern Salesforce Scheduler resource utilization and load balancing."
category: "metadata"
tags:
  - "metadata"
  - "salesforce-scheduler"
  - "resource-assignment"
  - "sfdx"
  - "field-service"
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "AppointmentAssignmentPolicy defines resource selection and load-balancing rules in Salesforce Scheduler, determining how service resources are prioritized and assigned to customer appointments."
faq:
  - q: "Where are AppointmentAssignmentPolicy files stored in SFDX?"
    a: "They are stored in force-app/main/default/appointmentAssignmentPolicies/ with the file suffix .appointmentAssignmentPolicy-meta.xml."
  - q: "How does AppointmentAssignmentPolicy work with AppointmentSchedulingPolicy?"
    a: "An AppointmentSchedulingPolicy references an AppointmentAssignmentPolicy via its appointmentAssignmentPolicy field to decide which eligible service resource receives an appointment."
  - q: "What utilization CalculationDuration values are supported?"
    a: "Valid utilization calculation durations enable Salesforce Scheduler to evaluate existing appointment loads over a rolling window when balancing assignments across resources."
  - q: "Can I query AppointmentAssignmentPolicy via SOQL?"
    a: "Yes, AppointmentAssignmentPolicy is available as a standard and Tooling API object to inspect PolicyType, UtilizationFactor, and MasterLabel."
related:
  - "metadata/flow-metadata-type"
  - "metadata/custom-object-metadata-type"
  - "metadata/permission-set-metadata-type"
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-appointmentassignmentpolicy.md"
---

## Architectural Overview

The `AppointmentAssignmentPolicy` metadata type defines the resource distribution algorithm used by **Salesforce Scheduler** when assigning `ServiceAppointment` records to eligible `ServiceResource` staff (such as wealth advisors, branch bankers, or healthcare clinicians).

Instead of overloading the first alphabetically returned advisor, architects configure an `AppointmentAssignmentPolicy` to calculate resource utilization across a defined duration and balance incoming bookings fairly across the qualified pool.

```mermaid
flowchart LR
    A["AppointmentAssignmentPolicy"] --> B["AppointmentSchedulingPolicy"]
    B --> C["Salesforce Scheduler Flow / API"]
    C --> D["Evaluate Resource Priority & Utilization"]
    D --> E["Assign Optimal ServiceResource"]
```

## Directory Location and File Suffix

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `AppointmentAssignmentPolicy` |
| **XML Root Element** | `<AppointmentAssignmentPolicy>` |
| **SFDX Directory** | `force-app/main/default/appointmentAssignmentPolicies/` |
| **File Suffix** | `.appointmentAssignmentPolicy-meta.xml` |

## Key Metadata Fields

| Field | Type | Required | Description & Architectural Significance |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | The human-readable name of the assignment policy displayed in Setup. |
| `policyApplicableDuration` | `string` | Yes | Specifies the time window used to calculate resource utilization (for example, `OneDay`, `OneWeek`, `TwoWeeks`, `FourWeeks`, `ThreeMonths`). |
| `policyType` | `string` | Yes | Defines the assignment strategy, such as `LoadBalancing` to distribute work evenly across service resources. |
| `utilizationFactor` | `string` | Yes | Determines how existing utilization is measured (for example, `NumberOfAppointments` or `TotalAppointmentsDuration`). |

## Declarative XML and Package Manifest Examples

Below is an `AppointmentAssignmentPolicy` configured to load-balance appointments across wealth advisors based on total appointment duration over a 2-week rolling window:

```xml title="force-app/main/default/appointmentAssignmentPolicies/Advisor_Duration_Load_Balance.appointmentAssignmentPolicy-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<AppointmentAssignmentPolicy xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>Advisor Duration Load Balance</masterLabel>
    <policyApplicableDuration>TwoWeeks</policyApplicableDuration>
    <policyType>LoadBalancing</policyType>
    <utilizationFactor>TotalAppointmentsDuration</utilizationFactor>
</AppointmentAssignmentPolicy>
```

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Advisor_Duration_Load_Balance</members>
        <name>AppointmentAssignmentPolicy</name>
    </types>
    <version>68.0</version>
</Package>
```

## Querying AppointmentAssignmentPolicy via SOQL

You can query `AppointmentAssignmentPolicy` records directly in SOQL to verify active load-balancing configurations:

```soql
SELECT Id, DeveloperName, MasterLabel, PolicyType,
       PolicyApplicableDuration, UtilizationFactor
FROM AppointmentAssignmentPolicy
ORDER BY DeveloperName
```

## Senior Architect Best Practices and Gotchas

1. **Deploy Before `AppointmentSchedulingPolicy`:** Because `AppointmentSchedulingPolicy` references `AppointmentAssignmentPolicy` by developer name when resource assignment rules are enabled, always include both metadata types in your `package.xml` or deploy `AppointmentAssignmentPolicy` first.
2. **Choose Duration vs. Count Wisely:** Use `TotalAppointmentsDuration` when appointment lengths vary widely (e.g., 15-minute check-ins mixed with 90-minute mortgage reviews). Use `NumberOfAppointments` only when all work type durations are uniform.
3. **License Requirement in Scratch Orgs:** Deploying `AppointmentAssignmentPolicy` to a scratch org requires the `LightningScheduler` feature flag in `config/project-scratch-def.json`.
