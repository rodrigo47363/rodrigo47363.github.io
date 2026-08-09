import os
import re

DIR = '/home/rodrigo47363/Workspace/Desarrollo/Proyectos_github/portafolio_final'

# 1. HTML and JS: replace class=".*glass.*" with ".*surface.*"
def replace_glass_with_surface(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace glass with surface in class attributes
    # E.g., class="glass" -> class="surface", class="blog-card glass" -> class="blog-card surface"
    content = re.sub(r'class="([^"]*)\bglass\b([^"]*)"', r'class="\1surface\2"', content)
    
    # Replace in JS className assignments
    content = re.sub(r"className = '([^']*)\bglass\b([^']*)'", r"className = '\1surface\2'", content)
    
    # Clean up multiple spaces if any
    content = re.sub(r'class="\s+', 'class="', content)
    content = re.sub(r'\s+"', '"', content)

    with open(filepath, 'w') as f:
        f.write(content)

# 2. Process all HTML and JS files
for root, dirs, files in os.walk(DIR):
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            replace_glass_with_surface(os.path.join(root, file))

# 3. Re-write CSS
css_path = os.path.join(DIR, 'css/style.css')
with open(css_path, 'r') as f:
    css = f.read()

# Replace variables
css = re.sub(
    r':root \{.*?\/\* Modo Claro \*\/',
    ''':root {
    --bg-color: #121212;
    --text-color: #f1f5f9;
    --accent-color: #2563eb;
    --accent-hover: #1d4ed8;
    --surface-bg: #1e1e1e;
    --border-color: #333333;
}

/* Focus Visible for Accessibility */
a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, .toggle-switch:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 4px;
    border-radius: 4px;
}

/* Modo Claro */''',
    css, flags=re.DOTALL
)

css = re.sub(
    r'body\.light-mode \{.*?\}',
    '''body.light-mode {
    --bg-color: #fafafa;
    --text-color: #111111;
    --accent-color: #2563eb;
    --accent-hover: #1d4ed8;
    --surface-bg: #ffffff;
    --border-color: #e5e5e5;
}''',
    css, flags=re.DOTALL
)

# Remove dynamic body::before, body::after gradients
css = re.sub(r'/\* --- Fondo Dinámico con gradientes suaves --- \*/.*?(?=/\* --- Utilidad Glassmorphism \(Efecto Cristal\) --- \*/)', '', css, flags=re.DOTALL)

# Replace .glass with .surface
css = re.sub(
    r'/\* --- Utilidad Glassmorphism \(Efecto Cristal\) --- \*/\s*\.glass\s*\{.*?\}',
    '''/* --- Utilidad Surface (Estructural) --- */
.surface {
    background: var(--surface-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
}''',
    css, flags=re.DOTALL
)

# Replace all background: var(--gradient-x) or background: linear-gradient with accent-color
css = re.sub(r'background:\s*linear-gradient\([^)]+\);', 'background: var(--accent-color);', css)
css = re.sub(r'-webkit-background-clip:\s*text;', '', css)
css = re.sub(r'-webkit-text-fill-color:\s*transparent;', 'color: var(--text-color);', css)
css = re.sub(r'var\(--gradient-1\)', 'var(--accent-color)', css)
css = re.sub(r'var\(--gradient-2\)', 'var(--accent-color)', css)
css = re.sub(r'var\(--glass-border\)', 'var(--border-color)', css)

# Replace all arbitrary rgba backgrounds with surface-bg where appropriate (just simplifying borders)
# We leave arbitrary rgba as is for now unless it breaks, because we removed glass variables.

with open(css_path, 'w') as f:
    f.write(css)

print("Refactor complete.")
