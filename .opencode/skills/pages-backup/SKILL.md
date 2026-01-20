---
name: pages-backup
description: Backup the pages directory into a timestamped ZIP file
license: MIT
compatibility: opencode
---
## Overview
This skill provides instructions for creating a backup of the `pages/` directory.

## What I do
- Guide the agent to use `npm run backup` to create a ZIP-based backup.
- Help the agent understand where backups are stored (`backups/` directory).
- Explain the naming convention of backup files: `backup_YYYY-MM-DDTHH-mm-ss_note.zip`.

## When to use me
- When the user wants to save a snapshot of their content.
- Before making significant changes to the `pages/` directory.
- When performing a restoration, to ensure a "safety" backup is made first.

## Usage
Run the following command in the project root:
```bash
npm run backup
```
Follow the interactive prompts to add an optional note.
