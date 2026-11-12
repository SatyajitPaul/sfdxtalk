---
title: "RemoteSiteSetting Metadata Type Reference"
description: "Configure and deploy RemoteSiteSetting (.remoteSite-meta.xml) metadata to allowlist external HTTP callout endpoints and understand NamedCredential trade-offs."
category: metadata
tags:
  - metadata-api
  - remote-site-settings
  - integration
  - security
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "RemoteSiteSetting (.remoteSite-meta.xml) registers an external domain in Salesforce's outbound HTTP callout allowlist for Apex HttpRequest callouts that do not use a NamedCredential."
faq:
  - q: "Do I need a RemoteSiteSetting if my Apex callout uses a NamedCredential?"
    a: "No. When an Apex HttpRequest or Flow HTTP Callout uses a NamedCredential endpoint (callout:My_Named_Credential), Salesforce automatically authorizes the outbound connection without requiring a RemoteSiteSetting."
  - q: "When is RemoteSiteSetting still required in modern Salesforce architectures?"
    a: "RemoteSiteSetting is still required when making Apex callouts to dynamic URLs not bound to a NamedCredential, when calling back into your own org's Tooling or Metadata SOAP/REST APIs via URL.getOrgDomainUrl() without a NamedCredential, or inside managed package post-install scripts."
  - q: "What does disableProtocolSecurity control on a RemoteSiteSetting?"
    a: "When disableProtocolSecurity is false (recommended), Salesforce enforces protocol security. Setting it to true allows outbound callouts over unencrypted HTTP from an HTTPS session, which should never be enabled in production."
  - q: "Does RemoteSiteSetting check the URL path or only the protocol, host, and port?"
    a: "Salesforce only evaluates the protocol (http/https), domain hostname, and port number of the url field in a RemoteSiteSetting; any trailing path segments in the url field are ignored."
  - q: "Can I query existing RemoteSiteSettings using the Tooling API?"
    a: "Yes. Query the RemoteProxy object via the Tooling API to inspect Id, SiteName, EndpointUrl, IsActive, DisableProtocolSecurity, and Description."
related:
  - metadata/named-credential-metadata-type
  - metadata/external-credential-metadata-type
  - metadata/csp-trusted-site-metadata-type
  - metadata/apex-class-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_remotesitesetting.htm
---

The `RemoteSiteSetting` metadata type registers an external domain and protocol in Salesforce's **Remote Site Settings** outbound allowlist. Available in API version 19.0 and later, any outbound [ApexClass](/docs/metadata/apex-class-metadata-type/) `HttpRequest` or Visualforce callout that specifies a raw `https://...` URL (rather than a `callout:` [NamedCredential](/docs/metadata/named-credential-metadata-type/)) will fail with `System.CalloutException: Unauthorized endpoint, please check Setup->Security->Remote site settings` unless an active `RemoteSiteSetting` matches the target protocol, host, and port.

In Salesforce DX projects, remote site settings are stored in `force-app/main/default/remoteSiteSettings/` with the `.remoteSite-meta.xml` suffix.

```mermaid
flowchart TD
    Callout["Apex HttpRequest.setEndpoint(...)"] --> Check{"Uses callout:\nNamedCredential?"}
    Check -->|"Yes"| NC["NamedCredential Authorizes\nDomain & Injects Auth Headers"]
    Check -->|"No (Raw URL)"| RSS{"Active RemoteSiteSetting\nMatches Protocol + Host + Port?"}
    RSS -->|"Yes"| Allow["Outbound Callout Allowed"]
    RSS -->|"No"| Block["Throws System.CalloutException:\nUnauthorized endpoint"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | Protocol, domain, and optional port of the external endpoint (for example, `https://api.stripe.com`) |
| `isActive` | `boolean` | Yes | Activates (`true`) or disables (`false`) the allowlist entry |
| `disableProtocolSecurity` | `boolean` | Yes | Always set to `false` in production so HTTPS protocol security is enforced |
| `description` | `string` | No | Documents which integration or Apex class consumes this endpoint |

## Production-Grade XML Example

Below is a `RemoteSiteSetting` (`Stripe_Payment_Gateway.remoteSite-meta.xml`) authorizing HTTPS callouts to `https://api.stripe.com`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<RemoteSiteSetting xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Authorizes outbound HTTPS webhook verification callouts to the Stripe Payment API.</description>
    <disableProtocolSecurity>false</disableProtocolSecurity>
    <isActive>true</isActive>
    <url>https://api.stripe.com</url>
</RemoteSiteSetting>
```

> [!TIP]
> **Prefer `NamedCredential` Over `RemoteSiteSetting`**: Whenever possible, use [NamedCredential](/docs/metadata/named-credential-metadata-type/) + [ExternalCredential](/docs/metadata/external-credential-metadata-type/) instead of `RemoteSiteSetting`. Named Credentials eliminate hardcoded endpoint URLs in Apex, manage OAuth 2.0/JWT authentication outside code, and automatically authorize the outbound endpoint without a `RemoteSiteSetting`.

## Auditing Remote Site Settings via Tooling API (`RemoteProxy`)

In the Tooling API, `RemoteSiteSetting` is exposed as the `RemoteProxy` object:

```sql
-- Audit all Remote Site Settings and flag any insecure HTTP or protocol-disabled entries (Tooling API)
SELECT Id, SiteName, EndpointUrl, IsActive, DisableProtocolSecurity, Description
FROM RemoteProxy
ORDER BY SiteName ASC
```

