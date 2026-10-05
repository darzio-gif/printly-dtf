/* Printly — keep the current app page after a browser refresh */
(function () {
  'use strict';
  const KEY = 'printly.currentPage.v1';
  const labels = {
    'Commandes': 'dashboard',
    'Clients': 'customers',
    'Journal': 'activity',
    'Équipe': 'users',
    'Equipe': 'users'
  };
  const pageToLabel = Object.fromEntries(Object.entries(labels).map(([label, page]) => [page, label]));
  let restored = false;

  function getNav() {
    return document.querySelector('.sidebar .sideNav');
  }

  function getButtons() {
    const nav = getNav();
    return nav ? Array.from(nav.querySelectorAll('button')) : [];
  }

  function pageFromButton(button) {
    const text = (button.querySelector('span')?.textContent || button.textContent || '').trim();
    return labels[text] || null;
  }

  function attach() {
    getButtons().forEach(button => {
      if (button.dataset.pagePersistenceBound) return;
      button.dataset.pagePersistenceBound = '1';
      button.addEventListener('click', function () {
        const page = pageFromButton(button);
        if (page) localStorage.setItem(KEY, page);
      }, true);
    });
  }

  function restore() {
    if (restored) return;
    const wanted = localStorage.getItem(KEY);
    if (!wanted) return;
    const button = getButtons().find(b => pageFromButton(b) === wanted);
    if (!button) return;
    restored = true;
    // Let React finish its initial render before selecting the saved page.
    setTimeout(() => button.click(), 80);
  }

  function watch() {
    attach();
    restore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch, { once: true });
  } else {
    watch();
  }

  const observer = new MutationObserver(watch);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
})();
