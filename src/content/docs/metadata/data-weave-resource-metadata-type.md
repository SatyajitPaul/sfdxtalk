---
title: "DataWeaveResource Metadata Type for DataWeave in Apex"
description: "Deploy DataWeave 2.0 transformation scripts (.dwl) using the DataWeaveResource metadata type. Convert CSV, JSON, and XML directly to SObjects in Apex."
category: "metadata"
tags:
  - metadata-api
  - apex
  - integration
  - dataweave
  - sfdx
  - deployment
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "Introduced in API v58.0, DataWeaveResource (dw/<Name>.dwl and .dwl-meta.xml) compiles MuleSoft DataWeave 2.0 scripts into DataWeaveScriptResource Apex classes for high-speed CSV, XML, and JSON transformations."
faq:
  - q: "Why should developers use DataWeaveResource in Apex instead of custom CSV or XML parsers?"
    a: "Parsing large CSV files with escaped commas/newlines or deeply nested XML payloads in native Apex frequently triggers Apex CPU time limits and heap size exceptions. DataWeaveResource offloads data transformation to MuleSoft's compiled DataWeave 2.0 engine."
  - q: "How do you invoke a DataWeaveResource script from an Apex class?"
    a: "Salesforce generates a strongly typed class under the DataWeaveScriptResource namespace (such as new DataWeaveScriptResource.csvToContacts()), or you can load it dynamically via DataWeave.Script.createScript('csvToContacts') and call execute(parameters)."
  - q: "Can a DataWeaveResource script output SObject instances directly?"
    a: "Yes! By setting output application/apex in the .dwl script header and appending as Object {class: 'Account'} (or any custom SObject or Apex class), script.execute() returns a List of SObjects that you can pass directly to Database.insert()."
  - q: "What does the isGlobal field do in a .dwl-meta.xml file?"
    a: "When isGlobal is set to true in a managed package, the generated DataWeaveScriptResource.ScriptName Apex class is marked global so subscriber org Apex code can instantiate and execute the DataWeave script."
related:
  - metadata/apex-class-metadata-type
  - metadata/static-resource-metadata-type
  - metadata/custom-object-metadata-type
officialRefs:
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_dataweaveresource.htm
---

## Why `DataWeaveResource` Revolutionizes File & Payload Parsing in Apex

Available starting in **API version 58.0**, **`DataWeaveResource`** (`dw/<ScriptName>.dwl` and `dw/<ScriptName>.dwl-meta.xml`) brings MuleSoft's **DataWeave 2.0** transformation language natively into the Apex runtime.

Instead of writing fragile regexes to parse RFC-4180 CSV files with embedded newlines or walking `Dom.Document` XML trees that exhaust the 10,000-ms Apex CPU limit, you deploy a declarative `.dwl` script that transforms **CSV, JSON, or XML directly into `List<SObject>` or Apex DTOs**.

```mermaid
flowchart LR
    subgraph SFDX["force-app/main/default/dw/"]
        DWL["csvToInvoices.dwl<br/>(DataWeave 2.0 Script)"]
        META["csvToInvoices.dwl-meta.xml<br/>(apiVersion: 68.0, isGlobal: false)"]
    end

    subgraph RUNTIME["Apex Runtime"]
        GEN["Generated Class:<br/>DataWeaveScriptResource.csvToInvoices"]
        EXEC["script.execute(new Map&lt;String, Object&gt;{ 'payload' =&gt; csvString })"]
        SOBJ["List&lt;Invoice__c&gt; Ready for DML"]
    end

    DWL --> GEN
    META --> GEN
    GEN --> EXEC
    EXEC --> SOBJ
```

---

## SFDX Source Format & Metadata Fields

Each `DataWeaveResource` consists of two paired files inside `force-app/main/default/dw/`:
- `dw/<ScriptName>.dwl`: The DataWeave 2.0 script (`%dw 2.0`).
- `dw/<ScriptName>.dwl-meta.xml`: The metadata companion file.

| Field | Type | Required | Description |
|---|---|---|---|
| `apiVersion` | `double` | Yes | Salesforce API version (`58.0` or higher; use `68.0`). |
| `isGlobal` | `boolean` | No | Marks the generated `DataWeaveScriptResource.<ScriptName>` class as `global`. Defaults to `false`. |
| `isProtected` | `boolean` | No | Reserved field. |

---

## Real-World Example: Transforming CSV directly to `Contact` SObjects

### 1. DataWeave Script (`dw/csvToContacts.dwl`)

```dataweave
%dw 2.0
input records application/csv
output application/apex
---
records map(record) -> {
    FirstName: trim(record.first_name),
    LastName: trim(record.last_name),
    Email: lower(trim(record.email)),
    Department: record.dept default "General"
} as Object {class: "Contact"}
```

### 2. Metadata Sidecar (`dw/csvToContacts.dwl-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DataWeaveResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>68.0</apiVersion>
    <isGlobal>false</isGlobal>
</DataWeaveResource>
```

### 3. Invoking the `DataWeaveResource` in Apex

```java
DataWeave.Script script = new DataWeaveScriptResource.csvToContacts();
DataWeave.Result result = script.execute(new Map<String, Object>{
    'records' => csvFileBodyString
});
List<Contact> contactsToUpsert = (List<Contact>) result.getValue();
upsert contactsToUpsert;
```

---

## Senior Architect Best Practices & Limits

> [!TIP]
> **Compile-Time Safety with `new DataWeaveScriptResource.<ScriptName>()`:** Always prefer instantiating `new DataWeaveScriptResource.csvToContacts()` over `DataWeave.Script.createScript('csvToContacts')`. Using the generated `DataWeaveScriptResource` subclass creates a hard metadata dependency in Salesforce, preventing anyone from accidentally deleting the `.dwl` script while your Apex class depends on it!

- **Check FLS / CRUD After `output application/apex`:** Instantiating SObjects inside a `.dwl` script bypasses UI-level field checks just like `new Contact()` in Apex. Always run `insert as user contactsToUpsert` or `Security.stripInaccessible()` before committing records parsed from external files.
