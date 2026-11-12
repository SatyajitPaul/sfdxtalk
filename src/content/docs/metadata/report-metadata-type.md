---
title: "Report Metadata Type Reference"
description: "Configure, retrieve, and deploy Report (.report-meta.xml) metadata for Tabular, Summary, Matrix, and Joined reports, folders, crossFilters, and SOQL."
category: metadata
tags:
  - metadata-api
  - reports
  - analytics
  - dashboards
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "Report (.report-meta.xml) defines a custom Tabular, Summary, Matrix, or MultiBlock (Joined) report, including columns, groupingsDown, aggregates, customDetailFormulas, crossFilters, and report folder paths."
faq:
  - q: "Why can I not use the asterisk (*) wildcard with Report in package.xml?"
    a: "Report is a foldered metadata type (inFolder = true) and does not support the asterisk wildcard in package.xml. You must list the explicit FolderDeveloperName/ReportDeveloperName path for each report."
  - q: "Why do I need a trailing slash when referencing a nested ReportFolder in package.xml?"
    a: "Without a trailing slash, Metadata API interprets TopFolder/SubFolder as a report named SubFolder inside TopFolder and fails. Appending a trailing slash (TopFolder/SubFolder/) tells the API that the member is a nested folder."
  - q: "What happens if I redeploy a Report with the same fullName as a previously deleted report?"
    a: "Redeploying a Report with the same fullName as a deleted report (even one purged from the Recycle Bin) restores the original report record along with its original 18-character Id, CreatedDate, and CreatedById."
  - q: "What are the valid values for the format field on a Report?"
    a: "Valid format values are Tabular (flat list of rows), Summary (grouped rows with subtotals via groupingsDown), Matrix (2D grid using both groupingsDown and groupingsAcross), and MultiBlock (Joined Report across up to 5 blocks)."
  - q: "How can I list all Report developer names and folders using SOQL to build a package.xml?"
    a: "Query SELECT Id, DeveloperName, Name, FolderName, OwnerId, Format FROM Report WHERE OwnerId IN (SELECT Id FROM Folder WHERE Type = 'Report') in standard SOQL."
related:
  - metadata/report-type-metadata-type
  - metadata/dashboard-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_report.htm
---

The `Report` metadata type represents a custom analytics report in Salesforce (`Tabular`, `Summary`, `Matrix`, or `MultiBlock` Joined Report). Introduced in API version 14.0 (with `aggregateFilters` added in API v64.0 and `crossFilters` documented in v68.0), `Report` encapsulates displayed `columns`, row and column groupings (`groupingsDown`, `groupingsAcross`), custom summary formulas (`aggregates`), row-level formulas (`customDetailFormulas`), bucket fields (`buckets`), and embedded charts (`chart`).

In Salesforce DX projects, reports are stored inside folder subdirectories at `force-app/main/default/reports/<FolderName>/<ReportDeveloperName>.report-meta.xml`.

