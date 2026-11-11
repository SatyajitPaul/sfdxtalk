---
title: "Create a Scratch Org with the Salesforce CLI"
description: "Create, open, deploy to, and delete a Salesforce scratch org with the sf CLI, including the scratch org definition file and Dev Hub limits."
category: sf-cli
tags: [scratch-orgs, dev-hub, sf-cli]
release: "Winter '27"
apiVersion: "68.0"
published: 2026-11-11
lastUpdated: 2026-11-11
level: beginner
tldr: "Authorize a Dev Hub with sf org login web, then run sf org create scratch with a definition file. Scratch orgs are disposable, source-driven orgs that last 1 to 30 days (7 by default)."
faq:
  - q: "How long does a scratch org last?"
    a: "A scratch org lasts 7 days by default. Set the duration-days flag to any value from 1 to 30 when you create it. You cannot extend a scratch org after it is created."
  - q: "How many scratch orgs can I create?"
    a: "It depends on your Dev Hub edition. Each edition has a limit on active scratch orgs and on daily sign-ups. Check your current usage with sf limits api display against the Dev Hub."
  - q: "Can I use a Developer Edition org as a Dev Hub?"
    a: "Yes. Enable Dev Hub in Setup in a Developer Edition org. Developer Edition Dev Hubs have much lower scratch org limits than production Dev Hubs."
  - q: "What is the difference between sf org create scratch and sfdx force:org:create?"
    a: "They do the same job. The sf command is the current Salesforce CLI syntax. The sfdx force:org:create command is the legacy syntax and is deprecated."
  - q: "Do I need a scratch org definition file?"
    a: "No, you can pass the edition flag instead for a basic org. A definition file is recommended because it records the edition, features, and settings your project needs in source control."
related:
  - apex/trigger-handler-pattern
  - lwc/call-apex-from-lwc
officialRefs:
  - "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs.htm"
  - "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm"
---

## Overview

A scratch org is a temporary, configurable Salesforce org that you create from the command line. Scratch orgs are built from your project's source and configuration, so every developer and every CI run gets the same starting point.

Use scratch orgs for feature development, automated tests, and trying out a change in isolation. Use a sandbox instead when you need a copy of production metadata or data.

## Prerequisites

- The [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`) installed. Run `sf --version` to check.
- A Dev Hub org: a production org or Developer Edition org with **Dev Hub** enabled in Setup.
- A Salesforce DX project. Create one with `sf project generate --name my-project` if you don't have one.

## Authorize the Dev Hub

Authorize the Dev Hub once per machine. The CLI then uses it to create every scratch org.

```bash
sf org login web --set-default-dev-hub --alias DevHub
```

A browser window opens for you to log in. After login, the CLI stores the authorization and sets `DevHub` as the default Dev Hub.

## Define the Scratch Org

The scratch org definition file describes the org's edition, features, and settings. New projects include one at `config/project-scratch-def.json`.

```json title="config/project-scratch-def.json"
{
  "orgName": "My Project Scratch Org",
  "edition": "Developer",
  "features": ["EnableSetPasswordInApi"],
  "settings": {
    "lightningExperienceSettings": {
      "enableS1DesktopEnabled": true
    }
  }
}
```

- `edition`: one of `Developer`, `Enterprise`, `Group`, or `Professional`.
- `features`: org features to turn on, such as `EnableSetPasswordInApi`.
- `settings`: Metadata API settings applied at creation time.

## Create and Use the Scratch Org

Create the scratch org from the definition file and make it the default org for the project:

```bash
sf org create scratch --definition-file config/project-scratch-def.json --alias my-scratch --duration-days 7 --set-default
```

Deploy your project source and open the org in a browser:

```bash
sf project deploy start
sf org open
```

List your orgs, including scratch org expiration dates:

```bash
sf org list
```

> [!NOTE]
> Legacy command: `sfdx force:org:create -f config/project-scratch-def.json -a my-scratch -d 7 -s`. Use the `sf` syntax for new scripts.

## Delete the Scratch Org

Delete a scratch org as soon as you finish with it. Deleting frees one of your Dev Hub's active scratch org slots.

```bash
sf org delete scratch --target-org my-scratch --no-prompt
```

## Limits and Gotchas

- **Duration:** 1 to 30 days, default 7. The duration cannot be changed after creation.
- **Active and daily limits:** each Dev Hub edition allows a fixed number of active scratch orgs and daily sign-ups. Check usage with `sf limits api display --target-org DevHub` and look for `ActiveScratchOrgs` and `DailyScratchOrgs`.
- **Deleted orgs still count toward the daily limit:** deleting a scratch org frees an active slot, not a daily sign-up.
- **No production data:** scratch orgs start empty. Load test data with `sf data import tree` or a script.

> [!RELEASE] Winter '27
> The commands in this article were verified against the Winter '27 release (API 68.0). No behavior described here changed in this release.

## Related Official Documentation

- [Scratch Orgs](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs.htm): overview, editions, and limits.
- [Scratch Org Definition File](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm): every supported option.
