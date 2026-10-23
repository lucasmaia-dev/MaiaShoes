export const THEME_STORAGE_KEY = "maia:theme:v1";

// Executado antes de pintar a página para restaurar o tema sem um clarão inicial.
export const THEME_BOOT_SCRIPT = `(() => {
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try {
    const saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {}
  document.documentElement.dataset.theme = theme;
})();`;
