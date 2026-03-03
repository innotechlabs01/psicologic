/**
 * Psicologic - Persistent Navigation Engine (Pure Persistence Edition)
 * Goal: Load sidebar once, use it forever.
 */

// Global state to prevent re-initialization
window.__PSICOLOGIC_READY = window.__PSICOLOGIC_READY || false;

const ProgressBar = {
  element: null,
  bar: null,
  init() {
    this.element = document.getElementById('global-page-loader');
    if (this.element) this.bar = this.element.firstElementChild;
  },
  start() {
    if (!this.element) this.init();
    if (this.element) {
      this.element.classList.remove('opacity-0');
      this.bar.style.width = '70%';
    }
  },
  finish() {
    if (this.element) {
      this.bar.style.width = '100%';
      setTimeout(() => {
        this.element.classList.add('opacity-0');
        setTimeout(() => this.bar.style.width = '0%', 300);
      }, 200);
    }
  }
};

const NavigationEngine = {
  isNavigating: false,
  async navigateTo(url) {
    if (window.location.pathname === url || this.isNavigating) return;
    this.isNavigating = true;
    ProgressBar.start();

    const main = document.querySelector('.main-content');
    if (main) {
      main.style.transition = 'opacity 0.2s ease-out';
      main.style.opacity = '0.3';
    }

    try {
      const response = await fetch(url, { headers: { 'Accept': 'text/html' }, credentials: 'include' });
      if (!response.ok) throw new Error('Net');

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newMain = doc.querySelector('.main-content');

      if (main && newMain) {
        history.pushState({}, '', url);
        main.innerHTML = newMain.innerHTML;

        // Re-execute only the necessary scripts inside the new content
        const scripts = newMain.querySelectorAll('script');
        scripts.forEach(s => {
          const newS = document.createElement('script');
          if (s.src) {
            newS.src = s.src;
            newS.async = false;
            document.head.appendChild(newS);
          } else {
            setTimeout(() => {
              try { new Function(`try{${s.textContent}}catch(e){}`)() } catch (e) { }
            }, 0);
          }
        });

        requestAnimationFrame(() => {
          main.style.opacity = '1';
          SidebarUI.updateActiveLink(url);
          if (window.innerWidth < 640) SidebarUI.hide();
        });
      }
    } catch (e) {
      window.location.href = url;
    } finally {
      this.isNavigating = false;
      ProgressBar.finish();
    }
  }
};

const SidebarUI = {
  initialized: false,

  init() {
    if (window.__PSICOLOGIC_READY) {
      this.updateActiveLink(window.location.pathname);
      return;
    }

    this.setupGlobalListeners();
    this.loadDynamicMenu();
    window.__PSICOLOGIC_READY = true;
  },

  setupGlobalListeners() {
    // These listeners are added ONCE per session
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-navigate]');
      if (link) { e.preventDefault(); NavigationEngine.navigateTo(link.getAttribute('href')); }

      const trigger = e.target.closest('[data-collapse-toggle]');
      if (trigger) {
        const target = document.getElementById(trigger.dataset.collapseToggle);
        if (target) {
          const isOpen = !target.classList.contains('hidden');
          target.classList.toggle('hidden');
          trigger.querySelector('svg:last-child')?.classList.toggle('rotate-180', !isOpen);
        }
      }

      if (e.target.closest('#sidebar-toggle')) this.show();
      if (e.target.closest('#sidebar-overlay') || e.target.closest('#sidebar-close')) this.hide();
    });

    window.addEventListener('popstate', () => NavigationEngine.navigateTo(window.location.pathname));
  },

  async loadDynamicMenu() {
    const container = document.getElementById('sidebar-menu-client-dynamic');
    if (!container || window.location.pathname.includes('/agenda/meet')) return;

    try {
      const res = await fetch('/api/settings/games/menu', { credentials: 'include' });
      const data = await res.json();
      const items = data[0]?.menu?.menu || [];

      container.innerHTML = items.filter(i => i.status !== false).map(i => {
        const label = i.name === 'config_agend' ? 'Config. Horario' : (i.nametext || i.name);
        if (Array.isArray(i.subItem) && i.subItem.length > 0) return this.renderSub(label, i.subItem, i.name);
        const path = i.name === 'Historia Clinica' ? '/client/history/historias' : `/client/${i.name}`;
        return `<li><a href="${path}" data-navigate class="sidebar-link flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 22 21"><path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/><path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/></svg><span class="ms-3">${label}</span></a></li>`;
      }).join('');

      this.updateActiveLink(window.location.pathname);
    } catch (e) {
      setTimeout(() => this.loadDynamicMenu(), 5000);
    }
  },

  renderSub(label, subs, key) {
    const id = `drop-${String(key).replace(/\s/g, '')}`;
    const links = subs.map(s => `<li><a href="/client/${label.toLowerCase().includes('jueg') ? 'games' : 'settings'}/${s.name}" data-navigate class="sidebar-link flex items-center w-full p-2 ps-11 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">${s.nametext || s.name}</a></li>`).join('');
    return `<li><button type="button" data-collapse-toggle="${id}" class="flex items-center w-full p-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 18 21"><path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z"/></svg><span class="flex-1 ms-3 text-left">${label}</span><svg class="w-3 h-3" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-width="2" d="m1 1 4 4 4-4"/></svg></button><ul id="${id}" class="hidden py-1 space-y-1">${links}</ul></li>`;
  },

  show() {
    document.getElementById('separator-sidebar')?.classList.replace('-translate-x-full', 'translate-x-0');
    document.getElementById('sidebar-overlay')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  hide() {
    document.getElementById('separator-sidebar')?.classList.replace('translate-x-0', '-translate-x-full');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  },

  updateActiveLink(url) {
    document.querySelectorAll('.sidebar-link').forEach(a => {
      const active = a.getAttribute('href') === url;
      a.classList.toggle('bg-gray-100', active);
      a.classList.toggle('dark:bg-gray-700', active);
    });
  }
};

// Start logic
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SidebarUI.init());
else SidebarUI.init();