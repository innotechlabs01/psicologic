(function () {
  let activeFetches = 0;
  let isBackground = false;

  const originalFetch = window.fetch.bind(window);

  function updateLoader() {
    const loader = document.getElementById("global-loader");
    if (!loader) return;

    if (activeFetches > 0) loader.classList.add("show");
    else loader.classList.remove("show");
  }

  window.fetch = async (...args) => {
    const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
    
    isBackground = url.includes('/messages') || 
                    url.includes('/mark-read') || 
                    url.includes('/headers/api') ||
                    (args[1] && args[1].background);

    if (isBackground) {
      return originalFetch(...args);
    }

    activeFetches++;
    updateLoader();
    window.dispatchEvent(new CustomEvent('global:fetch-start'));

    try {
      const res = await originalFetch(...args);
      return res;
    } finally {
      activeFetches = Math.max(0, activeFetches - 1);
      updateLoader();
      if (activeFetches === 0) {
        window.dispatchEvent(new CustomEvent('global:fetch-end'));
      }
    }
  };

  window.DashboardLoader = {
    show: (moduleName) => {
      window.dispatchEvent(new CustomEvent('dashboard:loading-start', { detail: { module: moduleName } }));
    },
    hide: () => {
      window.dispatchEvent(new CustomEvent('dashboard:loading-end'));
    }
  };
})();
