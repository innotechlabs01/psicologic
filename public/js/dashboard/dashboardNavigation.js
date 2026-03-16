/**
 * Psicologic - Dashboard Navigation Engine
 * Adapting the high-performance navigation from LayoutClient to LayoutDashboard
 */

// Global state to prevent re-initialization
window.__DASHBOARD_NAV_READY = window.__DASHBOARD_NAV_READY || false;

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
      this.bar.style.transition = 'width 0.4s ease-out';
      this.bar.style.width = '70%';
    }
  },
  finish() {
    if (this.element) {
      this.bar.style.transition = 'width 0.2s ease-in';
      this.bar.style.width = '100%';
      setTimeout(() => {
        this.element.classList.add('opacity-0');
        setTimeout(() => {
           this.bar.style.transition = 'none';
           this.bar.style.width = '0%';
        }, 300);
      }, 200);
    }
  }
};

const DashboardNavigation = {
  isNavigating: false,
  
  async navigateTo(url) {
    if (window.location.pathname === url || this.isNavigating) return;
    
    this.isNavigating = true;
    ProgressBar.start();

    const main = document.querySelector('.main-content');
    if (main) {
      main.style.transition = 'opacity 0.15s ease-out';
      main.style.opacity = '0.4';
    }

    try {
      const response = await fetch(url, { 
        headers: { 'Accept': 'text/html', 'X-Requested-With': 'PsicologicNavigation' }, 
        credentials: 'include' 
      });
      
      if (!response.ok) throw new Error('Navigation failed');

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newMain = doc.querySelector('.main-content');
      const newTitle = doc.querySelector('title')?.textContent;

      if (main && newMain) {
        // Update URL and Title
        history.pushState({}, '', url);
        if (newTitle) document.title = newTitle;

        // Replace content
        main.innerHTML = newMain.innerHTML;

        // Extract and execute scripts in the new content
        const scripts = newMain.querySelectorAll('script');
        scripts.forEach(s => {
          const newS = document.createElement('script');
          Array.from(s.attributes).forEach(attr => newS.setAttribute(attr.name, attr.value));
          
          if (s.src) {
            newS.src = s.src;
            newS.async = false;
            document.head.appendChild(newS);
          } else {
            // Inline script execution
            try {
              const scriptContent = s.textContent;
              // We wrapper it in a timeout to ensure DOM is ready
              setTimeout(() => {
                const execute = new Function(scriptContent);
                execute();
              }, 0);
            } catch (e) {
              console.error('Error executing inline script:', e);
            }
          }
        });

        // Trigger astro events manually since we are bypassing the router
        // This ensures components that listen to page-load still work
        document.dispatchEvent(new Event('astro:after-preparation'));
        document.dispatchEvent(new Event('astro:after-swap'));
        document.dispatchEvent(new Event('astro:page-load'));

        requestAnimationFrame(() => {
          main.style.opacity = '1';
          this.updateActiveLinks(url);
          
          // Close sidebar on mobile after navigation
          if (window.innerWidth < 640) {
             const hideSidebar = window.hideSidebar; // Assuming it might be global or we trigger it
             if (typeof hideSidebar === 'function') hideSidebar();
             else {
                // Fallback direct manipulation if helper not global
                document.getElementById('separator-sidebar')?.classList.add('-translate-x-full');
                document.getElementById('sidebar-overlay')?.classList.add('hidden');
                document.body.style.overflow = '';
             }
          }
        });
      }
    } catch (e) {
      console.error('SPA Navigation failed, falling back to full load:', e);
      window.location.href = url;
    } finally {
      this.isNavigating = false;
      ProgressBar.finish();
    }
  },

  updateActiveLinks(url) {
    document.querySelectorAll('.sidebar-link').forEach(a => {
      const href = a.getAttribute('href');
      const active = href === url || (url.startsWith(href) && href !== '/dashboard');
      a.classList.toggle('bg-gray-200', active);
      a.classList.toggle('dark:bg-gray-700', active);
    });
  },

  init() {
    if (window.__DASHBOARD_NAV_READY) return;

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-navigate]');
      if (link && link instanceof HTMLAnchorElement) {
        // Only handle internal same-origin links
        if (link.origin === window.location.origin) {
          e.preventDefault();
          this.navigateTo(link.getAttribute('href'));
        }
      }
    });

    window.addEventListener('popstate', () => {
      this.navigateTo(window.location.pathname);
    });

    window.__DASHBOARD_NAV_READY = true;
    console.log('Dashboard Navigation Engine Initialized');
  }
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DashboardNavigation.init());
} else {
  DashboardNavigation.init();
}

// Also re-init on astro:page-load in case of full reload through Astro router
document.addEventListener('astro:page-load', () => DashboardNavigation.init());
