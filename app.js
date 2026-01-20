const express = require('express');
const path = require('path');
const fs = require('fs');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const { gfmHeadingId } = require('marked-gfm-heading-id');
const hljs = require('highlight.js');
const matter = require('gray-matter');

const app = express();
const port = 9901;

// Configure Marked with highlighting and heading IDs
const marked = new Marked(
  markedHighlight({
    emptyCheck: true,
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      try {
        return hljs.highlight(code, { language }).value;
      } catch (err) {
        console.error('Highlight error:', err);
        return code;
      }
    }
  })
);

marked.use(gfmHeadingId());

// Inject anchor links into headings after they are rendered with IDs
marked.use({
  hooks: {
    postprocess(html) {
      // Wrap the entire heading content in a link
      return html.replace(/<h([1-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g, 
        '<h$1 id="$2"><a class="heading-link" href="#$2"><span class="anchor-icon">#</span>$3</a></h$1>');
    }
  }
});

// Setup Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/hljs', express.static(path.join(__dirname, 'node_modules/highlight.js')));

const PAGES_DIR = path.join(__dirname, 'pages');

// Helper to get all pages with metadata
function getPages() {
    if (!fs.existsSync(PAGES_DIR)) return [];
    
    return fs.readdirSync(PAGES_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const filePath = path.join(PAGES_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(content);
            return {
                slug: file.replace('.md', ''),
                title: data.title || file,
                date: data.date ? new Date(data.date).toLocaleDateString() : 'N/A',
                tags: data.tags || [],
                rawContent: content // for searching
            };
        });
}

// Dashboard Route
app.get('/', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    let pages = getPages();

    if (query) {
        pages = pages.filter(page => 
            page.title.toLowerCase().includes(query) || 
            page.rawContent.toLowerCase().includes(query)
        );
    }

    res.render('index', {
        title: 'Dashboard',
        pages,
        query: req.query.q
    });
});

// Page Route
app.get('/:slug', (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(PAGES_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).render('page', {
            title: '404 Not Found',
            content: '<h1>404 - Page Not Found</h1><p>The requested page does not exist.</p>'
        });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    let htmlContent = marked.parse(content);

    // Wrap tables in a div for horizontal scrolling
    htmlContent = htmlContent.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');

    res.render('page', {
        title: data.title || slug,
        content: htmlContent
    });
});

app.listen(port, () => {
    console.log(`Render app listening at http://localhost:${port}`);
});
