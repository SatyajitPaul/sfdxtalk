---
title: "Call Apex Methods from Lightning Web Components"
description: "Call Apex from a Lightning Web Component with @wire or an imperative call, refresh cached data with refreshApex, and handle errors correctly."
category: lwc
tags: [apex, wire-service, lwc]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-11
lastUpdated: 2026-11-11
level: intermediate
tldr: "Expose a static Apex method with @AuraEnabled, import it into your component, and call it with @wire for cacheable reads or imperatively for DML and on-demand calls. Use refreshApex to reload wired data."
faq:
  - q: "When should I use @wire instead of an imperative Apex call?"
    a: "Use @wire to read data that should load and update automatically when its parameters change. Use an imperative call for DML, for calls triggered by a user action, or when you need to control exactly when the call runs."
  - q: "Why does my wired Apex method fail with a cacheable error?"
    a: "Wired Apex methods must be annotated with @AuraEnabled(cacheable=true). Cacheable methods cannot perform DML, so move any inserts or updates to a separate method you call imperatively."
  - q: "How do I refresh data loaded with @wire?"
    a: "Wire the method to a property or function, keep the provisioned value, and pass it to refreshApex imported from @salesforce/apex. The call returns a promise that resolves when the data is refreshed."
  - q: "Does an Apex method called from LWC respect sharing and field-level security?"
    a: "Sharing depends on the class keyword, such as with sharing. Field-level security is not enforced automatically, so use WITH USER_MODE in SOQL or Security.stripInaccessible to enforce it."
related:
  - sf-cli/create-scratch-org
officialRefs:
  - "https://developer.salesforce.com/docs/platform/lwc/guide/apex.html"
---

## Overview

Lightning Web Components (LWC) call server-side Apex through methods annotated with `@AuraEnabled`. There are two ways to call them:

| Approach | Use for | Caching | DML allowed |
|---|---|---|---|
| `@wire` | Reading data reactively | Yes (client cache) | No |
| Imperative call | User actions, DML, on-demand reads | Only if `cacheable=true` | Yes, if not cacheable |

Prefer Lightning Data Service (for example `getRecord`) for single-record reads and writes. Use Apex when you need custom queries, multiple objects, or business logic.

## Prerequisites

- An org where you can deploy Apex and LWC, such as a [scratch org](/docs/sf-cli/create-scratch-org/).
- A Salesforce DX project with an `lwc` folder.

## Expose the Apex Method

An Apex method callable from LWC must be `static`, `public` or `global`, and annotated with `@AuraEnabled`. Add `cacheable=true` to allow `@wire`.

```apex title="ContactController.cls"
public with sharing class ContactController {

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId) {
        return [
            SELECT Id, Name, Email, Title
            FROM Contact
            WHERE AccountId = :accountId
            WITH USER_MODE
            ORDER BY Name
            LIMIT 50
        ];
    }

    @AuraEnabled
    public static void updateTitle(Id contactId, String title) {
        update as user new Contact(Id = contactId, Title = title);
    }
}
```

`WITH USER_MODE` and `update as user` enforce the running user's object permissions, field-level security, and sharing.

## Read Data with @wire

The `@wire` decorator calls a cacheable Apex method and re-runs it whenever a reactive parameter changes. Prefix a parameter with `$` to make it reactive.

```javascript title="accountContacts.js"
import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getContacts from '@salesforce/apex/ContactController.getContacts';
import updateTitle from '@salesforce/apex/ContactController.updateTitle';

export default class AccountContacts extends LightningElement {
    @api recordId;
    contacts;
    error;
    wiredResult;

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts(result) {
        this.wiredResult = result;
        if (result.data) {
            this.contacts = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error.body?.message ?? 'Unknown error';
            this.contacts = undefined;
        }
    }

    async handlePromote(event) {
        try {
            await updateTitle({ contactId: event.target.dataset.id, title: 'Manager' });
            await refreshApex(this.wiredResult);
        } catch (err) {
            this.error = err.body?.message ?? 'Update failed';
        }
    }
}
```

The keys in the parameter object (`accountId`) must match the Apex parameter names exactly.

```html title="accountContacts.html"
<template>
    <template lwc:if={error}>
        <p class="slds-text-color_error">{error}</p>
    </template>
    <template for:each={contacts} for:item="contact">
        <p key={contact.Id}>
            {contact.Name} ({contact.Title})
            <lightning-button label="Promote" data-id={contact.Id} onclick={handlePromote}></lightning-button>
        </p>
    </template>
</template>
```

## Call Apex Imperatively

An imperative call invokes the imported function directly and returns a promise. Use it for DML or when the call should run only on a user action, as `handlePromote` does above.

- Pass parameters as one object: `updateTitle({ contactId, title })`.
- Await the promise and catch errors; failed calls reject with an object whose message is in `body.message`.
- After DML, call `refreshApex` on the wired result so the UI shows the new data.

> [!TIP]
> Call `refreshApex` with the whole object the wire service provisioned (`this.wiredResult`), not with `result.data`. Passing only the data does not refresh anything.

## Limits and Gotchas

- **Cacheable methods cannot perform DML.** A DML statement in an `@AuraEnabled(cacheable=true)` method throws an exception.
- **Wired calls may not run immediately.** A wire with an undefined reactive parameter (for example `recordId` before it is set) does not call Apex.
- **Parameter names must match.** A mismatched key passes `null` to Apex silently.
- **Governor limits apply per call.** Each Apex call is its own transaction with standard synchronous limits, such as 100 SOQL queries.

## Related Official Documentation

- [Call Apex Methods (LWC Developer Guide)](https://developer.salesforce.com/docs/platform/lwc/guide/apex.html): wire, imperative calls, and refreshApex.
