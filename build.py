import os
import json
import re
import hashlib
from datetime import datetime

PORTFOLIO_DIR = '/home/rodrigo47363/Workspace/Desarrollo/Proyectos_github/portafolio_final'
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

def load_posts():
    posts = []
    for filename in os.listdir(CONTENT_DIR):
        if filename.endswith('.json'):
            with open(os.path.join(CONTENT_DIR, filename), 'r', encoding='utf-8') as f:
                data = json.load(f)
                data['parsed_date'] = parse_date(data['date'])
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
                <span style="font-size: 0.8em; opacity: 0.7;">{tag_str}</span>
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
        
        # Check if it has a custom raw_body
        if 'raw_body' in post:
            final_content = post['raw_body']
        else:
            final_content = post_template \
                .replace('{{title}}', post['title']) \
                .replace('{{date}}', post['date']) \
                .replace('{{post_content}}', post['content']) \
                .replace('{{prev_post_link}}', prev_link) \
                .replace('{{next_post_link}}', next_link) \
                .replace('{{related_posts}}', related_html) \
                .replace('{{base_path}}', '../')
                
        full_html = base_template \
            .replace('{{title}}', post['title']) \
            .replace('{{description}}', post['excerpt']) \
            .replace('{{og_image}}', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000') \
            .replace('{{og_type}}', 'article') \
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
    for post in posts_feed:
        tags_html = ""
        for tag in post['tags']:
            tags_html += f'<a href="blog.html?tag={tag}" class="blog-tag" style="text-decoration: none;">{tag.capitalize()}</a> '
            
        hero_class = ' hero' if post.get('tags') and 'osint' in post.get('tags') else ''
        
        # Determinar icono y gradiente dinámicamente usando hash del título para variedad determinista
        def get_variation(options, seed_text):
            idx = int(hashlib.md5(seed_text.encode('utf-8')).hexdigest(), 16) % len(options)
            return options[idx]

        tags_lower = [t.lower() for t in post.get('tags', [])]
        
        if "linux" in tags_lower:
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
            
        cards_html += f'''
        <article class="blog-card glass{hero_class}" data-title="{post['title']}" data-tags="{','.join(post['tags'])}">
            <div class="card-visual" style="background: {gradient};">
                <span class="card-icon">{icon}</span>
            </div>
            <div class="card-content">
                <div class="blog-meta">
                    <span class="blog-date">{post['date']}</span>
                </div>
                <h3 class="blog-title">{post['title']}</h3>
                <p class="blog-excerpt">{post['excerpt']}</p>
                <div class="blog-tags">{tags_html}</div>
                <a href="../posts/{post['filename']}" class="blog-read-more">Leer artículo</a>
            </div>
        </article>
        '''
        
    blog_content = blog_template.replace('{{blog_grid}}', cards_html)
    full_blog_html = base_template \
        .replace('{{title}}', 'Blog') \
        .replace('{{description}}', 'Artículos sobre tecnología y ciberseguridad.') \
        .replace('{{og_image}}', '') \
        .replace('{{og_type}}', 'website') \
        .replace('{{content}}', f'<main>{blog_content}</main>') \
        .replace('{{base_path}}', '../') \
        .replace('{{extra_head}}', '') \
        .replace('{{blog_active}}', 'style="color: var(--accent-color);"')
        
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
            <link>https://rodrigo47363.github.io/portfolio/posts/{post['filename']}</link>
            <description><![CDATA[{post['excerpt']}]]></description>
            <pubDate>{pub_date}</pubDate>
        </item>
        '''
        
    rss_feed = f'''<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>Blog de Rodrigo47363</title>
    <link>https://rodrigo47363.github.io/portfolio/</link>
    <description>Tutoriales y recursos sobre ciberseguridad y desarrollo</description>
    {rss_items}
</channel>
</rss>
'''
    with open(os.path.join(PORTFOLIO_DIR, 'rss.xml'), 'w', encoding='utf-8') as f:
        f.write(rss_feed)
        
    # 4. GENERATE SITEMAP
    sitemap_items = ""
    # Add root pages
    root_pages = [
        "index.html",
        "404.html",
        "pages/acerca-de.html",
        "pages/contacto.html",
        "pages/repositorios.html",
        "pages/blog.html"
    ]
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    for page in root_pages:
        sitemap_items += f'''
    <url>
        <loc>https://rodrigo47363.github.io/portfolio/{page}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>{"1.0" if page == "index.html" else "0.8"}</priority>
    </url>'''
    
    for post in posts:
        post_date = post['parsed_date'].strftime("%Y-%m-%d")
        sitemap_items += f'''
    <url>
        <loc>https://rodrigo47363.github.io/portfolio/posts/{post['filename']}</loc>
        <lastmod>{post_date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>'''
    
    sitemap_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sitemap_items}
</urlset>'''

    with open(os.path.join(PORTFOLIO_DIR, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)
        
    print("Build completado con éxito. 🎉")

if __name__ == '__main__':
    build_site()
