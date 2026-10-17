/* Apply the saved presentation preference before styles paint. */
(() => {
  let theme;
  try { theme = localStorage.getItem('spark-theme'); } catch (_) {}
  document.documentElement.dataset.theme = theme === 'light' || theme === 'dark'
    ? theme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();
