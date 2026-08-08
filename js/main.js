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
    
    // 5. Inicializar Botones de Copiar Código
    initCodeCopy();
});

// --- 5. Funcionalidad de Copiar Código ---
function initCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach(pre => {
        // Asegurar que position es relative para el botón
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
