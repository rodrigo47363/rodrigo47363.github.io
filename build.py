import os
import json
import re
import hashlib
import html
import urllib.parse
from datetime import datetime

PORTFOLIO_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(PORTFOLIO_DIR, 'content')
TEMPLATES_DIR = os.path.join(PORTFOLIO_DIR, 'templates')
POSTS_DIR = os.path.join(PORTFOLIO_DIR, 'posts')
PAGES_DIR = os.path.join(PORTFOLIO_DIR, 'pages')

MONTHS = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

def parse_date(date_str):
    # Parses strings like "22 Julio, 2026" or "Julio 2026"
    date_str = date_str.lower().replace(',', '')
    parts = date_str.split()
    
    day = 1
    month = 1
    year = 1970
    
    if len(parts) >= 3:
        try:
            day = int(parts[0])
            month = MONTHS.get(parts[1], 1)
            year = int(parts[2])
        except:
            pass
    elif len(parts) == 2:
        month = MONTHS.get(parts[0], 1)
        try:
            year = int(parts[1])
        except:
            pass
            
    return datetime(year, month, day)

def calculate_reading_time(html_content):
    text = re.sub(r'<[^>]+>', ' ', html_content)
    words = len(text.split())
    minutes = max(1, round(words / 200))
    return minutes

def load_posts():
    posts = []
    for filename in os.listdir(CONTENT_DIR):
        if filename.endswith('.json'):
            with open(os.path.join(CONTENT_DIR, filename), 'r', encoding='utf-8') as f:
                data = json.load(f)
                data['parsed_date'] = parse_date(data['date'])
                content = data.get('content', '') or data.get('raw_body', '')
                data['reading_time'] = calculate_reading_time(content)
                posts.append(data)
    
    # Sort chronological (oldest first for linking next/prev properly)
    posts.sort(key=lambda x: x['parsed_date'])
    return posts

def generate_related_posts(current_post, all_posts):
    # Simple strategy: get 2 posts with similar tags
    related = []
    for p in all_posts:
        if p['filename'] == current_post['filename']:
            continue
        common_tags = set(current_post['tags']).intersection(set(p['tags']))
        if common_tags:
            related.append(p)
    
    # Fallback to random/latest if none found
    if not related:
        related = [p for p in all_posts if p['filename'] != current_post['filename']]
        
    related = related[:2]
    
    html = ""
    for r in related:
        tag_str = r['tags'][0].capitalize() if r['tags'] else 'Tech'
        html += f'''
        <a href="../posts/{r['filename']}" style="text-decoration: none; color: inherit; display: block;">
            <div class="glass" style="padding: 20px; border-radius: 12px; transition: transform 0.3s; height: 100%;">
                <span style="font-size: 0.8em; opacity: 0.7;">{tag_str} • ⏱️ {r['reading_time']} min</span>
                <h4 style="margin: 10px 0; font-size: 1.1em; color: var(--accent-color);">{r['title']}</h4>
            </div>
        </a>
        '''
    return html

