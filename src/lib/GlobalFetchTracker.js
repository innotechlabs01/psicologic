let activeRequests = 0;

function emit(event) {
  window.dispatchEvent(new CustomEvent(event));
}

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  activeRequests++;
  emit("global:fetch-start");

  try {
    const res = await originalFetch(...args);
    return res;
  } finally {
    activeRequests--;
    if (activeRequests === 0) {
      emit("global:fetch-end");
    }
  }
};
