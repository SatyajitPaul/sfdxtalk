---
title: "AutoResponseRules Metadata Type Reference"
description: "Configure and deploy AutoResponseRules (.autoResponseRules-meta.xml) metadata to send automated confirmation emails for Web-to-Lead and Email-to-Case."
category: metadata
tags:
  - metadata-api
  - auto-response-rules
  - case-management
  - lead-routing
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "AutoResponseRules (.autoResponseRules-meta.xml) defines ordered ruleEntry criteria that send immediate confirmation emails using Organization-Wide Email Addresses and Classic Email Templates when Leads or Cases are submitted."
faq:
  - q: "Which Salesforce objects support AutoResponseRules metadata?"
    a: "Only Lead (Lead.autoResponseRules-meta.xml) and Case (Case.autoResponseRules-meta.xml) support AutoResponseRules."
  - q: "How many AutoResponseRules can be active at the same time per object?"
    a: "Only one AutoResponseRule per object (one for Lead and one for Case) can have active set to true at any given time, though that active rule can contain many ordered ruleEntry blocks."
  - q: "Why did my AutoResponseRules deployment fail on the senderEmail field?"
    a: "The email address specified in senderEmail on a ruleEntry must match a verified Organization-Wide Email Address in the target org, or the deployment will fail validation."
  - q: "How many emails are sent if a Case matches three ruleEntry blocks inside an active AutoResponseRule?"
    a: "Only one email is sent. Salesforce evaluates ruleEntry blocks top-to-bottom and stops as soon as the first matching ruleEntry fires."
  - q: "How do I trigger AutoResponseRules when inserting a Lead or Case via Apex or SOAP/REST API?"
    a: "Set Database.DMLOptions.EmailHeader.triggerAutoResponseEmail = true on the record or DML operation in Apex, or pass the EmailHeader SOAP/REST header."
related:
  - metadata/assignment-rules-metadata-type
  - metadata/escalation-rules-metadata-type
  - metadata/email-template-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_autoresponserules.htm
---

The `AutoResponseRules` metadata type configures automatic acknowledgment emails sent to customers or prospects when a **Case** or **Lead** is created (via Web-to-Lead, Web-to-Case, Email-to-Case, Customer Portal, or API with `EmailHeader.triggerAutoResponseEmail`). Introduced in API version 27.0, an active `AutoResponseRule` evaluates `<ruleEntry>` blocks in top-to-bottom sequence and sends the [EmailTemplate](/docs/metadata/email-template-metadata-type/) defined on the first matching entry.

In Salesforce DX projects, auto-response rules are stored in `force-app/main/default/autoResponseRules/Case.autoResponseRules-meta.xml` and `Lead.autoResponseRules-meta.xml`.

```mermaid
flowchart LR
    Submit["Inbound Case or Lead Created"] --> Header{"triggerAutoResponseEmail\nEnabled?"}
    Header -->|"Yes"| Rule["Active AutoResponseRule\n(active: true)"]
    Rule --> Entry1{"First Matching\nruleEntry"}
    Entry1 --> Send["Sends EmailTemplate from\nVerified OrgWideEmailAddress (senderEmail)"]
```

## Key Fields on `AutoResponseRule` and `RuleEntry`

| Field | Location | Required | Description |
|---|---|---|---|
| `fullName` | `autoResponseRule` | Yes | Name of the auto-response rule |
| `active` | `autoResponseRule` | No | Whether this rule is active (`true` for at most 1 rule per object) |
| `ruleEntry` | `autoResponseRule` | No | Ordered array of condition-to-template rules |
| `criteriaItems` | `ruleEntry` | Conditional | Field filter criteria (`field`, `operation`, `value`)—mutually exclusive with `formula` |
| `booleanFilter` | `ruleEntry` | No | Boolean logic combining `criteriaItems` |
| `formula` | `ruleEntry` | Conditional | Formula expression evaluating to `true`—mutually exclusive with `criteriaItems` |
| `senderName` | `ruleEntry` | Yes | Display name in the outbound email's `From` header |
| `senderEmail` | `ruleEntry` | Yes | Must match a verified **Organization-Wide Email Address** in the target org |
| `replyToEmail` | `ruleEntry` | No | Optional `Reply-To` address (for example, your Email-to-Case routing address) |
| `template` | `ruleEntry` | Yes | Developer path (`Folder/TemplateName`) of the Email Template to send |
| `notifyCcRecipients` | `ruleEntry` | No | Includes CC recipients from an incoming Email-to-Case message on the auto-response (v32.0+) |

## Production-Grade XML Example (`Case.autoResponseRules-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<AutoResponseRules xmlns="http://soap.sforce.com/2006/04/metadata">
    <autoResponseRule>
        <fullName>Customer_Support_Auto_Response</fullName>
        <active>true</active>
        <ruleEntry>
            <criteriaItems>
                <field>Case.Priority</field>
                <operation>equals</operation>
                <value>Critical,High</value>
            </criteriaItems>
            <notifyCcRecipients>true</notifyCcRecipients>
            <replyToEmail>support@example.com</replyToEmail>
            <senderEmail>noreply-support@example.com</senderEmail>
            <senderName>Enterprise Priority Support</senderName>
            <template>Support_Templates/Priority_Case_Acknowledgment</template>
        </ruleEntry>
        <ruleEntry>
            <formula>TRUE</formula>
            <notifyCcRecipients>false</notifyCcRecipients>
            <replyToEmail>support@example.com</replyToEmail>
            <senderEmail>noreply-support@example.com</senderEmail>
            <senderName>Customer Support Team</senderName>
            <template>Support_Templates/Standard_Case_Acknowledgment</template>
        </ruleEntry>
    </autoResponseRule>
</AutoResponseRules>
```

> [!WARNING]
> **Verify `OrgWideEmailAddress` Before Deploying `AutoResponseRules`**: If `<senderEmail>` references an email address that is not registered and verified in `OrgWideEmailAddress` in the destination sandbox or production org, the deployment will fail. Query `SELECT Id, Address, DisplayName, IsVerified FROM OrgWideEmailAddress` in the target org before deploying.

## Triggering Auto-Response Emails in Apex

```java
Database.DMLOptions dmlOpts = new Database.DMLOptions();
dmlOpts.emailHeader.triggerAutoResponseEmail = true;

Lead webLead = new Lead(
    FirstName = 'Aarav',
    LastName = 'Mehta',
    Company = 'CloudScale India',
    Email = 'aarav@cloudscale.example.com'
);
webLead.setOptions(dmlOpts);
insert as user webLead;
```

