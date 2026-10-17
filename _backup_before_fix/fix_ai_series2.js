/* 补修 ai-series.html 第 2 处语法错误（锚点平滑滚动）
 * 用 indexOf 定位，避开正则转义问题。
 */
const fs = require('fs');
const path = 'c:/Users/22279/Desktop/Spark-Enlightening-Platform-JT-version--main (1)/Spark-Enlightening-Platform-JT-version--main/ai-series.html';

let s = fs.readFileSync(path, 'utf8');

const startMark = "document.querySelectorAll('a[href=\"#\"]').forEacha=>";
const endMark = "scrollIntoView(behavior:'smooth'););;";

const i = s.indexOf(startMark);
const j = s.indexOf(endMark, i);

if (i < 0) { console.log('  ✗ 未找到起始锚点'); process.exit(1); }
if (j < 0) { console.log('  ✗ 未找到结束锚点'); process.exit(1); }

const FIXED = "document.querySelectorAll('a[href^=\"#\"]').forEach(function(a){a.addEventListener('click',function(e){var h=a.getAttribute('href');e.preventDefault();if(h&&h.length>1){var t=document.querySelector(h);if(t)t.scrollIntoView({behavior:'smooth'});}});});";

const removed = s.slice(i, j + endMark.length);
s = s.slice(0, i) + FIXED + s.slice(j + endMark.length);

fs.writeFileSync(path, s, 'utf8');
console.log(`  ✓ 锚点平滑滚动: 已替换 ${removed.length} 字符的崩坏代码`);
console.log(`  （被替换的原文开头: ${removed.slice(0, 60)}...）`);
