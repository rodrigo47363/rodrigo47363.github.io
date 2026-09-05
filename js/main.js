'use strict';

// --- 1. Gestión del Tema ---
function updateGiscusTheme(theme) {
    const iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
        giscus: {
            setConfig: {
                theme: theme === 'light' ? 'light' : 'dark'
            }
        }
    }, 'https://giscus.app');
}

function toggleDarkMode(e) {
    const isLight = e.target.checked;
    if (isLight) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
    updateGiscusTheme(isLight ? 'light' : 'dark');
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const checkbox = document.getElementById('theme-switch');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (checkbox) checkbox.checked = true;
        // Si giscus ya está cargado o carga después
        setTimeout(() => updateGiscusTheme('light'), 800);
    } else {
        document.body.classList.remove('light-mode');
        if (checkbox) checkbox.checked = false;
        setTimeout(() => updateGiscusTheme('dark'), 800);
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

// --- Función Utilitaria: Normalización de cadenas (insensible a acentos y diacríticos) ---
function normalizeStr(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

// --- 3. Sistema Táctico de Filtros y Búsqueda del Blog ---
function initBlogFeatures() {
    const searchInput = document.getElementById('blogSearch');
    const searchClearBtn = document.getElementById('blogSearchClear');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const blogCards = document.querySelectorAll('.blog-card');
    const activeTagBadge = document.getElementById('activeTagBadge');
    const resultsCountEl = document.getElementById('blogResultsCount');
    const emptyState = document.getElementById('blogEmptyState');
    const resetFiltersBtn = document.getElementById('resetBlogFilters');

    if (!searchInput && filterBtns.length === 0 && blogCards.length === 0) return;

    // Estado reactivo del blog
    let currentFilter = 'all';
    let currentSearch = '';

    // 1. Leer parámetros de la URL (?tag=... & ?search=...)
    const urlParams = new URLSearchParams(window.location.search);
    const rawTagParam = urlParams.get('tag');
    const rawSearchParam = urlParams.get('search');

    if (rawTagParam) {
        try {
            currentFilter = decodeURIComponent(rawTagParam).trim().toLowerCase();
        } catch (e) {
            currentFilter = rawTagParam.trim().toLowerCase();
        }
    }
    if (rawSearchParam && searchInput) {
        try {
            currentSearch = decodeURIComponent(rawSearchParam).trim();
        } catch (e) {
            currentSearch = rawSearchParam.trim();
        }
        searchInput.value = currentSearch;
        if (searchClearBtn) searchClearBtn.style.display = 'block';
    }

    // 2. Controladores para botones de filtro de categoría
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter') || 'all';
            setFilter(filterValue);
        });
    });

    // 3. Controlador de búsqueda reactiva con debouncing ligero
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value.trim();
                if (searchClearBtn) {
                    searchClearBtn.style.display = currentSearch.length > 0 ? 'block' : 'none';
                }
                updateUrlParams();
                filterCards();
            }, 50);
        });

        // Limpiar búsqueda al presionar Escape en el campo
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchInput.value !== '') {
                e.preventDefault();
                clearSearch();
            }
        });
    }

    // 4. Botón limpiar búsqueda (✕)
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            clearSearch();
            searchInput.focus();
        });
    }

    // 5. Botón restablecer todo en empty state
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            resetAllFilters();
        });
    }

    // Atajo de teclado global: presionar "/" enfoca el buscador de artículos
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            if (searchInput && document.querySelector('.blog-grid')) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            const kbd = document.querySelector('.search-kbd-wrapper');
            if (kbd) kbd.style.opacity = '0';
        });
        searchInput.addEventListener('blur', () => {
            const kbd = document.querySelector('.search-kbd-wrapper');
            if (kbd && searchInput.value === '') kbd.style.opacity = '1';
        });
    }

    // 6. Interceptar clics en tags de tarjetas en la misma página para fluidez SPA
    document.addEventListener('click', (e) => {
        const tagLink = e.target.closest('.blog-tag');
        if (tagLink && document.querySelector('.blog-grid')) {
            const href = tagLink.getAttribute('href');
            if (href && href.includes('blog.html?tag=')) {
                e.preventDefault();
                const urlObj = new URL(tagLink.href, window.location.origin);
                const rawTag = urlObj.searchParams.get('tag');
                if (rawTag) {
                    const requestedTag = decodeURIComponent(rawTag);
                    setFilter(requestedTag.toLowerCase());
                    const controlsEl = document.querySelector('.blog-controls');
                    if (controlsEl) {
                        controlsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        }
    });

    function setFilter(filterValue) {
        currentFilter = filterValue.trim().toLowerCase();
        updateFilterUI();
        updateUrlParams();
        filterCards();
    }

    function clearSearch() {
        if (searchInput) {
            searchInput.value = '';
            currentSearch = '';
        }
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        updateUrlParams();
        filterCards();
    }

    function resetAllFilters() {
        clearSearch();
        setFilter('all');
    }

    function updateFilterUI() {
        let matchingButtonFound = false;
        const normFilter = normalizeStr(currentFilter);

        filterBtns.forEach(b => {
            const btnNorm = normalizeStr(b.getAttribute('data-filter') || '');
            const isMatch = btnNorm === normFilter;
            b.classList.toggle('active', isMatch);
            b.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
            if (isMatch) matchingButtonFound = true;
        });

        // Si el filtro es un tag específico sin botón predefinido, mostrar badge interactivo
        if (activeTagBadge) {
            if (normFilter !== 'all' && !matchingButtonFound) {
                activeTagBadge.style.display = 'inline-flex';
                activeTagBadge.innerHTML = `
                    <span>🏷️ Tag activo: <strong>${escapeHTML(currentFilter)}</strong></span>
                    <button type="button" id="clearTagFilter" aria-label="Quitar filtro de etiqueta">✕</button>
                `;
                const clearTagBtn = document.getElementById('clearTagFilter');
                if (clearTagBtn) {
                    clearTagBtn.addEventListener('click', () => setFilter('all'));
                }
            } else {
                activeTagBadge.style.display = 'none';
                activeTagBadge.innerHTML = '';
            }
        }
    }

    function updateUrlParams() {
        const url = new URL(window.location.href);
        if (currentFilter && currentFilter !== 'all') {
            url.searchParams.set('tag', currentFilter);
        } else {
            url.searchParams.delete('tag');
        }

        if (currentSearch && currentSearch.length > 0) {
            url.searchParams.set('search', currentSearch);
        } else {
            url.searchParams.delete('search');
        }

        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }

    function filterCards() {
        let visibleCount = 0;
        const normSearch = normalizeStr(currentSearch);
        const normFilter = normalizeStr(currentFilter);

        blogCards.forEach(card => {
            const title = card.getAttribute('data-title') || '';
            const excerpt = card.getAttribute('data-excerpt') || card.querySelector('.blog-excerpt')?.textContent || '';
            const tagsAttr = card.getAttribute('data-tags') || '';
            
            const titleNorm = normalizeStr(title);
            const excerptNorm = normalizeStr(excerpt);
            const tagsListNorm = tagsAttr.split(',').map(t => normalizeStr(t)).filter(Boolean);

            // Coincidencia de búsqueda insensible a mayúsculas y acentos
            const matchesSearch = normSearch === '' || 
                titleNorm.includes(normSearch) || 
                excerptNorm.includes(normSearch) || 
                tagsListNorm.some(t => t.includes(normSearch));

            // Coincidencia exacta de categoría o etiqueta normalizada
            const matchesFilter = normFilter === 'all' || tagsListNorm.includes(normFilter);

            if (matchesSearch && matchesFilter) {
                card.style.display = 'flex';
                if (visibleCount === 0 && normSearch === '' && normFilter === 'all') {
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

        // Actualizar contador y estado vacío
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            const emptyQueryVal = document.getElementById('emptyQueryVal');
            if (emptyQueryVal) {
                const terms = [];
                if (currentSearch) terms.push(escapeHTML(currentSearch));
                if (currentFilter !== 'all') terms.push(`tag:${escapeHTML(currentFilter)}`);
                emptyQueryVal.textContent = terms.join(' ') || 'query';
            }
        }

        if (resultsCountEl) {
            if (visibleCount === 0) {
                resultsCountEl.textContent = '0 artículos encontrados';
            } else if (visibleCount === blogCards.length) {
                resultsCountEl.textContent = `Mostrando todos los artículos (${visibleCount})`;
            } else {
                resultsCountEl.textContent = `Mostrando ${visibleCount} de ${blogCards.length} artículos`;
            }
        }

        // Refrescar AOS para recalcular posiciones y evitar elementos ocultos
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    // Inicializar estado de UI y filtrado inicial
    updateFilterUI();
    filterCards();
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

    // 7. Inicializar Barra de Progreso de Lectura
    initReadingProgress();
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
        help: 'Comandos disponibles:\n  whoami     - Información sobre Rodrigo47363\n  skills     - Habilidades técnicas y stack\n  projects   - Proyectos destacados\n  acersense  - Suite nativa de hardware en Rust\n  contact    - Redes y métodos de contacto\n  cv         - Descargar curriculum vitae\n  date       - Mostrar fecha del sistema\n  clear      - Limpiar consola\n  matrix     - Efecto hacker táctico\n  sudo       - Ejecutar como administrador',
        whoami: 'Rodrigo47363\nPentester Senior & Software Architect | Red Team | Reversing | Rust, Python & Bash.',
        skills: '🛡️ Seguridad: Ethical Hacking, Active Directory (Impacket, NetExec), Web (Burp, FFUF), Reversing (Ghidra, SMM).\n💻 Desarrollo: Rust, Python 3, Bash, Linux Ring-0/Ring -2 internals.\n🐧 OS: Parrot OS, Kali Linux, Debian, BSPWM.',
        projects: '⚡ AcerSense Pro (Rust Hardware Suite a 6,122 RPM)\n🚀 NekoFI (Auditoría Wi-Fi)\n🔍 OSIdentifier (Passive TTL Recon)\n📘 Portafolio Web Glassmorphism con SSG',
        acersense: '⚡ AcerSense Pro Linux v2.0\nSuite nativa en Rust para control de hardware y firmware InsydeH2O a 6,122 RPM.\nWriteup: posts/acersense-linux-rust.html\nRepo: https://github.com/rodrigo47363/acersense-linux',
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
        { title: 'AcerSense Pro: Reversing de BIOS InsydeH2O (Rust)', url: prefix + 'posts/acersense-linux-rust.html' },
        { title: '🎯 Resolviendo Máquinas HackTheBox: Basic Toolset', url: prefix + 'posts/htb.html' },
        { title: '🗺️ Guía de Paths de HackTheBox', url: prefix + 'posts/htb-paths.html' },
        { title: '📜 Guía Completa de OSINT: Herramientas y Técnicas', url: prefix + 'posts/osint-guide.html' },
        { title: '🐧 Limpiar Caché Rofi y XDG en Linux', url: prefix + 'posts/limpiar-cache-rofi.html' },
        { title: '🐚 Automatizando tareas con scripts de Bash', url: prefix + 'posts/bash-scripts.html' },
        { title: '🔧 Resolviendo los 3 errores más frustrantes de ZSH', url: prefix + 'posts/errores-zsh.html' },
        { title: '🐍 Mis librerías favoritas de Python', url: prefix + 'posts/python-libs.html' },
        { title: '💻 Por qué Linux es el mejor sistema para desarrolladores', url: prefix + 'posts/linux-dev.html' },
        { title: '🖥️ Cómo configurar tu terminal para que luzca increíble', url: prefix + 'posts/terminal-setup.html' }
    ];

    let activeItems = [...searchableItems];

    // Cargar índice dinámico generado por build.py si está disponible
    fetch((isSubdir ? '../' : './') + 'data/search_index.json')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                activeItems = data.map(item => ({
                    title: item.title,
                    url: (isSubdir ? '../' : './') + item.url,
                    tags: item.tags || []
                }));
            }
        })
        .catch(() => { /* Usa searchableItems por defecto */ });

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
        const qNorm = normalizeStr(query.trim());
        const filtered = activeItems.filter(item => {
            const titleNorm = normalizeStr(item.title);
            const tagsNorm = (item.tags || []).map(t => normalizeStr(t));
            return qNorm === '' || titleNorm.includes(qNorm) || tagsNorm.some(t => t.includes(qNorm));
        });

        if (filtered.length === 0) {
            searchResults.innerHTML = '<li style="padding: 10px; opacity: 0.6; text-align: center;">No se encontraron resultados</li>';
            return;
        }

        filtered.forEach((item, index) => {
            const li = document.createElement('li');
            if (index === 0) li.className = 'selected';
            li.innerHTML = `<a href="${item.url}">${escapeHTML(item.title)}</a>`;
            li.addEventListener('mouseenter', () => {
                const current = searchResults.querySelector('li.selected');
                if (current) current.classList.remove('selected');
                li.classList.add('selected');
            });
            searchResults.appendChild(li);
        });
    }

    if (searchTrigger) searchTrigger.addEventListener('click', openModal);
    if (searchClose) searchClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (modal.classList.contains('active')) {
                closeModal();
            } else {
                openModal();
            }
            return;
        }

        if (!modal.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeModal();
            return;
        }

        const items = searchResults.querySelectorAll('li');
        if (items.length === 0) return;

        let currentIndex = Array.from(items).findIndex(el => el.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex >= 0 && items[currentIndex]) {
                items[currentIndex].classList.remove('selected');
            }
            currentIndex = (currentIndex + 1) % items.length;
            items[currentIndex].classList.add('selected');
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex >= 0 && items[currentIndex]) {
                items[currentIndex].classList.remove('selected');
            }
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            items[currentIndex].classList.add('selected');
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            if (currentIndex >= 0 && items[currentIndex]) {
                const link = items[currentIndex].querySelector('a');
                if (link) {
                    e.preventDefault();
                    link.click();
                }
            }
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });
}

// --- 9. Barra de Progreso de Lectura Optimizada ---
function initReadingProgress() {
    const bar = document.getElementById('myBar');
    if (!bar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                if (height > 0) {
                    const scrolled = Math.min(100, Math.max(0, (winScroll / height) * 100));
                    bar.style.width = scrolled + '%';
                } else {
                    bar.style.width = '0%';
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

