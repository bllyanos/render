# Plan for "Render" Application

## Architecture & Technologies
- **Runtime**: Node.js
- **Server**: `express` (handling routes and requests)
- **Markdown Engine**: `marked` (for standard rendering)
- **Metadata**: `gray-matter` (parsing front-matter like titles/dates)
- **Styling**: `github-markdown-css` (clean, familiar visual style)

## Proposed File Structure
```text
render/
├── app.js            # Main server logic
├── package.json      # Dependencies
├── AGENTS.md         # This plan file
└── pages/            # Content folder
    ├── news.md       # Sample file with front-matter
    └── about.md      # Sample file
```

## Implementation Steps

1.  **Project Setup**: 
    - Install `express`, `marked`, `gray-matter`, and `github-markdown-css`.
    - Ensure `package.json` is configured correctly.

2.  **Content Creation**: 
    - Create the `pages` directory.
    - Populate it with `news.md` and `about.md`.
    - Include sample front-matter (e.g., `--- title: News ---`) to demonstrate metadata usage.

3.  **Server Logic (`app.js`)**:
    - **Dashboard (`/`)**: 
        - Scan `pages/` directory for `.md` files.
        - Parse front-matter to get metadata (title, date, etc.).
        - Implement **Server-side Search**: Filter results based on the `?q=` query parameter against filenames or metadata.
        - Render a list of matching pages with links to their rendered views.
    - **Page Renderer (`/:slug`)**:
        - Read the corresponding markdown file based on the slug.
        - Convert markdown to HTML using `marked`.
        - Wrap in a HTML template including the GitHub-style CSS and navigation links (Home, Search).
        - Handle 404s for missing files.

4.  **Verification**: 
    - Start the server on port 9901.
    - Verify the dashboard lists files.
    - Verify search functionality works via `?q=`.
    - Verify markdown rendering and styling.
