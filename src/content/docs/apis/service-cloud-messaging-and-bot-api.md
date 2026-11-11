---
title: "Service Cloud Messaging and Bot API Architecture"
description: "Architect real-time customer messaging with Messaging for In-App and Web (MIAW), Einstein Bot Session APIs, and seamless bot-to-agent escalation."
category: apis
tags:
  - apis
  - integration
  - agentforce
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-11
lastUpdated: 2026-11-11
level: advanced
tldr: "Service Cloud Messaging combines Messaging for In-App and Web with the Einstein Bot Session REST API and Omni-Channel flow routing to automate conversational service."
faq:
  - q: "What is the primary difference between legacy Live Agent Chat and Messaging for In-App and Web (MIAW)?"
    a: "Live Agent Chat was synchronous and session-bound, terminating if the customer closed the browser window. MIAW is persistent and asynchronous, allowing customers to resume conversations across devices while preserving history in the Messaging Object Model."
  - q: "What are the core entities in the Salesforce Messaging Object Model (MOM)?"
    a: "The primary entities are MessagingChannel for channel settings, MessagingUser representing customer identity, MessagingSession tracking each conversation lifecycle, and ConversationEntry containing individual message transcript records."
  - q: "How do external applications integrate with Einstein Bots headlessly?"
    a: "External applications use the Einstein Bot REST API (v5.1). The client creates a session with POST /sessions, sends customer messages with POST /messages, processes bot responses, and handles escalation events."
  - q: "How does Omni-Channel Flow route incoming messaging sessions?"
    a: "Incoming messaging sessions invoke Omni-Channel Flows that inspect customer attributes, verify business hours, check agent availability queues, or route to an Agentforce service bot before escalating to human agents."
  - q: "What happens during a bot-to-human escalation event?"
    a: "When an Einstein Bot or Agentforce bot initiates escalation, the Bot API emits an EscalationEvent. Omni-Channel routes the MessagingSession to an available human agent while passing the complete conversation transcript and CRM context."
related:
  - agentforce/models-api-and-genai
  - apis/pubsub-api-eventbus
  - integration/named-credentials-callouts
officialRefs:
  - "https://developer.salesforce.com/docs/service/messaging-web/guide/overview.html"
  - "https://developer.salesforce.com/docs/atlas.en-us.bot_rest.meta/bot_rest/intro.htm"
---

## Overview

Customer communication has fundamentally shifted from ephemeral, synchronous live chat to persistent, asynchronous messaging channels (WhatsApp, Apple Messages for Business, mobile apps, and modern web portals).

Salesforce Service Cloud delivers this paradigm through **Messaging for In-App and Web (MIAW)** and the **Einstein Bot Session REST API**. Unlike legacy Live Agent Chat (which permanently disconnected when a customer closed their browser tab), modern Service Cloud Messaging preserves full conversational context in the **Messaging Object Model (MOM)**, enabling seamless transitions between autonomous Agentforce bots and human contact center agents.

![Service Cloud Messaging & Einstein Bot API Architecture](../../../assets/docs/apis/service-cloud-messaging-and-bot-api-1.png)

---

## The Messaging Object Model (MOM) Architecture

All conversational interactions across web, mobile, SMS, and social messaging channels resolve into standardized CRM data structures:

```mermaid
erDiagram
    MessagingChannel ||--o{ MessagingSession : "transacts"
    MessagingUser ||--o{ MessagingSession : "engages"
    MessagingSession ||--o{ ConversationEntry : "contains"
    MessagingSession ||--o| Case : "links to"
```

1. **`MessagingChannel`**: Represents the communication endpoint (e.g., an In-App Mobile Channel, Web Deployment, or WhatsApp business number).
2. **`MessagingUser`**: Maps the customer's external channel identity (phone number, authenticated JWT subject, or device UUID) to a standard `Contact` or `Lead`.
3. **`MessagingSession`**: Represents a single interaction lifecycle. Tracks session start/end timestamps, agent acceptance, routing queues, and resolution status (`Active`, `Ended`, `Error`).
4. **`ConversationEntry`**: Stores individual message entries, transcripts, attachments, and routing system events.

---

## Headless Einstein Bot Session REST API (v5.1)

For organizations embedding Salesforce AI bots into custom native apps, IoT devices, or third-party web portals, the **Einstein Bot REST API** provides programmatic access to bot dialogs without using Salesforce's prebuilt chat widgets.

### Step 1: Initiate Bot Session (`POST /sessions`)

```http title="Initiate Bot Session"
POST /api/v5.1.0/bots/{botId}/sessions HTTP/1.1
Host: runtime-api-na-east.bot.salesforce.com
Authorization: Bearer <OAuth_Token>
Content-Type: application/json

{
  "externalSessionKey": "user-session-uuid-12345",
  "instanceUrl": "https://mycompany.my.salesforce.com",
  "variables": [
    {
      "name": "CustomerEmail",
      "value": "customer@example.com"
    },
    {
      "name": "OrderNumber",
      "value": "ORD-99882"
    }
  ]
}
```

The response returns a `sessionId` used for all subsequent conversational turns.

### Step 2: Send Message & Receive Responses (`POST /messages`)

```http title="Send Message to Bot"
POST /api/v5.1.0/sessions/{sessionId}/messages HTTP/1.1
Host: runtime-api-na-east.bot.salesforce.com
Authorization: Bearer <OAuth_Token>
Content-Type: application/json

{
  "message": {
    "text": "What is the status of my order?"
  }
}
```

```json title="Example Bot Response Payload"
{
  "messages": [
    {
      "type": "text",
      "text": "Your order ORD-99882 has shipped and is scheduled for delivery tomorrow."
    }
  ],
  "agentEscalated": false
}
```

---

## Omni-Channel Flow Routing & Human Escalation

When customer queries exceed automated bot capabilities, the system initiates a **Bot-to-Human Handover**:

```mermaid
flowchart TD
    A["Customer Message"] --> B["Einstein Bot / Agentforce"]
    B -->|Intent Resolved| C["Bot Concludes Session"]
    B -->|Escalation Event| D["Omni-Channel Flow"]
    D --> E["Skill & Availability Evaluation"]
    E --> F["Human Agent Service Console"]
```

1. **Triggering Escalation**: The bot executes a Transfer Dialog or emits an `EscalationEvent`.
2. **Omni-Channel Evaluation**: Salesforce invokes an **Omni-Channel Flow** that checks agent capacity, operating hours, and required routing skills (e.g., Tier 2 Billing).
3. **Context Preservation**: The human agent receives the incoming `MessagingSession` in the Service Console with the **complete historical transcript** and customer record automatically linked, eliminating customer repetition.

