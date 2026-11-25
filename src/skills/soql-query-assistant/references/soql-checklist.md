# SOQL checklist

Use this before running any query.

## Correctness
- Every field and relationship name comes from the schema result, not from memory.
- Parent fields use the relationship name: `Account.Name`, `Owner.Email`. Child subqueries use the child relationship name: `(SELECT Id, LastName FROM Contacts)`.
- Date and datetime literals are unquoted: `CreatedDate = LAST_N_DAYS:30`, `CloseDate >= 2026-01-01`.
- String values are single-quoted and any quote inside is escaped: `Name = 'O\'Brien'`.
- Picklists compare as text: `StageName = 'Closed Won'`. Use `INCLUDES` for multi-select picklists.
- `COUNT()` returns a number only; `COUNT(Id)` can be grouped.
- Aggregate queries cannot select other fields unless they are in `GROUP BY`.

## Efficiency
- Select only the fields needed.
- Filter on indexed fields where possible: `Id`, `Name`, `OwnerId`, lookup and master-detail fields, `CreatedDate`, `SystemModstamp` and fields marked External ID or unique.
- Avoid: leading wildcards, `!=`, `NOT IN`, `NOT LIKE`, filtering on formula fields, and functions on the left side of a filter.
- `ORDER BY` on large results is costly: pair it with `LIMIT`.
- Add `LIMIT` unless every row is needed.

## Safety
- No DML, no Apex.
- Remember limits: 50,000 rows per transaction, 100 queries per synchronous Apex transaction (when the query ends up in code).
- Do not print more personal data than the user asked for.
