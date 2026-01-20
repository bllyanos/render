const express = require('express');
const path = require('path');
const fs = require('fs');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const { gfmHeadingId } = require('marked-gfm-heading-id');
const hljs = require('highlight.js');
const matter = require('gray-matter');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const { createClient } = require('redis');
const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 9901;

// Redis Setup
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis', err);
    }
})();

// Admin Auth Middleware
const adminAuth = basicAuth({
    users: {
        [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'password'
    },
    challenge: true,
    realm: 'RenderAdmin'
});

// Load font for OG images
const fontPath = path.join(__dirname, 'public/fonts/JetBrainsMono-Bold.ttf');
const fontData = fs.existsSync(fontPath) ? fs.readFileSync(fontPath) : null;

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

const hbs = require('hbs');
const pinColors = ['pin-teal', 'pin-orange', 'pin-lime', 'pin-yellow', 'pin-pink'];
const hexColors = ['#2dd4bf', '#fb923c', '#bef264', '#fde047', '#f472b6'];

function getTagHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

hbs.registerHelper('tagColor', function(tag) {
    const index = getTagHash(tag) % pinColors.length;
    return pinColors[index];
});

// Middleware to set base URL for OG tags
app.use((req, res, next) => {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    req.baseUrl = `${protocol}://${host}`;
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
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
                description: data.description || '',
                date: data.date ? new Date(data.date).toLocaleDateString() : 'N/A',
                tags: data.tags || [],
                rawContent: content // for searching
            };
        });
}

// Admin Routes
app.use('/__admin', adminAuth);

app.get('/__admin/cache', (req, res) => {
    res.render('admin-cache', {
        title: 'Cache Admin',
        baseUrl: req.baseUrl,
        ogUrl: `${req.baseUrl}/__admin/cache`,
        description: 'Manage application cache'
    });
});

app.post('/__admin/cache/clear-index', async (req, res) => {
    try {
        await redisClient.del('render:index');
        res.redirect('/__admin/cache');
    } catch (err) {
        res.status(500).send('Error clearing cache: ' + err.message);
    }
});

app.post('/__admin/cache/clear-pages', async (req, res) => {
    try {
        // Scan for all page keys
        let cursor = 0;
        do {
            const reply = await redisClient.scan(cursor, { MATCH: 'render:page:*', COUNT: 100 });
            cursor = reply.cursor;
            const keys = reply.keys;
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } while (cursor !== 0);
        
        res.redirect('/__admin/cache');
    } catch (err) {
        res.status(500).send('Error clearing cache: ' + err.message);
    }
});


// Dashboard Route
app.get('/', async (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    let pages;

    try {
        const cachedIndex = await redisClient.get('render:index');
        if (cachedIndex) {
            console.log('Cache hit for index');
            pages = JSON.parse(cachedIndex);
        } else {
            console.log('Cache miss for index');
            pages = getPages();
            // Cache for 1 hour
            await redisClient.set('render:index', JSON.stringify(pages), { EX: 3600 });
        }
    } catch (err) {
        console.error('Redis error:', err);
        pages = getPages();
    }

    if (query) {
        pages = pages.filter(page => 
            page.title.toLowerCase().includes(query) || 
            page.rawContent.toLowerCase().includes(query)
        );
    }


    res.render('index', {
        title: 'Dashboard',
        pages,
        query: req.query.q,
        baseUrl: req.baseUrl,
        ogUrl: req.baseUrl,
        ogImage: `${req.baseUrl}/og-main.png`, // I should probably create a main OG image too or just use a default
        description: 'A lightweight Markdown renderer with a clean aesthetic.'
    });
});

// OG Image Route
app.get('/og-main.png', async (req, res) => {
    try {
        const svg = await satori(
            {
                type: 'div',
                props: {
                    children: [
                        {
                            type: 'div',
                            props: {
                                children: [
                                    {
                                        type: 'div',
                                        props: {
                                            children: 'RENDER',
                                            style: {
                                                fontSize: 40,
                                                fontWeight: 'bold',
                                                marginBottom: 40,
                                                color: '#0f766e',
                                                letterSpacing: '0.2em'
                                            }
                                        }
                                    },
                                    {
                                        type: 'div',
                                        props: {
                                            children: 'Markdown Engine',
                                            style: {
                                                fontSize: 80,
                                                fontWeight: 'bold',
                                                marginBottom: 20,
                                                lineHeight: 1.1,
                                                color: '#1c1917'
                                            }
                                        }
                                    },
                                    {
                                        type: 'div',
                                        props: {
                                            children: 'Clean. Minimal. Neubrutalist.',
                                            style: {
                                                fontSize: 30,
                                                color: '#c2410c',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em'
                                            }
                                        }
                                    }
                                ],
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '60px',
                                    backgroundColor: '#fafaf9',
                                    width: '100%',
                                    height: '100%',
                                    border: '12px solid #1c1917',
                                    borderRadius: '24px',
                                    boxShadow: '20px 20px 0px #1c1917'
                                }
                            }
                        }
                    ],
                    style: {
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#fff',
                        padding: '40px',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                }
            },
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'JetBrains Mono',
                        data: fontData,
                        weight: 700,
                        style: 'normal',
                    },
                ],
            }
        );

        const resvg = new Resvg(svg, {
            background: 'rgba(255, 255, 255, 1)',
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        res.setHeader('Content-Type', 'image/png');
        res.send(pngBuffer);
    } catch (err) {
        console.error('Main OG Image generation error:', err);
        res.status(500).send('Error generating image');
    }
});

