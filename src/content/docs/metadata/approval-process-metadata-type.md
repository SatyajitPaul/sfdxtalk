---
title: "ApprovalProcess Metadata Type Reference"
description: "Configure and deploy ApprovalProcess (.approvalProcess-meta.xml) metadata for multi-step approvals, entry criteria, record locks, and Apex Approval calls."
category: metadata
tags:
  - metadata-api
  - approval-process
  - automation
  - apex
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "ApprovalProcess (.approvalProcess-meta.xml) automates multi-step record approvals, including entryCriteria, allowedSubmitters, up to 30 approvalStep stages, recordEditability locks, and initial/final approval actions."
faq:
  - q: "Why can I not add, delete, or reorder approvalStep blocks when deploying an existing ApprovalProcess?"
    a: "Once an ApprovalProcess has been activated in an org, Salesforce locks the structural step sequence even if you later deactivate the process. To add or reorder steps in a higher environment, clone the process under a new developer name (such as v2) and deactivate the old version."
  - q: "What is the difference between AdminOnly and AdminOrCurrentApprover in recordEditability?"
    a: "AdminOnly restricts editing of a locked pending record strictly to users with Modify All Data or Modify All on that object. AdminOrCurrentApprover also allows the currently assigned approver to edit the record while it is pending their decision."
  - q: "How are ApprovalProcess files named in SFDX?"
    a: "ApprovalProcess files live in force-app/main/default/approvalProcesses/ and use the naming convention ObjectName.ProcessDeveloperName.approvalProcess-meta.xml."
  - q: "Does ApprovalProcess metadata preserve the execution order across multiple active approval processes on the same object?"
    a: "While processOrder is included on the metadata, deploying a single ApprovalProcess does not always reorder all active processes in the destination org. Deploy all active processes for that object together or verify the process order in Setup."
  - q: "How do I query pending and historical approval steps using SOQL?"
    a: "Query ProcessInstance for the overall approval lifecycle, ProcessInstanceWorkitem for currently pending approval requests awaiting action, and ProcessInstanceStep for completed approve/reject audit history."
related:
  - metadata/flow-metadata-type
  - metadata/apex-class-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/queue-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_approvalprocess.htm
---

The `ApprovalProcess` metadata type automates multi-step sign-off workflows for Salesforce records—governing who can submit a record (`allowedSubmitters`), which criteria qualify a record (`entryCriteria`), how records are locked during review (`recordEditability`, `finalApprovalRecordLock`), and which approvers or [Queue](/docs/metadata/queue-metadata-type/) members review each of up to **30** sequential or unanimous `<approvalStep>` stages.

In Salesforce DX projects, approval processes are stored in `force-app/main/default/approvalProcesses/` using the `<ObjectName>.<ProcessName>.approvalProcess-meta.xml` naming format.

