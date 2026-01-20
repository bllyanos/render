# Implementation Plan - Render

- [x] **Project Setup**
    - [x] Install dependencies: `express`, `marked`, `gray-matter`, `github-markdown-css`
- [x] **Content Creation**
    - [x] Create `pages/` directory
    - [x] Add `news.md` with front-matter
    - [x] Add `about.md` with front-matter
- [x] **Server Implementation (`app.js`)**
    - [x] Set up Express server
    - [x] Implement Dashboard (`/`) with file listing and metadata parsing
    - [x] Implement Search functionality via `?q=`
    - [x] Implement Page Renderer (`/:slug`) with Markdown to HTML conversion
    - [x] Apply `github-markdown-css` for styling
- [x] **Verification**
    - [x] Test file listing on dashboard
    - [x] Test search filtering
    - [x] Test markdown rendering and front-matter extraction

## Bonus Features
- [x] **Syntax Highlighting**
    - [x] Integrate `highlight.js` with `marked`
    - [x] Serve `highlight.js` CSS locally
- [x] **Improved UX**
    - [x] Format dates on dashboard (e.g., "January 20, 2026")
    - [x] Self-contained assets (no CDNs)

## Containerization
- [x] **Docker Setup**
    - [x] Create `Dockerfile`
    - [x] Create `docker-compose.yml` with volumes for `pages/`
    - [x] Verify container build and execution
