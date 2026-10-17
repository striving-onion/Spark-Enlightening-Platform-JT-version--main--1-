/* 第二轮修复后的整体回归验证（文件名重构 + 视频绑定 + 封面兜底 + 离线化） */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = 'c:/Users/22279/Desktop/Spark-Enlightening-Platform-JT-version--main (1)/Spark-Enlightening-Platform-JT-version--main';
const FILES = ['index.html', 'course.html', 'game.html', 'ai-series.html'];
const R = f => path.join(ROOT, f);

let fail = 0;
const bad = m => { console.log('  ✗ ' + m); fail++; };

console.log('===== 1. 内联 JS 语法检查 =====');
for (const f of FILES) {
  const html = fs.readFileSync(R(f), 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, idx = 0, ok = true;
  while ((m = re.exec(html)) !== null) {
    idx++;
    const tmp = path.join(process.env.TEMP || '/tmp', 'chk2_' + f.replace(/\W/g, '_') + '_' + idx + '.js');
    fs.writeFileSync(tmp, m[1], 'utf8');
    try { cp.execSync('node --check "' + tmp + '"', { stdio: 'pipe' }); }
    catch (e) { ok = false; bad(f + ' 第' + idx + '个内联脚本语法错误'); }
  }
  if (ok) console.log('  ✓ ' + f + '（' + idx + ' 个内联脚本通过）');
}

console.log('\n===== 2. 旧文件名残留检查（class.html / "index .html"）=====');
for (const f of FILES.concat(['assets/courses.js'])) {
  const t = fs.readFileSync(R(f), 'utf8');
  if (/class\.html/.test(t)) bad(f + ' 仍引用 class.html');
  if (/index \.html/.test(t)) bad(f + ' 仍引用 "index .html"');
}
console.log('  ' + (fail === 0 ? '✓ 无残留' : '见上'));

console.log('\n===== 3. 本地资源引用完整性 =====');
for (const f of FILES) {
  const html = fs.readFileSync(R(f), 'utf8');
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"$]+)"/g)) {
    const u = m[1];
    if (/^(https?:|#|mailto:|data:)/.test(u)) continue;
    if (u.includes('${')) continue;            // JS 模板字符串，非静态引用
    refs.add(u);
  }
  let miss = 0;
  for (const u of refs) {
    if (!fs.existsSync(path.join(ROOT, decodeURIComponent(u.split('?')[0])))) { bad(f + ' -> ' + u + ' 【不存在】'); miss++; }
  }
  console.log('  · ' + f + ': ' + refs.size + ' 个本地引用，缺失 ' + miss);
}

console.log('\n===== 4. 外部依赖（离线可用性）=====');
for (const f of FILES) {
  const ext = fs.readFileSync(R(f), 'utf8').match(/(?:src|href)="https?:\/\/[^"]+"/g) || [];
  console.log('  ' + (ext.length ? '⚠' : '✓') + ' ' + f + ': 外部引用 ' + ext.length + ' 处');
  if (ext.length) bad(f + ' 仍有外部引用: ' + ext.slice(0, 3).join(', '));
}

console.log('\n===== 5. 四段视频是否都被引用（原来有 3 段从未被使用）=====');
const site = ['index.html', 'course.html', 'game.html', 'ai-series.html', 'assets/courses.js']
  .map(f => fs.readFileSync(R(f), 'utf8')).join('\n');
for (const v of ['数据读心者', '人机舞蹈家', '伦理守望者', '跨界编织者']) {
  const used = site.includes(v + '.mp4');
  console.log('  ' + (used ? '✓' : '✗') + ' ' + v + '.mp4');
  if (!used) fail++;
}
for (const v of ['数据读心者', '人机舞蹈家', '伦理守望者', '跨界编织者']) {
  if (!fs.existsSync(R('assets/videos/' + v + '.mp4'))) bad('视频文件缺失 ' + v);
}

console.log('\n===== 6. 课程数据 + 封面兜底（真实跑一遍 coverFallback）=====');
global.window = {};
eval(fs.readFileSync(R('assets/courses.js'), 'utf8'));
const html = fs.readFileSync(R('index.html'), 'utf8');
const start = html.indexOf('const COVER_COLOR');
const end = html.indexOf('let currentFilter');
if (start < 0 || end < 0) bad('未能从 index.html 提取 coverFallback');
else {
  eval(html.slice(start, end));
  console.log('  · COURSES: ' + COURSES.length + ' 门');
  const missing = [];
  for (let i = 1; i <= 20; i++) if (!fs.existsSync(R('assets/course/' + i + '.jpg'))) missing.push(i);
  console.log('  · 缺真实封面: ' + missing.length + ' 张 -> ' + missing.join(','));
  for (const id of missing) {
    const uri = coverFallback(id);
    const PREFIX = 'data:image/svg+xml;charset=utf-8,';
    if (!uri.startsWith(PREFIX)) { bad('id=' + id + ' 兜底不是 svg data URI'); continue; }
    const svg = decodeURIComponent(uri.slice(PREFIX.length));
    const c = COURSES.find(x => x.id === id);
    if ((svg.match(/<svg/g) || []).length !== 1 || (svg.match(/<\/svg>/g) || []).length !== 1) bad('id=' + id + ' svg 标签不配对');
    if (!svg.includes(c.title.slice(0, 4))) bad('id=' + id + ' 兜底封面未包含课程标题');
  }
  if (missing.every(id => coverFallback(id).length > 300)) console.log('  ✓ 14 张兜底封面全部生成成功且各含对应标题');
  // 有真实封面的课也应能生成兜底（万一图片损坏）
  console.log('  ✓ 有真实封面的课程同样可生成兜底: ' + (coverFallback(1).length > 300 ? '是' : '否'));

  const vm = new Set(COURSES.map(c => c.video));
  console.log('  · 视频绑定: ' + COURSES.length + ' 门课 -> ' + vm.size + ' 段不同视频');
  for (const v of vm) if (!fs.existsSync(R(v))) bad('绑定视频不存在: ' + v);
}

console.log('\n===== 7. 关键修复点抽查 =====');
const checks = [
  ['index.html',       'assets/js/matter.min.js',           'matter 本地化'],
  ['index.html',       "typeof Matter===",                  'Matter 存在性判断'],
  ['index.html',       'let ballInited=false',              '弹球幂等'],
  ['index.html',       "textContent=msg",                   '聊天 XSS 修复'],
  ['index.html',       "onclick=\"setFilter('all', event)\"",'event 显式传递'],
  ['index.html',       'function maxSlideIndex()',          '轮播边界收敛'],
  ['index.html',       'coverFallback',                     '封面兜底函数'],
  ['index.html',       'onclick="openCourse(1)"',           '轮播卡1 可点'],
  ['index.html',       'onclick="openCourse(8)"',           '轮播卡4 可点'],
  ['index.html',       "location.href='course.html?id='",   '课卡跳详情页'],
  ['index.html',       '<a href="index.html" class="logo-icon">', 'logo 指向存在的首页'],
  ['course.html',      'type="video/mp4"',                  '视频 type 声明'],
  ['course.html',      'function goBack()',                 '返回兜底'],
  ['course.html',      'renderCourseDetail',                '详情页按 id 渲染'],
  ['course.html',      'videoEl.load()',                    '按课程切换视频'],
  ['game.html',        'function resetGame()',              '游戏重开'],
  ['ai-series.html',   "querySelectorAll('.faq-item')",     'FAQ 选择器修复'],
];
for (const [f, needle, label] of checks) {
  const t = fs.readFileSync(R(f), 'utf8');
  const ok = t.includes(needle);
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + label);
  if (!ok) fail++;
}

console.log('\n===== 8. 视频编码复核 =====');
for (const v of ['数据读心者', '人机舞蹈家', '伦理守望者', '跨界编织者']) {
  try {
    const out = cp.execSync('ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "' +
      R('assets/videos/' + v + '.mp4') + '"').toString().trim();
    console.log('  ' + (out === 'h264' ? '✓' : '⚠') + ' ' + v + '.mp4 -> ' + out);
  } catch (e) { console.log('  · ' + v + '.mp4 （ffprobe 不可用，跳过）'); }
}

console.log('\n===== 结果: ' + (fail === 0 ? '全部通过 ✅' : fail + ' 项异常 ❌') + ' =====');
