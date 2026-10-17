/* Shared local feedback and accessible modal handling. */
(() => {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  let timer;
  window.showToast = message => {
    clearTimeout(timer);
    toast.textContent = message;
    timer = setTimeout(() => { toast.textContent = ''; }, 4500);
  };
  let active = null;
  let previous = null;
  const focusable = () => [...active.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
  window.openDialog = id => {
    if (active) window.closeDialog();
    active = document.getElementById(id);
    if (!active) return;
    previous = document.activeElement;
    active.style.display = 'flex';
    active.removeAttribute('inert');
    document.body.classList.add('modal-open');
    for (const child of document.body.children) {
      if (child !== active && child !== toast && !['SCRIPT','STYLE','LINK'].includes(child.tagName)) {
        child.setAttribute('data-dialog-inert', '');
        child.inert = true;
      }
    }
    (active.querySelector('input:not([type="file"])') || focusable()[0] || active).focus();
  };
  window.closeDialog = () => {
    if (!active) return;
    active.style.display = 'none';
    active.inert = true;
    active = null;
    document.body.classList.remove('modal-open');
    document.querySelectorAll('[data-dialog-inert]').forEach(el => { el.inert = false; el.removeAttribute('data-dialog-inert'); });
    if (previous && previous.isConnected) previous.focus();
  };
  document.querySelectorAll('.modal-mask').forEach(mask => mask.addEventListener('click', e => { if (e.target === mask) closeDialog(); }));
  document.addEventListener('keydown', e => {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); }
    if (e.key !== 'Tab') return;
    const items = focusable();
    const first = items[0], last = items[items.length-1];
    if (!first) { e.preventDefault(); active.focus(); return; }
    if (e.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
})();
