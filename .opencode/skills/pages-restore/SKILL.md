---
name: pages-restore
description: Restore the pages directory from a previously created ZIP backup
license: MIT
compatibility: opencode
---
## Overview
This skill provides instructions for restoring the `pages/` directory from an existing ZIP backup.

## What I do
- Guide the agent to use `npm run restore` to interactively select and apply a backup.
- Remind the agent to offer a pre-restoration backup to prevent accidental data loss.
- Explain the extraction process and how the `.keep` file is preserved.

## When to use me
- When the user wants to revert to a previous state of their content.
- When moving content between environments using ZIP files.

## Usage
Run the following command in the project root:
```bash
npm run restore
```
1. Select the desired backup from the list.
2. Confirm if a pre-restoration backup should be performed.
3. Confirm the final restoration action (this will overwrite the current `pages/` directory).
