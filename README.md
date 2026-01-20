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

## Project Structure

- `app.js`: The main Express server logic and rendering engine.
- `pages/`: The directory where your Markdown files are stored.
- `package.json`: Project dependencies and configuration.
- `Dockerfile` & `docker-compose.yml`: For containerized deployment.