// OG Image Route
// OG Image Route
app.get('/:slug/og.png', async (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(PAGES_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Not Found');
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    const title = data.title || slug;
    const description = data.description || '';
    const tags = data.tags || [];

    const hexColors = ['#2dd4bf', '#fb923c', '#bef264', '#fde047', '#f472b6'];

    try {
        const svg = await satori(
            {
                type: 'div',
                props: {
                    children: [
                        {
                            type: 'div',
                            props: {
                                children: [
                                    {
                                        type: 'div',
                                        props: {
                                            children: [
                                                {
                                                    type: 'div',
                                                    props: {
                                                        children: 'RENDER',
                                                        style: {
                                                            fontSize: 24,
                                                            fontWeight: 'bold',
                                                            color: '#0f766e',
                                                            letterSpacing: '0.1em'
                                                        }
                                                    }
                                                },
                                                {
                                                    type: 'div',
                                                    props: {
                                                        children: tags.map((tag) => {
                                                            const colorIndex = getTagHash(tag) % hexColors.length;
                                                            return {
                                                                type: 'div',
                                                                props: {
                                                                    children: tag,
                                                                    style: {
                                                                        backgroundColor: hexColors[colorIndex],
                                                                        border: '3px solid #1c1917',
                                                                        borderRadius: '8px',
                                                                        padding: '4px 12px',
                                                                        fontSize: 18,
                                                                        fontWeight: 'bold',
                                                                        marginLeft: 12,
                                                                        boxShadow: '3px 3px 0px #1c1917',
                                                                        textTransform: 'uppercase'
                                                                    }
                                                                }
                                                            };
                                                        }),
                                                        style: {
                                                            display: 'flex'
                                                        }
                                                    }
                                                }
                                            ],
                                            style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                width: '100%',
                                                marginBottom: 40
                                            }
                                        }
                                    },
                                    {
                                        type: 'div',
                                        props: {
                                            children: title,
                                            style: {
                                                fontSize: 70,
                                                fontWeight: 'bold',
                                                marginBottom: description ? 24 : 0,
                                                lineHeight: 1.1,
                                                color: '#1c1917'
                                            }
                                        }
                                    },
                                    description ? {
                                        type: 'div',
                                        props: {
                                            children: description,
                                            style: {
                                                fontSize: 32,
                                                color: '#444',
                                                lineHeight: 1.4,
                                                maxWidth: '900px'
                                            }
                                        }
                                    } : null
                                ].filter(Boolean),
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '60px',
                                    backgroundColor: '#fafaf9',
                                    width: '100%',
                                    height: '100%',
                                    border: '10px solid #1c1917',
                                    borderRadius: '24px',
                                    boxShadow: '20px 20px 0px #1c1917'
                                }
                            }
                        }
                    ],
                    style: {
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#fff',
                        padding: '40px',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                }
            },
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'JetBrains Mono',
                        data: fontData,
                        weight: 700,
                        style: 'normal',
                    },
                ],
            }
        );

        const resvg = new Resvg(svg, {
            background: 'rgba(255, 255, 255, 1)',
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        res.setHeader('Content-Type', 'image/png');
        res.send(pngBuffer);
    } catch (err) {
        console.error('OG Image generation error:', err);
        res.status(500).send('Error generating image');
    }
});
// Page Route
app.get('/:slug', async (req, res) => {
    const slug = req.params.slug;
    
    // Try cache first
    try {
        const cachedPage = await redisClient.get(`render:page:${slug}`);
        if (cachedPage) {
            console.log(`Cache hit for page: ${slug}`);
            return res.send(cachedPage);
        }
        console.log(`Cache miss for page: ${slug}`);
    } catch (err) {
        console.error('Redis error:', err);
    }

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
        date: data.date ? new Date(data.date).toLocaleDateString() : null,
        tags: data.tags || [],
        description: data.description || '',
        content: htmlContent,
        baseUrl: req.baseUrl,
        ogUrl: `${req.baseUrl}/${slug}`,
        ogImage: `${req.baseUrl}/${slug}/og.png`
    }, async (err, html) => {
        if (err) {
            return res.status(500).send('Error rendering page');
        }
        
        try {
            // Cache for 24 hours
            await redisClient.set(`render:page:${slug}`, html, { EX: 86400 });
        } catch (cacheErr) {
            console.error('Failed to cache page:', cacheErr);
        }
        
        res.send(html);
    });
});


app.listen(port, () => {
    console.log(`Render app listening at http://localhost:${port}`);
});
