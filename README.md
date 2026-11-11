# SFDX Talk

**Unofficial, community-maintained Salesforce developer documentation** — Apex, Lightning Web Components, SOQL, the `sf` CLI, APIs, Agentforce and more. Live at **[sfdxtalk.com](https://sfdxtalk.com)**.

Every article opens with a quick answer, names the Salesforce release it was verified against, and links to the official docs it was checked with.

> SFDX Talk is not affiliated with, endorsed by, or sponsored by Salesforce, Inc. Salesforce is a trademark of Salesforce, Inc.

## Contribute

Anyone with a GitHub account can improve the docs.

- **Fix or update an article:** open it on sfdxtalk.com and click **Edit this page on GitHub** at the bottom. GitHub forks the repo for you and opens a pull request.
- **Report a problem:** click **Report a problem** on the article, or [open an issue](../../issues/new/choose).
- **Suggest a new article:** [request an article](../../issues/new?template=article-request.yml).
- **Ask or discuss:** comment under any article, or use [Discussions](../../discussions).

Read **[CONTRIBUTING.md](CONTRIBUTING.md)** before your first pull request, and **[docs/CONTENT-SPEC.md](docs/CONTENT-SPEC.md)** for the exact article format. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Run it locally

Requires Node.js 24 and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static build to dist/ — also validates every article
```

`pnpm build` is the content check: a frontmatter mistake or a broken `related` link fails the build with a message naming the file. CI runs the same build, the page-size budget and Lighthouse on every pull request.

## How it's built

An [Astro](https://astro.build) static site served by Cloudflare Workers static assets. Articles are Markdown in `src/content/docs/{category}/{slug}.md`; structured data, the sitemap, RSS, `llms.txt` and per-article Markdown copies are all generated from their frontmatter. Search is [Pagefind](https://pagefind.app); comments are [giscus](https://giscus.app) on GitHub Discussions.

| Path | What |
|---|---|
| `src/content/docs/` | The articles |
| `src/assets/docs/` | Article images |
| `src/content.config.ts` | Frontmatter schema |
| `src/lib/taxonomy.ts` | Categories and Salesforce releases |
| `docs/CONTENT-SPEC.md` | Article format and writing rules |
| `docs/PLAN.md` | Site design, SEO and performance decisions |

## License

- **Articles** (`src/content/`, `src/assets/docs/`): [CC BY 4.0](LICENSE-CONTENT) — reuse freely with attribution.
- **Site code**: [MIT](LICENSE).

Security issues: see [SECURITY.md](SECURITY.md).
