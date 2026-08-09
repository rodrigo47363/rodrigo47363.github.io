'use strict';

// --- 1. Gestión del Tema ---
function toggleDarkMode(e) {
    if (e.target.checked) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const checkbox = document.getElementById('theme-switch');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (checkbox) checkbox.checked = true;
    } else {
        document.body.classList.remove('light-mode');
        if (checkbox) checkbox.checked = false;
    }
}

// --- 2. Integración Segura con GitHub API ---
// Función modularizada que evita la duplicación de código y previene XSS
async function fetchRepos(targetId, maxRepos, showStats = false) {
    const repoList = document.getElementById(targetId);
    if (!repoList) return; // Sale silenciosamente si no está en la página correcta

    try {
        const response = await fetch(`https://api.github.com/users/rodrigo47363/repos?sort=updated&per_page=${maxRepos}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const repos = await response.json();
        repoList.textContent = ''; // Limpieza segura del estado "Cargando..."

        repos.forEach(repo => {
            const li = document.createElement('li');
            li.className = 'glass';
            li.style.marginBottom = '15px';
            li.style.padding = '20px';

            const link = document.createElement('a');
            link.href = repo.html_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer'; // Prevención de Reverse Tabnabbing
            link.style.color = 'var(--accent-color)';
            link.style.fontWeight = 'bold';
            link.style.textDecoration = 'none';
            link.textContent = repo.name; 

            const p = document.createElement('p');
            p.className = 'repos-desc';
            p.textContent = repo.description || 'Sin descripción disponible.';

            li.appendChild(link);
            li.appendChild(p);

            // Renderizado condicional dependiendo de la página
            if (showStats) {
                const stats = document.createElement('div');
                stats.className = 'repo-stats';
                stats.style.marginTop = '10px';
                
                // Construimos los stats de forma segura
                const langSpan = document.createElement('span');
                langSpan.textContent = repo.language || 'N/A';
                langSpan.style.marginRight = '10px';
                
                const starSpan = document.createElement('span');
                starSpan.textContent = `★ ${repo.stargazers_count} `;
                starSpan.style.marginRight = '10px';

                const forkSpan = document.createElement('span');
                forkSpan.textContent = `⑂ ${repo.forks_count}`;

                stats.appendChild(langSpan);
                stats.appendChild(starSpan);
                stats.appendChild(forkSpan);
                li.appendChild(stats);
            } else {
                const tag = document.createElement('span');
                tag.className = 'blog-tag';
                tag.style.marginTop = '10px';
                tag.style.display = 'inline-block';
                tag.textContent = repo.language || 'Markdown';
                li.appendChild(tag);
            }

            repoList.appendChild(li);
        });

    } catch (error) {
        console.error('Error fetching repos:', error);
        // Error genérico seguro (no refleja inputs del usuario)
        repoList.innerHTML = '<li class="glass"><strong style="color: #ef4444;">Error de telemetría</strong><p class="repos-desc">No se pudieron cargar los repositorios desde GitHub.</p></li>';
    }
}

// --- 3. Sistema de Filtros del Blog ---
function initBlogFeatures() {
    const searchInput = document.getElementById('blogSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const blogCards = document.querySelectorAll('.blog-card');

    if (!searchInput && filterBtns.length === 0) return;

    // Leer parámetro URL para etiquetas
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');

    if (tagParam) {
        filterBtns.forEach(b => b.classList.remove('active'));
        const targetBtn = Array.from(filterBtns).find(b => b.getAttribute('data-filter') === tagParam.toLowerCase());
        if (targetBtn) targetBtn.classList.add('active');
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterCards(searchTerm, getActiveFilter());
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filterValue = e.target.getAttribute('data-filter');
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            filterCards(searchTerm, filterValue);
        });
    });

    function getActiveFilter() {
        const activeBtn = document.querySelector('.filter-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    }

    // Gatillar filtro inicial (por si viene de URL param)
    const initialFilter = getActiveFilter();
    const initialSearch = searchInput ? searchInput.value.toLowerCase() : '';
    filterCards(initialSearch, initialFilter);

    function filterCards(searchTerm, filterValue) {
        let visibleCount = 0;
        
        blogCards.forEach(card => {
            const title = card.getAttribute('data-title').toLowerCase();
            const tags = card.getAttribute('data-tags').toLowerCase();
            
            const matchesSearch = title.includes(searchTerm);
            const matchesFilter = filterValue === 'all' || tags.includes(filterValue.toLowerCase());
            
            if (matchesSearch && matchesFilter) {
                card.style.display = 'flex';
                if (visibleCount === 0 && searchTerm === '' && filterValue === 'all') {
                    card.classList.add('hero');
                } else {
                    card.classList.remove('hero');
                }
                visibleCount++;
            } else {
                card.style.display = 'none';
                card.classList.remove('hero');
            }
        });
    }
}

// --- 4. Inicializador Principal (Único punto de entrada) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Iniciar Tema
    initTheme(); 
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleDarkMode);
    }
    
    // 2. Cargar Repositorios (Busca los IDs, si no existen, la función ignora la carga)
    fetchRepos('repos-list', 6, false);       // Para el index.html (solo 6, sin stats extra)
    fetchRepos('all-repos-list', 100, true);  // Para repositorios.html (hasta 100, con estrellas y forks)
    
    // 3. Iniciar Blog
    initBlogFeatures();
    
    // 4. Inicializar AOS (Animaciones)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }
    
    // 5. Inicializar Botones de Copiar Código y Highlight.js
    initCodeCopy();
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
    
    // 6. Inicializar Terminal e Interactive Search
    initInteractiveTerminal();
    initGlobalSearch();
});

// --- 5. Funcionalidad de Copiar Código ---
function initCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach(pre => {
        pre.style.position = 'relative';
        
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerHTML = '📋 Copiar';
        
        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code');
            const textToCopy = code ? code.innerText : pre.innerText;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                btn.innerHTML = '✅ Copiado!';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.innerHTML = '📋 Copiar';
                    btn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Error al copiar: ', err);
                btn.innerHTML = '❌ Error';
            }
        });
        
        pre.appendChild(btn);
    });
}

// --- 6. PWA Manifest & Service Worker ---
if (window.location.protocol !== 'file:') {
    // Inyección dinámica de manifest para evitar advertencias CORS en protocolo file://
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    const isSubdir = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/posts/');
    manifestLink.href = (isSubdir ? '../' : './') + 'site.webmanifest';
    document.head.appendChild(manifestLink);

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swPath = (isSubdir ? '../' : './') + 'sw.js';
            navigator.serviceWorker.register(swPath).catch(err => {
                console.log('SW registration note:', err);
            });
        });
    }
}

// --- 7. Terminal Interactiva ---
function initInteractiveTerminal() {
    const termInput = document.getElementById('terminalInput');
    const termBody = document.getElementById('terminalBody');
    if (!termInput || !termBody) return;

    const commands = {
        help: 'Comandos disponibles:\n  whoami     - Información sobre Rodrigo47363\n  skills     - Habilidades técnicas y stack\n  projects   - Proyectos destacados\n  contact    - Redes y métodos de contacto\n  cv         - Descargar curriculum vitae\n  date       - Mostrar fecha del sistema\n  clear      - Limpiar consola\n  matrix     - Efecto hacker táctico\n  sudo       - Ejecutar como administrador',
        whoami: 'Rodrigo47363\nEsp. en Ciberseguridad Ofensiva | Pentesting | Red Team | Scripting Python & Bash.',
        skills: '🛡️ Seguridad: Ethical Hacking, WiFi Audit (Aircrack-ng, Hashcat), Metasploit, Nmap, Burp Suite.\n💻 Desarrollo: Python, Bash, HTML5, CSS3 Glassmorphism, JavaScript ES6+.\n🐧 OS: Parrot OS, Kali Linux, Arch Linux, Debian.',
        projects: '🚀 NekoFI (Auditoría Wi-Fi)\n📘 Portafolio Web Glassmorphism con SSG\n🛠️ Rofi Cache Cleaner & Automation Tools',
        contact: '📧 Contacto Directo: Formulario en pages/contacto.html\n🐙 GitHub: https://github.com/rodrigo47363',
        cv: 'Iniciando descarga de cv.pdf...',
        date: new Date().toLocaleString(),
        sudo: 'Access denied: Rodrigo is already root! 🚀',
        matrix: '01001000 01100001 01100011 01101011 01110011 00100001 00001010 [SYSTEM OVERRIDE APPROVED]'
    };

    termInput.addEventListener('keydown', (e) => {
        // 1. Interrupción de terminal Ctrl+C (si no hay texto seleccionado para copiar)
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            const selectedText = window.getSelection().toString();
            if (!selectedText) {
                e.preventDefault();
                const inputVal = termInput.value;
                termInput.value = '';
                const cmdLine = document.createElement('div');
                cmdLine.className = 'term-output';
                cmdLine.innerHTML = `<span class="term-prompt">rodrigo@parrot:~$</span> <span class="term-cmd">${escapeHTML(inputVal)}^C</span>`;
                termBody.insertBefore(cmdLine, document.getElementById('currentTermLine'));
                termBody.scrollTop = termBody.scrollHeight;
                return;
            }
        }

        // 2. Limpiar pantalla Ctrl+L
        if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            const outputs = termBody.querySelectorAll('.term-output');
            outputs.forEach(el => el.remove());
            return;
        }

        // 3. Ejecutar comando Enter
        if (e.key === 'Enter') {
            const inputVal = termInput.value.trim().toLowerCase();
            termInput.value = '';

            const cmdLine = document.createElement('div');
            cmdLine.className = 'term-output';
            cmdLine.innerHTML = `<span class="term-prompt">rodrigo@parrot:~$</span> <span class="term-cmd">${escapeHTML(inputVal)}</span>`;
            termBody.insertBefore(cmdLine, document.getElementById('currentTermLine'));

            if (inputVal === 'clear') {
                const outputs = termBody.querySelectorAll('.term-output');
                outputs.forEach(el => el.remove());
            } else if (inputVal === 'cv') {
                const link = document.createElement('a');
                link.href = 'cv.pdf';
                link.download = 'cv.pdf';
                link.click();
                const outLine = document.createElement('div');
                outLine.className = 'term-output';
                outLine.textContent = commands.cv;
                termBody.insertBefore(outLine, document.getElementById('currentTermLine'));
            } else if (inputVal !== '') {
                const outLine = document.createElement('div');
                outLine.className = 'term-output';
                outLine.textContent = commands[inputVal] || `Command not found: '${inputVal}'. Escribe 'help' para comandos.`;
                termBody.insertBefore(outLine, document.getElementById('currentTermLine'));
            }

            termBody.scrollTop = termBody.scrollHeight;
        }
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- 8. Modal de Búsqueda Global (Ctrl+K) ---
function initGlobalSearch() {
    const modal = document.getElementById('globalSearchModal');
    const searchInput = document.getElementById('globalSearchInput');
    const searchClose = document.getElementById('globalSearchClose');
    const searchResults = document.getElementById('globalSearchResults');
    const searchTrigger = document.getElementById('searchTriggerBtn');

    if (!modal || !searchInput) return;

    // Detectar ruta base si estamos en un subdirectorio /pages/ o /posts/
    const isSubdir = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/posts/');
    const prefix = isSubdir ? '../' : './';

    const searchableItems = [
        { title: '🏠 Inicio', url: prefix + 'index.html' },
        { title: '📝 Blog y Artículos', url: prefix + 'pages/blog.html' },
        { title: '👨‍💻 Acerca de Mí', url: prefix + 'pages/acerca-de.html' },
        { title: '📦 Repositorios GitHub', url: prefix + 'pages/repositorios.html' },
        { title: '📬 Contacto', url: prefix + 'pages/contacto.html' },
        { title: '📄 Descargar CV', url: prefix + 'cv.pdf' },
        { title: '📜 Guía Completa de OSINT', url: prefix + 'posts/osint-guide.html' },
        { title: '🎯 Resolviendo Máquinas HackTheBox', url: prefix + 'posts/htb.html' },
        { title: '🐧 Limpiar Caché Rofi en Linux', url: prefix + 'posts/limpiar-cache-rofi.html' },
        { title: '🤖 Módulos Python en Archivos Separados', url: prefix + 'posts/modules.html' }
    ];

    function openModal() {
        modal.classList.add('active');
        searchInput.value = '';
        renderResults('');
        setTimeout(() => searchInput.focus(), 100);
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    function renderResults(query) {
        searchResults.innerHTML = '';
        const q = query.toLowerCase().trim();
        const filtered = searchableItems.filter(item => item.title.toLowerCase().includes(q));

        if (filtered.length === 0) {
            searchResults.innerHTML = '<li style="padding: 10px; opacity: 0.6; text-align: center;">No se encontraron resultados</li>';
            return;
        }

        filtered.forEach((item, index) => {
            const li = document.createElement('li');
            if (index === 0) li.className = 'selected';
            li.innerHTML = `<a href="${item.url}">${item.title}</a>`;
            searchResults.appendChild(li);
        });
    }

    if (searchTrigger) searchTrigger.addEventListener('click', openModal);
    if (searchClose) searchClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (modal.classList.contains('active')) {
                closeModal();
            } else {
                openModal();
            }
        } else if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });
}
