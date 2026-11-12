---
title: "Dashboard Metadata Type Reference"
description: "Configure and deploy Dashboard (.dashboard-meta.xml) metadata for 12-column Lightning grid layouts, dynamic running users, dashboardFilters, and SOQL."
category: metadata
tags:
  - metadata-api
  - dashboards
  - analytics
  - reports
  - sfdx
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: intermediate
tldr: "Dashboard (.dashboard-meta.xml) defines a visual analytics dashboard, including its 12-column Lightning dashboardGridLayout, underlying Report widgets, dashboardFilters, and runningUser security context (dashboardType)."
faq:
  - q: "Why do Dashboard deployments often fail on the runningUser field in CI/CD pipelines?"
    a: "The runningUser tag contains an environment-specific username (such as admin@company.com.uat). When deploying to a sandbox or production where that username does not exist, Either switch dashboardType to LoggedInUser or replace runningUser via SFDX string replacement."
  - q: "What are the valid values for dashboardType on a Dashboard?"
    a: "SpecifiedUser runs the dashboard under the single security context of runningUser, LoggedInUser runs the dashboard dynamically using each viewer's own security access, and MyTeamUser lets managers view data for their role subordinates."
  - q: "What is the org limit on Dynamic Dashboards (LoggedInUser and MyTeamUser)?"
    a: "Dynamic Dashboards are capped by edition: up to 5 in Enterprise Edition, 10 in Unlimited and Performance Editions, and 3 in Developer Edition."
  - q: "Does Dashboard support the asterisk (*) wildcard in package.xml?"
    a: "No. Dashboard is a foldered metadata type (inFolder = true) and does not support the asterisk wildcard. You must list the explicit FolderDeveloperName/DashboardDeveloperName path in package.xml."
  - q: "How do I query Dashboards and their folders using SOQL?"
    a: "Query the standard Dashboard object for Id, Title, DeveloperName, FolderName, Type, and RunningUserId, and query Folder WHERE Type = 'Dashboard' for folder developer names."
related:
  - metadata/report-metadata-type
  - metadata/report-type-metadata-type
  - metadata/flexipage-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_dashboard.htm
---

The `Dashboard` metadata type represents an analytics dashboard composed of charts, metric gauges, KPI cards, and Lightning tables powered by underlying [Report](/docs/metadata/report-metadata-type/) components. Introduced in API version 14.0 (with the 12-column Lightning `dashboardGridLayout` introduced in API v35.0), `Dashboard` also controls dashboard-wide filters (`dashboardFilters`) and data visibility security (`dashboardType`: `SpecifiedUser`, `LoggedInUser`, or `MyTeamUser`).

In Salesforce DX projects, dashboards are stored inside folder subdirectories at `force-app/main/default/dashboards/<FolderName>/<DashboardDeveloperName>.dashboard-meta.xml`.

```mermaid
flowchart TD
    Dash["Dashboard\n(FolderName/Exec_Overview.dashboard-meta.xml)"] --> Sec{"dashboardType\n(Security Context)"}
    Sec -->|"SpecifiedUser"| Static["Uses runningUser's Access"]
    Sec -->|"LoggedInUser / MyTeamUser"| Dyn["Dynamic Dashboard\n(Viewer's Own Sharing Access)"]
    Dash --> Grid["dashboardGridLayout\n(12-Column Grid + dashboardGridComponents)"]
    Grid --> Rep["Underlying Report\n(<report>Folder/ReportName</report>)"]
```

