---
title: "LightningMessageChannel Metadata Type Reference"
description: "Configure and deploy LightningMessageChannel (.messageChannel-meta.xml) metadata for cross-DOM communication across LWC, Aura, and Visualforce."
category: metadata
tags:
  - metadata-api
  - lwc
  - lightning-message-service
  - ui
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "LightningMessageChannel (.messageChannel-meta.xml) defines a Lightning Message Service (LMS) channel and payload schema (lightningMessageFields) for communicating between sibling LWCs, Aura components, and Visualforce pages."
faq:
  - q: "When should I use a LightningMessageChannel instead of standard DOM CustomEvents?"
    a: "Use standard DOM CustomEvents for parent-child LWC communication within the same component hierarchy. Use a LightningMessageChannel when communicating across separate sibling components on a FlexiPage, across utility bar panels, or between LWC, Aura, and Visualforce."
  - q: "Why must isExposed be set to false to pass the AppExchange Security Review?"
    a: "Setting isExposed to true allows components in any namespace across the org to publish and subscribe to the channel. For ISV managed packages, Salesforce Security Review requires isExposed to be false so the message channel remains isolated within your package namespace."
  - q: "Can I change isExposed from true back to false after deploying a LightningMessageChannel?"
    a: "No. Once a LightningMessageChannel is deployed in a managed package or referenced by other components with isExposed set to true, you cannot revert isExposed to false."
  - q: "How do I import a LightningMessageChannel inside a Lightning Web Component?"
    a: "Import the channel using import CHANNEL_NAME from '@salesforce/messageChannel/ChannelDeveloperName__c'; and use publish, subscribe, unsubscribe, and MessageContext from lightning/messageService."
  - q: "Where are LightningMessageChannel files stored in SFDX?"
    a: "They are stored in the force-app/main/default/messageChannels/ directory with the .messageChannel-meta.xml suffix."
related:
  - metadata/lightning-component-bundle-metadata-type
  - metadata/flexipage-metadata-type
  - metadata/custom-application-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_lightningmessagechannel.htm
---

The `LightningMessageChannel` metadata type defines a **Lightning Message Service (LMS)** channel used to publish and subscribe to structured JSON messages across independent UI components on a page—including sibling [LightningComponentBundle](/docs/metadata/lightning-component-bundle-metadata-type/) instances on a [FlexiPage](/docs/metadata/flexipage-metadata-type/), Utility Bar widgets, Aura components, and Visualforce pages. Introduced in API version 47.0, LMS eliminates brittle `window.postMessage` hacks.

In Salesforce DX projects, message channels are stored in `force-app/main/default/messageChannels/` with the `.messageChannel-meta.xml` suffix.

```mermaid
flowchart LR
    Pub["Publisher LWC\n(publish(messageContext, CHANNEL, payload))"] --> LMC["LightningMessageChannel\n(OrderSelectionChannel.messageChannel-meta.xml)"]
    LMC --> Sub1["Subscriber LWC\n(FlexiPage Sidebar)"]
    LMC --> Sub2["Subscriber LWC\n(Console Utility Bar)"]
    LMC --> Sub3["Subscriber Aura / VF Page"]
```

## Key Metadata Fields

| Field | Location | Required | Description |
|---|---|---|---|
| `masterLabel` | Root | Yes | Display label of the Lightning Message Channel |
| `isExposed` | Root | No | Exposes the channel across namespaces when `true` (default `false`) |
| `description` | Root | No | Documents the channel's purpose and expected payload contract |
| `lightningMessageFields` | Root | No | List of payload keys (`fieldName` and `description`) |
| `fieldName` | `lightningMessageFields` | Yes | Property key name inside the published JSON message object |

## Production-Grade XML Example

Below is a `LightningMessageChannel` (`OrderSelectionChannel.messageChannel-meta.xml`) that broadcasts selected order details across components on an Order Command Center page:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Broadcasts the currently selected Order Id and status across sibling LWCs on the Order Command Center App Page.</description>
    <isExposed>true</isExposed>
    <lightningMessageFields>
        <description>The 18-character Salesforce Id of the selected Order record.</description>
        <fieldName>orderId</fieldName>
    </lightningMessageFields>
    <lightningMessageFields>
        <description>The current Order Status code (for example, Activated, Fulfilled, Cancelled).</description>
        <fieldName>orderStatus</fieldName>
    </lightningMessageFields>
    <lightningMessageFields>
        <description>The source component that triggered the selection event.</description>
        <fieldName>sourceComponent</fieldName>
    </lightningMessageFields>
    <masterLabel>Order Selection Channel</masterLabel>
</LightningMessageChannel>
```

## Publishing and Subscribing in LWC

Notice that when importing a `LightningMessageChannel` in JavaScript, you append `__c` to the channel's file name (`@salesforce/messageChannel/OrderSelectionChannel__c`):

```javascript
import { LightningElement, wire } from 'lwc';
import { publish, subscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import ORDER_SELECTION_CHANNEL from '@salesforce/messageChannel/OrderSelectionChannel__c';

export default class OrderDetailInspector extends LightningElement {
    @wire(MessageContext)
    messageContext;

    subscription = null;
    selectedOrderId;

    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                ORDER_SELECTION_CHANNEL,
                (message) => this.handleOrderSelected(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    handleOrderSelected(message) {
        this.selectedOrderId = message.orderId;
    }

    notifyOrderRefresh() {
        publish(this.messageContext, ORDER_SELECTION_CHANNEL, {
            orderId: this.selectedOrderId,
            orderStatus: 'Fulfilled',
            sourceComponent: 'OrderDetailInspector'
        });
    }
}
```

> [!WARNING]
> **AppExchange Security Review Requirement**: If you are building a managed package for the AppExchange, you **must** set `<isExposed>false</isExposed>` on every `LightningMessageChannel`. Setting `<isExposed>true</isExposed>` causes an automatic AppExchange Security Review failure, and once released as `true` in a managed package, it can never be changed back to `false`.

