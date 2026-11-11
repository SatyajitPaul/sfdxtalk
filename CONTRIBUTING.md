# Contributing to SFDX Talk

Thanks for helping keep Salesforce developer docs accurate. Fixes to outdated releases, broken examples, typos and missing gotchas are the most valuable contributions — you don't need to write a whole article to help.

## Ways to contribute

| You want to… | Do this |
|---|---|
| Fix a typo, outdated fact or broken example | Click **Edit this page on GitHub** at the bottom of the article |
| Report something without fixing it | Click **Report a problem** on the article, or [open an issue](../../issues/new/choose) |
| Propose a new article | [Request an article](../../issues/new?template=article-request.yml) first, so we can agree on scope and slug |
| Ask a question about an article | Comment under the article (GitHub Discussions) |
| Change the site itself (layout, scripts, build) | Open an issue first to discuss it |

## Editing an article in the browser

1. On sfdxtalk.com, click **Edit this page on GitHub**.
2. GitHub asks to fork the repository — accept. Your edit happens in your copy.
3. Make the change, describe it in the commit message, and choose **Propose changes**.
4. Open the pull request and fill in the checklist.
5. CI builds the site and validates every article. If it fails, the log names the file and the rule that broke.
6. A maintainer reviews and merges. Merged changes go live automatically within a few minutes.

To be credited by your GitHub username on the article, keep GitHub's default *private email* setting (commits then use your `@users.noreply.github.com` address). Otherwise your git author name is shown, without a link. Email addresses are never published on the site.

## Editing locally

```bash
git clone https://github.com/<your-username>/sfdxtalk.git
cd sfdxtalk
pnpm install
pnpm dev     # live preview at http://localhost:4321
pnpm build   # must pass before you open a pull request
```

Requires Node.js 24 and pnpm 10. Site search in `pnpm dev` needs one `pnpm build` first.

## Article rules

**[docs/CONTENT-SPEC.md](docs/CONTENT-SPEC.md) is the contract** — frontmatter fields, body section order, callouts, code fences, diagrams and FAQ rules. The build enforces most of it. The rules reviewers check by hand:

- **Verify against a real release.** Set `release` (and the matching `apiVersion`) to the Salesforce release you actually checked the content against, and list the official pages you used in `officialRefs`.
- **Never copy Salesforce documentation.** Write in your own words. Short quotes are fine with attribution. Pull requests that paste official docs are closed.
- **No Salesforce logos or implied endorsement.** SFDX Talk is unofficial.
- **Modern CLI.** Examples use the `sf` CLI; legacy `sfdx` commands only inside a "Legacy command" note.
- **Code must work.** Prefer `with sharing` and `WITH USER_MODE` unless the point of the example is otherwise.
- **No bylines in the article.** Contributors are credited automatically from git history.
- **`lastUpdated` changes only for meaningful edits** (not for typo fixes) — it drives the sitemap.
- **Never rename or move a published article.** Its URL and its comment thread depend on the path.
- **No AI-generated filler.** AI tools are fine for drafting, but you are responsible for every fact and every line of code. Unverified content is rejected.

## Pull request scope

- One article (or one closely related set of changes) per pull request.
- Pull requests from outside contributors should not change `package.json`, `pnpm-lock.yaml`, `astro.config.mjs` or `.github/` unless an issue asked for it — those changes need extra review because they run during the build.

## License of your contribution

By opening a pull request you confirm that you wrote the contribution (or have the right to submit it), and you agree that article content is licensed under [CC BY 4.0](LICENSE-CONTENT) and code under the [MIT License](LICENSE).

## Conduct

Be kind and assume good intent. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
