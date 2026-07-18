document.addEventListener('DOMContentLoaded', () => {
    const pathsGrid = document.getElementById('paths-grid');
    const modal = document.getElementById('path-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalBody = document.getElementById('modal-body');

    // Use global variable htbData loaded from htb_data.js
    if (typeof htbData !== 'undefined') {
        renderPaths(htbData);
    } else {
        console.error('Error loading HTB data: htbData is undefined.');
        pathsGrid.innerHTML = '<p style="color: #ef4444; text-align: center; width: 100%;">Error al cargar los datos de los paths.</p>';
    }

    function getBadgeClass(difficulty) {
        switch(difficulty.toLowerCase()) {
            case 'easy': return 'easy';
            case 'medium': return 'medium';
            case 'hard': return 'hard';
            case 'fundamental': return 'info';
            default: return 'info';
        }
    }

    function renderPaths(paths) {
        pathsGrid.innerHTML = '';
        paths.forEach(path => {
            const card = document.createElement('div');
            card.className = 'path-card';
            
            card.innerHTML = `
                <h3 class="path-title">${path.title}</h3>
                <p class="path-desc">${path.description.substring(0, 150)}...</p>
                <div class="path-badges">
                    <span class="badge ${getBadgeClass(path.difficulty)}">${path.difficulty}</span>
                    <span class="badge info">${path.modules.length} Módulos</span>
                    ${path.reward ? `<span class="badge reward">Recompensa: ${path.reward}</span>` : ''}
                </div>
            `;
            
            card.addEventListener('click', () => openModal(path));
            pathsGrid.appendChild(card);
        });
    }

    function openModal(path) {
        // Populate modal content
        let html = `
            <div style="margin-bottom: 20px;">
                <h2 style="color: var(--accent-color); margin-bottom: 10px;">${path.title}</h2>
                <div class="path-badges" style="margin-bottom: 15px;">
                    <span class="badge ${getBadgeClass(path.difficulty)}">${path.difficulty}</span>
                    ${path.required ? `<span class="badge reward">Costo: ${path.required}</span>` : ''}
                    ${path.reward ? `<span class="badge reward">Recompensa: ${path.reward}</span>` : ''}
                </div>
                <p style="opacity: 0.9; line-height: 1.6;">${path.description}</p>
            </div>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">Módulos Incluidos (${path.modules.length})</h3>
            <div class="modules-list" style="display: flex; flex-direction: column; gap: 15px;">
        `;

        if (path.modules.length === 0) {
            html += `<p style="opacity: 0.7; font-style: italic;">No hay información detallada de los módulos para este path.</p>`;
        } else {
            path.modules.forEach(mod => {
                html += `
                    <div class="module-item" style="padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                            <h4 style="margin: 0; font-size: 1.1em; color: var(--text-color);">${mod.title}</h4>
                            <div class="path-badges" style="margin-top: 0;">
                                <span class="badge ${getBadgeClass(mod.difficulty)}">${mod.difficulty}</span>
                                ${mod.sections ? `<span class="badge info">${mod.sections}</span>` : ''}
                                ${mod.reward ? `<span class="badge reward">Recompensa: ${mod.reward}</span>` : ''}
                            </div>
                        </div>
                        <p style="margin: 0; font-size: 0.9em; opacity: 0.8; line-height: 1.5;">${mod.description}</p>
                    </div>
                `;
            });
        }

        html += `</div>`;
        modalBody.innerHTML = html;
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});
