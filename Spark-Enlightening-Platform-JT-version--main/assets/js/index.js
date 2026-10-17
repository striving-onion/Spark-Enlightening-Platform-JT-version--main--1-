function closeBanner(){document.getElementById('banner').style.display='none'}

// ========== 手动点击箭头切换逻辑（已加边界限制：修"右箭头可无限移出屏幕"） ==========
let slideIndex = 0;
const track = document.getElementById('slideTrack');
const CARD_W = 280; // 卡片宽 260 + 间距 20

function maxOffset(){ return Math.max(0, track.scrollWidth - track.clientWidth); }
function maxSlideIndex(){ return Math.ceil(maxOffset() / CARD_W); }
function updateSlide(){
  slideIndex=Math.min(Math.max(slideIndex,0),maxSlideIndex());
  track.style.transform=`translateX(-${Math.min(slideIndex*CARD_W,maxOffset())}px)`;
  document.querySelector('.arrow-left').disabled=slideIndex===0;
  document.querySelector('.arrow-right').disabled=slideIndex>=maxSlideIndex();
}
function nextSlide(){slideIndex++;updateSlide();}
function prevSlide(){slideIndex--;updateSlide();}
window.addEventListener('resize',updateSlide);
// 课程数据已抽到 assets/courses.js（由 index.html 与 course.html 共享），此处不再重复定义。

