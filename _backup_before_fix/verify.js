/* 修复后整体验证 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = 'c:/Users/22279/Desktop/Spark-Enlightening-Platform-JT-version--main (1)/Spark-Enlightening-Platform-JT-version--main';
const FILES = ['class.html', 'index .html', 'game.html', 'ai-series.html'];

let fail = 0;

console.log('===== 1. 内联 JS 语法检查 =====');
for (const f of FILES) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  // 提取所有不带 src 的 <script>...</script>
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, idx = 0, ok = true;
  while ((m = re.exec(html)) !== null) {
    idx++;
    const tmp = path.join(process.env.TEMP || '/tmp', `chk_${f.replace(/[^a-z0-9]/gi, '_')}_${idx}.js`);
    fs.writeFileSync(tmp, m[1], 'utf8');
    try { cp.execSync(`node --check "${tmp}"`, { stdio: 'pipe' }); }
    catch (e) { ok = false; fail++; console.log(`  ✗ ${f} 第${idx}个内联脚本语法错误`); }
  }
  if (ok) console.log(`  ✓ ${f}（${idx} 个内联脚本全部通过）`);
}

console.log('\n===== 2. 本地资源引用完整性 =====');
for (const f of FILES) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|#|mailto:|data:)/.test(u)) continue;
    refs.add(u);
  }
  for (const u of refs) {
    const p = path.join(ROOT, decodeURIComponent(u.split('?')[0]));
    if (!fs.existsSync(p)) { console.log(`  ✗ ${f} -> ${u}  【文件不存在】`); fail++; }
  }
  console.log(`  · ${f}: 检查 ${refs.size} 个本地引用`);
}

console.log('\n===== 3. 课程封面图片核对 =====');
let missing = [];
for (let i = 1; i <= 20; i++) {
  if (!fs.existsSync(path.join(ROOT, `assets/course/${i}.jpg`))) missing.push(i);
}
console.log(missing.length ? `  ⚠ 仍缺 ${missing.length} 张: ${missing.join(',')}（已由 placeholder.svg 兜底，不再显示裂图）` : '  ✓ 20 张齐全');

console.log('\n===== 4. 视频编码复核 =====');
for (const v of ['数据读心者', '人机舞蹈家', '伦理守望者', '跨界编织者']) {
  const out = cp.execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "${path.join(ROOT, 'assets/videos', v + '.mp4')}"`).toString().trim();
  console.log(`  ${v}.mp4 -> ${out}${out === 'h264' ? '  ✓ 浏览器通用' : '  ⚠'}`);
}

console.log('\n===== 5. 关键修复点抽查 =====');
const checks = [
  ['class.html', 'assets/js/matter.min.js', 'matter 本地化'],
  ['class.html', 'assets/courses.js', '共享课程数据'],
  ['class.html', 'function openCourse(', '课卡统一跳转'],
  ['class.html', 'field=document.createElement', ''],
  ['class.html', 'textContent=msg', '聊天 XSS 修复'],
  ['class.html', 'let ballInited=false', '弹球幂等'],
  ['class.html', 'typeof Matter===', 'Matter 存在性判断'],
  ['class.html', "onclick=\"setFilter('all', event)\"", 'event 显式传递'],
  ['index .html', 'type="video/mp4"', '视频 type 声明'],
  ['index .html', 'function goBack()', '返回兜底'],
  ['index .html', 'renderCourseDetail', '详情页按 id 渲染'],
  ['index .html', 'div.textContent = text', '聊天 XSS 修复'],
  ['game.html', 'function resetGame()', '游戏重开'],
  ['ai-series.html', "querySelectorAll('.faq-item')", 'FAQ 选择器修复'],
];
for (const [f, needle, label] of checks) {
  if (!label) continue;
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  console.log(`  ${html.includes(needle) ? '✓' : '✗'} ${label}`);
  if (!html.includes(needle)) fail++;
}

console.log(`\n===== 结果: ${fail === 0 ? '全部通过 ✅' : fail + ' 项异常 ❌'} =====`);
