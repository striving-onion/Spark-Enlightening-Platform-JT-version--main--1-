// ===== AI聊天交互（修：原来用 innerHTML 拼接用户输入，存在 XSS；改用 textContent）=====
const input = document.querySelector('.ai-input');
const btn = document.querySelector('.ai-send-btn');
const chat = document.querySelector('.ai-chat');

function appendBubble(text, cls) {
  const div = document.createElement('div');
  div.className = 'chat-bubble ' + cls;
  div.textContent = text;
  chat.appendChild(div);
}

function sendMsg() {
  const text = input.value.trim();
  if(!text) return;
  appendBubble(text, 'user-bubble');
  input.value = '';
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => {
    appendBubble('这是静态演示助手，暂未连接AI服务。建议结合课程视频复习，并把问题记录下来与老师讨论。', 'ai-bubble');
    chat.scrollTop = chat.scrollHeight;
  }, 600);
}

btn.onclick = sendMsg;
input.onkeydown = e => e.key === 'Enter' && sendMsg();

// ===== 返回按钮（修：直接打开本页时浏览历史为空，history.back() 点了没反应）=====
function goBack() {
  if (history.length > 1 && document.referrer) history.back();
  else location.href = 'index.html';
}

// ===== 按 ?id= 渲染对应课程（修：此前任何卡片点进来都显示同一门课，标题与所点卡片不符）=====
(function renderCourseDetail(){
  let id = 0;
  try { id = parseInt(new URLSearchParams(location.search).get('id'), 10) || 0; } catch (e) {}
  if (typeof COURSES === 'undefined') return;
  if(!id) id=1;
  const c = COURSES.find(x => x.id === id);
  if (!c) {document.querySelector('.course-title').textContent='课程暂未找到';document.querySelector('.course-desc').textContent='请返回课程列表，选择一门课程继续学习。';document.querySelector('.video-wrap').hidden=true;return;}

  document.title = c.title + ' | AI支教科普';
  const titleEl = document.querySelector('.course-title');
  if (titleEl) titleEl.textContent = c.title;

  const tagsEl = document.querySelector('.course-tags');
  if (tagsEl) {
    tagsEl.innerHTML = '<span class="tag">AI基础</span><span class="tag">支教教学</span><span class="tag">零基础入门</span>';
    const s = document.createElement('span');
    s.className = 'tag';
    s.textContent = c.tag;
    tagsEl.appendChild(s);
  }

  const descEl = document.querySelector('.course-desc');
  if (descEl) descEl.textContent = c.desc;

  // 修：原来无论点哪门课都播同一段视频。现按课程分类切换对应教学视频。
  // 注意：只改 <source> 的 src 不会自动生效，必须显式调用 load()。
  const videoEl = document.getElementById('courseVideo');
  const srcEl = document.getElementById('courseVideoSrc');
  videoEl.poster=c.poster;
  document.querySelector('.ai-chat').replaceChildren();
  appendBubble('你好！这里是「'+c.title+'」的随堂提问演示区，可记录问题。当前回复为预设学习提示。','ai-bubble');
  if (videoEl && srcEl && c.video && srcEl.getAttribute('src') !== c.video) {
    srcEl.setAttribute('src', c.video);
    videoEl.load();
  }
})();