// 修：assets/course/ 目前只有 6 张真实封面，另外 14 门课原来统一回落到同一张
//     placeholder.svg，看起来像 14 个重复的灰块。改为按课程即时生成一张带标题的
//     封面（data URI，不依赖任何外部文件）。日后把 4.jpg 等真实封面放进
//     assets/course/ 即可自动生效，无需再改代码。
const COVER_COLOR = {
  data:  ['#6366f1', '#8b5cf6'],
  inter: ['#00E08E', '#22c55e'],
  ethic: ['#FF62CB', '#e11d48'],
  cross: ['#38bdf8', '#6366f1']
};
function coverFallback(id){
  const c = COURSES.find(x => x.id === id) || {title:'课程', tag:'', type:'data'};
  const col = COVER_COLOR[c.type] || COVER_COLOR.data;
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const t = c.title;
  const isAscii = ch => /[A-Za-z0-9]/.test(ch);
  let lines;
  if (t.length <= 8) {
    lines = [t];
  } else {
    let br = Math.ceil(t.length / 2);
    // 不要把 "AI" 这类连续英文/数字从中间劈开（否则会出现 "...趣味A" / "I数据..."）
    while (br > 1 && isAscii(t[br - 1])) br--;
    lines = [t.slice(0, br), t.slice(br)];
  }
  // 估算行宽（中文按 1 个字号宽，英文数字按 0.55），过宽就缩一号字
  const units = s => Array.from(s).reduce((n, ch) => n + (isAscii(ch) ? 0.55 : 1), 0);
  const fz = lines.some(l => units(l) > 8.2) ? 34 : 42;
  const y0 = lines.length === 1 ? 215 : 185;
  const titleSvg = lines.map((ln, i) =>
    '<text x="320" y="' + (y0 + i * 56) + '" text-anchor="middle" ' +
    'font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="' + fz + '" font-weight="700" ' +
    'fill="#ffffff">' + esc(ln) + '</text>'
  ).join('');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + col[0] + '"/>' +
        '<stop offset="1" stop-color="' + col[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="400" fill="url(#g)"/>' +
      '<circle cx="560" cy="70" r="110" fill="#ffffff" opacity="0.10"/>' +
      '<circle cx="70" cy="350" r="80" fill="#ffffff" opacity="0.08"/>' +
      '<text x="40" y="70" font-family="PingFang SC,Microsoft YaHei,sans-serif" ' +
        'font-size="22" fill="#ffffff" opacity="0.85">' + esc(c.tag) + '</text>' +
      titleSvg +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

let currentFilter="all";let keyword="";
function renderCourse(){
  const grid=document.getElementById('courseGrid');
  const list=COURSES.filter(item=>{
    const tagOk=currentFilter==='all'||item.type===currentFilter;
    const keyOk=item.title.includes(keyword);
    return tagOk&&keyOk;
  });
  document.getElementById('courseCount').textContent = '共 ' + list.length + ' 门课程';
  // 修：搜索/筛选无结果时给出提示，而不是留一片空白
  if(!list.length){
    grid.innerHTML='<div class="course-empty">没有找到匹配的课程，换个关键词试试～</div>';
    return;
  }
  // 修：此前只有第 0 张卡片可点击，且筛选后"第一张"会变，导致点击的卡片与跳转内容不符。
  //     现在每张卡片都可点击，并把课程 id 传给详情页。
  grid.innerHTML=list.map(item=>`
  <a class="course-card" href="course.html?id=${item.id}">
    <img width="520" height="320" loading="lazy" decoding="async" class="course-cover" src="${item.img}" alt="${item.title}" onerror="this.onerror=null;this.src=coverFallback(${item.id})">
    <div class="course-info">
      <div class="course-title">${item.title}</div>
      <span class="course-tag">${item.tag}</span>
    </div>
  </a>
`).join('');
}
function openCourse(id){ location.href='course.html?id='+id; }

// 修：原来依赖 window.event（Firefox 下报错），改为显式接收 event
function setFilter(type, ev){
  currentFilter=type;
  document.querySelectorAll('.filter-item').forEach(e=>{e.classList.remove('active');e.setAttribute('aria-pressed','false');});
  if(ev && ev.currentTarget){ev.currentTarget.classList.add('active');ev.currentTarget.setAttribute('aria-pressed','true');}
  renderCourse();
}
function filterCourses(){keyword=document.querySelector('.search-input').value;renderCourse();}

// 修：openLogin() 此前无任何按钮调用，登录弹窗永远打不开。现由头像点击触发：
//     未登录 -> 打开登录框；已登录 -> 打开个人中心
// 接入三端账号体系：已登录则进入对应端，未登录则去登录页
function onAvatarClick(){
  try{
    if(window.SparkAuth){
      const u=SparkAuth.current();
      if(u){location.href={student:'student.html',teacher:'teacher.html',org:'org.html'}[u.role]||'login.html';return;}
      location.href='login.html';return;
    }
  }catch(e){}
  try{localStorage.getItem('login')?openProfile():openLogin();}catch(e){openLogin();}
}
function openLogin(){openDialog('loginModal');}
function closeLogin(){closeDialog();}
function login(){
  const u=document.getElementById('loginUser').value.trim();
  if(!u){showToast('请输入学习昵称');document.getElementById('loginUser').focus();return;}
  try{localStorage.setItem('login','true');localStorage.setItem('nick',u);}catch(e){showToast('浏览器暂时无法保存本机档案');return;}
  document.getElementById('nick').value=u;
  closeLogin();showToast('欢迎 '+u+'，开始探索课程吧');initBall();
}
function openProfile(){openDialog('profileModal');}
function closeProfile(){closeDialog();}
function saveProfile(){
  const n=document.getElementById('nick').value.trim();
  try{if(n)localStorage.setItem('nick',n);}catch(e){showToast('浏览器暂时无法保存昵称');return;}
  closeProfile();showToast('保存成功');
}
// 修：原代码依赖 window.event（Firefox 报错）、无文件类型/大小校验、写 localStorage 无 try/catch（大图会静默失败）
function changeAvatar(ev){
  const file=(ev && ev.target && ev.target.files) ? ev.target.files[0] : null;
  if(!file) return;
  if(!file.type || file.type.indexOf('image/')!==0){ showToast('请选择图片文件'); return; }
  if(file.size > 2*1024*1024){ showToast('图片过大，请选择 2MB 以内的图片'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    document.querySelector('.avatar').src=e.target.result;
    document.getElementById('profileAvatar').src=e.target.result;
    try{ localStorage.setItem('avatar',e.target.result); }
    catch(err){ showToast('该图片过大，无法保存到本地（不影响本次预览）'); }
  };
  reader.readAsDataURL(file);
}

function toggleChat(){const p=document.getElementById('chatPanel');const opened=p.style.display==='flex';p.style.display=opened?'none':'flex';document.querySelector('.chat-float-btn').setAttribute('aria-expanded',String(!opened));(opened?document.querySelector('.chat-float-btn'):document.getElementById('chatInput')).focus();}
function sendMsg(){
  const input=document.getElementById('chatInput');
  const msg=input.value.trim();
  if(!msg)return;
  // 修：原来用 innerHTML 拼接用户输入，输入 <img onerror=...> 会执行脚本（XSS）。
  //     改用 textContent，从根上杜绝。
  const div=document.createElement('div');
  div.className='chat-msg msg-user';
  div.textContent=msg;
  document.getElementById('chatBody').appendChild(div);
  input.value='';
  const body=document.getElementById('chatBody');body.scrollTop=body.scrollHeight;
}

// Decorative CSS ball: no physics library or perpetual JS loop required.
let ballInited=false;
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function initBall(){
  if(ballInited || motionPreference.matches)return;
  ballInited=true;
  const div=document.createElement('span');div.className='learning-ball';div.textContent='✦';div.setAttribute('aria-hidden','true');document.querySelector('.hero').append(div);
}
motionPreference.addEventListener('change',e=>{if(e.matches){document.querySelector('.learning-ball')?.remove();ballInited=false;}});
window.onload=()=>{
  renderCourse();
  updateSlide();
  try{
  const av=localStorage.getItem('avatar');
  if(av)document.querySelector('.avatar').src=av;
  const nk=localStorage.getItem('nick');
  if(nk)document.getElementById('nick').value=nk;
  if(localStorage.getItem('login')) initBall();
  }catch(e){console.info('本机存储不可用，课程仍可正常浏览');}
}
