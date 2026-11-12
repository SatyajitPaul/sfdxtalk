---
title: "CorsWhitelistOrigin Metadata Type Reference"
description: "Configure and deploy CorsWhitelistOrigin (.corswhitelistorigin-meta.xml) metadata to allow cross-origin browser requests to Salesforce REST and OAuth APIs."
category: metadata
tags:
  - metadata-api
  - cors
  - integration
  - security
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: beginner
tldr: "CorsWhitelistOrigin (.corswhitelistorigin-meta.xml) adds an external HTTPS origin or browser extension URI to Salesforce's CORS allowlist so external web apps can invoke Salesforce REST, GraphQL, and OAuth endpoints from browser JavaScript."
faq:
  - q: "When do I need a CorsWhitelistOrigin entry in Salesforce?"
    a: "You need a CorsWhitelistOrigin entry whenever a single-page application (React, Angular, Vue) or browser extension hosted outside Salesforce makes direct browser-to-Salesforce XMLHttpRequest or fetch() calls to Salesforce REST APIs, Apex REST endpoints, or OAuth token/revocation endpoints."
  - q: "What protocol and wildcard rules apply to urlPattern in CorsWhitelistOrigin?"
    a: "Standard web origins must use https:// (never http://), may include a port, and may use a leading subdomain wildcard such as https://*.example.com. Chrome extensions use chrome-extension:// followed by a 32-character lowercase ID."
  - q: "What HTTP status code does Salesforce return if an unallowlisted origin sends a CORS preflight request?"
    a: "If a browser sends a CORS request from an origin that is not in CorsWhitelistOrigin, Salesforce omits the Access-Control-Allow-Origin header and returns HTTP status code 404 on the preflight request."
  - q: "Where are CorsWhitelistOrigin files stored in SFDX?"
    a: "They are stored in the force-app/main/default/corsWhitelistOrigins/ directory with the .corswhitelistorigin-meta.xml suffix."
  - q: "Can I query existing CORS allowlist entries using SOQL?"
    a: "Yes. CorsWhitelistOrigin is queryable in both standard SOQL and Tooling API, returning Id, DeveloperName, and UrlPattern."
related:
  - metadata/csp-trusted-site-metadata-type
  - metadata/external-client-application-metadata-type
  - metadata/connected-app-metadata-type
  - metadata/remote-site-setting-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_corswhitelistorigin.htm
---

The `CorsWhitelistOrigin` metadata type registers an origin pattern in Salesforce's **Cross-Origin Resource Sharing (CORS)** allowlist. Introduced in API version 32.0, adding an origin to `CorsWhitelistOrigin` instructs Salesforce to return the `Access-Control-Allow-Origin` HTTP response header when a web application hosted on that external domain (or a Chrome/Firefox browser extension) calls Salesforce REST APIs, Custom `@RestResource` Apex endpoints, GraphQL API, or OAuth 2.0 endpoints directly from client-side JavaScript.

In Salesforce DX projects, CORS origins are stored in `force-app/main/default/corsWhitelistOrigins/` with the `.corswhitelistorigin-meta.xml` suffix.

```mermaid
flowchart LR
    SPA["External React/Vue SPA\n(https://portal.example.com)"] -->|"Browser Preflight OPTIONS +\nAuthorization: Bearer"| SF["Salesforce REST / Apex REST Endpoint"]
    SF --> Check{"Origin Matches\nCorsWhitelistOrigin?"}
    Check -->|"Yes"| Allow["Returns Access-Control-Allow-Origin:\nhttps://portal.example.com"]
    Check -->|"No"| Deny["Returns HTTP 404 &\nBrowser Blocks Response"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `urlPattern` | `string` | Yes | Origin pattern (`https://app.example.com`, `https://*.example.com:8443`, `chrome-extension://<32-char-id>`, or `moz-extension://<uuid>`) |

## Production-Grade XML Examples

### 1. External Single-Page Application Origin (`Customer_Checkout_SPA.corswhitelistorigin-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CorsWhitelistOrigin xmlns="http://soap.sforce.com/2006/04/metadata">
    <urlPattern>https://checkout.example.com</urlPattern>
</CorsWhitelistOrigin>
```

### 2. Internal Chrome Extension Origin (`Sales_Companion_Extension.corswhitelistorigin-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CorsWhitelistOrigin xmlns="http://soap.sforce.com/2006/04/metadata">
    <urlPattern>chrome-extension://abdkkegmcbiomijcbdaodaflgehfffed</urlPattern>
</CorsWhitelistOrigin>
```

> [!WARNING]
> **Avoid Overly Broad Wildcards on Shared Cloud Hosting Domains**: Never add shared multi-tenant PaaS domains such as `https://*.herokuapp.com`, `https://*.vercel.app`, or `https://*.cloudflarepages.com` to `CorsWhitelistOrigin`, as doing so would allow any third-party tenant hosted on that platform to make cross-origin requests if a user holds an active session/token. Always bind a custom subdomain (`https://app.yourcompany.com`) and allowlist that specific origin.

## Querying `CorsWhitelistOrigin` with SOQL

```sql
-- Audit all allowlisted CORS origins in standard SOQL
SELECT Id, DeveloperName, MasterLabel, UrlPattern, CreatedDate, LastModifiedBy.Name
FROM CorsWhitelistOrigin
ORDER BY UrlPattern ASC
```

