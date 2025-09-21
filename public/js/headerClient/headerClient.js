  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 DOM Content Loaded - Inicializando sidebar...');
    initHeaderClient();

    const toggleButton = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('separator-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeButton = document.getElementById('sidebar-close');

    console.log('🔍 Elementos encontrados:');
    console.log('Toggle button:', toggleButton);
    console.log('Sidebar:', sidebar);
    console.log('Overlay:', overlay);
    console.log('Close button:', closeButton);

    // Función para mostrar sidebar
    function showSidebar() {
      console.log('📱 Mostrando sidebar');
      sidebar?.classList.remove('-translate-x-full');
      sidebar?.classList.add('translate-x-0');
      overlay?.classList.remove('hidden');
      toggleButton?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    // Función para ocultar sidebar
    function hideSidebar() {
      console.log('📱 Ocultando sidebar');
      sidebar?.classList.add('-translate-x-full');
      sidebar?.classList.remove('translate-x-0');
      overlay?.classList.add('hidden');
      toggleButton?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Event listeners
    toggleButton?.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🔘 Toggle button clicked');
      const isHidden = sidebar?.classList.contains('-translate-x-full');
      isHidden ? showSidebar() : hideSidebar();
    });

    overlay?.addEventListener('click', () => {
      console.log('🔘 Overlay clicked');
      hideSidebar();
    });

    closeButton?.addEventListener('click', () => {
      console.log('🔘 Close button clicked');
      hideSidebar();
    });

    // Cerrar sidebar al redimensionar a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 640) {
        console.log('🖥️ Window resized to desktop - closing sidebar');
        hideSidebar();
      }
    });

    // Cerrar sidebar con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sidebar?.classList.contains('-translate-x-full')) {
        console.log('⌨️ ESC key pressed');
        hideSidebar();
      }
    });
  });

  async function initHeaderClient() {
    console.log('🔧 Inicializando Menu Dinámico...');
    const menuHtml = document.getElementById('sidebar-menu-client');
    if (!menuHtml) {
      console.error('Error: sidebar-menu-client element not found');
      showToast('Error: No se encontró el elemento del menú', 'error');
      return;
    }

    try {
      let menuData;
      try {
        const response = await fetch('/api/settings/games/menu', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          const text = await response.text();
          console.error('🚨 Response no es JSON:', text.slice(0, 100));
          throw new Error(`HTTP error! Status: ${response.status}, Response: ${text.slice(0, 100)}`);
        }

        menuData = await response.json();

        // Render menu
        menuHtml.innerHTML = menuData[0]?.menu.menu
          .map(item => {
            const items = Array.isArray(item.name) ? item.name : [item];
            return items
              .filter(subItem => subItem.status !== false) // Only include items with status: true or undefined
              .map(subItem => {
                const label = subItem.name || subItem;
                return `
                  <a href="/client/${label}" class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group sidebar-link">
                    <svg class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
                      <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
                      <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
                    </svg>
                    <span class="ms-3">${label}</span>
                  </a>
                `;
              })
              .join('');
          })
          .join('');
      } catch (fetchError) {
        console.warn('⚠️ Fetch falló, usando datos de respaldo:', fetchError);
        showToast('No se pudo cargar el menú desde el servidor, usando datos locales', 'warning');
      }

      // Attach click listeners to sidebar links for mobile
      const sidebarLinks = document.querySelectorAll('.sidebar-link');
      sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 640) {
            console.log('🔗 Link clicked on mobile - closing sidebar');
            const sidebar = document.getElementById('separator-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const toggleButton = document.getElementById('sidebar-toggle');
            sidebar?.classList.add('-translate-x-full');
            sidebar?.classList.remove('translate-x-0');
            overlay?.classList.add('hidden');
            toggleButton?.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }
        });
      });
    } catch (error) {
      console.error('🚨 Error procesando el menú:', error);
      menuHtml.innerHTML = '<li class="p-2 text-red-500">Error al cargar el menú</li>';
      showToast('Error al cargar el menú', 'error');
    }
  }

  // Placeholder toast function (replace with your actual toast implementation)
  function showToast(message, type) {
    console.log(`[Toast ${type}]: ${message}`);
    // Implement your toast notification here, e.g., using a library like Toastify
    // Example: Toastify({ text: message, className: type }).showToast();
  }