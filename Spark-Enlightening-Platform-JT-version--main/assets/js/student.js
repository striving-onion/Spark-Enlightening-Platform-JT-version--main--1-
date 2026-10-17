/* ==========================================================================
 * student.js — 学生端
 * 免费观看课程视频与课件，记录学习进度
 * ========================================================================== */
(function () {
  'use strict';
  const A = window.SparkAuth;
  const user = A.requireRole('student');
  if (!user) return;

  const K_PROGRESS = 'spark-progress';
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch (e) { return f; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  /* ---------- 身份条 ---------- */
  document.getElementById('identName').textContent = user.name;
  document.getElementById('identMeta').textContent = user.school + ' · ' + user.studentNo;
  document.getElementById('greet').textContent = user.name + '，欢迎回来';

  document.getElementById('logoutBtn').addEventListener('click', () => {
    A.logout();
    location.href = 'login.html?role=student';
  });

  /* ---------- 数据 ---------- */
  let progress = read(K_PROGRESS, {});
  const courses = (window.COURSES || []).slice();

  function courseState(id) {
    const p = progress[id];
    if (!p) return { status: 'todo', label: '未开始', cls: 'normal' };
    if (p.finished) return { status: 'done', label: '已完成', cls: 'done' };
    return { status: 'doing', label: '学习中 ' + Math.min(99, Math.round(p.percent || 0)) + '%', cls: 'planned' };
  }

  function renderStats() {
    const total = courses.length;
    const done = courses.filter(c => progress[c.id] && progress[c.id].finished).length;
    const doing = courses.filter(c => progress[c.id] && !progress[c.id].finished).length;
    document.getElementById('statTotal').innerHTML = total + '<small>门</small>';
    document.getElementById('statDone').innerHTML = done + '<small>门</small>';
    document.getElementById('statDoing').innerHTML = doing + '<small>门</small>';
    document.getElementById('statRate').innerHTML =
      (total ? Math.round(done / total * 100) : 0) + '<small>%</small>';
  }

  /* ---------- 课程列表 ---------- */
  const grid = document.getElementById('myCourses');
  const filter = document.getElementById('courseFilter');

  function renderCourses() {
    const key = filter.value;
    const list = key === 'all' ? courses
      : key === 'doing' ? courses.filter(c => courseState(c.id).status === 'doing')
      : key === 'done'  ? courses.filter(c => courseState(c.id).status === 'done')
      : courses.filter(c => courseState(c.id).status === 'todo');

    if (!list.length) {
      grid.innerHTML = '<p class="empty-state">这个分类下暂时没有课程。切换到「全部课程」看看吧。</p>';
      return;
    }

    grid.innerHTML = list.map(c => {
      const st = courseState(c.id);
      return `<article class="list-item">
        <div>
          <h3>${c.title}</h3>
          <p class="meta">${c.tag}</p>
          <div class="chips">
            <span class="badge ${st.cls}">${st.label}</span>
          </div>
        </div>
        <div class="actions">
          <a class="btn-sm primary" href="course.html?id=${c.id}">${st.status === 'todo' ? '开始学习' : '继续学习'}</a>
          ${st.status !== 'done' && st.status !== 'todo'
            ? `<button class="btn-sm" data-finish="${c.id}">标记完成</button>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  filter.addEventListener('change', renderCourses);

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-finish]');
    if (!btn) return;
    const id = btn.dataset.finish;
    progress[id] = Object.assign({}, progress[id], { finished: true, percent: 100, at: Date.now() });
    write(K_PROGRESS, progress);
    renderStats();
    renderCourses();
    window.showToast && window.showToast('已标记为完成');
  });

  renderStats();
  renderCourses();

  /* ---------- PPT / 课件（资源广场占位） ---------- */
  const resources = [
    { title: '数据读心术 · 课堂课件', type: 'PPT', note: '20 页 · 可在页面内播放' },
    { title: '人机共舞术 · 课堂课件', type: 'PPT', note: '18 页 · 可在页面内播放' },
    { title: '伦理守护盾 · 课堂课件', type: 'PPT', note: '16 页 · 可在页面内播放' }
  ];
  document.getElementById('resourceList').innerHTML = resources.map(r => `
    <article class="list-item">
      <div>
        <h3>${r.title}</h3>
        <p class="meta">${r.note}</p>
      </div>
      <div class="actions">
        <span class="chip">${r.type}</span>
        <button class="btn-sm" disabled title="资源广场上线后开放">即将开放</button>
      </div>
    </article>`).join('');
})();
