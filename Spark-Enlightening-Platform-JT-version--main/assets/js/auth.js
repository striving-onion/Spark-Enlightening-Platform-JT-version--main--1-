/* ==========================================================================
 * auth.js — 三端账号体系（学生 / 教师 / 机构）
 *
 * 说明：当前站点是纯静态站，没有后端。这里实现的是一个「本机演示账户体系」：
 *   - 数据存在 localStorage，仅当前浏览器可见
 *   - 密码只做不可逆散列后存储，不保存明文
 *   - 它不是真实身份认证：任何人都能改本机存储
 *
 * 接入后端时，只需替换 AuthAPI 中标注 [远端] 的几个方法，
 * 其余页面代码（login.html / student.html / teacher.html / org.html）无需改动。
 * ========================================================================== */
window.SparkAuth = (function () {
  'use strict';

  const K_USERS   = 'spark-users';
  const K_SESSION = 'spark-session';
  const K_NEEDS   = 'spark-needs';
  const K_ORGS    = 'spark-orgs';

  const ROLES = {
    student: { label: '学生端', icon: '🎒', desc: '免费观看课程视频与课件，记录学习进度' },
    teacher: { label: '教师端', icon: '🧑‍🏫', desc: '示范课、课件资源包、演示工具与需求上报' },
    org:     { label: '机构端', icon: '🏛️', desc: '管理学校、教师与需求池，统一调配资源' }
  };

  /* ---------- 存储 ---------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  /* ---------- 散列（演示用，非安全加密） ---------- */
  function hash(text) {
    // djb2 变体：足够避免明文落盘，但不能抵御离线爆破。
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return 'h' + h.toString(36) + '-' + text.length.toString(36);
  }

  /* ---------- 校验工具 ---------- */
  function isValidIdCard(id) {
    if (!/^\d{17}[\dXx]$/.test(id)) return false;
    const w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const c = '10X98765432';
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += Number(id[i]) * w[i];
    return c[sum % 11] === id[17].toUpperCase();
  }
  function isValidStudentNo(no) { return /^[A-Za-z0-9-]{6,20}$/.test(no); }
  function isValidStaffNo(no) { return /^[A-Za-z0-9-]{4,20}$/.test(no); }

  /* ---------- 账户 ---------- */
  function users() { return read(K_USERS, []); }

  function findByAccount(account, role) {
    const key = String(account || '').trim().toLowerCase();
    return users().find(u => u.role === role && u.account.toLowerCase() === key) || null;
  }

  /**
   * 注册
   * [远端] 接后端时替换为 POST /api/auth/register
   */
  function register(payload) {
    const {
      role, account, password, name,
      school, studentNo, idCard,
      institution, staffNo, teacherType
    } = payload || {};

    if (!ROLES[role]) return { ok: false, msg: '请选择正确的端' };
    if (!account || !password) return { ok: false, msg: '账号和密码不能为空' };
    if (String(password).length < 6) return { ok: false, msg: '密码至少 6 位' };
    if (!name) return { ok: false, msg: '请填写姓名' };
    if (findByAccount(account, role)) return { ok: false, msg: '该账号已在当前端注册' };

    const base = {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      role, account: String(account).trim(), pwd: hash(password),
      name: String(name).trim(), createdAt: new Date().toISOString(),
      status: 'active'
    };

    if (role === 'student') {
      // 学生认证：学校 + 学号，或身份证号（二选一，学号优先）
      if (!school) return { ok: false, msg: '请填写学校名称' };
      if (studentNo && !isValidStudentNo(studentNo)) return { ok: false, msg: '学号格式不正确（6–20 位字母或数字）' };
      if (!studentNo && !idCard) return { ok: false, msg: '请填写学号或身份证号用于身份认证' };
      if (idCard && !isValidIdCard(idCard)) return { ok: false, msg: '身份证号校验未通过，请检查后重试' };
      Object.assign(base, {
        school: String(school).trim(),
        studentNo: studentNo ? String(studentNo).trim() : '',
        idCard: idCard ? String(idCard).trim().toUpperCase() : '',
        verifyType: studentNo ? 'studentNo' : 'idCard'
      });
    }

    if (role === 'teacher') {
      if (!institution) return { ok: false, msg: '请填写所在机构' };
      if (!teacherType) return { ok: false, msg: '请选择教师类型' };
      if (!staffNo || !isValidStaffNo(staffNo)) return { ok: false, msg: '请填写有效的工号或学号' };
      // 大学生支教：用工号字段承载学号，同时需要学校
      if (teacherType === 'volunteer' && !school) return { ok: false, msg: '大学生支教请填写所在高校' };
      Object.assign(base, {
        institution: String(institution).trim(),
        staffNo: String(staffNo).trim(),
        teacherType,
        school: school ? String(school).trim() : '',
        status: 'pending' // 教师注册需机构审核
      });
    }

    if (role === 'org') {
      if (!institution) return { ok: false, msg: '请填写机构名称' };
      if (!staffNo || !isValidStaffNo(staffNo)) return { ok: false, msg: '请填写机构管理员编号' };
      Object.assign(base, {
        institution: String(institution).trim(),
        staffNo: String(staffNo).trim(),
        status: 'pending' // 机构账号由平台开通
      });
    }

    const list = users();
    list.push(base);
    if (!write(K_USERS, list)) return { ok: false, msg: '本机存储已满，无法保存账户' };
    return { ok: true, user: base, msg: base.status === 'pending' ? '注册已提交，等待审核' : '注册成功' };
  }

  /**
   * 登录
   * [远端] 接后端时替换为 POST /api/auth/login {account,password,role}
   */
  function login(account, password, role) {
    if (!ROLES[role]) return { ok: false, msg: '请选择正确的端' };
    const u = findByAccount(account, role);
    if (!u) return { ok: false, msg: '账号不存在，请确认端选择是否正确' };
    if (u.pwd !== hash(password)) return { ok: false, msg: '密码不正确' };
    if (u.status === 'pending') return { ok: false, msg: '账号正在审核中，审核通过后方可登录' };
    if (u.status === 'disabled') return { ok: false, msg: '账号已被停用，请联系机构管理员' };

    write(K_SESSION, { userId: u.id, role: u.role, ts: Date.now() });
    return { ok: true, user: u };
  }

  function logout() {
    try { localStorage.removeItem(K_SESSION); } catch (e) {}
  }

  function current() {
    const s = read(K_SESSION, null);
    if (!s || !s.userId) return null;
    const u = users().find(x => x.id === s.userId);
    if (!u || u.status !== 'active') return null;
    return u;
  }

  /** 页面守卫：角色不符则跳登录页 */
  function requireRole(role) {
    const u = current();
    if (!u || u.role !== role) {
      const target = 'login.html?role=' + role;
      location.replace(target);
      return null;
    }
    return u;
  }

  /* ---------- 机构数据 ---------- */
  function orgs() { return read(K_ORGS, []); }
  function addOrg(org) {
    const list = orgs();
    org.id = 'org' + Date.now().toString(36);
    list.push(org);
    write(K_ORGS, list);
    return org;
  }

  /* ---------- 支教需求（教师上报 → 机构汇总） ---------- */
  function needs() { return read(K_NEEDS, []); }

  function addNeed(data) {
    const list = needs();
    const item = {
      id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      school: data.school,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      batch: data.batch || '',
      categories: data.categories || [],
      detail: data.detail || '',
      urgency: data.urgency || 'normal',
      status: 'pending',       // pending | planned | prepared | done
      createdAt: new Date().toISOString()
    };
    list.unshift(item);
    if (!write(K_NEEDS, list)) return { ok: false, msg: '本机存储已满，无法保存' };
    return { ok: true, item };
  }

  function updateNeed(id, patch) {
    const list = needs();
    const i = list.findIndex(n => n.id === id);
    if (i < 0) return false;
    list[i] = Object.assign({}, list[i], patch);
    write(K_NEEDS, list);
    return true;
  }

  /** 首次访问时写入演示数据，便于机构端立即有内容可看 */
  function seedOnce() {
    if (read('spark-seeded', false)) return;
    const demoNeeds = [
      { id: 'n-demo-1', school: '青山乡中心小学', teacherId: 'demo', teacherName: '李老师',
        batch: '2026 秋季第一批', categories: ['设备', '课程'], detail: '缺少投影设备，四年级以上学生未接触过计算机操作。希望提供无需设备即可开展的 AI 通识课。',
        urgency: 'high', status: 'planned', createdAt: '2026-09-18T02:00:00.000Z' },
      { id: 'n-demo-2', school: '河口镇第二小学', teacherId: 'demo', teacherName: '王老师',
        batch: '2026 秋季第一批', categories: ['师资', '教案'], detail: '当地教师对 AI 概念不熟悉，需要可直接照讲的示范课与配套教案。',
        urgency: 'normal', status: 'prepared', createdAt: '2026-09-22T06:30:00.000Z' },
      { id: 'n-demo-3', school: '石门村教学点', teacherId: 'demo', teacherName: '陈老师',
        batch: '2026 秋季第二批', categories: ['课程', '课外读物'], detail: '只有 12 名学生混班教学，希望有分龄的趣味科普材料与动手小游戏。',
        urgency: 'normal', status: 'pending', createdAt: '2026-10-02T08:10:00.000Z' }
    ];
    const demoUsers = [
      { id: 'demo-t1', role: 'teacher', account: 'T2026001', pwd: hash('123456'), name: '李老师',
        institution: '星火支教志愿服务中心', staffNo: 'T2026001', teacherType: 'volunteer',
        school: '师范大学', status: 'active', createdAt: '2026-08-01T00:00:00.000Z' },
      { id: 'demo-s1', role: 'student', account: '20260101', pwd: hash('123456'), name: '小明',
        school: '青山乡中心小学', studentNo: '20260101', idCard: '', verifyType: 'studentNo',
        status: 'active', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'demo-o1', role: 'org', account: 'ORG001', pwd: hash('123456'), name: '机构管理员',
        institution: '星火支教志愿服务中心', staffNo: 'ORG001', status: 'active',
        createdAt: '2026-07-01T00:00:00.000Z' }
    ];
    const u = users();
    const ids = new Set(u.map(x => x.id));
    demoUsers.forEach(x => { if (!ids.has(x.id)) u.push(x); });
    write(K_USERS, u);
    if (!read(K_NEEDS, []).length) write(K_NEEDS, demoNeeds);
    write('spark-seeded', true);
  }

  return {
    ROLES, register, login, logout, current, requireRole, users,
    needs, addNeed, updateNeed, orgs, addOrg, seedOnce,
    isValidIdCard, isValidStudentNo, isValidStaffNo
  };
})();
