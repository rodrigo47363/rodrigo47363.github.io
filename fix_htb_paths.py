import json

file_path = '/home/rodrigo47363/.gemini/antigravity/scratch/portfolio/content/htb-paths.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'raw_body' in data:
    data['content'] = """
                <p style="font-size: 1.1em; opacity: 0.9;">Una colección completa de los Paths disponibles en HackTheBox Academy para diferentes roles de ciberseguridad. Haz clic en cualquier Path para ver sus módulos en detalle.</p>

            <!-- Dynamic Grid Container -->
            <div class="paths-grid" id="paths-grid">
                <div style="grid-column: 1 / -1;">
                    <div class="loader"></div>
                    <p style="text-align: center; opacity: 0.7;">Cargando paths...</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="https://academy.hackthebox.com/" target="_blank" rel="noopener noreferrer" class="btn-link">Explorar en HackTheBox Academy →</a>
            </div>

    <!-- Modal for Path Details -->
    <div class="modal-overlay" id="path-modal">
        <div class="modal-container">
            <div class="modal-header">
                <h3 style="margin: 0; font-size: 1.2em; opacity: 0.8;">Detalles del Path</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
                <!-- Content injected by JS -->
            </div>
        </div>
    </div>
    
    <!-- Incluir scripts necesarios -->
    <script src="../js/htb_data.js"></script>
    <script src="../js/htb.js"></script>
"""
    del data['raw_body']

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