```mermaid
flowchart LR
    RT["ReportType /\nStandard Report Type"] --> Rep["Report\n(FolderName/ReportName.report-meta.xml)"]
    Rep --> Format{"format Field:\nTabular | Summary | Matrix | MultiBlock"}
    Rep --> Logic["Logic:\n- filter & crossFilters\n- buckets & customDetailFormulas\n- aggregates & aggregateFilters (v64.0+)"]
    Rep --> Dash["Dashboard\n(DashboardGridComponent)"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | UI display title of the report |
| `format` | `ReportFormat` | Yes | `Tabular`, `Summary`, `Matrix`, or `MultiBlock` (Joined Report) |
| `reportType` | `string` | Yes | Standard report type code (such as `Opportunity`, `CaseList`) or custom [ReportType](/docs/metadata/report-type-metadata-type/) developer name (`CustomEntity$Invoice__c`) |
| `scope` | `string` | No | Ownership scope (`organization`, `user`, `team`, `my_team_territory`) |
| `columns` | `ReportColumn[]` | No | Ordered fields (`field`, `aggregateTypes`: `Sum`, `Average`, `Maximum`, `Minimum`) |
| `groupingsDown` | `ReportGrouping[]` | No | Up to 3 row groupings for `Summary` reports (2 for `Matrix`) |
| `groupingsAcross` | `ReportGrouping[]` | No | Up to 2 column groupings for `Matrix` reports |
| `aggregates` | `ReportAggregate[]` | No | Custom Summary Formulas (`calculatedFormula`, `datatype`, `developerName` prefixed with `FORMULA1`) |
| `customDetailFormulas` | `ReportCustomDetailFormula[]` | No | Row-Level Formulas (`calculatedFormula`, ` developerName` set to `CDF1`) |
| `filter` | `ReportFilter` | No | Field filter criteria (`criteriaItems` + `booleanFilter`) |
| `crossFilters` | `ReportCrossFilter[]` | No | `WITH` (`includes`) or `WITHOUT` (`excludes`) child object filters |
| `timeFrameFilter` | `ReportTimeFrameFilter` | No | Date field and interval filter (`dateColumn`, `interval`) |

## Production-Grade XML Example (Summary Report with Custom Summary Formula)

Below is a `Summary` report (`force-app/main/default/reports/Executive_Sales_Reports/Quarterly_Enterprise_Pipeline.report-meta.xml`) grouped by `StageName` with a win-rate custom summary formula:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://soap.sforce.com/2006/04/metadata">
    <aggregates>
        <calculatedFormula>WON:SUM / RowCount</calculatedFormula>
        <datatype>percent</datatype>
        <developerName>FORMULA1</developerName>
        <isActive>true</isActive>
        <isCrossBlock>false</isCrossBlock>
        <masterLabel>Stage Win Rate %</masterLabel>
        <scale>1</scale>
    </aggregates>
    <columns>
        <field>OPPORTUNITY_NAME</field>
    </columns>
    <columns>
        <field>ACCOUNT_NAME</field>
    </columns>
    <columns>
        <aggregateTypes>Sum</aggregateTypes>
        <aggregateTypes>Average</aggregateTypes>
        <field>AMOUNT</field>
    </columns>
    <columns>
        <field>CLOSE_DATE</field>
    </columns>
    <description>Executive pipeline summary grouped by stage for the current fiscal quarter.</description>
    <filter>
        <criteriaItems>
            <column>AMOUNT</column>
            <columnToColumn>false</columnToColumn>
            <isUnlocked>true</isUnlocked>
            <operator>greaterOrEqual</operator>
            <value>50000</value>
        </criteriaItems>
    </filter>
    <format>Summary</format>
    <groupingsDown>
        <dateGranularity>Day</dateGranularity>
        <field>STAGE_NAME</field>
        <sortOrder>Asc</sortOrder>
    </groupingsDown>
    <name>Quarterly Enterprise Pipeline</name>
    <reportType>Opportunity</reportType>
    <scope>organization</scope>
    <showDetails>true</showDetails>
    <showGrandTotal>true</showGrandTotal>
    <showSubTotals>true</showSubTotals>
    <timeFrameFilter>
        <dateColumn>CLOSE_DATE</dateColumn>
        <interval>INTERVAL_CURRENT</interval>
    </timeFrameFilter>
</Report>
```

> [!WARNING]
> **Nested Report Folders Require a Trailing Slash (`/`) in `package.xml`**: When retrieving or deploying a nested `ReportFolder` without a trailing slash (`<members>Sales_Ops/EMEA_Reports</members>`), Metadata API assumes `EMEA_Reports` is a report file and throws `Entity of type 'Report' named 'Sales_Ops/EMEA_Reports' cannot be found`. Always append a trailing slash to folder paths:
> ```xml
> <types>
>     <members>Sales_Ops/</members>
>     <members>Sales_Ops/EMEA_Reports/</members>
>     <members>Sales_Ops/EMEA_Reports/Quarterly_Enterprise_Pipeline</members>
>     <name>Report</name>
> </types>
> ```

## Querying Reports and Folders with SOQL

```sql
-- 1. List all public and shared Reports with their Folder DeveloperName
SELECT Id, Name, DeveloperName, FolderName, Format, LastRunDate, LastViewedDate
FROM Report
WHERE FolderName != 'Private Reports'
ORDER BY FolderName, Name ASC

-- 2. List all Report Folders to construct package.xml paths
SELECT Id, Name, DeveloperName, AccessType, Type
FROM Folder
WHERE Type = 'Report' AND DeveloperName != null
ORDER BY DeveloperName ASC
```

