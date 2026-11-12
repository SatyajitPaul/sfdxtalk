---
title: "SamlSsoConfig Metadata Type for Single Sign-On (SSO)"
description: "Configure SAML 2.0 Single Sign-On with Okta, Microsoft Entra ID, and PingFederate using the SamlSsoConfig metadata type. Learn JIT provisioning and SOQL."
category: "metadata"
tags:
  - metadata-api
  - authentication
  - security
  - sso
  - sfdx
  - soql
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "SamlSsoConfig (samlssoconfigs/<Name>.samlssoconfig-meta.xml) configures SAML 2.0 Single Sign-On between Salesforce and external Identity Providers (Okta, Entra ID, Ping), including FederationId mapping and JIT user provisioning."
faq:
  - q: "Why should enterprise orgs use FederationId instead of Username in SamlSsoConfig identityMapping?"
    a: "In Salesforce Sandboxes, usernames are automatically appended with the sandbox name (such as user@acme.com.uat), whereas FederationIdentifier remains identical across Production and all Sandboxes. Using FederationId ensures SAML SSO works across refreshes without modifying IdP claims."
  - q: "Why does deploying SamlSsoConfig fail when requestSigningCertId or executionUserId is included?"
    a: "Both requestSigningCertId (an 18-character Certificate record ID) and executionUserId (the JIT handler running User) are environment-specific. Use sfdx-project.json string replacements to inject the target org values during CI/CD deployment."
  - q: "What is required to enable Just-in-Time (JIT) user provisioning in SamlSsoConfig?"
    a: "To enable JIT provisioning, set userProvisioning to true, set identityMapping to FederationId, specify an executionUserId with Manage Users permission, and optionally reference a custom Apex class implementing Auth.SamlJitHandler in samlJitHandlerId."
  - q: "Can you query SamlSsoConfig settings using SOQL?"
    a: "Yes. You can query the SamlSsoConfig standard object in SOQL to audit DeveloperName, Issuer, SamlEntityId, LoginUrl, IdentityMapping, IdentityLocation, RequestSignatureMethod, and ValidationCert."
related:
  - metadata/certificate-metadata-type
  - metadata/auth-provider-metadata-type
  - metadata/connected-app-metadata-type
  - metadata/apex-class-metadata-type
  - metadata/network-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_samlssoconfig.htm
---

## Why the `SamlSsoConfig` Metadata Type Is the Cornerstone of Enterprise SSO

While [AuthProvider](/docs/metadata/auth-provider-metadata-type/) configures OpenID Connect (OIDC) and OAuth 2.0 social/enterprise login, **`SamlSsoConfig`** (`samlssoconfigs/<Name>.samlssoconfig-meta.xml`) configures **SAML 2.0 Single Sign-On** with enterprise Identity Providers (IdPs) such as **Okta**, **Microsoft Entra ID (Azure AD)**, **PingFederate**, and **ADFS**.

```mermaid
flowchart LR
    IDP["Enterprise IdP<br/>(Okta / Microsoft Entra ID)"] -->|Signed SAML 2.0 Assertion| SAML["SamlSsoConfig<br/>(samlssoconfigs/Corporate_Okta_SSO.samlssoconfig-meta.xml)"]
    SAML --> CERT["validationCert & decryptionCertificate<br/>(Verifies & Decrypts Assertion)"]
    SAML --> MAP["identityMapping: FederationId<br/>(Matches User.FederationIdentifier)"]
    SAML --> JIT["samlJitHandlerId<br/>(Optional Auth.SamlJitHandler Apex)"]
```

---

