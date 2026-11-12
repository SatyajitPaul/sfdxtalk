---
title: "GenAiPlugin Metadata Type Reference"
description: "Configure and deploy GenAiPlugin (.genAiPlugin-meta.xml) metadata to define Agentforce Agent Topics, classification descriptions, scope, and actions."
category: metadata
tags:
  - metadata-api
  - agentforce
  - ai
  - agent-topics
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: advanced
tldr: "GenAiPlugin (.genAiPlugin-meta.xml) represents an Agentforce Topic. Introduced in API version 60.0, it groups related GenAiFunction actions, natural-language classification descriptions, scope boundaries, and instructions for the reasoning engine."
faq:
  - q: "What does GenAiPlugin represent in Agentforce Builder?"
    a: "In Agentforce Builder, a GenAiPlugin metadata component corresponds directly to an Agent Topic. It defines the classification description used to route user utterances, the scope boundaries, the topic instructions, and the allowed Agent Actions."
  - q: "How does the Agentforce reasoning engine decide which GenAiPlugin to select?"
    a: "The reasoning engine evaluates the description field (Classification Description in the UI) of each GenAiPlugin assigned to the agent's GenAiPlannerBundle against the user's message and conversation history."
  - q: "What is the difference between description and scope on a GenAiPlugin?"
    a: "The description field tells the planner when to route a user request into this topic. Once the topic is selected, the scope field defines the boundaries of what the agent is permitted to do while operating inside that topic."
  - q: "How do I attach Agent Actions to a GenAiPlugin?"
    a: "Add genAiFunctions entries to the GenAiPlugin XML, setting each functionName field to the developer name of a GenAiFunction metadata component."
  - q: "What does the canEscalate field control on a GenAiPlugin?"
    a: "When canEscalate is set to true, the agent is permitted to escalate the conversation to a human service representative when operating within that topic."
related:
  - metadata/genai-function-metadata-type
  - metadata/genai-planner-bundle-metadata-type
  - metadata/genai-prompt-template-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_genaiplugin.htm
---

The `GenAiPlugin` metadata type represents an **Agentforce Topic**—a modular capability domain composed of natural-language classification rules, behavioral guardrails (`scope`), step-by-step instructions (`genAiPluginInstructions`), and executable actions ([GenAiFunction](/docs/metadata/genai-function-metadata-type/)). Introduced in API version 60.0, `GenAiPlugin` is the core building block referenced by an agent's [GenAiPlannerBundle](/docs/metadata/genai-planner-bundle-metadata-type/).

In Salesforce DX projects, topic definitions are stored in `force-app/main/default/genAiPlugins/` with the `.genAiPlugin-meta.xml` suffix.

```mermaid
flowchart TD
    Planner["GenAiPlannerBundle\n(ReAct Reasoning Engine)"] -->|"Evaluates description"| Plugin["GenAiPlugin\n(Agent Topic)"]
    Plugin --> Scope["scope\n(Topic Guardrails & Boundaries)"]
    Plugin --> Instructions["genAiPluginInstructions\n(Step-by-Step Rules)"]
    Plugin --> Functions["genAiFunctions\n(List of GenAiFunction Actions)"]
```

## Why `GenAiPlugin` Design Determines Agent Accuracy

In Agentforce's ReAct (Reason + Act) architecture, the LLM does not evaluate every single action across your entire org on every turn. Instead:
1. **Topic Classification (`description`)**: The planner reads the `description` of all `GenAiPlugin` topics attached to the agent and selects the best-matching topic.
2. **Scoped Reasoning (`scope` + `genAiPluginInstructions`)**: Once inside the selected `GenAiPlugin`, the agent is restricted to the `genAiFunctions` listed in that plugin and follows its instructions to decide which action to call.

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `masterLabel` | `string` | Yes | Topic label shown in Agentforce Builder |
| `developerName` | `string` | No | Unique API name of the topic |
| `pluginType` | `string` | Yes | Must be set to `Topic` |
| `description` | `string` | No | **Classification Description**: explains when the reasoning engine should select this topic |
| `scope` | `string` | No | **Scope**: defines the job and strict boundaries of the agent within this topic |
| `canEscalate` | `boolean` | No | Whether the topic allows escalating the session to a human agent |
| `genAiFunctions` | `GenAiPluginFunctionDef[]` | No | Array of `<functionName>` references pointing to `GenAiFunction` components |
| `genAiPluginInstructions` | `GenAiPluginInstructionDef[]` | No | Array of natural-language instructions (`description`, `developerName`, `sortOrder`) |
| `language` | `string` | No | Language code (for example, `en_US`) |

## Production-Grade XML Example

Below is a `GenAiPlugin` (`Order_Returns_And_Refunds.genAiPlugin-meta.xml`) that defines a customer-facing order return topic with clear classification rules, instructions, and two custom Agent Actions:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<GenAiPlugin xmlns="http://soap.sforce.com/2006/04/metadata">
    <canEscalate>true</canEscalate>
    <description>Handles customer inquiries about returning purchased items, checking return eligibility windows, generating return shipping labels, and checking refund statuses.</description>
    <developerName>Order_Returns_And_Refunds</developerName>
    <genAiFunctions>
        <functionName>Verify_Order_Return_Eligibility</functionName>
    </genAiFunctions>
    <genAiFunctions>
        <functionName>Create_Return_Authorization</functionName>
    </genAiFunctions>
    <genAiPluginInstructions>
        <description>Always call Verify_Order_Return_Eligibility using the customer's Order Number before promising a refund or creating a return authorization.</description>
        <developerName>Instruction_Verify_Eligibility_First</developerName>
        <masterLabel>Verify Eligibility First</masterLabel>
        <sortOrder>0</sortOrder>
    </genAiPluginInstructions>
    <genAiPluginInstructions>
        <description>If the order total exceeds $1,000 or the return window expired within the last 7 days, offer to escalate the conversation to a human support specialist.</description>
        <developerName>Instruction_High_Value_Escalation</developerName>
        <masterLabel>High Value Escalation</masterLabel>
        <sortOrder>1</sortOrder>
    </genAiPluginInstructions>
    <language>en_US</language>
    <masterLabel>Order Returns and Refunds</masterLabel>
    <pluginType>Topic</pluginType>
    <scope>Your job is only to verify order return eligibility and initiate return authorizations for verified orders. Never modify shipping addresses or process credit card chargebacks directly.</scope>
</GenAiPlugin>
```

> [!TIP]
> **Preventing Topic Overlap**: If two `GenAiPlugin` files have vague or overlapping `<description>` text (for example, "Handles customer orders" and "Helps with order issues"), the planner will inconsistently switch topics mid-conversation. Write mutually exclusive classification descriptions that explicitly list the user intents covered by each topic.

> [!NOTE]
> **Deploy Order**: Always deploy referenced [GenAiFunction](/docs/metadata/genai-function-metadata-type/) components before or in the same deployment transaction as `GenAiPlugin`, and deploy `GenAiPlugin` before [GenAiPlannerBundle](/docs/metadata/genai-planner-bundle-metadata-type/).

