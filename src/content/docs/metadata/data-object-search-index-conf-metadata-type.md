---
title: "DataObjectSearchIndexConf in SFDX"
description: "Configure and deploy DataObjectSearchIndexConf metadata in Salesforce Data Cloud to power vector search, Agentforce grounding, and semantic hybrid indexing."
category: "metadata"
tags:
  - metadata
  - data-cloud
  - agentforce
  - vector-search
  - sf-cli
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-12
lastUpdated: 2026-11-12
level: "advanced"
tldr: "DataObjectSearchIndexConf configures vector embeddings, text chunking strategies, and hybrid search indexes across Data Cloud objects for Agentforce grounding."
faq:
  - q: "What is the purpose of DataObjectSearchIndexConf?"
    a: "It configures semantic vector search indexes and text chunking on Data Cloud objects to ground Agentforce autonomous agents and generative AI."
  - q: "Where are DataObjectSearchIndexConf files stored in SFDX?"
    a: "They are stored in force-app/main/default/dataObjectSearchIndexConfs/ with the file suffix .dataObjectSearchIndexConf-meta.xml."
  - q: "Which search types can DataObjectSearchIndexConf define?"
    a: "It configures vector embedding search for unstructured data as well as hybrid search combining semantic similarity and keyword filtering."
  - q: "How do you retrieve DataObjectSearchIndexConf via CLI?"
    a: "Execute sf project retrieve start with the metadata flag DataObjectSearchIndexConf."
related:
  - metadata/custom-object-metadata-type
  - metadata/custom-field-metadata-type
  - metadata/permission-set-metadata-type
officialRefs:
  - "https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-dataobjectsearchindexconf.md"
---

## Architectural Overview

The `DataObjectSearchIndexConf` metadata type configures vector search indexing, semantic embedding pipelines, and hybrid retrieval parameters within **Salesforce Data Cloud**. In the era of autonomous AI agents and **Agentforce**, generative language models require accurate, real-time grounding in enterprise knowledge and unstructured customer interaction histories.

`DataObjectSearchIndexConf` defines how Data Model Objects (DMOs) and Data Lake Objects (DLOs)—such as customer support transcripts, knowledge articles, product manuals, or PDF claims—are chunked, vectorized using embedding models, and indexed. When an Agentforce agent or Prompt Template executes a semantic query, the Data Cloud vector database relies on this configuration to perform high-precision hybrid retrieval.

```mermaid
flowchart LR
    A["Data Cloud DMO (Knowledge / Transcripts)"] --> B["DataObjectSearchIndexConf"]
    B -->|"Chunking & Token Overlap"| C["Vector Embedding Model"]
    C --> D["Data Cloud Vector Index"]
    D -->|"Semantic & Keyword Hybrid Retrieval"| E["Agentforce Autonomous Reasoning"]
```

## Directory and File Suffix Conventions

In SFDX source format, `DataObjectSearchIndexConf` metadata files reside in the `dataObjectSearchIndexConfs` directory:

| Property | Value |
| :--- | :--- |
| **Metadata Type Name** | `DataObjectSearchIndexConf` |
| **SFDX Source Directory** | `force-app/main/default/dataObjectSearchIndexConfs/` |
| **SFDX File Suffix** | `.dataObjectSearchIndexConf-meta.xml` |
| **Manifest Member Name** | `<name>DataObjectSearchIndexConf</name>` |

## Key Metadata Fields

| Field Name | Type | Required | Architectural Guidance |
| :--- | :--- | :--- | :--- |
| `masterLabel` | `string` | Yes | Human-readable title of the search index in Data Cloud Setup. |
| `developerName` | `string` | Yes | Programmatic identifier utilized in metadata manifests and API calls. |
| `sourceDataObject` | `string` | Yes | API name of the target Data Lake Object or Data Model Object being indexed. |
| `searchIndexType` | `string` | Yes | Specifies index retrieval behavior, such as `Vector` or `Hybrid`. |
| `embeddingModel` | `string` | No | Identifier of the vector embedding model (e.g., Salesforce proprietary or OpenAI model). |
| `chunkSize` | `int` | No | Maximum token length allocated per document chunk during ingestion. |
| `chunkOverlap` | `int` | No | Number of overlapping tokens preserved across adjacent chunks to maintain context. |

## Declarative XML and Manifest Examples

### Source Format XML (`Knowledge_Vector_Index.dataObjectSearchIndexConf-meta.xml`)

```xml title="force-app/main/default/dataObjectSearchIndexConfs/Knowledge_Vector_Index.dataObjectSearchIndexConf-meta.xml"
<?xml version="1.0" encoding="UTF-8"?>
<DataObjectSearchIndexConf xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Knowledge_Vector_Index</developerName>
    <masterLabel>Knowledge Base Vector Search Index</masterLabel>
    <sourceDataObject>Knowledge_Article_DMO</sourceDataObject>
    <searchIndexType>Hybrid</searchIndexType>
    <chunkSize>512</chunkSize>
    <chunkOverlap>64</chunkOverlap>
</DataObjectSearchIndexConf>
```

### Manifest (`package.xml`)

```xml title="manifest/package.xml"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Knowledge_Vector_Index</members>
        <name>DataObjectSearchIndexConf</name>
    </types>
    <version>68.0</version>
</Package>
```

## Retrieval and Deployment Commands

Use the Salesforce CLI to retrieve and deploy `DataObjectSearchIndexConf` metadata:

```bash
# Retrieve all search index configurations
sf project retrieve start --metadata DataObjectSearchIndexConf

# Retrieve a specific vector search index configuration
sf project retrieve start --metadata DataObjectSearchIndexConf:Knowledge_Vector_Index

# Deploy vector index metadata to target environment
sf project deploy start --metadata DataObjectSearchIndexConf:Knowledge_Vector_Index
```

## Senior Architect Best Practices and Gotchas

- **Chunk Sizing Tradeoffs:** Tuning `chunkSize` and `chunkOverlap` directly affects retrieval precision. Smaller chunks (256–512 tokens) excel at specific factual question-answering, while larger chunks (1024 tokens) preserve holistic narrative context for Agentforce agents.
- **Index Rebuild Latency:** Deploying metadata updates to `DataObjectSearchIndexConf` (such as changing embedding models or chunk sizes) triggers a background re-indexing job across the target data lake. Plan major changes during low-utilization windows.
- **Field-Level Security and Filtering:** Ensure indexed fields do not contain raw unmasked PII unless access policies restrict Agentforce grounding prompts to authorized administrative audiences.

> [!NOTE]
> Salesforce Data Cloud Vector Search and Agentforce licenses must be active in the org before deploying `DataObjectSearchIndexConf` metadata.
