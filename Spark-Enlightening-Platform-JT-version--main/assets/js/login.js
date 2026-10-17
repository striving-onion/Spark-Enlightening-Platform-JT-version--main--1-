/* ==========================================================================
 * login.js — 登录 / 注册页交互
 * 依赖：auth.js
 * ========================================================================== */
(function () {
  'use strict';

  if (!window.SparkAuth) return;
  const A = window.SparkAuth;
  A.seedOnce();

  const params = new URLSearchParams(location.search);
  const state = { role: 'student', mode: 'login' };

  const $ = sel => document.querySelector(sel);

  /* ---------- 面板切换 ---------- */
  function setRole(role) {
    if (!A.ROLES[role]) role = 'student';
    state.role = role;

    document.querySelectorAll('[data-role-tab]').forEach(btn => {
      const on = btn.dataset.roleTab === role;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-role-panel]').forEach(panel => {
      // 注册面板只在注册模式下可见；登录模式下全部隐藏，避免和登录表单同时出现
      panel.hidden = state.mode !== 'register' || panel.dataset.rolePanel !== role;
    });

    const meta = A.ROLES[role];
    const title = $('#formTitle');
    if (title) title.textContent = (state.mode === 'login' ? '登录' : '注册') + meta.label;
    const hint = $('#roleHint');
    if (hint) hint.textContent = meta.desc;
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode-tab]').forEach(btn => {
      const on = btn.dataset.modeTab === mode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
    });
    const isLogin = mode === 'login';
    document.querySelectorAll('[data-when="login"]').forEach(el => { el.hidden = !isLogin; });
    setRole(state.role);
  }

  /* ---------- 反馈 ---------- */
  let timer;
  function say(msg, type) {
    const box = $('#authMsg');
    if (!box) return;
    clearTimeout(timer);
    box.textContent = msg;
    box.className = 'auth-msg ' + (type || 'info');
    box.hidden = !msg;
    if (msg) timer = setTimeout(() => { box.hidden = true; }, 5000);
  }

  function field(form, name) {
    const el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', e => {
    const roleTab = e.target.closest('[data-role-tab]');
    if (roleTab) { setRole(roleTab.dataset.roleTab); return; }

    const modeTab = e.target.closest('[data-mode-tab]');
    if (modeTab) { setMode(modeTab.dataset.modeTab); return; }

    const goto = e.target.closest('[data-goto-mode]');
    if (goto) {
      e.preventDefault();
      setMode(goto.dataset.gotoMode);
      return;
    }
  });

  /* 键盘左右切换角色 tab */
  const tablist = $('[role="tablist"]');
  if (tablist) {
    tablist.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const tabs = [...tablist.querySelectorAll('[data-role-tab]')];
      const i = tabs.findIndex(t => t.dataset.roleTab === state.role);
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      setRole(next.dataset.roleTab);
      next.focus();
      e.preventDefault();
    });
  }

  /* 登录 */
  document.querySelectorAll('form[data-login-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const res = A.login(field(form, 'account'), form.elements.password.value, state.role);
      if (!res.ok) { say(res.msg, 'error'); return; }
      say('登录成功，正在进入' + A.ROLES[state.role].label + '…', 'ok');
      const dest = { student: 'student.html', teacher: 'teacher.html', org: 'org.html' }[state.role];
      setTimeout(() => { location.href = dest; }, 500);
    });
  });

  /* 注册 */
  document.querySelectorAll('form[data-register-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const role = form.dataset.registerForm;
      const payload = {
        role,
        account: field(form, 'account'),
        password: form.elements.password.value,
        password2: form.elements.password2 ? form.elements.password2.value : undefined,
        name: field(form, 'name'),
        school: field(form, 'school'),
        studentNo: field(form, 'studentNo'),
        idCard: field(form, 'idCard'),
        institution: field(form, 'institution'),
        staffNo: field(form, 'staffNo'),
        teacherType: field(form, 'teacherType')
      };
      if (payload.password2 !== undefined && payload.password !== payload.password2) {
        say('两次输入的密码不一致', 'error'); return;
      }
      const res = A.register(payload);
      if (!res.ok) { say(res.msg, 'error'); return; }
      say(res.msg, 'ok');
      if (role === 'student') {
        form.reset();
        setMode('login');
        const loginForm = document.querySelector('form[data-login-form]');
        if (loginForm) loginForm.elements.account.value = payload.account;
      } else {
        form.reset();
      }
    });
  });

  /* 身份证：输入时自动大写末位 X */
  document.querySelectorAll('input[name="idCard"]').forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^\dXx]/g, '').toUpperCase().slice(0, 18);
    });
  });

  /* 学号只允许字母数字与连字符 */
  document.querySelectorAll('input[name="studentNo"], input[name="staffNo"]').forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20);
    });
  });

  /* 已登录则直接跳转对应端 */
  const existing = A.current();
  if (existing) {
    const dest = { student: 'student.html', teacher: 'teacher.html', org: 'org.html' }[existing.role];
    location.replace(dest);
    return;
  }

  /* 初始化：URL 可指定 ?role=teacher&mode=register */
  setMode(params.get('mode') === 'register' ? 'register' : 'login');
  setRole(params.get('role') || 'student');
})();
