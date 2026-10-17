/* ==========================================================================
 * org.js — 机构端（PC 后台）
 *
 * 设计依据：支教公益机构的两个核心痛点
 *   1. 学校需求靠人工调研、响应慢   → 「需求池」集中收集教师上报，可视化优先级
 *   2. 物资与师资调配靠经验、缺数据 → 「数据看板」+「学校档案」提供决策依据
 * ========================================================================== */
(function () {
  'use strict';
  const A = window.SparkAuth;
  const user = A.requireRole('org');
  if (!user) return;

  const $ = id => document.getElementById(id);

  $('identName').textContent = user.name;
  $('identMeta').textContent = user.institution + ' · ' + user.staffNo;

  $('logoutBtn').addEventListener('click', () => {
    A.logout();
    location.href = 'login.html?role=org';
  });

  /* ---------- 选项卡 ---------- */
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      document.querySelectorAll('[data-tab-panel]').forEach(p => {
        p.hidden = p.dataset.tabPanel !== btn.dataset.tab;
      });
    });
  });

  const STATUS_LABEL = { pending: '待汇总', planned: '已列入计划', prepared: '已备好资源', done: '已落实' };
  const STATUS_ORDER = ['pending', 'planned', 'prepared', 'done'];

  /* ---------- 需求池 ---------- */
  const needList = $('needList');
  const statusFilter = $('needStatusFilter');

  function needs() { return A.needs(); }

  function renderNeeds() {
    const all = needs();
    const key = statusFilter.value;
    const list = key === 'all' ? all : all.filter(n => n.status === key);

    if (!list.length) {
      needList.innerHTML = '<p class="empty-state">当前筛选下没有需求。</p>';
      return;
    }

    needList.innerHTML = list.map(n => `
      <article class="list-item">
        <div style="min-width:0">
          <h3>${esc(n.school)}</h3>
          <p class="meta">${esc(n.teacherName || '—')} 提交 · ${esc(n.batch || '未填写批次')} · ${new Date(n.createdAt).toLocaleDateString('zh-CN')}</p>
          <p class="meta">${esc(n.detail || '（无详细说明）')}</p>
          <div class="chips">
            ${(n.categories || []).map(c => `<span class="chip">${esc(c)}</span>`).join('')}
            <span class="badge ${n.status}">${STATUS_LABEL[n.status] || n.status}</span>
            ${n.urgency === 'high' ? '<span class="badge high">紧急</span>' : ''}
          </div>
        </div>
        <div class="actions">
          <label class="sr-only" for="st-${n.id}">更新状态</label>
          <select id="st-${n.id}" data-need="${n.id}">
            ${STATUS_ORDER.map(s => `<option value="${s}"${s === n.status ? ' selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}
          </select>
        </div>
      </article>`).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  statusFilter.addEventListener('change', renderNeeds);

  needList.addEventListener('change', e => {
    const sel = e.target.closest('[data-need]');
    if (!sel) return;
    A.updateNeed(sel.dataset.need, { status: sel.value });
    window.showToast && window.showToast('状态已更新为「' + STATUS_LABEL[sel.value] + '」');
    renderStats();
    renderNeeds();
  });

  /* ---------- 统计 ---------- */
  function renderStats() {
    const all = needs();
    const schools = new Set(all.map(n => n.school));
    const done = all.filter(n => n.status === 'done').length;
    const pending = all.filter(n => n.status === 'pending').length;
    const high = all.filter(n => n.urgency === 'high' && n.status !== 'done').length;

    $('statSchools').innerHTML = schools.size + '<small>所</small>';
    $('statNeeds').innerHTML = all.length + '<small>条</small>';
    $('statPending').innerHTML = pending + '<small>条</small>';
    $('statDone').innerHTML = all.length ? Math.round(done / all.length * 100) + '<small>%</small>' : '0<small>%</small>';
    $('statHigh').innerHTML = high + '<small>条</small>';

    // 分类分布
    const dist = {};
    all.forEach(n => (n.categories || []).forEach(c => { dist[c] = (dist[c] || 0) + 1; }));
    const rows = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...rows.map(r => r[1]));
    $('catChart').innerHTML = rows.length ? rows.map(([name, count]) => `
      <div class="bar-row">
        <span class="bar-label">${esc(name)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.round(count / max * 100)}%"></span></span>
        <span class="bar-value">${count}</span>
      </div>`).join('') : '<p class="empty-state">暂无数据</p>';
  }

  /* ---------- 教师审核 ---------- */
  const teacherList = $('teacherList');
  function renderTeachers() {
    const teachers = A.users().filter(u => u.role === 'teacher');
    if (!teachers.length) {
      teacherList.innerHTML = '<p class="empty-state">还没有教师账号。</p>';
      return;
    }
    teacherList.innerHTML = teachers.map(t => `
      <article class="list-item">
        <div>
          <h3>${esc(t.name)}</h3>
          <p class="meta">${esc(t.institution)} · ${t.teacherType === 'volunteer' ? '大学生支教' : '在职教师'} · 工号 ${esc(t.staffNo)}</p>
          <div class="chips">
            <span class="badge ${t.status === 'active' ? 'done' : t.status === 'pending' ? 'pending' : 'normal'}">
              ${t.status === 'active' ? '已通过' : t.status === 'pending' ? '待审核' : '已停用'}
            </span>
          </div>
        </div>
        <div class="actions">
          ${t.status === 'pending' ? `<button class="btn-sm primary" data-approve="${t.id}">通过审核</button>` : ''}
          ${t.status === 'active' ? `<button class="btn-sm" data-disable="${t.id}">停用</button>` : ''}
          ${t.status === 'disabled' ? `<button class="btn-sm" data-enable="${t.id}">恢复</button>` : ''}
        </div>
      </article>`).join('');
  }

  teacherList.addEventListener('click', e => {
    const btn = e.target.closest('button[data-approve],button[data-disable],button[data-enable]');
    if (!btn) return;
    const users = A.users();
    const id = btn.dataset.approve || btn.dataset.disable || btn.dataset.enable;
    const u = users.find(x => x.id === id);
    if (!u) return;
    u.status = btn.dataset.approve ? 'active' : btn.dataset.disable ? 'disabled' : 'active';
    try { localStorage.setItem('spark-users', JSON.stringify(users)); } catch (err) {}
    window.showToast && window.showToast('教师账号状态已更新');
    renderTeachers();
  });

  /* ---------- 学校档案 ---------- */
  const schoolList = $('schoolList');
  function renderSchools() {
    const all = needs();
    const map = {};
    all.forEach(n => {
      if (!map[n.school]) map[n.school] = { name: n.school, count: 0, high: 0, cats: new Set(), last: n.createdAt };
      const s = map[n.school];
      s.count++;
      if (n.urgency === 'high') s.high++;
      (n.categories || []).forEach(c => s.cats.add(c));
      if (n.createdAt > s.last) s.last = n.createdAt;
    });
    const rows = Object.values(map).sort((a, b) => b.count - a.count);
    if (!rows.length) { schoolList.innerHTML = '<p class="empty-state">暂无学校记录。</p>'; return; }
    schoolList.innerHTML = rows.map(s => `
      <article class="list-item">
        <div>
          <h3>${esc(s.name)}</h3>
          <p class="meta">累计 ${s.count} 条需求 · 最近 ${new Date(s.last).toLocaleDateString('zh-CN')}</p>
          <div class="chips">
            ${[...s.cats].map(c => `<span class="chip">${esc(c)}</span>`).join('')}
            ${s.high ? `<span class="badge high">${s.high} 条紧急</span>` : ''}
          </div>
        </div>
      </article>`).join('');
  }

  /* ---------- 资源调配建议 ---------- */
  function renderAdvice() {
    const all = needs().filter(n => n.status !== 'done');
    const tips = [];
    const catCount = {};
    all.forEach(n => (n.categories || []).forEach(c => { catCount[c] = (catCount[c] || 0) + 1; }));
    const top = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

    if (top) tips.push(`当前未落实需求中，「${esc(top[0])}」缺口最大（${top[1]} 条），建议优先准备对应资源。`);
    const highSchools = new Set(all.filter(n => n.urgency === 'high').map(n => n.school));
    if (highSchools.size) tips.push(`有 ${highSchools.size} 所学校提交了紧急需求，建议排入下一批次。`);
    const noBatch = all.filter(n => !n.batch).length;
    if (noBatch) tips.push(`有 ${noBatch} 条需求未填写支教批次，建议补录以便排期。`);

    $('adviceList').innerHTML = tips.length
      ? tips.map(t => `<article class="list-item"><div><p class="meta">${t}</p></div></article>`).join('')
      : '<p class="empty-state">暂无调配建议。</p>';
  }

  /* ---------- 初始化 ---------- */
  renderStats();
  renderNeeds();
  renderTeachers();
  renderSchools();
  renderAdvice();
})();
