/* 修复 ai-series.html 内联脚本的 3 处语法错误 + 2 处死链
 * 用正则锚点匹配，避免手工转录被压缩工具破坏的代码。
 */
const fs = require('fs');
const path = 'c:/Users/22279/Desktop/Spark-Enlightening-Platform-JT-version--main (1)/Spark-Enlightening-Platform-JT-version--main/ai-series.html';

let s = fs.readFileSync(path, 'utf8');
const before = s.length;
const report = [];

function apply(name, re, rep, expect) {
  const m = s.match(re);
  const n = m ? m.length : 0;
  if (n !== expect) { report.push(`  ✗ ${name}: 匹配到 ${n} 处（期望 ${expect}）`); return; }
  s = s.replace(re, rep);
  report.push(`  ✓ ${name}: 已修复 ${n} 处`);
}

// 1) document.querySelectorAll'.faq<U+2212>item'  ->  querySelectorAll('.faq-item')
//    同时修掉：缺左括号 + Unicode 减号(U+2212) 与 HTML 的 ASCII 连字符不匹配
apply('FAQ 选择器（缺括号 + Unicode 减号）',
  /document\.querySelectorAll'\.faq.item'/g,
  "document.querySelectorAll('.faq-item')", 2);

// 2) 锚点平滑滚动：.forEacha=> ... 崩坏
apply('锚点平滑滚动（.forEacha=> 崩坏）',
  /document\.querySelectorAll\('a\[href="#\]'\)[\s\S]*?scrollIntoView\(behavior:'smooth'\);;/,
  "document.querySelectorAll('a[href^=\"#\"]').forEach(function(a){a.addEventListener('click',function(e){var h=a.getAttribute('href');e.preventDefault();if(h&&h.length>1){var t=document.querySelector(h);if(t)t.scrollIntoView({behavior:'smooth'});}});});",
  1);

// 3) 数字滚动动画：nums.forEachnum=> ... 崩坏
apply('数字滚动动画（nums.forEachnum=> 崩坏）',
  /nums\.forEachnum=>[\s\S]*?Math\.floor\(current\);,30\);;/,
  "nums.forEach(function(num){var target=parseInt(num.dataset.value,10)||0;var current=0;var increment=target/20;var timer=setInterval(function(){current+=increment;if(current>=target){clearInterval(timer);num.textContent=target+\"+\";}else{num.textContent=Math.floor(current);}},30);});",
  1);

// 4) 死链：practice-series.html 不存在 -> 指向 game.html
apply('死链 practice-series.html',
  /href="practice-series\.html"/g, 'href="game.html"', 1);

// 5) 自链接：AI科普系列 指向自己 -> 指向真实课程列表 class.html
apply('自链接 ai-series.html -> class.html',
  /href="ai-series\.html" class="course-box ai"/g,
  'href="class.html" class="course-box ai"', 1);

fs.writeFileSync(path, s, 'utf8');
console.log(report.join('\n'));
console.log(`  文件长度: ${before} -> ${s.length}`);
