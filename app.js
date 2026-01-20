const express = require('express');
const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const matter = require('gray-matter');

const app = express();
const port = 9901;
const PAGES_DIR = path.join(__dirname, 'pages');

// Initialize Marked with highlight.js
const marked = new Marked(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);

// Serve CSS from node_modules
app.use('/css/github-markdown', express.static(path.join(__dirname, 'node_modules/github-markdown-css')));
app.use('/css/highlight', express.static(path.join(__dirname, 'node_modules/highlight.js/styles')));

// Date formatter
const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(date));
};

// Simple HTML wrapper for styling and navigation
const wrapHtml = (content, title = 'Render') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/css/github-markdown/github-markdown.css">
    <link rel="stylesheet" href="/css/highlight/github.css">
    <style>
        body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
        }
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
        }
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
        nav {
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        nav a {
            margin-right: 15px;
            text-decoration: none;
            color: #0366d6;
        }
        .search-box {
            margin-bottom: 20px;
        }
    </style>
</head>
<body class="markdown-body">
    <nav>
        <a href="/">Home</a>
    </nav>
    ${content}
</body>
</html>
`;

// Dashboard route
app.get('/', (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    
    fs.readdir(PAGES_DIR, (err, files) => {
        if (err) return res.status(500).send('Error reading pages directory');

        const mdFiles = files.filter(f => f.endsWith('.md'));
        const pages = mdFiles.map(file => {
            const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
            const { data } = matter(content);
            return {
                slug: file.replace('.md', ''),
                title: data.title || file,
                date: data.date || '',
                content: content.toLowerCase()
            };
        });

        const filteredPages = pages.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.slug.toLowerCase().includes(query) ||
            p.content.includes(query)
        );

        let htmlContent = `
            <h1>Render Dashboard</h1>
            <div class="search-box">
                <form action="/" method="GET">
                    <input type="text" name="q" placeholder="Search pages..." value="${req.query.q || ''}">
                    <button type="submit">Search</button>
                </form>
            </div>
            <ul>
                ${filteredPages.map(p => `
                    <li>
                        <a href="/${p.slug}">${p.title}</a> ${p.date ? `<small>(${formatDate(p.date)})</small>` : ''}
                    </li>
                `).join('')}
            </ul>
        `;

        if (filteredPages.length === 0) {
            htmlContent += '<p>No pages found matching your search.</p>';
        }

        res.send(wrapHtml(htmlContent));
    });
});

// Page renderer route
app.get('/:slug', (req, res) => {
    const filePath = path.join(PAGES_DIR, `${req.params.slug}.md`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send(wrapHtml('<h1>404 Page Not Found</h1>'));
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    const htmlBody = marked.parse(content);
    
    res.send(wrapHtml(htmlBody, data.title));
});

app.listen(port, () => {
    console.log(`Render app listening at http://localhost:${port}`);
});
