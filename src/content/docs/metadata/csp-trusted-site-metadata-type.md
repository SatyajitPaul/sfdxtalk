---
title: "CspTrustedSite Metadata Type Reference"
description: "Configure and deploy CspTrustedSite (.cspTrustedSite-meta.xml) metadata for Trusted URLs, Content Security Policy (CSP) directives, and LWC fetch calls."
category: metadata
tags:
  - metadata-api
  - csp-trusted-site
  - lwc
  - security
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "CspTrustedSite (.cspTrustedSite-meta.xml) defines a Trusted URL in Salesforce Setup, configuring Content Security Policy (CSP) directives (connect-src, img-src, frame-src, style-src, font-src) and camera/microphone Permissions-Policy headers for LWC."
faq:
  - q: "What is the difference between RemoteSiteSetting and CspTrustedSite?"
    a: "RemoteSiteSetting authorizes server-side outbound HTTP callouts made from Apex on the Salesforce server. CspTrustedSite (Trusted URLs) authorizes client-side browser connections made directly from a user's web browser in LWC or Aura using fetch(), WebSockets, images, fonts, or iframes."
  - q: "Why did my CspTrustedSite deployment fail in API version 59.0 or later?"
    a: "Starting in API version 59.0, at least one directive field beginning with isApplicableTo (such as isApplicableToConnectSrc or isApplicableToImgSrc) or canAccess (canAccessCamera or canAccessMicrophone) must be set to true."
  - q: "Which CspTrustedSite directive is required for LWC JavaScript fetch() or WebSocket calls?"
    a: "Set isApplicableToConnectSrc to true and specify https:// for REST APIs or wss:// for WebSocket endpoints in endpointUrl."
  - q: "Why does Salesforce recommend keeping total CspTrustedSite entries concise?"
    a: "Every active CspTrustedSite adds its URL to the Content-Security-Policy HTTP response header. If the CSP HTTP header grows past 12 KB to 16 KB, CDNs, reverse proxies, and browsers can reject responses with HTTP 431 Request Header Fields Too Large."
  - q: "Can I query CspTrustedSite records in standard SOQL?"
    a: "Yes. CspTrustedSite is queryable in standard SOQL and returns Id, DeveloperName, EndpointUrl, Context, IsActive, and all isApplicableTo directive flags."
related:
  - metadata/remote-site-setting-metadata-type
  - metadata/cors-whitelist-origin-metadata-type
  - metadata/lightning-component-bundle-metadata-type
  - metadata/experience-bundle-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_csptrustedsite.htm
---

The `CspTrustedSite` metadata type represents a **Trusted URL** (formerly *CSP Trusted Site*) in Salesforce Setup. Introduced in API version 39.0 (and expanded with Permissions-Policy directives in API version 59.0), `CspTrustedSite` instructs the browser's **Content Security Policy (CSP)** to allow client-side [LightningComponentBundle](/docs/metadata/lightning-component-bundle-metadata-type/) JavaScript (`fetch()`, `XMLHttpRequest`, `WebSocket`), `<img>` tags, `<iframe>` embeds, `@font-face` fonts, and stylesheets to load from external third-party domains.

In Salesforce DX projects, trusted URLs are stored in `force-app/main/default/cspTrustedSites/` with the `.cspTrustedSite-meta.xml` suffix.

```mermaid
flowchart LR
    LWC["Client-Side Browser (LWC / Aura)\nfetch(), WebSocket, <img>, <iframe>"] --> CSP{"Matches Active\nCspTrustedSite?"}
    CSP -->|"Yes (Directive = true)"| Browser["Browser Allows Request\n(connect-src / img-src / frame-src)"]
    CSP -->|"No"| Violation["Browser Blocks Request with\nCSP SecurityError in Console"]
```

## `CspTrustedSite` vs. `RemoteSiteSetting` vs. `CorsWhitelistOrigin`

