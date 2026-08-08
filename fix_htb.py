import json
import re

file_path = '/home/rodrigo47363/.gemini/antigravity/scratch/portfolio/content/htb.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'raw_body' in data:
    raw = data['raw_body']
    # Extract everything after the <h1 class="post-title">HackTheBox Path: Basic Toolset</h1>
    # We want to keep the content but remove the <main> and <article class="post-container glass"> wrappers
    # as those are provided by post_layout.html
    
    start_str = '<h1 class="post-title">HackTheBox Path: Basic Toolset</h1>'
    end_str = '</article>'
    
    if start_str in raw:
        content_extracted = raw[raw.find(start_str) + len(start_str):raw.rfind(end_str)].strip()
        data['content'] = content_extracted
    else:
        # Fallback if something went wrong
        data['content'] = "No se pudo extraer."
    
    del data['raw_body']

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