## Key Metadata Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Display title of the dashboard |
| `isGridLayout` | `boolean` | No | Set to `true` for modern 12-column Lightning Experience dashboards |
| `dashboardType` | `DashboardType` | No | `SpecifiedUser`, `LoggedInUser` (Dynamic), or `MyTeamUser` (Dynamic) |
| `runningUser` | `string` | Conditional | Username of the context user (required when `dashboardType` is `SpecifiedUser`) |
| `chartTheme` | `ChartTheme` | No | `light` or `dark` default widget theme (v42.0+) |
| `colorPalette` | `ChartColorPalettes` | No | Color palette (`Default`, `colorSafe`, `dusk`, `sunrise`, `water`, etc.) |
| `dashboardFilters` | `DashboardFilter[]` | No | Up to 3 header filter dropdowns (`name`, `dashboardFilterOptions`) |
| `dashboardGridLayout` | `DashboardGridLayout` | No | Defines `numberOfColumns` (`12`), `rowHeight`, and `dashboardGridComponents` (`colSpan`, `rowSpan`, `columnIndex`, `rowIndex`, `dashboardComponent`) |
| `backgroundStartColor` / `backgroundEndColor` / `backgroundFadeDirection` | `string` | Yes | Legacy gradient attributes (`#FFFFFF` / `Diagonal`) required by the schema |

## Production-Grade XML Example (12-Column Lightning Dashboard)

Below is a Lightning `Dashboard` (`force-app/main/default/dashboards/Executive_Dashboards/Q4_Revenue_Command_Center.dashboard-meta.xml`) using `LoggedInUser` so it deploys across sandboxes without hardcoded usernames:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Dashboard xmlns="http://soap.sforce.com/2006/04/metadata">
    <backgroundEndColor>#FFFFFF</backgroundEndColor>
    <backgroundFadeDirection>Diagonal</backgroundFadeDirection>
    <backgroundStartColor>#FFFFFF</backgroundStartColor>
    <chartTheme>light</chartTheme>
    <colorPalette>colorSafe</colorPalette>
    <dashboardGridLayout>
        <dashboardGridComponents>
            <colSpan>6</colSpan>
            <columnIndex>0</columnIndex>
            <dashboardComponent>
                <autoselectColumnsFromReport>false</autoselectColumnsFromReport>
                <chartAxisRange>Auto</chartAxisRange>
                <chartSummary>
                    <aggregate>Sum</aggregate>
                    <axisBinding>y</axisBinding>
                    <column>AMOUNT</column>
                </chartSummary>
                <componentType>Bar</componentType>
                <displayUnits>Auto</displayUnits>
                <GroupingColumn>STAGE_NAME</GroupingColumn>
                <header>Pipeline by Stage</header>
                <report>Executive_Sales_Reports/Quarterly_Enterprise_Pipeline</report>
                <showPercentage>false</showPercentage>
                <showValues>true</showValues>
                <sortBy>RowLabelAscending</sortBy>
            </dashboardComponent>
            <rowIndex>0</rowIndex>
            <rowSpan>8</rowSpan>
        </dashboardGridComponents>
        <numberOfColumns>12</numberOfColumns>
        <rowHeight>36</rowHeight>
    </dashboardGridLayout>
    <dashboardType>LoggedInUser</dashboardType>
    <description>Executive pipeline dashboard running under the logged-in user security context.</description>
    <isGridLayout>true</isGridLayout>
    <title>Q4 Revenue Command Center</title>
    <titleColor>#000000</titleColor>
    <titleSize>12</titleSize>
</Dashboard>
```

> [!WARNING]
> **Eliminating `<runningUser>` Deployment Failures**: Even when `dashboardType` is set to `LoggedInUser`, retrieving a Dashboard from a sandbox often includes a `<runningUser>developer@company.com.dev</runningUser>` tag. Strip `<runningUser>` from `LoggedInUser` dashboards before committing to Git, or use SFDX string replacements (`sfdx-project.json` `replacements`) for `SpecifiedUser` dashboards.

## Querying Dashboards and Folders with SOQL

```sql
-- 1. Audit all Dashboards, their Folders, and whether they consume Dynamic Dashboard slots
SELECT Id, Title, DeveloperName, FolderName, Type, RunningUser.Username, LastViewedDate
FROM Dashboard
ORDER BY Type, FolderName, Title ASC

-- 2. Count how many Dynamic Dashboards (LoggedInUser / MyTeamUser) are currently used
SELECT Type, COUNT(Id) totalDashboards
FROM Dashboard
WHERE Type IN ('LoggedInUser', 'MyTeamUser')
GROUP BY Type
```

