# "Render" Application - Overview & Development Plan

## Architecture & Technologies
- **Runtime**: Node.js (ES Modules)
- **Server**: `express` (handling routes, middleware, and admin auth)
- **Templating**: `hbs` (Handlebars) for dynamic HTML rendering
- **Markdown Engine**: `marked` with `marked-highlight`, `marked-gfm-heading-id`, and custom anchor hooks
- **Metadata**: `gray-matter` for parsing front-matter (title, description, date, tags, priority)
- **Caching**: `redis` for high-performance caching of the dashboard index and rendered pages
- **Styling**: `github-markdown-css` + `Tailwind CSS` + `Vite` for asset bundling
- **Visuals**: `satori` and `@resvg/resvg-js` for dynamic OG image generation
- **Maintenance**: `adm-zip` and `archiver` for automated content backups

## Project Structure
```text
render/
├── app.js            # Main server logic and routes
├── package.json      # Dependencies and maintenance scripts
├── AGENTS.md         # Project overview and AI instructions
├── pages/            # Markdown content storage
├── views/            # Handlebars templates (layout, index, page, admin)
├── public/           # Static assets (fonts, icons, styles)
│   └── dist/         # Vite-compiled production assets
├── scripts/          # Utility scripts (backup, restore, cache-clear)
├── src/              # Frontend source files (CSS/JS for Vite)
├── Dockerfile        # Containerization config
└── docker-compose.yml # Service orchestration (App + Redis)
```

## Core Features

1.  **Dynamic Dashboard (`/`)**:
    - Scans `pages/` for `.md` files and extracts metadata.
    - **Multi-level Sorting**: Sorts by `priority` (top-tier) then by `date` or `title`.
    - **Search**: Full-text search across titles and raw content.
    - **Caching**: Redis-backed index for sub-millisecond loads.

2.  **Advanced Page Rendering (`/:slug`)**:
    - Converts Markdown to HTML with GitHub-flavored styling.
    - **Syntax Highlighting**: Powered by `highlight.js`.
    - **Interactivity**: Automatic anchor links on headings and responsive table wrappers.
    - **SEO & Social**: Dynamic OG images (`/:slug/og.png`) generated on-the-fly.

3.  **Admin & Maintenance**:
    - **Cache Management**: `/__admin/cache` for clearing index or page caches.
    - **Backups**: Automated ZIP-based backup/restore system for the `pages/` directory.
    - **Basic Auth**: Protected admin routes via environment variables.

## Verification & Workflow
- **Development**: `npm run dev` (Vite build + Nodemon)
- **Production**: `npm start` (Standard Node.js runtime)
- **Port**: Defaulting to `9901`
- **Portals**:
    - Dashboard: `http://localhost:9901`
    - Admin: `http://localhost:9901/__admin/cache`

## Available Skills
- **pages-backup**: Backup the pages directory into a timestamped ZIP file.
- **pages-restore**: Restore the pages directory from a previously created ZIP backup.
