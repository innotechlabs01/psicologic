const SELECTORS = {
  sidebar: '#separator-sidebar',
  overlay: '#sidebar-overlay',
  toggleButton: '#sidebar-toggle',
  closeButton: '#sidebar-close',
  mainContent: '.main-content',
  dynamicMenu: '#sidebar-menu-client-dynamic',
  sidebarLink: '.sidebar-link[data-navigate]'
};

const SidebarManager = {
  menuInitialized: false,

  getElement(selector, errorMessage) {
    const element = document.querySelector(selector);
    if (!element) {
      this.logError(errorMessage, { selector });
    }
    return element;
  },

  logError(message, details) {
    console.error(`🚨 ${message}`, details);
    this.showToast(message, 'error');
  },

  showToast(message, type) {
    console.log(`[Toast ${type}]: ${message}`);
    // Implementa tu sistema de notificaciones aquí
  },

  showSidebar() {
    const sidebar = this.getElement(SELECTORS.sidebar, 'Elementos del sidebar no encontrados');
    const overlay = this.getElement(SELECTORS.overlay, 'Elementos del sidebar no encontrados');
    const toggleButton = this.getElement(SELECTORS.toggleButton, 'Elementos del sidebar no encontrados');
    
    if (sidebar && overlay && toggleButton) {
      sidebar.classList.replace('-translate-x-full', 'translate-x-0');
      overlay.classList.remove('hidden');
      toggleButton.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  },

  hideSidebar() {
    const sidebar = this.getElement(SELECTORS.sidebar, 'Elementos del sidebar no encontrados');
    const overlay = this.getElement(SELECTORS.overlay, 'Elementos del sidebar no encontrados');
    const toggleButton = this.getElement(SELECTORS.toggleButton, 'Elementos del sidebar no encontrados');
    
    if (sidebar && overlay && toggleButton) {
      sidebar.classList.replace('translate-x-0', '-translate-x-full');
      overlay.classList.add('hidden');
      toggleButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  },

  async executeScripts(container, scripts) {
    for (const script of scripts) {
      if (script.src && (script.src.includes('astro&type=style') || script.src.includes('@vite/client') || script.src.includes('entrypoint.js'))) {
        continue;
      }

      if (script.src) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.async = true;
        newScript.type = 'module';
        document.head.appendChild(newScript);
      } else {
        const scriptContent = script.textContent.trim();
        if (scriptContent && !scriptContent.match(/^[{\[]/)) {
          try {
            const scriptFunction = new Function(`
              document.addEventListener('DOMContentLoaded', function() {
                ${scriptContent}
              });
            `);
            scriptFunction();
          } catch (error) {
            this.logError('Error ejecutando script inline:', error);
          }
        } else {
          
        }
      }
    }
  },

  closeGamesSubmenu() {
    const dropdownButtons = document.querySelectorAll('[data-collapse-toggle]');
    dropdownButtons.forEach(button => {
      const targetId = button.getAttribute('data-collapse-toggle');
      const target = document.getElementById(targetId);
      if (target && !target.classList.contains('hidden')) {
        target.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        button.querySelector('svg:last-child')?.classList.remove('rotate-180');
      }
    });
  },

  async navigateTo(url) {
    history.pushState({}, '', url);
    // Cerrar submenú de /client/games si no estamos en esa ruta
    if (!url.includes('/client/games')) {
      this.closeGamesSubmenu();
    }
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html' },
        credentials: 'include'
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${text.slice(0, 100)}`);
      }

      if (response.redirected) {
        this.showToast('Redirigido, por favor inicia sesión', 'warning');
        window.location.href = response.url;
        return;
      }

      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const contentFragment = doc.querySelector('main') || doc.querySelector('.main-content') || doc.body;
      const scripts = doc.querySelectorAll('script');

      const contentContainer = this.getElement(SELECTORS.mainContent, 'No se encontró el contenedor .main-content');
      if (contentContainer && contentFragment) {
        contentContainer.innerHTML = contentFragment.innerHTML;
        await this.executeScripts(contentContainer, scripts);

        if (url.includes('/client/games/cartas')) {
          try {
            const module = await import('/js/games/cartas.js');
            if (typeof module.initializeCartas === 'function') {
              module.initializeCartas();
            } else {
              console.warn('⚠️ initializeCartas no encontrada en cartas.js');
            }
          } catch (error) {
            this.logError('Error al cargar /js/games/cartas.js:', error);
          }
        }
      } else {
        this.logError('No se encontró el contenedor .main-content o el fragmento en la respuesta', { contentContainer, contentFragment });
      }
    } catch (error) {
      this.logError('Error al cargar contenido:', error);
    }
  },

  async initializeSidebar() {
    if (this.menuInitialized) {
      return;
    }
    const dynamicMenuHtml = this.getElement(SELECTORS.dynamicMenu, 'sidebar-menu-client-dynamic element not found');
    
    if (!dynamicMenuHtml) return;

    try {
      const response = await fetch('/api/settings/games/menu', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${text.slice(0, 100)}`);
      }

      const menuData = await response.json();

      // Filtrar ítems duplicados por nombre
      const uniqueMenuItems = [];
      const seenNames = new Set();
      for (const item of menuData[0]?.menu.menu || []) {
        const label = typeof item.name === 'string' ? item.name : item.toString();
        if (!seenNames.has(label)) {
          seenNames.add(label);
          uniqueMenuItems.push(item);
        }
      }

      dynamicMenuHtml.innerHTML = this.renderMenu(uniqueMenuItems, true);
      this.menuInitialized = true;
      this.initializeDropdowns();
    } catch (error) {
      this.logError('Error procesando el menú:', error);
      dynamicMenuHtml.innerHTML = '<li class="p-2 text-red-500">Error al cargar el menú</li>';
    }
  },

  renderMenu(menuItems, isDynamic) {
    if (!menuItems || !Array.isArray(menuItems)) {
      return '';
    }
    return menuItems
      .filter(item => item.status !== false)
      .map(item => {
        const label = typeof item.name === 'string' ? item.name : item.toString();
        if (isDynamic && Array.isArray(item.subItem) && item.subItem.length > 0) {
          return this.renderDynamicSubMenu(label, item.subItem, item.id || label);
        }
        return `
          <a href="/client/${label}" data-navigate class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group sidebar-link">
            <svg class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
              <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
              <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
            </svg>
            <span class="ms-3">${label}</span>
          </a>
        `;
      })
      .join('');
  },

  renderDynamicSubMenu(label, subItems, parentId) {
    if (!subItems || !Array.isArray(subItems)) {
      console.warn('⚠️ Subítems no válidos para el menú:', { label, subItems });
      return '';
    }
    // Convertir parentId a string y manejar valores no válidos
    const safeParentId = typeof parentId === 'string' ? parentId : String(parentId || label || 'submenu');
    const subMenuId = `dropdown-${safeParentId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    return `
      <button type="button" class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" data-collapse-toggle="${subMenuId}">
        <svg class="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 21">
          <path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z"/>
        </svg>
        <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">${label}</span>
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
        </svg>
      </button>
      <ul id="${subMenuId}" class="hidden py-2 space-y-2">
        ${subItems
          .filter(nestedItem => nestedItem.status !== false)
          .map(nestedItem => {
            const nestedLabel = typeof nestedItem.name === 'string' ? nestedItem.name : nestedItem.toString();
            return `
              <li>
                <a href="/client/games/${nestedLabel}" data-navigate class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 sidebar-link">
                  <svg class="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 21">
                    <path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z"/>
                  </svg>
                  <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">${nestedLabel}</span>
                </a>
              </li>
            `;
          })
          .join('')}
      </ul>
    `;
  },

  initializeDropdowns() {
    const dropdownButtons = document.querySelectorAll('[data-collapse-toggle]');
    if (dropdownButtons.length === 0) {
      console.warn('⚠️ No se encontraron botones de dropdown');
      return;
    }
    dropdownButtons.forEach(button => {
      const targetId = button.getAttribute('data-collapse-toggle');
      const target = document.getElementById(targetId);
      if (!target) {
        console.warn(`⚠️ No se encontró el elemento con ID ${targetId} para el dropdown`);
        return;
      }
      button.addEventListener('click', () => {
        target.classList.toggle('hidden');
        const isExpanded = !target.classList.contains('hidden');
        button.setAttribute('aria-expanded', isExpanded);
        button.querySelector('svg:last-child')?.classList.toggle('rotate-180', isExpanded);
      });
    });
  },

  setupEventListeners() {
    const toggleButton = this.getElement(SELECTORS.toggleButton, 'Elementos del sidebar no encontrados');
    const sidebar = this.getElement(SELECTORS.sidebar, 'Elementos del sidebar no encontrados');
    const overlay = this.getElement(SELECTORS.overlay, 'Elementos del sidebar no encontrados');
    const closeButton = this.getElement(SELECTORS.closeButton, 'Elementos del sidebar no encontrados');

    if (!sidebar || !toggleButton || !overlay || !closeButton) return;

    toggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.contains('-translate-x-full') ? this.showSidebar() : this.hideSidebar();
    });

    overlay.addEventListener('click', () => this.hideSidebar());
    closeButton.addEventListener('click', () => this.hideSidebar());

    sidebar.addEventListener('click', (e) => {
      const link = e.target.closest(SELECTORS.sidebarLink);
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.navigateTo(href);
        if (window.innerWidth < 640) {
          this.hideSidebar();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 640) {
        this.hideSidebar();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
        this.hideSidebar();
      }
    });

    window.addEventListener('popstate', () => {
      this.navigateTo(window.location.pathname);
    });
  },

  async initialize() {
    this.setupEventListeners();
    await this.initializeSidebar();
  }
};

document.addEventListener('DOMContentLoaded', () => SidebarManager.initialize());