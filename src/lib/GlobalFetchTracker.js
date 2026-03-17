let activeRequests = 0;

function emit(event) {
  window.dispatchEvent(new CustomEvent(event));
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (...args) => {
  const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
  
  const isBackground = url.includes('/messages') || 
                      url.includes('/mark-read') || 
                      url.includes('/headers/api') ||
                      (args[1] && args[1].background);

  if (isBackground) {
    return originalFetch(...args);
  }

  activeRequests++;
  emit("global:fetch-start");

  try {
    const res = await originalFetch(...args);
    return res;
  } finally {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      emit("global:fetch-end");
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
