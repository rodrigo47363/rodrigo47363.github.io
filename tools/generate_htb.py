import re

with open('htb_raw.txt', 'r') as f:
    text = f.read().strip()

blocks = re.split(r'(\d+ Modules included\n?)', text)

paths = []
current_text = ""
for block in blocks:
    current_text += block
    if "Modules included" in block:
        paths.append(current_text.strip())
        current_text = ""

html_cards = ""
for path in paths:
    lines = path.split('\n')
    lines = [l.strip() for l in lines if l.strip()]
    if not lines: continue
    
    title = lines[0]
    desc = lines[1]
    
    difficulty_sections = lines[2]
    match = re.match(r'(Easy|Medium|Hard)\s+Path Sections\s+(\d+)\s+Sections', difficulty_sections)
    if match:
        diff = match.group(1)
        sections = match.group(2)
    else:
        diff = "Info"
        sections = "0"
        
    req = lines[3].replace("Required: ", "")
    rew = lines[4].replace("Reward: ", "")
    modules = lines[6].split(' ')[0]
    
    diff_class = diff.lower()
    
    html_cards += f'''
                <div class="path-card">
                    <h3 class="path-title">{title}</h3>
                    <p class="path-desc">{desc}</p>
                    <div class="path-badges">
                        <span class="badge {diff_class}">{diff}</span>
                        <span class="badge info">{sections} Secciones</span>
                        <span class="badge info">{modules} Módulos</span>
                        <span class="badge reward">Costo: {req}</span>
                        <span class="badge reward">Recompensa: {rew}</span>
                    </div>
                </div>'''

template = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HackTheBox Paths - Mi Portafolio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <script src="js/main.js" defer></script>
    <style>
        .post-container {{ max-width: 1000px; margin: 0 auto; padding: 40px; border-radius: 24px; margin-bottom: 40px; }}
        .post-header {{ margin-bottom: 40px; text-align: center; }}
        .post-date {{ font-size: 0.9em; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }}
        .post-title {{ font-size: 2.8em; color: var(--accent-color); margin: 10px 0; line-height: 1.2; }}
        
        .paths-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
        }}

        .path-card {{
            padding: 25px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            gap: 15px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}
        
        body.light-mode .path-card {{
            background: rgba(0, 0, 0, 0.02);
            border-color: rgba(0,0,0,0.1);
        }}

        .path-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }}

        .path-title {{ font-size: 1.4em; font-weight: 800; color: var(--text-color); }}
        .path-desc {{ font-size: 0.95em; opacity: 0.8; line-height: 1.5; flex: 1; }}

        .path-badges {{
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: auto;
        }}

        .badge {{ font-size: 0.8em; padding: 5px 10px; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }}
        .badge.easy {{ background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }}
        .badge.medium {{ background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }}
        .badge.hard {{ background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }}
        .badge.info {{ background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }}
        .badge.reward {{ background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3); }}
        
        .btn-link {{
            display: inline-block;
            margin-top: 40px;
            color: var(--accent-color);
            text-decoration: none;
            font-weight: 600;
        }}
        
        .btn-link:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <header>
        <nav class="glass">
            <h1>Mi Portafolio</h1>
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="acerca-de.html">Acerca de</a></li>
                <li><a href="contacto.html">Contacto</a></li>
                <li><a href="repositorios.html">Repositorios</a></li>
                <li><a href="blog.html" style="color: var(--accent-color);">Mi Blog</a></li>
            </ul>
            
            <div class="theme-toggle-container">
                <label class="toggle-switch" aria-label="Cambiar tema">
                    <input type="checkbox" id="theme-switch">
                    <span class="slider"></span>
                </label>
            </div>
        </nav>
    </header>

    <main>
        <article class="post-container glass">
            <div class="post-header">
                <span class="post-date">Julio 2026</span>
                <h1 class="post-title">HackTheBox Skill & Job Role Paths</h1>
                <p style="font-size: 1.1em; opacity: 0.9;">Una colección completa de los Paths disponibles en HackTheBox Academy para diferentes roles de ciberseguridad, incluyendo detalles de duración y dificultad.</p>
            </div>

            <div class="paths-grid">
{html_cards}
            </div>
            
            <div style="text-align: center;">
                <a href="https://academy.hackthebox.com/" target="_blank" class="btn-link">Explorar en HackTheBox Academy →</a>
            </div>
        </article>
    </main>

    <footer class="footer">
        <p>&copy; 2025 Rodrigo47363. Construido con pasión y código.</p>
    </footer>
</body>
</html>'''

with open('post-htb-paths.html', 'w') as f:
    f.write(template)
