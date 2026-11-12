---
title: "PaymentGatewayProvider in SFDX"
description: "Deploy PaymentGatewayProvider metadata in Salesforce DX to bind custom Apex adapter classes with Salesforce Payments and merchant gateway processors."
category: "metadata"
tags:
  - metadata
  - payments
  - commerce-cloud
  - apex-adapter
  - fintech
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "PaymentGatewayProvider registers custom Apex payment adapters, connecting Salesforce Payments and Commerce Cloud to external payment gateways."
faq:
  - q: "What is the purpose of PaymentGatewayProvider in Salesforce?"
    a: "PaymentGatewayProvider links external payment gateway adapters implemented in Apex to the native Salesforce Payments and Commerce transaction engine."
  - q: "Where are PaymentGatewayProvider metadata files stored in an SFDX project?"
    a: "They are stored in force-app/main/default/paymentGatewayProviders/ with the file extension .paymentGatewayProvider-meta.xml."
  - q: "Which Apex interface must be implemented for a PaymentGatewayProvider?"
    a: "The referenced Apex class must implement the commercepayments.PaymentGatewayAdapter interface to handle authorizations, captures, and refunds."
  - q: "Can idempotency be enforced using PaymentGatewayProvider?"
    a: "Yes. PaymentGatewayProvider supports idempotency configurations ensuring duplicate payment requests are safely rejected by the merchant gateway."
related:
  - metadata/apex-class-metadata-type
  - metadata/custom-object-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-paymentgatewayprovider.md"
---

## Architectural Overview

`PaymentGatewayProvider` is the bridge between Salesforce Payments / B2B Commerce and external merchant payment processors (such as Stripe, Adyen, Cybersource, or PayPal). While standard connectors exist for select gateways, enterprise architectures frequently require bespoke integration adapters to accommodate proprietary fraud scoring, multi-currency routing, or regional acquirers.

Architecturally, `PaymentGatewayProvider` registers a custom [ApexClass](/docs/metadata/apex-class-metadata-type/) implementing the `commercepayments.PaymentGatewayAdapter` interface with the core payment platform. Once registered via metadata, administrators can create declarative `PaymentGateway` records that route authorizations, captures, tokenizations, and refunds through the custom adapter without hardcoding endpoints in business logic.

```mermaid
flowchart LR
    A["Salesforce Checkout / Order"] --> B["PaymentGateway Record"]
    B --> C["PaymentGatewayProvider Metadata"]
    C --> D["Custom Apex Adapter Class"]
    D --> E["Named Credential / External API"]
    E --> F["External Payment Processor (e.g., Stripe)"]
```

## Directory and File Conventions

In SFDX source format, each `PaymentGatewayProvider` is stored as an XML file within the `paymentGatewayProviders/` folder.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `PaymentGatewayProvider` |
| **SFDX Directory** | `force-app/main/default/paymentGatewayProviders/` |
| **File Suffix** | `.paymentGatewayProvider-meta.xml` |
| **Full File Path** | `force-app/main/default/paymentGatewayProviders/<ProviderName>.paymentGatewayProvider-meta.xml` |

## Key Metadata Fields

The XML schema of `PaymentGatewayProvider` references the Apex adapter class and integration capabilities:

| Field Name | Field Type | Required | Architectural Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable provider label displayed in Setup and Payment Gateway wizards. |
| `apexAdapterId` | `string` | Yes | Developer name of the Apex class implementing `commercepayments.PaymentGatewayAdapter`. |
| `comments` | `string` | No | Architectural description and versioning notes for the payment adapter. |
| `idempotencySupported` | `string` | No | Indicates whether the gateway provider supports idempotent transaction tokens (`Yes`, `No`). |

> [!NOTE]
> The Apex class referenced by `apexAdapterId` must be deployed before or in the exact same deployment transaction as `PaymentGatewayProvider`. Deploying the provider without the compiled adapter class results in a dependency resolution failure.

## Declarative XML and Package Manifest Examples

Below is a declarative `PaymentGatewayProvider` definition linking to a Stripe payment adapter:

```xml title="force-app/main/default/paymentGatewayProviders/Stripe_Commerce_Adapter.paymentGatewayProvider-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<PaymentGatewayProvider xmlns="http://soap.sforce.com/2006/04/metadata">
    <apexAdapterId>StripePaymentGatewayAdapter</apexAdapterId>
    <comments>Production-grade Stripe payment gateway adapter supporting credit cards and SEPA debit.</comments>
    <idempotencySupported>Yes</idempotencySupported>
    <masterLabel>Stripe Commerce Adapter</masterLabel>
</PaymentGatewayProvider>
```

### Corresponding Apex Adapter Skeleton

The referenced Apex class must implement the `commercepayments.PaymentGatewayAdapter` interface:

```java
global class StripePaymentGatewayAdapter implements commercepayments.PaymentGatewayAdapter {
    global commercepayments.GatewayResponse processRequest(commercepayments.paymentGatewayContext gatewayContext) {
        commercepayments.RequestType requestType = gatewayContext.getPaymentRequestType();
        if (requestType == commercepayments.RequestType.Authorize) {
            // Execute external payment authorization callout
            return new commercepayments.AuthorizationResponse();
        }
        return new commercepayments.GatewayErrorResponse('400', 'Unsupported Request Type');
    }
}
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Stripe_Commerce_Adapter</members>
        <name>PaymentGatewayProvider</name>
    </types>
    <types>
        <members>StripePaymentGatewayAdapter</members>
        <name>ApexClass</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage `PaymentGatewayProvider` via the Salesforce CLI (`sf`):

```bash
# Retrieve all payment gateway providers
sf project retrieve start --metadata PaymentGatewayProvider

# Retrieve provider along with the underlying Apex class
sf project retrieve start --metadata PaymentGatewayProvider:Stripe_Commerce_Adapter,ApexClass:StripePaymentGatewayAdapter

# Deploy provider and adapter simultaneously
sf project deploy start --metadata PaymentGatewayProvider,ApexClass:StripePaymentGatewayAdapter
```

## Architect Best Practices and Gotchas

- **PCI-DSS Compliance Boundary:** Ensure that credit card numbers (PANs) and CVVs never touch Salesforce memory unencrypted. Use hosted fields or tokenization on the frontend so the Apex adapter only handles transient tokens.
- **Idempotency Strategy:** Always set `idempotencySupported` to `Yes` and pass client-generated UUID keys to prevent duplicate customer charges during network retry scenarios.
- **Mocking for CI/CD Testing:** Because payment adapters execute live callouts to merchant gateways, provide robust mock responses implementing `commercepayments.PaymentGatewayAdapter` to facilitate headless scratch org automated testing.

> [!WARNING]
> Renaming the underlying Apex class after deploying `PaymentGatewayProvider` leaves orphaned metadata references, breaking active checkout pipelines.
