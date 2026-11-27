(() => {
  const path = window.location.pathname;
  const hasFixedSidebar = path.includes('/profile/') || path.includes('/register/');

  if (hasFixedSidebar) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'cashdash-sidebar-fixed cashdash-sidebar';
    sidebar.setAttribute('aria-label', 'Головна навігація');
    const isProfile = path.includes('/profile/');
    sidebar.innerHTML = `
      <button class="nav-item" type="button" data-nav-action="menu" aria-expanded="false" title="Меню">
        <span aria-hidden="true">☰</span><span class="nav-item-label">Меню</span>
      </button>
      <a class="nav-item" href="../home/home.html" title="Головна"><span aria-hidden="true">⌂</span><span class="nav-item-label">Головна</span></a>
      <a class="nav-item" href="../bet/bet.html" title="Спорт"><span aria-hidden="true">⚽</span><span class="nav-item-label">Спорт</span></a>
      <a class="nav-item${isProfile ? ' is-active' : ''}" href="../profile/profile.html" title="Акаунт"><span aria-hidden="true">👤</span><span class="nav-item-label">Акаунт</span></a>
      <button class="nav-item" type="button" data-nav-action="support" title="Підтримка"><span aria-hidden="true">🎧</span><span class="nav-item-label">Підтримка</span></button>`;
    document.body.append(sidebar);

    const dialog = document.createElement('dialog');
    dialog.className = 'cashdash-nav-dialog';
    dialog.innerHTML = `<div class="cashdash-nav-dialog-header"><h2>Підтримка</h2><button type="button" aria-label="Закрити">×</button></div><div class="cashdash-nav-dialog-content">Якщо потрібна допомога, перевірте розділ правил або зверніться через <a href="mailto:support@cashdash.example">support@cashdash.example</a>.</div>`;
    document.body.append(dialog);

    sidebar.querySelector('[data-nav-action="menu"]').addEventListener('click', (event) => {
      const expanded = sidebar.classList.toggle('expanded');
      event.currentTarget.setAttribute('aria-expanded', String(expanded));
    });

    sidebar.querySelector('[data-nav-action="support"]').addEventListener('click', () => dialog.showModal());
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }

  if (!path.includes('/home/')) {
    document.querySelectorAll('.cashdash-sidebar [data-nav-action="menu"]').forEach((button) => {
      if (button.dataset.sharedNavigationBound) return;
      button.dataset.sharedNavigationBound = 'true';
      button.addEventListener('click', () => {
        const sidebar = button.closest('.cashdash-sidebar');
        if (!sidebar) return;
        const expanded = sidebar.classList.toggle('expanded');
        button.setAttribute('aria-expanded', String(expanded));
      });
    });
  }
})();
