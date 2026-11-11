# SFDX Talk — Content Spec (for writer agents)

Every article is one Markdown file. The build **fails** if frontmatter breaks this spec, so follow it exactly.

SFDX Talk is **unofficial** and not affiliated with Salesforce. Never imply endorsement, never use Salesforce logos, never copy official docs verbatim beyond short attributed quotes.

---

## 1. File location & naming

```
src/content/docs/{category}/{slug}.md
```

- `category` folder must match the `category` field.
- `slug`: lowercase, hyphenated, 3–6 words, keyword-first, no dates or release names.
  - ✅ `apex/trigger-handler-pattern.md`
  - ❌ `apex/Trigger_Handler_Winter27.md`
- Public URL becomes `/docs/{category}/{slug}/`. **Never rename a slug after publishing** (add a redirect if unavoidable).

---

## 2. Frontmatter

```yaml
---
title: "Apex Trigger Handler Pattern"
description: "Structure Apex triggers with a handler class to keep logic testable, bulk-safe, and in a predictable order. Includes a full example and test class."
category: apex
tags: [triggers, best-practices, bulkification]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-01
lastUpdated: 2026-11-11
level: intermediate
tldr: "Put one trigger per object and delegate all logic to a handler class. This keeps code bulk-safe, testable, and controls execution order."
faq:
  - q: "Can I have more than one trigger on the same object?"
    a: "Yes, but Salesforce does not guarantee the execution order between multiple triggers on the same object. Use one trigger per object and route logic through a handler."
  - q: "Does a trigger handler framework affect governor limits?"
    a: "No. The handler runs in the same transaction and shares the same limits. The pattern only organizes code; bulkification is still your job."
related:
  - apex/trigger-context-variables
  - testing/apex-test-data-factory
officialRefs:
  - "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm"
draft: false
---
```

### Field rules

| Field | Required | Rules |
|---|---|---|
| `title` | ✅ | ≤60 chars. Primary keyword near the start. Title Case. No "Salesforce" prefix (brand is implied by the site). |
| `description` | ✅ | 120–160 chars. A complete sentence that answers "what will I learn". Used as meta description and in JSON-LD. |
| `category` | ✅ | One value from §3. |
| `tags` | ✅ | 1–6 items, lowercase-hyphenated. Reuse existing tags before inventing new ones. |
| `release` | ✅ | Release the content was **verified against**, from §4. Format: `Season 'YY` with a straight apostrophe. |
| `apiVersion` | ✅ | Matches `release` per §4, string with one decimal, e.g. `"68.0"`. |
| `published` | ✅ | `YYYY-MM-DD`. Never changes. |
| `lastUpdated` | ✅ | `YYYY-MM-DD`. Change **only** for meaningful content edits (not typos). Drives sitemap `lastmod` and `dateModified`; inaccurate dates make search engines ignore them. |
| `level` | ✅ | `beginner` \| `intermediate` \| `advanced`. |
| `tldr` | ✅ | 1–3 sentences, ≤300 chars. Direct answer to the article's main question. No "In this article…". |
| `faq` | ✅ | 3–8 items. See §6. |
| `related` | ⬜ | 0–5 paths `{category}/{slug}` of existing articles. |
| `officialRefs` | ✅ | ≥1 link to official Salesforce documentation for the topic. |
| `draft` | ⬜ | `true` hides the article from build output. Default `false`. |

### Automatic checks

The build also rejects:

- Unknown frontmatter fields (typos like `lastupdated` fail instead of being ignored).
- `apiVersion` that doesn't match `release` (§4).
- `lastUpdated` before `published`, or either date in the future.
- A file whose folder differs from its `category`, or a non-hyphenated slug.
- A title or description already used by another article.
- `related` entries that point to a missing or draft article, or to the article itself.
- FAQ text containing backticks, HTML, `**bold**`, or Markdown links. Underscores are fine (`Account__c`).

There is **no `author` field**. Every article is credited to "SFDX Talk Editorial" automatically. Do not add personal names or bylines in the body.

---

## 3. Categories

| Value | Covers |
|---|---|
| `apex` | Apex language, triggers, async Apex, governor limits |
| `lwc` | Lightning Web Components |
| `aura` | Aura components (legacy) |
| `soql-sosl` | Queries, search, query optimization |
| `sf-cli` | Salesforce CLI (`sf`), legacy `sfdx` commands, scratch orgs |
| `metadata` | Metadata API, source format, package.xml, deployments |
| `devops` | CI/CD, DevOps Center, packaging (2GP/unlocked) |
| `testing` | Apex tests, Jest for LWC, test data |
| `apis` | REST, SOAP, Bulk, Composite, GraphQL, Pub/Sub APIs |
| `integration` | Named Credentials, callouts, Platform Events, CDC |
| `flow` | Flow Builder from a developer perspective, invocable Apex |
| `security` | Sharing, CRUD/FLS, `WITH USER_MODE`, Shield |
| `agentforce` | Agentforce, Einstein, AI features for developers |
| `data-cloud` | Data Cloud developer topics |

