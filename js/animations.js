document.addEventListener('DOMContentLoaded', () => {
    // Añadir clase 'reveal' a los elementos principales
    const elementsToReveal = document.querySelectorAll('section, .blog-card, .repos-list li, .single-article, .timeline-item, .contact-form');
    elementsToReveal.forEach(el => el.classList.add('reveal'));

    // Configurar Intersection Observer
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Opcional: Descomentar la siguiente línea si quieres que la animación ocurra solo la primera vez
                // observer.unobserve(entry.target); 
            } else {
                // Si quieres que se vuelva a animar al subir y bajar, déjalo así
                entry.target.classList.remove('active');
            }
        });
    };

    const revealOptions = {
        threshold: 0.15, // Se activa cuando el 15% del elemento es visible
        rootMargin:"0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    // Observar elementos existentes
    elementsToReveal.forEach(el => revealObserver.observe(el));

    // Si los elementos se cargan dinámicamente (como el blog), hay que observarlos después
    // MutationObserver ayuda a detectar cuando se añaden nuevos nodos al DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    if (node.classList.contains('blog-card') || node.classList.contains('glass') && node.tagName === 'LI') {
                        node.classList.add('reveal');
                        revealObserver.observe(node);
                    }
                    // Buscar hijos dentro de los nodos añadidos
                    const newElements = node.querySelectorAll('.blog-card, .repos-list li');
                    newElements.forEach(el => {
                        el.classList.add('reveal');
                        revealObserver.observe(el);
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
