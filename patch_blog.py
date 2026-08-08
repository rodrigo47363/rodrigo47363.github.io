import json

file_path = '/home/rodrigo47363/.gemini/antigravity/scratch/portfolio/content/limpiar-cache-rofi.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

data['excerpt'] = "Aprende a borrar accesos directos duplicados y solucionar el error de iconos fantasmas de Telegram y Flatpak en Rofi (Linux)."

data['content'] = data['content'].replace(
    "<p><strong>¡Hola, comunidad!</strong> ¿Alguna vez les ha pasado que desinstalan una aplicación (como Telegram o algún paquete Flatpak) y su lanzador de aplicaciones —en mi caso, Rofi— se empeña en mostrar accesos directos duplicados o dañados que no llevan a ninguna parte? ¡A mí me pasó! Hoy vamos a resolver este misterio de forma súper práctica.</p>",
    "<p><strong>¡Hola, comunidad!</strong> Si estás buscando cómo solucionar el problema de <strong>Telegram duplicado en Rofi</strong> o iconos fantasmas tras desinstalar un paquete <strong>Flatpak</strong> en Linux, llegaste al lugar correcto.</p>\n                    <p>¿Qué fue exactamente lo que me pasó? Instalé Telegram desde Flatpak y, tras desinstalarlo o actualizarlo, el lanzador de aplicaciones (Rofi) se empeñaba en seguir mostrando el viejo icono. Al hacerle clic, no pasaba absolutamente nada (era un acceso dañado o fantasma que solo estorbaba). Hoy vamos a resolver este misterio limpiando la caché de Rofi y XDG paso a paso.</p>"
)

# Adding SEO keywords to tags
if "telegram" not in data['tags']:
    data['tags'].append("telegram")
if "flatpak" not in data['tags']:
    data['tags'].append("flatpak")

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