def build_site():
    print("Iniciando build...")
    posts = load_posts()
    
    # Load templates
    with open(os.path.join(TEMPLATES_DIR, 'base_layout.html'), 'r', encoding='utf-8') as f:
        base_template = f.read()
    with open(os.path.join(TEMPLATES_DIR, 'post_layout.html'), 'r', encoding='utf-8') as f:
        post_template = f.read()
    with open(os.path.join(TEMPLATES_DIR, 'blog_layout.html'), 'r', encoding='utf-8') as f:
        blog_template = f.read()

    # 1. GENERATE POSTS
    for i, post in enumerate(posts):
        prev_post = posts[i-1] if i > 0 else None
        next_post = posts[i+1] if i < len(posts)-1 else None
        
        prev_link = f'<a href="../posts/{prev_post["filename"]}" class="nav-btn">← Anterior</a>' if prev_post else ''
        next_link = f'<a href="../posts/{next_post["filename"]}" class="nav-btn">Siguiente →</a>' if next_post else ''
        
        related_html = generate_related_posts(post, posts)
        og_image = post.get('og_image', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000')
        
        # Check if it has a custom raw_body
        if 'raw_body' in post:
            final_content = post['raw_body']
        else:
            final_content = post_template \
                .replace('{{title}}', post['title']) \
                .replace('{{date}}', post['date']) \
                .replace('{{reading_time}}', str(post['reading_time'])) \
                .replace('{{post_content}}', post['content']) \
                .replace('{{prev_post_link}}', prev_link) \
                .replace('{{next_post_link}}', next_link) \
                .replace('{{related_posts}}', related_html) \
                .replace('{{base_path}}', '../')
                
        canonical_url = f"https://rodrigo47363.github.io/posts/{post['filename']}"
        full_html = base_template \
            .replace('{{title}}', post['title']) \
            .replace('{{description}}', post['excerpt']) \
            .replace('{{og_image}}', og_image) \
            .replace('{{og_type}}', 'article') \
            .replace('{{canonical_url}}', canonical_url) \
            .replace('{{content}}', final_content) \
            .replace('{{base_path}}', '../') \
            .replace('{{extra_head}}', '') \
            .replace('{{blog_active}}', '')
            
        out_path = os.path.join(POSTS_DIR, post['filename'])
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(full_html)
            
    # 2. GENERATE BLOG INDEX
    # Reverse posts for feed (newest first)
    posts_feed = list(reversed(posts))
    cards_html = ""
    for idx, post in enumerate(posts_feed):
        tags_html = ""
        for tag in post['tags']:
            tag_quoted = urllib.parse.quote(tag)
            tags_html += f'<a href="blog.html?tag={tag_quoted}" class="blog-tag" style="text-decoration: none;" aria-label="Filtrar por etiqueta {tag}">{tag.capitalize()}</a> '
            
        hero_class = ' hero' if idx == 0 else ''
        
        tags_lower = [t.lower() for t in post.get('tags', [])]
        
        # Determinar icono y gradiente dinámicamente usando hash del título para variedad determinista
        def get_variation(options, seed_text):
            idx = int(hashlib.md5(seed_text.encode('utf-8')).hexdigest(), 16) % len(options)
            return options[idx]

        badge_html = ''
        if post.get('badge'):
            badge_html = f'''
                <div class="hero-chip-badge">
                    <span class="chip-status-dot"></span>
                    <span class="chip-label">{post['badge']}</span>
                </div>'''
        elif idx == 0:
            badge_html = '''
                <div class="hero-chip-badge">
                    <span class="chip-status-dot"></span>
                    <span class="chip-label">ARTÍCULO DESTACADO</span>
                </div>'''

        if post.get('card_image'):
            icon = post.get('icon', '')
            icon_html = f'\n                <span class="card-icon">{icon}</span>' if icon else ''
            visual_html = f'''
            <div class="card-visual" aria-hidden="true" style="background: linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.65)), url('{post['card_image']}') center/cover no-repeat;">{badge_html}{icon_html}
            </div>'''
        else:
            if post.get('icon'):
                icon = post['icon']
                gradient = "linear-gradient(135deg, #141e30, #243b55)"
            elif "rust" in tags_lower or "hardware" in tags_lower:
                icon = get_variation(["⚡", "🦀", "💻", "🔬", "🛡️"], post['title'])
                gradient = get_variation([
                    "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
                    "linear-gradient(135deg, #141e30, #243b55)",
                    "linear-gradient(135deg, #1f1c2c, #928dab)"
                ], post['title'])
            elif "linux" in tags_lower:
                icon = get_variation(["🐧", "💻", "⚙️", "🚀", "🛡️"], post['title'])
                gradient = get_variation([
                    "linear-gradient(135deg, #000000, #434343)",
                    "linear-gradient(135deg, #141e30, #243b55)",
                    "linear-gradient(135deg, #232526, #414345)"
                ], post['title'])
            elif "htb" in tags_lower:
                icon = get_variation(["🟩", "🏴‍☠️", "🎯", "👾", "🔓"], post['title'])
                gradient = get_variation([
                    "linear-gradient(135deg, #111827, #10b981)",
                    "linear-gradient(135deg, #0f2027, #2c5364)",
                    "linear-gradient(135deg, #000000, #0f9b0f)"
                ], post['title'])
            elif "python" in tags_lower:
                icon = get_variation(["🐍", "⌨️", "📊", "🤖", "🧠"], post['title'])
                gradient = get_variation([
                    "linear-gradient(135deg, #f59e0b, #3b82f6)",
                    "linear-gradient(135deg, #1e3c72, #2a5298)",
                    "linear-gradient(135deg, #2c3e50, #fd746c)"
                ], post['title'])
            elif "osint" in tags_lower:
                icon = get_variation(["🔍", "👁️", "🕵️", "🌐", "📡"], post['title'])
                gradient = get_variation([
                    "linear-gradient(135deg, #ef4444, #b91c1c)",
                    "linear-gradient(135deg, #870000, #190a05)",
                    "linear-gradient(135deg, #cb2d3e, #ef473a)"
                ], post['title'])
            else:
                icon = get_variation(["📄", "💡", "📝", "✨", "📌"], post['title'])
                gradient = get_variation([
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))",
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))",
                    "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(239, 68, 68, 0.2))"
                ], post['title'])
                
            visual_html = f'''
            <div class="card-visual" aria-hidden="true" style="background: {gradient};">
                <span class="card-icon">{icon}</span>
            </div>'''
            
        escaped_title = html.escape(post['title'], quote=True)
        escaped_excerpt = html.escape(post['excerpt'], quote=True)
        tags_joined = ','.join(post['tags']).lower()
        iso_date = post['parsed_date'].strftime('%Y-%m-%d')
        
        cards_html += f'''
        <article class="blog-card glass{hero_class}" data-title="{escaped_title}" data-excerpt="{escaped_excerpt}" data-tags="{tags_joined}">
            {visual_html}
            <div class="card-content">
                <div class="blog-meta">
                    <span class="blog-meta-item">
                        <svg class="meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <time datetime="{iso_date}" class="blog-date">{post['date']}</time>
                    </span>
                    <span class="meta-sep" aria-hidden="true">•</span>
                    <span class="blog-meta-item reading-time" aria-label="Tiempo de lectura estimado: {post['reading_time']} minutos">
                        <svg class="meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {post['reading_time']} min de lectura
                    </span>
                </div>
                <h3 class="blog-title"><a href="../posts/{post['filename']}" class="blog-title-link">{post['title']}</a></h3>
                <p class="blog-excerpt">{post['excerpt']}</p>
                <div class="blog-tags" aria-label="Etiquetas del artículo">{tags_html}</div>
                <div class="card-footer">
                    <a href="../posts/{post['filename']}" class="blog-read-more" aria-label="Leer artículo completo: {escaped_title}">
                        <span>Leer artículo</span>
                        <svg class="arrow-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                </div>
            </div>
        </article>
        '''
        
    blog_content = blog_template.replace('{{blog_grid}}', cards_html)

    # Schema.org JSON-LD estructurado para SEO y enriquecimiento de motores de búsqueda
    blog_schema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Blog de Rodrigo47363",
        "description": "Artículos técnicos sobre seguridad ofensiva, reversing, Linux, Bash y desarrollo de herramientas.",
        "url": "https://rodrigo47363.github.io/pages/blog.html",
        "author": {
            "@type": "Person",
            "name": "Rodrigo47363",
            "url": "https://rodrigo47363.github.io/"
        },
        "blogPost": [
            {
                "@type": "BlogPosting",
                "headline": p["title"],
                "description": p["excerpt"],
                "datePublished": p["parsed_date"].strftime("%Y-%m-%d"),
                "url": f"https://rodrigo47363.github.io/posts/{p['filename']}",
                "keywords": p.get("tags", [])
            } for p in posts_feed
        ]
    }
    schema_script = f'    <script type="application/ld+json">\n{json.dumps(blog_schema, ensure_ascii=False, indent=4)}\n    </script>'

    full_blog_html = base_template \
        .replace('{{title}}', 'Blog') \
        .replace('{{description}}', 'Artículos y writeups sobre seguridad ofensiva, reversing, Linux, Bash y desarrollo de herramientas.') \
        .replace('{{og_image}}', 'https://rodrigo47363.github.io/img/acersense_gui_dashboard.png') \
        .replace('{{og_type}}', 'website') \
        .replace('{{canonical_url}}', 'https://rodrigo47363.github.io/pages/blog.html') \
        .replace('{{content}}', f'<main id="main-content" class="blog-main-container">\n{blog_content}\n</main>') \
        .replace('{{base_path}}', '../') \
        .replace('{{extra_head}}', schema_script) \
        .replace('{{blog_active}}', 'style="color: var(--accent-color);" aria-current="page"')
        
    with open(os.path.join(PAGES_DIR, 'blog.html'), 'w', encoding='utf-8') as f:
        f.write(full_blog_html)
        
    # 3. GENERATE RSS
    rss_items = ""
    for post in posts_feed:
        # RFC-822 date
        pub_date = post['parsed_date'].strftime("%a, %d %b %Y %H:%M:%S GMT")
        rss_items += f'''
        <item>
            <title><![CDATA[{post['title']}]]></title>
            <link>https://rodrigo47363.github.io/posts/{post['filename']}</link>
            <description><![CDATA[{post['excerpt']}]]></description>
            <pubDate>{pub_date}</pubDate>
        </item>
        '''
        
    rss_feed = f'''<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>Blog de Rodrigo47363</title>
    <link>https://rodrigo47363.github.io/</link>
    <description>Tutoriales y recursos sobre ciberseguridad y desarrollo</description>
    {rss_items}
</channel>
</rss>
'''
    with open(os.path.join(PORTFOLIO_DIR, 'rss.xml'), 'w', encoding='utf-8') as f:
        f.write(rss_feed)
        
    # 4. GENERATE SITEMAP (Excluyendo páginas de error como 404.html)
    sitemap_items = ""
    root_pages = [
        "index.html",
        "pages/acerca-de.html",
        "pages/contacto.html",
        "pages/repositorios.html",
        "pages/blog.html"
    ]
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    for page in root_pages:
        sitemap_items += f'''
    <url>
        <loc>https://rodrigo47363.github.io/{page}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>{"1.0" if page == "index.html" else "0.8"}</priority>
    </url>'''
    
    for post in posts:
        post_date = post['parsed_date'].strftime("%Y-%m-%d")
        sitemap_items += f'''
    <url>
        <loc>https://rodrigo47363.github.io/posts/{post['filename']}</loc>
        <lastmod>{post_date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>'''
    
    sitemap_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sitemap_items}
</urlset>'''

    with open(os.path.join(PORTFOLIO_DIR, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)

    # 5. GENERATE DYNAMIC GLOBAL SEARCH INDEX
    search_index = [
        {"title": "🏠 Inicio", "url": "index.html"},
        {"title": "📝 Blog y Artículos", "url": "pages/blog.html"},
        {"title": "👨‍💻 Acerca de Mí", "url": "pages/acerca-de.html"},
        {"title": "📦 Repositorios GitHub", "url": "pages/repositorios.html"},
        {"title": "📬 Contacto", "url": "pages/contacto.html"},
        {"title": "📄 Descargar CV", "url": "cv.pdf"}
    ]
    for p in posts_feed:
        search_index.append({
            "title": f"📄 {p['title']}",
            "url": f"posts/{p['filename']}",
            "tags": p.get("tags", [])
        })

    data_dir = os.path.join(PORTFOLIO_DIR, 'data')
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, 'search_index.json'), 'w', encoding='utf-8') as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)
        
    print("Build completado con éxito. 🎉")

if __name__ == '__main__':
    build_site()
