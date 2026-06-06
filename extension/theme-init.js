(function () {
  try {
    const stored = localStorage.getItem('esutabs.theme') || 'system';
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const mode = stored === 'system' ? sys : stored;
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.themePref = stored;
  } catch (e) {}
})();