## Key Metadata Fields on `SamlSsoConfig`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Developer name of the SAML SSO configuration. |
| `samlVersion` | `SamlType` | Yes | Always use `SAML2_0` (`SAML1_1` is legacy). |
| `issuer` | `string` | Yes | The Entity ID / Issuer URI provided by your Identity Provider. |
| `samlEntityId` | `string` | Yes | The Audience URI expected in inbound SAML assertions (always use your My Domain URL, e.g., `https://acme.my.salesforce.com`). |
| `identityMapping` | `SamlIdentityType` | Yes | `FederationId` (recommended best practice), `Username`, or `UserId`. |
| `identityLocation` | `SamlIdentityLocationType` | Yes | `SubjectNameId` (identity is in `<Subject><NameID>`) or `Attribute` (identity is in a named SAML `<Attribute>`). |
| `validationCert` | `string` | Yes | Base64-encoded X.509 public certificate from the IdP used to verify SAML response signatures. |
| `requestSignatureMethod` | `string` | No | `RSA-SHA256` (recommended) or `RSA-SHA1`. |
| `useSameDigestAlgoForSigning` | `boolean` | No | *(API v55.0+)* When `true`, matches the digest algorithm (`SHA-256`) to `requestSignatureMethod`. |
| `userProvisioning` | `boolean` | No | Enables Just-in-Time (JIT) user creation/updates on login (requires `identityMapping = FederationId`). |
| `samlJitHandlerId` | `string` | No | Apex class implementing `Auth.SamlJitHandler` for custom JIT provisioning. |

---

## Real-World XML Example (`samlssoconfigs/Entra_ID_Enterprise_SSO.samlssoconfig-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<SamlSsoConfig xmlns="http://soap.sforce.com/2006/04/metadata">
    <executionUserId>jit.admin@acme.example.com</executionUserId>
    <identityLocation>SubjectNameId</identityLocation>
    <identityMapping>FederationId</identityMapping>
    <issuer>https://sts.windows.net/00000000-0000-0000-0000-000000000000/</issuer>
    <loginUrl>https://login.microsoftonline.com/00000000-0000-0000-0000-000000000000/saml2</loginUrl>
    <logoutUrl>https://login.microsoftonline.com/common/wsfederation?wa=wsignout1.0</logoutUrl>
    <name>Entra_ID_Enterprise_SSO</name>
    <redirectBinding>false</redirectBinding>
    <requestSignatureMethod>RSA-SHA256</requestSignatureMethod>
    <samlEntityId>https://acme.my.salesforce.com</samlEntityId>
    <samlJitHandlerId>EnterpriseSamlJitHandler</samlJitHandlerId>
    <samlVersion>SAML2_0</samlVersion>
    <singleLogoutBinding>RedirectBinding</singleLogoutBinding>
    <singleLogoutUrl>https://login.microsoftonline.com/00000000-0000-0000-0000-000000000000/saml2</singleLogoutUrl>
    <useConfigRequestMethod>true</useConfigRequestMethod>
    <useSameDigestAlgoForSigning>true</useSameDigestAlgoForSigning>
    <userProvisioning>true</userProvisioning>
    <validationCert>MIIDBTCCAe2gAwIBAgIQN33ROa6p...</validationCert>
</SamlSsoConfig>
```

---

## Querying `SamlSsoConfig` via SOQL

You can audit all SAML SSO configurations, signature algorithms, and JIT handlers in your org using standard SOQL:

```sql
SELECT Id, DeveloperName, MasterLabel, Issuer, SamlEntityId,
       IdentityMapping, IdentityLocation, RequestSignatureMethod,
       OptionsSpInitBinding, OptionsUserProvisioning,
       SamlJitHandler.Name, ExecutionUser.Username
FROM SamlSsoConfig
ORDER BY DeveloperName ASC
```

---

## Senior Architect Best Practices

> [!WARNING]
> **Hardcoded `requestSigningCertId` in `SamlSsoConfig`:** Unlike `decryptionCertificate` (which references the Certificate's developer name), `<requestSigningCertId>` stores a **18-character Salesforce `0P1...` Certificate ID**! When deploying `SamlSsoConfig` between Sandboxes and Production, either omit `<requestSigningCertId>` so Salesforce uses the default signing certificate or use `sfdx-project.json` replacements to map the target org's `0P1` ID.

