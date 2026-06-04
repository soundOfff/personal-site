/* theme.js — light/dark toggle, persisted. Shared by all variants. */
(function () {
  const KEY = 'fq-site-theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(KEY);
  if (saved === 'dark') root.setAttribute('data-theme', 'dark');

  function sync() {
    const dark = root.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('[data-theme-toggle] use').forEach(u => {
      u.setAttribute('href', dark ? 'icons.svg#i-sun' : 'icons.svg#i-moon');
    });
  }
  function toggle() {
    const dark = root.getAttribute('data-theme') === 'dark';
    if (dark) { root.removeAttribute('data-theme'); localStorage.setItem(KEY, 'light'); }
    else { root.setAttribute('data-theme', 'dark'); localStorage.setItem(KEY, 'dark'); }
    sync();
  }
  function boot() {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggle));
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
