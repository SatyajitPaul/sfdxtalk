---
title: "SharingSet Metadata Type for Experience Cloud Portals"
description: "Configure Customer Community record sharing with the SharingSet metadata type. Learn accessMappings, userField to objectField matching, and deployment tips."
category: "metadata"
tags:
  - metadata-api
  - experience-cloud
  - sharing
  - security
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "intermediate"
tldr: "SharingSet (sharingSets/<Name>.sharingSet-meta.xml) grants Experience Cloud users—including Customer Community users without roles—Read or Edit access to records linked to their Account or Contact."
faq:
  - q: "Why do Customer Community users need a SharingSet instead of standard Sharing Rules?"
    a: "Standard Customer Community licenses (formerly High Volume Customer Portal users) do not have Roles in the Salesforce Role Hierarchy and cannot participate in standard Sharing Rules or manual sharing. SharingSet grants them record access dynamically based on Account or Contact lookup matching."
  - q: "How many SharingSet accessMappings can exist per object for a given Profile?"
    a: "Each Profile can have only one AccessMapping per target object across all Sharing Sets in the org. If you need multiple sharing paths on the same object, upgrade to Customer Community Plus or Partner Community licenses."
  - q: "What values are supported in the userField element of an AccessMapping?"
    a: "The userField element supports Account, Contact, Account.FieldName, Contact.FieldName, Contact.RelatedAccount (for Account Contact Relationship multi-account sharing), Manager.Account, and Manager.Contact."
  - q: "Which standard and custom objects can be shared via a SharingSet?"
    a: "SharingSet supports custom objects (that have a lookup to Account or Contact) as well as Account, Campaign, Case, Contact, Opportunity, Order, ServiceContract, User, and WorkOrder."
related:
  - metadata/network-metadata-type
  - metadata/sharing-rules-metadata-type
  - metadata/profile-metadata-type
  - metadata/custom-site-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_sharingset.htm
---

## Why the `SharingSet` Metadata Type Powers High-Volume Experience Cloud Portals

Users with **Customer Community** (High-Volume) licenses are designed to scale to millions of external portal members. To achieve that scale, Salesforce does not generate role hierarchy nodes or calculate standard sharing table rows (`*Share`) for Customer Community users. Instead, **`SharingSet`** (`sharingSets/<Name>.sharingSet-meta.xml`) grants `Read` or `Edit` access at runtime by matching a lookup field on the logged-in `User` (`userField`) against a lookup field on the target record (`objectField`).

```mermaid
flowchart LR
    USR["Logged-In Portal User<br/>(User.AccountId = '001_Acme')"] --> SS["SharingSet<br/>(sharingSets/Customer_Portal_Sharing.sharingSet-meta.xml)"]
    SS --> MAP1["AccessMapping 1 (Case)<br/>userField: Account == objectField: Account"]
    SS --> MAP2["AccessMapping 2 (Invoice__c)<br/>userField: Account == objectField: Bill_To_Account__c"]
    SS --> MAP3["AccessMapping 3 (Case via ACR)<br/>userField: Contact.RelatedAccount == objectField: Account"]
```

---

## Key Metadata Fields on `SharingSet` & `AccessMapping`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Unique display label of the Sharing Set in Digital Experiences Settings. |
| `description` | `string` | No | Explains which portal persona and records this Sharing Set governs. |
| `profiles` | `string[]` | No | Portal profile names assigned to this Sharing Set (e.g., `Customer Community Plus User`, `Customer Portal Manager`). |
| `accessMappings.object` | `string` | Yes | Target SObject API name (`Case`, `Order`, `WorkOrder`, `Invoice__c`). |
| `accessMappings.accessLevel` | `string` | Yes | `Read` or `Edit`. |
| `accessMappings.userField` | `string` | Yes | Lookup path from the logged-in `User` (`Account`, `Contact`, `Contact.RelatedAccount`, or `Account.ParentId`). |
| `accessMappings.objectField` | `string` | Yes | Lookup path on the target record pointing to an `Account` or `Contact` (e.g., `Account`, `Contact`, `Entitlement.Account`, `Customer_Account__c`). |

---

## Real-World XML Example (`sharingSets/Customer_Self_Service_Sharing.sharingSet-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<SharingSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <accessMappings>
        <accessLevel>Read</accessLevel>
        <object>Account</object>
        <objectField>Id</objectField>
        <userField>Account</userField>
    </accessMappings>
    <accessMappings>
        <accessLevel>Edit</accessLevel>
        <object>Case</object>
        <objectField>Account</objectField>
        <userField>Contact.RelatedAccount</userField>
    </accessMappings>
    <accessMappings>
        <accessLevel>Read</accessLevel>
        <object>Order</object>
        <objectField>Account</objectField>
        <userField>Account</userField>
    </accessMappings>
    <accessMappings>
        <accessLevel>Read</accessLevel>
        <object>Invoice__c</object>
        <objectField>Billed_Account__c</objectField>
        <userField>Account</userField>
    </accessMappings>
    <description>Grants Customer Community users access to Cases (including related ACR accounts), Orders, and Invoices.</description>
    <name>Customer Self Service Sharing</name>
    <profiles>acme customer community user</profiles>
</SharingSet>
```

---

## Senior Architect Best Practices & Gotchas

> [!TIP]
> **Multi-Account Portal Access with `Contact.RelatedAccount`:** When a single external consultant or regional manager supports multiple B2B customer accounts, enable **Account Contact Relationships (Contacts to Multiple Accounts)** and set `<userField>Contact.RelatedAccount</userField>`. One `SharingSet` mapping will automatically grant that user access to Cases across all Accounts linked to their Contact via `AccountContactRelation`!

- **Profile Names in `<profiles>` Are Lowercase in Metadata:** When retrieving a `SharingSet`, Salesforce outputs custom portal profile names in lowercase (e.g., `<profiles>acme customer community user</profiles>`). Ensure the referenced [Profile](/docs/metadata/profile-metadata-type/) exists in the target org before deploying the `SharingSet`.
