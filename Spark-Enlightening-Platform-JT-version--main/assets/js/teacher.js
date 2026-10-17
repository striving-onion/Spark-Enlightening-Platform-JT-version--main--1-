/* ==========================================================================
 * teacher.js — 教师端
 * 示范课 / 课件资源包 / 演示工具 / 支教需求上报
 * ========================================================================== */
(function () {
  'use strict';
  const A = window.SparkAuth;
  const user = A.requireRole('teacher');
  if (!user) return;

  const $ = id => document.getElementById(id);

  $('identName').textContent = user.name;
  $('identMeta').textContent = user.institution +
    (user.teacherType === 'volunteer' ? ' · 大学生支教' : ' · 在职教师') +
    ' · ' + user.staffNo;

  $('logoutBtn').addEventListener('click', () => {
    A.logout();
    location.href = 'login.html?role=teacher';
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

  /* ---------- 示范课（真实课程数据 + 标记） ---------- */
  const demoCourses = [
    { id: 1, title: '数据读心术 · 示范课', type: '数据读心术', len: '40 分钟', level: '四年级以上', note: '从生活中的文字与图片切入，适合零设备课堂。' },
    { id: 4, title: '人机共舞术 · 示范课', type: '人机共舞术', len: '35 分钟', level: '五年级以上', note: '用对话示例讲解提示词，可配合纸笔完成。' },
    { id: 7, title: '伦理守护盾 · 示范课', type: '伦理守护盾', len: '30 分钟', level: '四年级以上', note: '以隐私与网络安全为主题，适合班会课。' },
    { id: 8, title: '跨界编织者 · 示范课', type: '跨界编织者', len: '45 分钟', level: '六年级以上', note: '展示 AI 绘画与视频，激发兴趣与讨论。' }
  ];

  $('demoList').innerHTML = demoCourses.map(c => `
    <article class="list-item">
      <div>
        <h3>${c.title}</h3>
        <p class="meta">${c.type} · ${c.len} · 适用 ${c.level}</p>
        <p class="meta">${c.note}</p>
      </div>
      <div class="actions">
        <a class="btn-sm primary" href="course.html?id=${c.id}">观看示范课</a>
        <button class="btn-sm" data-outline="${c.id}">查看教案</button>
      </div>
    </article>`).join('');

  $('demoList').addEventListener('click', e => {
    const btn = e.target.closest('[data-outline]');
    if (btn) window.showToast && window.showToast('教案资源包将在资源广场上线后开放下载缩略页');
  });

  /* ---------- 资源包 ---------- */
  const packs = [
    { name: '零设备版 · 数据读心术资源包', items: '课件 20 页 · 课堂练习 4 份 · 教具清单 1 份', size: '12.4 MB' },
    { name: '零设备版 · 人机共舞术资源包', items: '课件 18 页 · 对话脚本 6 段 · 板书卡 1 套', size: '9.8 MB' },
    { name: '班会版 · 伦理守护盾资源包', items: '课件 16 页 · 情景讨论卡 8 张', size: '7.2 MB' },
    { name: '启发版 · 跨界编织者资源包', items: '课件 22 页 · 作品示例 12 张', size: '18.6 MB' }
  ];
  $('packList').innerHTML = packs.map(p => `
    <article class="list-item">
      <div>
        <h3>${p.name}</h3>
        <p class="meta">${p.items}</p>
        <p class="meta">${p.size}</p>
      </div>
      <div class="actions">
        <button class="btn-sm" data-pack>申请领取</button>
      </div>
    </article>`).join('');

  $('packList').addEventListener('click', e => {
    if (e.target.closest('[data-pack]')) {
      window.showToast && window.showToast('已记录领取申请，机构端可统一打包下发');
    }
  });

  /* ---------- 演示工具 ---------- */
  const tools = [
    { icon: '🤖', name: 'AI 猜数字', desc: '讲解输入、判断与反馈，可现场互动 5 分钟。', href: 'game.html' },
    { icon: '🃏', name: '提示词卡片', desc: '把提示词拆成角色、任务、格式三张卡，学生分组拼装。', href: null },
    { icon: '🎭', name: '场景判断题', desc: 'AI 应用对错判断，适合班会课快速投票。', href: null }
  ];
  $('toolList').innerHTML = tools.map(t => `
    <article class="list-item">
      <div>
        <h3>${t.icon} ${t.name}</h3>
        <p class="meta">${t.desc}</p>
      </div>
      <div class="actions">
        ${t.href
          ? `<a class="btn-sm primary" href="${t.href}">打开工具</a>`
          : `<button class="btn-sm" data-tool>查看说明</button>`}
      </div>
    </article>`).join('');

  $('toolList').addEventListener('click', e => {
    if (e.target.closest('[data-tool]')) {
      window.showToast && window.showToast('该工具尚在准备中，可先用「AI 猜数字」开展课堂互动');
    }
  });

  /* ---------- 需求上报 ---------- */
  const CATS = ['课程', '设备', '师资', '教案', '课外读物', '场地', '其他'];
  $('needCats').innerHTML = CATS.map(c => `
    <label><input type="checkbox" name="cats" value="${c}"/> ${c}</label>`).join('');

  const myNeedsBox = $('myNeeds');

  function renderMyNeeds() {
    const mine = A.needs().filter(n => n.teacherId === user.id);
    if (!mine.length) {
      myNeedsBox.innerHTML = '<p class="empty-state">还没有提交过需求。支教结束后，把学校缺少的东西记下来吧。</p>';
      return;
    }
    const label = { pending: '待汇总', planned: '已列入计划', prepared: '已备好资源', done: '已落实' };
    myNeedsBox.innerHTML = mine.map(n => `
      <article class="list-item">
        <div>
          <h3>${n.school}</h3>
          <p class="meta">${n.batch || '未填写批次'} · ${new Date(n.createdAt).toLocaleDateString('zh-CN')}</p>
          <p class="meta">${n.detail || '（无详细说明）'}</p>
          <div class="chips">
            ${(n.categories || []).map(c => `<span class="chip">${c}</span>`).join('')}
            <span class="badge ${n.status}">${label[n.status] || n.status}</span>
            ${n.urgency === 'high' ? '<span class="badge high">紧急</span>' : ''}
          </div>
        </div>
      </article>`).join('');
  }

  $('needForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const cats = [...form.querySelectorAll('input[name="cats"]:checked')].map(i => i.value);
    const school = form.elements.school.value.trim();
    const detail = form.elements.detail.value.trim();

    if (!school) { window.showToast && window.showToast('请填写学校名称'); form.elements.school.focus(); return; }
    if (!cats.length) { window.showToast && window.showToast('请至少选择一项缺少的内容'); return; }
    if (detail.length < 10) { window.showToast && window.showToast('请再详细描述一下具体情况（至少 10 个字）'); form.elements.detail.focus(); return; }

    const res = A.addNeed({
      school,
      batch: form.elements.batch.value.trim(),
      categories: cats,
      detail,
      urgency: form.elements.urgency.value,
      teacherId: user.id,
      teacherName: user.name
    });

    if (!res.ok) { window.showToast && window.showToast(res.msg); return; }

    form.reset();
    renderMyNeeds();
    window.showToast && window.showToast('需求已提交，机构端可以看到了');
  });

  renderMyNeeds();
})();
