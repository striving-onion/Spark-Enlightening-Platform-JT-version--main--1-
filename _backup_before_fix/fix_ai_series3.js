/* 第三轮修复 ai-series.html：
 *   1) 死链 class.html -> index.html（文件已重命名）
 *   2) 5 个 testimonial 头像用的是 https://picsum.photos 外链，离线/断网时全是空白灰圈。
 *      改为离线可用的字母头像（内联渐变，不依赖任何外部资源）。
 * 该文件是压缩成单行的，所以用脚本按锚点替换，避免把整行读进上下文。
 */
const fs = require('fs');
const path = 'c:/Users/22279/Desktop/Spark-Enlightening-Platform-JT-version--main (1)/Spark-Enlightening-Platform-JT-version--main/ai-series.html';

let s = fs.readFileSync(path, 'utf8');
const before = s.length;
const report = [];

// ---- 1) 死链修复 ----
const deadLinks = (s.match(/href="class\.html"/g) || []).length;
s = s.replace(/href="class\.html"/g, 'href="index.html"');
report.push(`  ${deadLinks > 0 ? '✓' : '·'} class.html -> index.html（${deadLinks} 处）`);

// ---- 2) 外链头像 -> 字母头像 ----
// 顺序与文件中出现顺序一致：Craig / doreen / raini / Kiks / Emma
const AVATARS = {
  1: ['C', '#6366f1', '#8b5cf6'],
  2: ['d', '#00E08E', '#22c55e'],
  3: ['r', '#FF62CB', '#e11d48'],
  4: ['K', '#f59e0b', '#FF9747'],
  5: ['E', '#38bdf8', '#6366f1']
};

let hit = 0;
s = s.replace(
  /<div class="avatar-img" style="background-image: url\('https:\/\/picsum\.photos\/[^']*'\);"><\/div>/g,
  function (whole) {
    hit++;
    const m = whole.match(/picsum\.photos\/\d+\/\d+\?(\d)/);
    const key = m ? parseInt(m[1], 10) : hit;
    const [letter, c1, c2] = AVATARS[key] || AVATARS[hit] || ['S', '#6366f1', '#8b5cf6'];
    return '<div class="avatar-img" style="display:flex;align-items:center;justify-content:center;' +
           'color:#fff;font-weight:700;font-size:1.05rem;' +
           'background:linear-gradient(135deg,' + c1 + ',' + c2 + ')">' + letter + '</div>';
  }
);
report.push(`  ${hit === 5 ? '✓' : '⚠'} picsum 外链头像替换为字母头像（${hit} 处，期望 5）`);

fs.writeFileSync(path, s, 'utf8');
console.log(report.join('\n'));
console.log(`  文件长度: ${before} -> ${s.length}`);

// ---- 3) 自检：确认再无外链 ----
const ext = s.match(/(?:src|href)="https?:\/\/[^"]+"/g) || [];
console.log(ext.length ? `  ⚠ 仍存在外部引用 ${ext.length} 处: ${ext.slice(0, 5).join(' | ')}` : '  ✓ 已无任何外部 http(s) 引用');