```mermaid
flowchart TD
    Submit["Record Submitted\n(UI Button, Flow, or Apex Approval.process)"] --> Entry{"entryCriteria\nEvaluates True?"}
    Entry -->|"Yes"| Init["Locks Record (recordEditability) &\nRuns initialSubmissionActions"]
    Init --> Step1["approvalStep #1\n(Manager Hierarchy / Queue / User)"]
    Step1 -->|"Approve"| Final["Runs finalApprovalActions &\nApplies finalApprovalRecordLock"]
    Step1 -->|"Reject"| Reject["Runs finalRejectionActions &\nApplies finalRejectionRecordLock"]
    Init -->|"Submitter Recalls"| Recall["Runs recallActions & Unlocks Record"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | UI display name of the approval process |
| `active` | `boolean` | Yes | Whether the approval process is active (`true`) or inactive (`false`) |
| `recordEditability` | `RecordEditabilityType` | Yes | Who can edit locked pending records: `AdminOnly` or `AdminOrCurrentApprover` |
| `allowRecall` | `boolean` | No | Allows the original submitter to recall a pending submission |
| `entryCriteria` | `ApprovalEntryCriteria` | No | `criteriaItems` (+ `booleanFilter`) or `formula` qualifying records for this process |
| `allowedSubmitters` | `ApprovalSubmitter[]` | No | Who can submit records (`owner`, `creator`, `role`, `group`, `user`) |
| `nextAutomatedApprover` | `NextAutomatedApprover` | No | User hierarchy field (such as `Manager`) used for automatic routing |
| `approvalPageFields` | `ApprovalPageField` | No | Fields displayed to the approver on the approval decision screen |
| `approvalStep` | `ApprovalStep[]` | No | Up to 30 ordered approval steps (`name`, `stepNumber`, `entryCriteria`, `assignedApprover`, `rejectBehavior`) |
| `initialSubmissionActions` / `finalApprovalActions` / `finalRejectionActions` / `recallActions` | `ApprovalAction` | No | Field updates, email alerts, or outbound messages executed at each lifecycle transition |
| `finalApprovalRecordLock` / `finalRejectionRecordLock` | `boolean` | No | Whether the record remains locked (`true`) or unlocks (`false`) after completion |

## Production-Grade XML Example

Below is an `ApprovalProcess` on `Opportunity` (`Opportunity.Enterprise_Discount_Approval_v1.approvalProcess-meta.xml`) that routes discounts over 20% to the submitter's `Manager` and escalates discounts over 40% to a Deal Desk Queue in Step 2:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApprovalProcess xmlns="http://soap.sforce.com/2006/04/metadata">
    <active>true</active>
    <allowRecall>true</allowRecall>
    <allowedSubmitters>
        <type>owner</type>
    </allowedSubmitters>
    <approvalPageFields>
        <field>Name</field>
        <field>Owner</field>
        <field>Amount</field>
        <field>Discount_Percent__c</field>
    </approvalPageFields>
    <approvalStep>
        <allowDelegate>true</allowDelegate>
        <assignedApprover>
            <approver>
                <type>userHierarchyField</type>
            </approver>
        </assignedApprover>
        <label>Step 1 - Sales Manager Review</label>
        <name>Step_1_Sales_Manager_Review</name>
    </approvalStep>
    <approvalStep>
        <allowDelegate>false</allowDelegate>
        <assignedApprover>
            <approver>
                <name>Deal_Desk_Approvers_Queue</name>
                <type>queue</type>
            </approver>
            <whenMultipleApprovers>FirstResponse</whenMultipleApprovers>
        </assignedApprover>
        <entryCriteria>
            <criteriaItems>
                <field>Opportunity.Discount_Percent__c</field>
                <operation>greaterThan</operation>
                <value>40</value>
            </criteriaItems>
        </entryCriteria>
        <label>Step 2 - Deal Desk Executive Sign-off</label>
        <name>Step_2_Deal_Desk_Executive_Sign_off</name>
        <rejectBehavior>
            <type>RejectRequest</type>
        </rejectBehavior>
    </approvalStep>
    <description>Two-tier discount approval process for Opportunities exceeding 20% discount.</description>
    <enableMobileDeviceAccess>false</enableMobileDeviceAccess>
    <entryCriteria>
        <criteriaItems>
            <field>Opportunity.Discount_Percent__c</field>
            <operation>greaterThan</operation>
            <value>20</value>
        </criteriaItems>
    </entryCriteria>
    <finalApprovalRecordLock>true</finalApprovalRecordLock>
    <finalRejectionRecordLock>false</finalRejectionRecordLock>
    <label>Enterprise Discount Approval v1</label>
    <nextAutomatedApprover>
        <useApproverFieldOfRecordOwner>true</useApproverFieldOfRecordOwner>
        <userHierarchyField>Manager</userHierarchyField>
    </nextAutomatedApprover>
    <processOrder>1</processOrder>
    <recordEditability>AdminOnly</recordEditability>
    <showApprovalHistory>true</showApprovalHistory>
</ApprovalProcess>
```

> [!WARNING]
> **Activated Approval Steps Cannot Be Added or Reordered in Place**: Once an `ApprovalProcess` has been activated in Production, Salesforce permanently locks the number and order of its `<approvalStep>` elements—even if you set `<active>false</active>` first. Always append a version suffix (`_v1`, `_v2`) to your `ApprovalProcess` developer name when introducing new steps in CI/CD.

## Querying Approval Processes and Pending Approvals with SOQL

```sql
-- 1. Find all currently pending approval requests for a specific record or user
SELECT Id, ActorId, Actor.Name, OriginalActorId, ProcessInstanceId,
       ProcessInstance.TargetObjectId, ProcessInstance.Status, CreatedDate
FROM ProcessInstanceWorkitem
WHERE ProcessInstance.TargetObjectId = '006xx000001a2b3AAA'

-- 2. Audit full approval step history (Submitted, Approved, Rejected, Recalled)
SELECT Id, TargetObjectId, Status, ProcessDefinition.Name, ProcessDefinition.DeveloperName,
       (SELECT Id, StepStatus, Actor.Name, Comments, CreatedDate FROM StepsAndWorkitems ORDER BY CreatedDate DESC)
FROM ProcessInstance
WHERE TargetObjectId = '006xx000001a2b3AAA'
ORDER BY CreatedDate DESC
```

