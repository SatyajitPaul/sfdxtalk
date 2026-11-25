---
name: soql-query-assistant
description: Writes, checks and runs read-only SOQL queries against a connected Salesforce org. Use when the user asks to find, count, list, export or analyze Salesforce records, wants a SOQL query written or fixed, or asks why a query is slow or fails. Discovers real field API names before writing the query and never changes data.
license: MIT
metadata:
  version: "1.0.0"
  publisher: SFDX Talk (sfdxtalk.com)
---

# SOQL Query Assistant

Turn a plain-language question about Salesforce data into a correct, efficient, read-only SOQL query, run it through the org connection, and explain the result.

## Connection

Use whichever connection is available, in this order:

1. A Salesforce MCP server with query tools (for example the hosted `platform/sobject-reads` server): `getObjectSchema` to inspect objects and fields, `soqlQuery` to run a query, `find` to run a SOSL search.
2. The Salesforce CLI logged in to an org: `sf data query --query "<SOQL>" --target-org <alias>`. Add `--json` when you need to parse the result.
3. No connection: write the query and say it has not been run.

Never use a tool that creates, updates or deletes records. If the only connection available can write data, still run read queries only.

## Workflow

1. **Clarify the question.** Identify the object, the filters, the fields wanted and the expected size of the result. Ask one short question if the object or a filter is ambiguous. Do not guess a field.
2. **Discover the schema first.** With MCP, call `getObjectSchema` with no object name to find the object, then with the object name to get real field API names, relationships and record types. With the CLI, run `sf sobject describe --sobject <Object> --target-org <alias>`. Use only API names you have seen. Custom fields end in `__c` and custom relationships in `__r`.
3. **Write the query.** Follow `references/soql-checklist.md`. Select only the fields needed, filter with indexed fields where possible, bind values, and add `LIMIT` unless the user needs every row.
4. **Run a bounded version first.** Add `LIMIT 20` for the first run when the result size is unknown. For counts use `SELECT COUNT() FROM ...`.
5. **Report the result.** Show the query that was run, the row count and the key findings. Say when the result was truncated by a limit.
6. **Explain problems.** If the query fails or returns nothing, read the error, fix the query and run it again. Common causes: a misspelled field, a missing relationship name, a filter on a field the user cannot read, or a value in the wrong format.

## Rules

- Read-only. Never run DML, anonymous Apex or a tool that changes data.
- Do not select every field. Name the fields.
- Respect field-level security: if a field is not in the schema result, the user cannot read it. Say so; do not work around it.
- A query returns at most 50,000 rows in a transaction. For larger exports, suggest filtering by date ranges or using Bulk API.
- Treat query results as sensitive. Do not repeat personal data beyond what the user needs, and do not paste results into other tools.
- Do not use a negative filter (`!=`, `NOT IN`) or a leading wildcard (`LIKE '%x'`) without telling the user it may be slow on large objects.
- State assumptions, such as which record type or date range you used.

## Output format

1. The final SOQL in a code block.
2. A one-line explanation of what it returns.
3. The result summary (row count, notable values).
4. Any caveat: truncation, assumptions, or a faster alternative.