| Metadata Type | Direction & Layer | Primary Use Case |
|---|---|---|
| `CspTrustedSite` | **Outbound from Browser** (Client-Side) | LWC calls external API via `fetch()`, opens a `wss://` WebSocket, or embeds an external `<iframe>` / `<img>` |
| [RemoteSiteSetting](/docs/metadata/remote-site-setting-metadata-type/) | **Outbound from Server** (Server-Side) | Apex `Http.send(HttpRequest)` calls an external API from Salesforce servers |
| [CorsWhitelistOrigin](/docs/metadata/cors-whitelist-origin-metadata-type/) | **Inbound from External Browser** | External website (`https://app.example.com`) calls Salesforce REST APIs from browser JS |

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `endpointUrl` | `string` | Yes | Domain URL (`https://api.example.com`, `https://*.example.com`, or `wss://stream.example.com`) |
| `isActive` | `boolean` | Yes | Enables (`true`) or disables (`false`) the Trusted URL |
| `context` | `CspTrustedSiteContext` | No | Scope: `All`, `LEX` (Lightning Experience), `Communities` (Experience Cloud), `VisualForce`, or `FieldServiceMobileExtension` |
| `isApplicableToConnectSrc` | `boolean` | No | Allows `fetch()`, `XMLHttpRequest`, and `WebSocket` (`connect-src`) |
| `isApplicableToImgSrc` | `boolean` | No | Allows loading images (`img-src`) |
| `isApplicableToFrameSrc` | `boolean` | No | Allows embedding inside `<iframe>` elements (`frame-src`) |
| `isApplicableToStyleSrc` | `boolean` | No | Allows external CSS stylesheets (`style-src`) |
| `isApplicableToFontSrc` | `boolean` | No | Allows external web fonts (`font-src`) |
| `isApplicableToMediaSrc` | `boolean` | No | Allows `<audio>` and `<video>` streams (`media-src`) |
| `canAccessCamera` / `canAccessMicrophone` | `boolean` | No | Grants `Permissions-Policy` access to camera/microphone (v59.0+) |

## Production-Grade XML Example

Below is a `CspTrustedSite` (`Mapbox_Telemetry_API.cspTrustedSite-meta.xml`) scoped strictly to Lightning Experience (`LEX`) with `connect-src` and `img-src` enabled:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <canAccessCamera>false</canAccessCamera>
    <canAccessMicrophone>false</canAccessMicrophone>
    <context>LEX</context>
    <description>Allows the Territory Map LWC to fetch vector tiles and static map images from Mapbox.</description>
    <endpointUrl>https://*.mapbox.com</endpointUrl>
    <isActive>true</isActive>
    <isApplicableToConnectSrc>true</isApplicableToConnectSrc>
    <isApplicableToFontSrc>false</isApplicableToFontSrc>
    <isApplicableToFrameSrc>false</isApplicableToFrameSrc>
    <isApplicableToImgSrc>true</isApplicableToImgSrc>
    <isApplicableToMediaSrc>false</isApplicableToMediaSrc>
    <isApplicableToStyleSrc>false</isApplicableToStyleSrc>
</CspTrustedSite>
```

> [!WARNING]
> **Watch the 12 KB HTTP Header Size Limit**: Every active `CspTrustedSite` appends its `endpointUrl` to the `Content-Security-Policy` HTTP header on page loads. Use wildcard subdomains (`https://*.example.com`), scope entries to `LEX` or `Communities` via `<context>`, and enable only the specific `isApplicableTo*` directives required so your CSP header stays well under 12 KB.

## Querying `CspTrustedSite` with SOQL

```sql
-- Audit all active Trusted URLs and their enabled CSP directives in standard SOQL
SELECT Id, DeveloperName, EndpointUrl, Context, IsActive,
       IsApplicableToConnectSrc, IsApplicableToFrameSrc, IsApplicableToImgSrc,
       IsApplicableToStyleSrc, IsApplicableToFontSrc, CanAccessCamera, CanAccessMicrophone
FROM CspTrustedSite
WHERE IsActive = true
ORDER BY Context, DeveloperName ASC
```

