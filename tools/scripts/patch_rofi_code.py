import json

file_path = '/home/rodrigo47363/.gemini/antigravity/scratch/portfolio/content/limpiar-cache-rofi.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The user wants to ensure the commands are visually separated.
# Some browsers/parsers act weirdly if the code block doesn't explicitly have a <br> or if \n is stripped.
# Let's replace the \n with explicit <br> tags within the <pre><code> block just for Paso B.
old_block = "rm -f ~/.local/share/applications/mimeinfo.cache\nrm -f ~/.cache/rofi-drun-desktop.cache\nrm -f ~/.cache/rofi/*(N)"
new_block = "rm -f ~/.local/share/applications/mimeinfo.cache<br>rm -f ~/.cache/rofi-drun-desktop.cache<br>rm -f ~/.cache/rofi/*(N)"

data['content'] = data['content'].replace(old_block, new_block)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
