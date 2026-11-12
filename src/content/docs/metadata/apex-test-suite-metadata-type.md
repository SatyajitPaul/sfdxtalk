---
title: "ApexTestSuite Metadata Type for CI/CD Test Execution"
description: "Organize and execute targeted Apex unit test suites in SFDX CI/CD pipelines using the ApexTestSuite metadata type. Learn wildcard syntax and SOQL queries."
category: "metadata"
tags:
  - metadata-api
  - apex
  - testing
  - sfdx
  - deployment
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "ApexTestSuite (testSuites/<Name>.testSuite-meta.xml) groups related Apex test classes—supporting exact names, prefix wildcards, and namespaces—so CI/CD pipelines can run fast, domain-focused test suites."
faq:
  - q: "Why should teams use ApexTestSuite instead of RunLocalTests on every Sandbox pull request?"
    a: "In large enterprise orgs where RunLocalTests takes 45 to 90 minutes, grouping tests by domain into ApexTestSuite files (such as Billing_Suite or Order_Sync_Suite) lets pull-request validation jobs run targeted tests in minutes via sf apex run test --suite-names."
  - q: "Does ApexTestSuite support wildcards in testClassName elements?"
    a: "Yes. Inside a .testSuite-meta.xml file, testClassName supports exact class names (OrderServiceTest), prefix/pattern wildcards (Order*Test), all local tests (*), and managed package namespace wildcards (MyNamespace.*)."
  - q: "Can you use an ApexTestSuite directly inside sf project deploy start --test-level RunSpecifiedTests?"
    a: "While sf apex run test natively accepts --suite-names, deployment commands (--test-level RunSpecifiedTests) require a comma-separated list of test class names. You can parse your .testSuite-meta.xml file in your CI script to pass the exact class list to --tests."
  - q: "Can you query ApexTestSuite and its member classes using SOQL?"
    a: "Yes. Both standard SOQL and the Tooling API allow querying ApexTestSuite (for TestSuiteName) and the junction object TestSuiteMembership (for ApexClassId and ApexTestSuiteId)."
related:
  - metadata/apex-class-metadata-type
  - metadata/apex-trigger-metadata-type
  - metadata/flow-test-metadata-type
  - metadata/apex-email-notifications-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_apextestsuite.htm
---

## Why the `ApexTestSuite` Metadata Type Accelerates Enterprise CI/CD

As a Salesforce org grows past hundreds of Apex classes, running `RunLocalTests` on every developer pull request creates multi-hour CI/CD bottlenecks. **`ApexTestSuite`** (`testSuites/<SuiteName>.testSuite-meta.xml`) lets architects curate domain-specific collections of Apex test classes (for example, `Order_To_Cash_Suite`, `CPQ_Pricing_Suite`, or `Nightly_Integration_Regression`) directly in version control.

```mermaid
flowchart LR
    SUITE["ApexTestSuite<br/>(testSuites/Order_To_Cash_Suite.testSuite-meta.xml)"] --> CLS1["OrderServiceTest"]
    SUITE --> CLS2["InvoiceTriggerHandlerTest"]
    SUITE --> WILD["Payment*Test (Wildcard Pattern)"]
    SUITE --> CLI["sf apex run test --suite-names Order_To_Cash_Suite"]
```

---

## Key Metadata Fields on `ApexTestSuite`

| Field | Type | Required | Description |
|---|---|---|---|
| `testClassName` | `string[]` | No | List of [ApexClass](/docs/metadata/apex-class-metadata-type/) test names or wildcard patterns (`Order*Test`, `*`, `Namespace.*`) included in the suite. |

---

## Real-World XML Example (`testSuites/Order_To_Cash_Suite.testSuite-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexTestSuite xmlns="http://soap.sforce.com/2006/04/metadata">
    <testClassName>OrderCreationServiceTest</testClassName>
    <testClassName>OrderTriggerHandlerTest</testClassName>
    <testClassName>InvoiceGenerationBatchTest</testClassName>
    <testClassName>PaymentGateway*Test</testClassName>
</ApexTestSuite>
```

---

## Running an `ApexTestSuite` with Salesforce CLI (`sf`)

```bash
# Run one or more ApexTestSuites asynchronously and wait 15 minutes for results
sf apex run test \
  --suite-names Order_To_Cash_Suite \
  --result-format human \
  --code-coverage \
  --wait 15
```

---

## Querying `ApexTestSuite` and `TestSuiteMembership` via SOQL

In the Salesforce database, suites are stored in `ApexTestSuite` and linked to `ApexClass` via the junction object `TestSuiteMembership`.

### 1. List All Apex Test Suites and Their Member Classes

```sql
SELECT Id, TestSuiteName,
       (SELECT ApexClassId, ApexClass.Name FROM TestSuiteMemberships)
FROM ApexTestSuite
ORDER BY TestSuiteName ASC
```

### 2. Find Test Classes That Are Not Included in Any `ApexTestSuite`

```sql
SELECT Id, Name, ApiVersion, LengthWithoutComments
FROM ApexClass
WHERE NamespacePrefix = null
  AND Name LIKE '%Test%'
  AND Id NOT IN (SELECT ApexClassId FROM TestSuiteMembership)
ORDER BY Name ASC
```

> [!TIP]
> **Audit Orphaned `*Test` Classes:** Running the second SOQL query above in your CI pipeline helps catch newly created `*Test` classes that developers forgot to add to their domain's `ApexTestSuite`!