New categories require a site change — ask before using one not listed.

---

## 4. Releases & API versions

| Release | API version | Approx. GA |
|---|---|---|
| `Winter '25` | 62.0 | Oct 2024 |
| `Spring '25` | 63.0 | Feb 2025 |
| `Summer '25` | 64.0 | Jun 2025 |
| `Winter '26` | 65.0 | Oct 2025 |
| `Spring '26` | 66.0 | Feb 2026 |
| `Summer '26` | 67.0 | Jun 2026 |
| `Winter '27` | 68.0 | Oct 2026 |
| `Spring '27` | 69.0 | Feb 2027 |

Salesforce has three releases a year; the "Winter 'YY" release ships in the autumn of the previous calendar year. Verify each new row against official release notes before adding.

---

## 5. Body structure

The page template renders **title, meta line, TL;DR, FAQ, related links** from frontmatter. **Do not** repeat them in the body. Do not add an H1.

Use these H2 sections in order (omit any that genuinely don't apply):

```markdown
## Overview
What it is, when to use it, when not to. 2–4 short paragraphs.

## Prerequisites
Bulleted list: permissions, org features, CLI version, prior knowledge.

## {Main topic sections — descriptive H2s}
The full details. Use H3 for sub-steps.

## Example
Complete, runnable code. Include the test class for Apex.

## Limits and Gotchas
Bulleted list with exact numbers (governor limits, sizes, timeouts).

## Related Official Documentation
Links with one-line descriptions.
```

### Writing rules (based on scanning and GEO research)

1. **Answer first.** The first sentence under every H2 states the key point. Details follow.
2. **Self-contained sections.** Each H2 must make sense if read alone (AI engines retrieve sections, not pages). Name the subject explicitly instead of "it" / "this" across section boundaries.
3. **Descriptive headings** using the words developers search for: "Bulkify an Apex Trigger", not "Making It Better".
4. **Concrete facts:** exact limits, numbers, version requirements. Statistics and specifics increase AI citation rates.
5. **Cite official sources** with inline links. Quote official docs only briefly (≤1 sentence) in a `>` blockquote with attribution.
6. **Short paragraphs** (≤4 sentences). Prefer lists and tables for comparisons, steps, and options.
7. **Plain language.** Second person ("you"), active voice, present tense. Define acronyms on first use per article.
8. **No fluff:** no "In this article we will…", no "In conclusion", no marketing tone.
9. **Release-specific behavior** goes in a callout naming the release (see §7).
10. **Accuracy over coverage.** If unsure, verify against official docs or omit.

---

## 6. FAQ rules

FAQ is rendered visibly at the end of the article **and** emitted as `FAQPage` JSON-LD — both from the `faq` field.

- 3–8 questions people actually search for (think "People also ask", Stack Exchange titles, Trailblazer Community questions).
- Questions end with `?` and are phrased as a developer would type them.
- Answers: 1–3 sentences, ≤300 chars, plain text (no Markdown, no code blocks — JSON-LD must match visible text).
- Each answer is complete on its own; the first words answer the question ("Yes, …", "No, …", "Use …").
- Do not repeat the TL;DR as a FAQ.

---

## 7. Markdown conventions

### Code blocks

Always set the language. Allowed: `apex`, `soql` (falls back to `sql`), `javascript`, `typescript`, `html`, `css`, `xml`, `json`, `yaml`, `bash`, `shell`.

Add a title when the file name matters:

````markdown
```apex title="AccountTriggerHandler.cls"
public with sharing class AccountTriggerHandler { }
```
````

- CLI examples use the modern `sf` CLI. Show legacy `sfdx` only in a "Legacy command" note.
- No shell prompts (`$`) in commands; output goes in a separate block.
- Code must compile/run. Use `with sharing` / `WITH USER_MODE` unless the point is otherwise.

### Callouts

```markdown
> [!NOTE]
> Supplementary information.

> [!TIP]
> A shortcut or best practice.

> [!WARNING]
> Something that causes errors or data issues.

> [!RELEASE] Winter '27
> Behavior introduced or changed in this release.
```

### Other

- Internal links: root-relative with trailing slash, `[Trigger Context Variables](/docs/apex/trigger-context-variables/)`.
- Tables: header row required; keep ≤5 columns.
- Images: `src/assets/docs/{category}/{slug}-{n}.png`, always with descriptive alt text. Prefer code/text over screenshots.
- No raw HTML, no emoji in headings.

---

## 8. Pre-publish checklist

- [ ] Frontmatter valid; `release` ↔ `apiVersion` match §4
- [ ] `title` ≤60, `description` 120–160 chars
- [ ] TL;DR answers the main question directly
- [ ] Every H2 opens with its key point and stands alone
- [ ] Code blocks have languages and run as written
- [ ] Limits/numbers verified against official docs; `officialRefs` present
- [ ] 3–8 FAQs, plain-text answers ≤300 chars
- [ ] `related` paths exist
- [ ] `lastUpdated` changed only if content meaningfully changed
