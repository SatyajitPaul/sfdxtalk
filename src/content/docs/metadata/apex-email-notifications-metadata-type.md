---
title: "ApexEmailNotifications Metadata Type for Error Alerts"
description: "Configure unhandled Apex exception and Flow fault email recipients using the ApexEmailNotifications metadata type. Learn full-replacement rules and SOQL."
category: "metadata"
tags:
  - metadata-api
  - apex
  - flow
  - error-handling
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "ApexEmailNotifications (apexEmailNotifications/apexEmailNotifications.notifications-meta.xml) defines the internal users and external email distribution lists that receive unhandled Apex and Flow exception alerts."
faq:
  - q: "Why should every production org configure ApexEmailNotifications?"
    a: "Without ApexEmailNotifications configured, unhandled Apex exceptions and Flow fault emails (when Send error email to Apex Exception Email Recipients is enabled in Process Automation Settings) are sent only to the developer who last modified the class or flow—who may no longer work at the company."
  - q: "Can a single apexEmailNotification block contain both user and email?"
    a: "No. Each apexEmailNotification entry must specify either a user (Salesforce username) or an email (external email address or distribution list), never both in the same block."
  - q: "What happens to existing recipients in the org when you deploy ApexEmailNotifications?"
    a: "Deploying apexEmailNotifications.notifications-meta.xml performs a full replacement! Any existing recipient in the target org that is not listed in your deployed XML file is immediately deleted."
  - q: "Can you query ApexEmailNotifications recipients using SOQL?"
    a: "Yes. Both standard SOQL and the Tooling API allow querying the ApexEmailNotification object to inspect Email, UserId, and User.Username."
related:
  - metadata/apex-class-metadata-type
  - metadata/apex-trigger-metadata-type
  - metadata/flow-metadata-type
  - metadata/apex-test-suite-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_apexemailnotifications.htm
---

## Why the `ApexEmailNotifications` Metadata Type Is Essential for Production Observability

By default, when an unhandled Apex governor limit (`System.LimitException: Too many SOQL queries: 101`) or NullPointerException occurs in Production, Salesforce emails the `LastModifiedBy` user of the failing class or trigger. If that consultant or developer left the project two years ago, critical production failures go unnoticed.

**`ApexEmailNotifications`** (`apexEmailNotifications/apexEmailNotifications.notifications-meta.xml`) centralizes unhandled **Apex Exception** and **Flow Fault** emails (when **Process Automation Settings → Send Process or Flow Error Email to → Apex Exception Email Recipients** is enabled) to your DevOps PagerDuty, Slack email webhook, or engineering distribution list.

```mermaid
flowchart LR
    ERR1["Unhandled Apex Exception<br/>(LimitException / DmlException)"] --> AEN["ApexEmailNotifications<br/>(apexEmailNotifications.notifications-meta.xml)"]
    ERR2["Unhandled Flow Fault<br/>(Process Automation Settings)"] --> AEN
    AEN --> EXT["External Distribution / PagerDuty<br/>(&lt;email&gt;sfdc-alerts@acme.com&lt;/email&gt;)"]
    AEN --> USR["Internal Lead Architect<br/>(&lt;user&gt;lead.arch@acme.com&lt;/user&gt;)"]
```

---

## Key Metadata Fields on `ApexEmailNotifications`

In SFDX source format, there is only **one** file per org:
`force-app/main/default/apexEmailNotifications/apexEmailNotifications.notifications-meta.xml`

| Field | Type | Required | Description |
|---|---|---|---|
| `apexEmailNotification` | `ApexEmailNotification[]` | No | List of notification recipients. Deploying an empty `<ApexEmailNotifications/>` deletes all recipients in the org. |
| `apexEmailNotification.email` | `string` | Conditional | External email address or distribution list (mutually exclusive with `user`). |
| `apexEmailNotification.user` | `string` | Conditional | Username of an active Salesforce User in the org (mutually exclusive with `email`). |

---

## Real-World XML Example (`apexEmailNotifications/apexEmailNotifications.notifications-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexEmailNotifications xmlns="http://soap.sforce.com/2006/04/metadata">
    <apexEmailNotification>
        <email>salesforce-prod-alerts@acme.example.com</email>
    </apexEmailNotification>
    <apexEmailNotification>
        <email>pagerduty-sfdc-sev2@acme.example.com</email>
    </apexEmailNotification>
</ApexEmailNotifications>
```

---

## Querying `ApexEmailNotification` via SOQL

You can query the configured exception recipients in standard SOQL or the Tooling API:

```sql
SELECT Id, Email, UserId, User.Name, User.Username, User.IsActive, CreatedDate
FROM ApexEmailNotification
ORDER BY CreatedDate DESC
```

---

## Senior Architect Best Practices & Gotchas

> [!WARNING]
> **Full-Overwrite Behavior (`destructiveChanges.xml` Not Used):** Deploying `ApexEmailNotifications` **replaces** the entire list of recipients in the target org. Any recipient previously added in **Setup → Apex Exception Email** that is missing from your `.notifications-meta.xml` file is deleted upon deploy.

- **Prefer `<email>` Distribution Lists Over `<user>` Usernames:** Using `<email>sfdc-devops@acme.example.com</email>` instead of `<user>admin@acme.com</user>` avoids sandbox username mismatch errors during CI/CD deployments and lets you manage alert membership in Google Workspace, Microsoft 365, or PagerDuty without redeploying Salesforce metadata!

