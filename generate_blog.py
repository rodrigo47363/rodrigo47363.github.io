import os
import json
import glob
import logging

# Configuración de logs para auditoría de errores
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

POSTS_DIR = 'posts'
OUTPUT_FILE = 'data/articulos.json'

def parse_markdown(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parts = content.split('---')
        if len(parts) < 3:
            raise ValueError(f"Formato de front-matter inválido en {filepath}")
            
        metadata = {}
        meta_lines = parts[1].strip().split('\n')
        for line in meta_lines:
            if ':' in line:
                key, val = line.split(':', 1)
                metadata[key.strip()] = val.strip()
        
        return {
            "id": os.path.basename(filepath).replace('.md', ''),
            "title": metadata.get('title', 'Sin título'),
            "category": metadata.get('category', 'General'),
            "date": metadata.get('date', '2026-06-25'),
            "excerpt": metadata.get('excerpt', ''),
            "content": parts[2].strip()
        }
    except Exception as e:
        logging.error(f"Error procesando {filepath}: {e}")
        return None

def generate():
    if not os.path.exists(POSTS_DIR):
        logging.warning(f"La carpeta '{POSTS_DIR}' no existe. Creándola...")
        os.makedirs(POSTS_DIR)
        return

    articulos = [res for res in [parse_markdown(f) for f in glob.glob(os.path.join(POSTS_DIR, '*.md'))] if res]
    
    # Ordenar por fecha (descendente)
    articulos.sort(key=lambda x: x['date'], reverse=True)
    
    os.makedirs('data', exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(articulos, f, indent=4, ensure_ascii=False)
    
    logging.info(f"Proceso finalizado. {len(articulos)} artículos generados correctamente.")

if __name__ == "__main__":
    generate()
