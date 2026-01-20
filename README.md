# Render

Render is a lightweight Node.js application designed to serve and display Markdown files with a clean, GitHub-inspired aesthetic. It features a dynamic dashboard and full-text search capabilities.

## Features

- **Markdown Rendering**: High-fidelity conversion of Markdown to HTML using `marked`.
- **Syntax Highlighting**: Beautiful code blocks powered by `highlight.js`.
- **Front-Matter Support**: Extract and use metadata (like titles and dates) from your Markdown files using `gray-matter`.
- **GitHub-Style UI**: Professional look and feel using `github-markdown-css`.
- **Dynamic Dashboard**: Automatically lists all pages available in the content directory.
- **Server-Side Search**: Quickly find pages by searching through titles, slugs, and content.

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm

### Installation

1. Clone the repository or download the source code.
2. Install the dependencies:

```bash
npm install
```

### Usage

1. **Add Content**: Place your `.md` files in the `pages/` directory.
2. **Run the App**: Start the server using Node:

```bash
node app.js
```

3. **View**: Open your browser and navigate to `http://localhost:9901`.

## Content Example

To take full advantage of Render's features, you can include YAML front-matter at the top of your Markdown files:

```markdown
---
title: My Project Update
date: 2026-01-20
---

# Introduction

This is an example of a rendered page.
```

## Data Management

Render includes built-in scripts to help you backup and restore your Markdown content.

### Backup

To create a backup of your `pages/` directory:

```bash
npm run backup
```

This will:
1. Prompt you for an optional note.
2. Create a timestamped ZIP file in the `backups/` directory (e.g., `backup_YYYY-MM-DDTHH-mm-ss_note.zip`).

### Restore

To restore your content from a previous backup:

```bash
npm run restore
```

This will:
1. List available backups from the `backups/` directory.
2. Ask if you want to create a safety backup of your current content.
3. Overwrite the `pages/` directory with the contents of the selected backup.

## Project Structure

- `app.js`: The main Express server logic and rendering engine.
- `pages/`: The directory where your Markdown files are stored.
- `package.json`: Project dependencies and configuration.
- `Dockerfile` & `docker-compose.yml`: For containerized deployment.
