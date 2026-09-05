# 🛡️ Rodrigo47363 — Offensive Security & Systems Architecture Portfolio

[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Frodrigo47363.github.io%2F&label=Live%20Portfolio&style=for-the-badge&logo=google-chrome&logoColor=white)](https://rodrigo47363.github.io/)
[![GitHub Pages Deployment](https://img.shields.io/github/deployments/rodrigo47363/rodrigo47363.github.io/github-pages?label=GitHub%20Pages&style=for-the-badge&logo=github)](https://rodrigo47363.github.io/)
[![Security Hardened](https://img.shields.io/badge/Security-CSP%20%7C%20SRI%20%7C%20WCAG%202.2%20AA-success?style=for-the-badge&logo=securityscorecard&logoColor=white)](https://rodrigo47363.github.io/)
[![Stack](https://img.shields.io/badge/Stack-Python%20%7C%20Rust%20%7C%20Bash%20%7C%20Vanilla%20JS-blue?style=for-the-badge)](https://rodrigo47363.github.io/)

> **Sitio web oficial, plataforma de writeups de ciberseguridad y catálogo de proyectos de ingeniería inversa, desarrollo de tooling y operaciones de Red Team.**

---

## 📌 Resumen del Proyecto

Este repositorio aloja el código fuente y motor de generación estática de mi portafolio profesional en **[rodrigo47363.github.io](https://rodrigo47363.github.io/)**. Diseñado bajo principios de **rendimiento sin frameworks pesados, seguridad ofensiva por diseño y accesibilidad universal (WCAG 2.2 AA)**.

Incluye writeups exhaustivos de investigaciones como el firmware reversing de InsydeH2O (`AcerSense Pro`), suites de auditoría inalámbrica (`NekoFi`), herramientas OSINT (`enum_phone`), y un motor de terminal interactivo en el navegador.

---

## ⚡ Características Principales

### 1. 🖥️ Interfaz Visual de Alto Rendimiento (UI/UX)
- **Diseño Glassmorphism Avanzado:** Efectos de refracción óptica, gradientes dinámicos y soporte completo para **Modo Oscuro / Modo Claro** con persistencia en `localStorage`.
- **Terminal Web Táctica Interactiva:** Emulador de terminal UNIX en navegador con comandos operativos (`help`, `skills`, `projects`, `acersense`, `whoami`, `clear`).
- **Sección de Blog Estilo Bento Grid:** Tarjetas con metadatos calculados (tiempo estimado de lectura, fecha, badges temáticos), filtrado interactivo por categorías e indicador de búsqueda vacía con terminal Bash retro.
- **Búsqueda Global Instantánea (`Ctrl+K`):** Modal de búsqueda rápida indexado dinámicamente, con soporte para navegación por teclado (`↑`, `↓`, `Enter`, `ESC`).

### 2. 🔒 Hardening de Seguridad Defensiva
- **Content Security Policy (CSP) Estricta:** Mitigación activa contra XSS e inyecciones de contenido:
  ```http
  default-src 'self'; script-src 'self' 'unsafe-inline' ...; object-src 'none'; base-uri 'self';
  ```
- **Integridad de Subrecursos (SRI):** Todos los CDNs externos (AOS, Highlight.js) verifican hashes criptográficos SHA-384.
- **Política de Referrer:** `strict-origin-when-cross-origin` para prevenir fuga de metadatos de navegación.
- **Sanitización DOM:** Salida dinámica sanitizada vía `escapeHTML()` y métodos DOM nativos (`textContent`), erradicando `innerHTML` inseguros.

### 3. ♿ Accesibilidad Universal (WCAG 2.2 AA)
- Enlace directo **Skip-to-Content** para lectores de pantalla y navegación por teclado.
- Jerarquía semántica de encabezados normalizada (`h1` $\rightarrow$ `h2` $\rightarrow$ `h3`).
- Modales con soporte completo de atributos `role="dialog"`, `aria-modal="true"` y gestión de foco accesible.
- Barra de progreso de lectura superior fluida mediante listeners de scroll pasivos.

### 4. ⚙️ Motor Estático Automatizado (`build.py`)
- Generación automática de páginas de artículos desde especificaciones JSON en `content/`.
- Cálculo automático de tiempo de lectura basado en conteo léxico de palabras.
- Construcción y validación de `sitemap.xml` para SEO y `rss.xml` para sindicación.
- Generación dinámica del índice de búsqueda en memoria `data/search_index.json`.

---

## 📂 Arquitectura del Repositorio

```text
rodrigo47363.github.io/
├── .github/                      # Workflows de CI/CD para GitHub Pages
├── assets/                       # Badges vectoriales, SVGs e imágenes tácticas
│   └── img/                      # Logos de Parrot OS, Kali, Nmap, Burp Suite, etc.
├── content/                      # Base de datos en JSON con artículos y writeups
│   ├── acersense-linux-rust.json
│   └── htb.json
├── css/
│   └── style.css                 # Arquitectura de estilos CSS modular y variables CSS
├── data/
│   └── search_index.json         # Índice dinámico para la búsqueda global (Ctrl+K)
├── js/
│   └── main.js                   # Lógica client-side: Terminal, Búsqueda, Filtros, Temas
├── pages/                        # Vistas estáticas secundarias
│   ├── acerca-de.html
│   ├── blog.html
│   ├── contacto.html
│   └── repositorios.html
├── posts/                        # Artículos y writeups técnicos generados
│   └── acersense-linux-rust.html
├── templates/                    # Plantillas modulares de HTML para build.py
│   ├── base_layout.html
│   ├── blog_layout.html
│   └── post_layout.html
├── build.py                      # Compilador y orquestador del sitio estático
├── index.html                    # Portada principal del portafolio
├── rss.xml                       # Feed de suscripción RSS 2.0
├── sitemap.xml                   # Mapa del sitio estructurado
└── robots.txt                    # Directivas de rastreo para motores de búsqueda
```

---

## 🚀 Despliegue y Desarrollo Local

### Prerrequisitos
- Python 3.10+
- Navegador web moderno (Chromium, Firefox)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/rodrigo47363/rodrigo47363.github.io.git
cd rodrigo47363.github.io
```

### 2. Compilar Artículos y Generar Índices
```bash
python3 build.py
```

### 3. Iniciar Servidor de Desarrollo
```bash
python3 -m http.server 8000
```
Abrir en el navegador: `http://localhost:8000/`

---

## ⚖️ Licencia y Responsabilidad Ética

Todo el contenido, código y guías técnicas publicadas en este portafolio tienen fines estrictamente didácticos, de investigación y auditoría de seguridad autorizada.

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
