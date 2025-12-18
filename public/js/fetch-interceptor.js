(function () {
  let activeFetches = 0;

  const originalFetch = window.fetch;

  function updateLoader() {
    const loader = document.getElementById("global-loader");
    if (!loader) return;

    if (activeFetches > 0) loader.classList.add("show");
    else loader.classList.remove("show");
  }

  window.fetch = async (...args) => {
    activeFetches++;
    updateLoader();

    try {
      const res = await originalFetch(...args);
      return res;
    } finally {
      activeFetches--;
      updateLoader();
    }
  };
})();
