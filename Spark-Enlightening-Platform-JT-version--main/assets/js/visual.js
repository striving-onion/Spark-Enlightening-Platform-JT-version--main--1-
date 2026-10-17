/* Presentation only: theme preference and once-only section entrances. */
(() => {
  const root = document.documentElement;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'theme-toggle';
  const update = () => {
    const dark = root.dataset.theme === 'dark';
    toggle.textContent = dark ? '☀ 亮色' : '☾ 暗色';
    toggle.setAttribute('aria-label', dark ? '切换到亮色主题' : '切换到暗色主题');
    toggle.setAttribute('aria-pressed', String(dark));
  };
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('spark-theme', root.dataset.theme); } catch (_) {}
    update();
  });
  const host = document.querySelector('.site-nav') || document.querySelector('[data-theme-host]');
  if (host) host.append(toggle); else document.body.prepend(toggle);
  update();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const observed = new WeakSet();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 }) : null;
  function attach() {
    document.querySelectorAll('.course-grid .course-card, .section-head, .course-box, .testi-card, .faq-item, .card, .toc').forEach((el, i) => {
      if (observed.has(el)) return;
      observed.add(el);
      el.style.setProperty('--reveal-delay', `${i % 4 * 50}ms`);
      el.classList.add('reveal');
      if (media.matches || !observer) el.classList.add('is-visible');
      else observer.observe(el);
    });
  }
  attach();
  const grid = document.querySelector('#courseGrid');
  if (grid) new MutationObserver(attach).observe(grid, { childList: true });
  media.addEventListener('change', () => {
    if (media.matches) document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
      observer?.unobserve(el);
    });
  });
})();
