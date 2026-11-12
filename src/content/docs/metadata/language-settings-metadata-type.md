---
title: "LanguageSettings Metadata Type in SFDX"
description: "Deploy LanguageSettings metadata in Salesforce to manage Translation Workbench, active org languages, and multilingual user interfaces in modern CI/CD."
category: "metadata"
tags:
  - metadata
  - settings
  - translation
  - localization
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "beginner"
tldr: "LanguageSettings configures Translation Workbench, enabling end-user and platform languages for international multi-language Salesforce orgs."
faq:
  - q: "What does LanguageSettings control in Salesforce?"
    a: "It configures Translation Workbench enablement, active organizational languages, and end-user multilingual capabilities."
  - q: "Where is LanguageSettings stored in an SFDX project?"
    a: "It is stored under force-app/main/default/settings as Language.settings-meta.xml and retrieved as Settings:Language."
  - q: "Why is LanguageSettings required before deploying translations?"
    a: "Translation Workbench must be enabled before custom label or field translations in specific locales can be deployed."
  - q: "Can LanguageSettings be deployed to scratch orgs?"
    a: "Yes, by adding TranslationWorkbench to features and defining languageSettings in project-scratch-def.json."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-languagesettings.md"
---

## Architectural Overview

The `LanguageSettings` metadata type manages internationalization (i18n), Translation Workbench activation, and supported organizational languages in Salesforce. In multinational enterprises, global user bases operate across diverse native languages—such as Japanese, German, Spanish, French, and Simplified Chinese—requiring localized field labels, picklist values, and help text.

Architecturally, `LanguageSettings` is the foundational prerequisite for all translation and localization metadata. Enabling Translation Workbench through this setting unlocks the deployment of `Translations`, `CustomObjectTranslation`, and localized `CustomLabel` records. Without first applying `LanguageSettings`, any CI/CD pipeline attempting to deploy localized metadata will fail with `TranslationWorkbenchNotEnabled` errors.

```mermaid
flowchart TD
    A["Language.settings-meta.xml"] --> B["Enable Translation Workbench"]
    B --> C["Activate Supported Locales (e.g., de, ja, es)"]
    C --> D["Deploy CustomObjectTranslation"]
    C --> E["Deploy CustomLabel Translations"]
    C --> F["Multilingual Experience Cloud Portals"]
    D --> G["Localized User Interface for Global Users"]
    E --> G
```

## Directory and File Conventions

In Salesforce DX source format, `LanguageSettings` is represented as a single XML file within the `settings` directory:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `Settings` (member: `Language`) |
| **SFDX Source Folder** | `force-app/main/default/settings/` |
| **File Name** | `Language.settings-meta.xml` |
| **Packaging / Manifest Type** | `Settings` |

## Key Metadata Fields

The XML schema for `LanguageSettings` controls Translation Workbench and data translation switches:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `enableTranslationWorkbench` | `boolean` | No | Master toggle that enables Translation Workbench in the Salesforce org. |
| `enableDataTranslation` | `boolean` | No | Enables translation of data stored in custom fields on products and categories. |
| `enableEndUserLanguages` | `boolean` | No | Enables tier-2 end-user languages in addition to fully supported platform languages. |

> [!NOTE]
> Translation Workbench cannot be disabled once translations have been actively assigned to translators in an organization.

## Declarative XML and Package Manifest Examples

### Source XML (`Language.settings-meta.xml`)

```xml title="force-app/main/default/settings/Language.settings-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<LanguageSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableTranslationWorkbench>true</enableTranslationWorkbench>
    <enableDataTranslation>true</enableDataTranslation>
    <enableEndUserLanguages>true</enableEndUserLanguages>
</LanguageSettings>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Language</members>
        <name>Settings</name>
    </types>
    <version>68.0</version>
</Package>
```

## Retrieval and Deployment

To retrieve `LanguageSettings` using the Salesforce CLI:

```bash
# Retrieve settings directly
sf project retrieve start --metadata Settings:Language

# Retrieve using manifest
sf project retrieve start --manifest manifest/package.xml
```

To deploy `LanguageSettings` to a target environment:

```bash
# Deploy to designated org
sf project deploy start \
  --metadata Settings:Language \
  --target-org uat \
  --wait 10
```

## Senior Architect Deployment Best Practices and Gotchas

### Dependency Ordering in Global Deployments

Translation metadata has an uncompromising dependency on `LanguageSettings`. In continuous delivery pipelines:

1. **Phase 1**: Deploy `Settings:Language` to activate Translation Workbench.
2. **Phase 2**: Deploy `CustomObject`, `CustomField`, and `GlobalValueSet` metadata.
3. **Phase 3**: Deploy `CustomObjectTranslation` and `Translations` language files.

> [!WARNING]
> Attempting to deploy `CustomObjectTranslation` or language-specific translations in the same package transaction as `Language.settings-meta.xml` in an unconfigured org will trigger compilation errors stating that the language is not enabled for translation.

### Scratch Org Configuration

For automated regression testing of multi-language implementations, enable Translation Workbench in `project-scratch-def.json`:

```json title="config/project-scratch-def.json"
{
  "orgName": "Global Multilingual Scratch Org",
  "edition": "Enterprise",
  "features": ["TranslationWorkbench"],
  "settings": {
    "languageSettings": {
      "enableTranslationWorkbench": true,
      "enableDataTranslation": true,
      "enableEndUserLanguages": true
    }
  }
}
```

> [!TIP]
> After enabling `LanguageSettings`, ensure deployment automation provisions translators for each target locale so developers and CI pipelines can deploy translation files without permission errors.
