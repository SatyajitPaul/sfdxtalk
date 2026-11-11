# Security Policy

SFDX Talk is a static documentation site: no user accounts, no server code and no database. Comments run on GitHub Discussions through giscus.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's private reporting instead:

**Security → Report a vulnerability** on this repository.

Examples of what to report:

- A way to inject script or content into sfdxtalk.com pages.
- A workflow or build step that could leak secrets or let a pull request deploy unreviewed code.
- A compromised or malicious dependency.

You'll get an acknowledgement within a few days. Please give us reasonable time to fix the issue before disclosing it.

## Wrong security advice in an article

If an article recommends something insecure (for example skipping CRUD/FLS checks, or `without sharing` where it isn't needed), that's a content bug, not a vulnerability: use **Report a problem** on the article or open a normal issue.
