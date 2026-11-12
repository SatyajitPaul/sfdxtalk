---
title: "FuelTypeSustnUom in SFDX"
description: "Configure FuelTypeSustnUom metadata in Salesforce DX to define unit of measure conversions and energy standardization rules across Net Zero Cloud assets."
category: "metadata"
tags:
  - metadata
  - net-zero-cloud
  - sustainability
  - esg
  - ci-cd
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "FuelTypeSustnUom specifies unit-of-measure conversions for specific fuel types, normalizing energy inputs like kilowatt-hours, gallons, and therms into gigajoules."
faq:
  - q: "What calculation role does FuelTypeSustnUom play in carbon accounting?"
    a: "It normalizes raw utility billing units into standardized energy metrics such as gigajoules or megawatt-hours for uniform emissions calculations."
  - q: "Can multiple UOM mappings be assigned to a single FuelType?"
    a: "Yes. Different global operating facilities can report consumption in local units, which this metadata converts into uniform reporting standards."
  - q: "What deployment dependency order must be followed for FuelTypeSustnUom?"
    a: "The parent FuelType must be deployed in the same transaction or committed earlier in the target org to satisfy metadata referential constraints."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-fueltypesustnuom.md"
---

## Architectural Overview

`FuelTypeSustnUom` is an essential mathematical and operational metadata component within Salesforce Net Zero Cloud. Global enterprises manage real estate and manufacturing operations across dozens of countries, each utilizing disparate regional units of measure (UOM) for utility and energy reporting. For example, natural gas may be billed in therms in the United States, cubic meters in Germany, and megawatt-hours in the United Kingdom.

To calculate greenhouse gas emissions accurately, Net Zero Cloud must normalize these disparate raw consumption units into standardized scientific energy units—primarily gigajoules (GJ) or kilowatt-hours (kWh). `FuelTypeSustnUom` defines the conversion multipliers and standard unit mappings for each `FuelType`. Managing these mathematical constants via Salesforce DX guarantees transparent, auditable conversion factors across multinational ESG pipelines.

```mermaid
flowchart LR
    A["Raw Utility Bill: 5,000 Therms"] --> B["FuelType: Natural_Gas"]
    B --> C["FuelTypeSustnUom: Therm_to_GJ"]
    C -->|"Multiplier: 0.1055"| D["Normalized Energy: 527.5 GJ"]
    D --> E["Carbon Emission Calculation Engine"]
```

## Directory and File Conventions

In Salesforce DX source format (`apiVersion` 68.0), `FuelTypeSustnUom` metadata files are stored in the `fuelTypeSustnUoms/` directory.

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `FuelTypeSustnUom` |
| **SFDX Folder** | `force-app/main/default/fuelTypeSustnUoms/` |
| **File Suffix** | `.fuelTypeSustnUom-meta.xml` |
| **XML Root Element** | `<FuelTypeSustnUom xmlns="http://soap.sforce.com/2006/04/metadata">` |

## Key Metadata Fields

The XML schema declares the conversion factors, target fuel types, and standard unit definitions:

| Field Name | Field Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Administrative title identifying the unit conversion mapping. |
| `developerName` | `string` | Yes | Unique programmatic identifier utilized across Net Zero calculation pipelines. |
| `fuelType` | `string` | Yes | Developer name of the associated parent `FuelType`. |
| `unitOfMeasure` | `string` | Yes | Source input unit of measure (e.g., `Therms`, `Gallons`, `CubicMeters`, `Liters`). |
| `conversionFactor` | `double` | Yes | Precise mathematical scalar converting one source unit into the standard sustainability unit. |
| `standardUom` | `string` | Yes | Normalized target unit of measure (e.g., `Gigajoules`, `KilowattHours`). |

> [!NOTE]
> Ensure high precision when specifying `conversionFactor` (e.g., up to 6 decimal places) to eliminate rounding errors in massive enterprise energy rollups.

## Declarative XML and Package Manifest Examples

Below is a declarative `FuelTypeSustnUom` converting US Therms of natural gas into Gigajoules:

```xml title="force-app/main/default/fuelTypeSustnUoms/Natural_Gas_Therms_to_GJ.fuelTypeSustnUom-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<FuelTypeSustnUom xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Natural_Gas_Therms_to_GJ</developerName>
    <masterLabel>Natural Gas Therms to Gigajoules</masterLabel>
    <fuelType>Natural_Gas</fuelType>
    <unitOfMeasure>Therms</unitOfMeasure>
    <conversionFactor>0.105506</conversionFactor>
    <standardUom>Gigajoules</standardUom>
</FuelTypeSustnUom>
```

### Package Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Natural_Gas_Therms_to_GJ</members>
        <name>FuelTypeSustnUom</name>
    </types>
    <version>68.0</version>
</Package>
```

## CLI Retrieval and Deployment Commands

Manage unit conversion metadata via the Salesforce CLI:

```bash
# Retrieve all fuel unit conversion records
sf project retrieve start --metadata FuelTypeSustnUom

# Deploy conversion mappings alongside parent fuel types
sf project deploy start --metadata FuelTypeSustnUom:Natural_Gas_Therms_to_GJ --metadata FuelType:Natural_Gas
```

## Architect Best Practices and Gotchas

- **Strict Upstream Dependency:** Deploying `FuelTypeSustnUom` without the referenced `fuelType` already existing or included in the same payload triggers a fatal metadata dependency failure.
- **Conversion Factor Precision:** Standardize conversion factors against international standards (such as GHG Protocol or IPCC guidelines) and document the source methodology in code review comments.
- **Energy Balance Validation:** Run automated validation tests in scratch orgs to verify that round-trip conversions (e.g., liters to gallons to gigajoules) do not introduce mathematical drift.

> [!TIP]
> Include unit conversion test cases in your CI test suite to guarantee that utility bill ingestion flows calculate emissions predictably across all supported regional UOMs.
