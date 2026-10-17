"""One-time migration of the four original static pages. Back up before running."""
from pathlib import Path
import sys, re, shutil
sys.path.insert(0, str(Path('.tools/python').resolve()))
from bs4 import BeautifulSoup

root = Path.cwd()
backup = root.parent / '_original_pages_before_optimization'
backup.mkdir(exist_ok=True)

def fragment(markup): return BeautifulSoup(markup, 'html.parser')
def replace(el, markup): el.replace_with(fragment(markup))
def nav(page):
    items = [('index.html','课程列表'),('ai-series.html','AI科普系列'),('game.html','互动游戏')]
    links = ''.join(f'<a href="{url}"'+(' aria-current="page"' if page == url else ' aria-current="location"' if page=='course.html' and url=='index.html' else '')+f'>{label}</a>' for url,label in items)
    account = '<button class="site-account" aria-label="登录或打开个人中心" onclick="onAvatarClick()"><img src="assets/images/college-badge.webp" class="avatar" width="38" height="38" alt="个人中心" decoding="async"></button>' if page=='index.html' else ''
    return f'<a class="skip-link" href="#main">跳到主要内容</a><header class="site-header"><nav class="site-nav" aria-label="主导航"><a class="site-brand" href="index.html"><img src="assets/images/college-badge.webp" width="38" height="38" alt="" decoding="async">星火 · AI支教科普</a><div class="site-links">{links}</div>{account}</nav></header>'

descriptions = {
 'index.html': ('AI支教科普 | 课程列表','面向乡村支教的AI科普学习平台，提供20门课程，涵盖数据认知、人机交互、AI伦理与跨界应用。'),
 'course.html': ('课程详情 | AI支教科普','观看AI支教科普教学视频，学习人工智能基础知识，结合课程简介与随堂提问开展自主学习。'),
 'game.html': ('互动游戏 | AI支教科普','通过1到100猜数字小游戏，体验输入、判断与反馈，理解程序逻辑和人工智能的基础概念。'),
 'ai-series.html': ('AI科普系列 | AI支教科普','了解AI支教科普的四个课程方向，探索20门入门课程与互动练习，查看学习建议和常见问题。')
}

for name,(title,desc) in descriptions.items():
    file = root/name
    if not (backup/name).exists(): shutil.copy2(file,backup/name)
    s = BeautifulSoup((backup/name).read_text(encoding='utf-8'), 'html.parser')
    s.html['lang']='zh-CN'
    s.title.string=title
    css=s.style.string
    css=re.sub(r':root\s*\{.*?\}', '', css, flags=re.S)
    css=re.sub(r'(?<![\w.])\*\s*\{.*?\}', '', css, flags=re.S)
    css=re.sub(r'font-family\s*:[^;]+;', '', css)
    # Remove obsolete navigation blocks and old patches, use shared base instead.
    if name=='index.html':
        css=re.sub(r'html, body\s*\{.*?\}', '', css, flags=re.S)
        css=re.sub(r'(?m)^    header\s*\{.*?\}', '', css, flags=re.S)
        css=css.replace('font-size: 72px','font-size: clamp(2.4rem, 9vw, 4.5rem)').replace('font-weight: 50;', 'font-weight: 500;').replace('font-size: 10px','font-size: 12px').replace('#22c55e; /*纯绿色方块*/','#15803d;')
        css=css.replace('grid-template-columns: repeat(3, 1fr);','grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));')
        css=css.replace('grid-template-columns: repeat(2,1fr);','grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));')
        css += '''
.hero { overflow: clip; isolation: isolate; }
.hero-bg-shape { z-index: -1; }
.hero-tags { flex-wrap: wrap; justify-content: center; }
.banner-text { padding-right: 40px; }
.banner-close { width: 32px; height: 32px; background: var(--brand); }
.slide-wrap { padding: 12px; margin: -12px; overflow: hidden; }
.slide-card { flex: 0 0 260px; min-width: 0; }
.slide-card-info { min-height: 153px; }
.course-content { min-width: 0; }
.course-card { display: block; color: inherit; text-decoration: none; }
.course-card:hover { box-shadow: var(--shadow-hover); }
.filter-item { border: 0; text-align: left; background: transparent; color: var(--text-dark); }
.chat-float-btn { border: 0; }
.chat-panel { height: 460px; max-height: calc(100dvh - 140px); }
.chat-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.chat-header button { background: transparent; border: 0; padding: 4px 8px; font-size: 22px; }
.chat-body { display: flex; flex-direction: column; min-height: 0; }
.sidebar { align-self: flex-start; }
.course-count { margin-bottom: 16px; color: var(--text-gray); }
@media (max-width: 1200px) { .container { gap: 24px; } .sidebar { width: 210px; } }
@media (max-width: 900px) { .container { gap: 20px; } .sidebar { width: 190px; } }
@media (max-width: 768px) { .sidebar { width: 100%; } .hero { min-height: 60vh; } }
@media (max-width: 560px) { .course-grid { grid-template-columns: 1fr; } .hero-tags { gap: 12px; } .hero-tag { font-size: 14px; } .chat-float-btn { width: 52px; height: 52px; right: 16px; bottom: 20px; } .chat-panel { right: 16px; bottom: 84px; max-height: calc(100dvh - 108px); width: calc(100vw - 32px); } }
@media (max-width: 480px) { .container { padding-inline: 16px; } .modal-box { padding: 24px; } .hero-desc { font-size: 16px; } }
@media (prefers-reduced-motion: reduce) { .banner-text { padding-left: 0; white-space: normal; } }
'''
        replace(s.header,nav(name))
        s.select_one('.hero')['id']='main'
        s.select_one('.hero-desc').string='20门科普课程，随时随地学习，与支教团队一起探索人工智能'
        s.select_one('.banner-text').string='欢迎开启 AI 科普之旅 · 零基础入门 · 支教团队 · 趣味实践'
        s.select_one('.banner-close')['aria-label']='关闭通知横幅'
        s.select_one('.slide-title').string='科普课程与实践'
        for badge in s.select('.slide-card-discount'): badge.string='开放学习'
        for arrow,label in [('.arrow-left','查看上一组课程'),('.arrow-right','查看下一组课程')]: s.select_one(arrow)['aria-label']=label
        search=s.select_one('.search-input'); search['id']='courseSearch'; search['type']='search'
        search.insert_before(fragment('<label class="sr-only" for="courseSearch">搜索课程名称</label>'))
        for idx,el in enumerate(s.select('.filter-item')):
            el.name='button'; el['type']='button'; el['aria-pressed']='true' if idx==0 else 'false'
        s.select_one('.course-grid').insert_before(fragment('<p class="course-count" id="courseCount" role="status"></p>'))
        for mid,label in [('loginModal','登录'),('profileModal','个人中心')]:
            mask=s.find(id=mid); mask['role']='dialog'; mask['aria-modal']='true'; mask['aria-labelledby']=mid+'Title'; mask['tabindex']='-1'; mask['inert']=''
            heading=mask.select_one('.modal-title'); heading['id']=mid+'Title'; heading.string='本机学习档案' if mid=='loginModal' else label
        s.select_one('#loginModal .modal-title').insert_after(fragment('<p class="local-note">此静态站点仅在本机保存学习档案，不提供账号认证。请勿填写真实账号密码。</p>'))
        s.find(id='loginPwd').decompose()
        s.find(id='loginUser')['placeholder']='输入学习昵称'; s.find(id='loginUser')['autocomplete']='nickname'
        s.select_one('#loginModal .modal-btn').string='开始学习'
        for iid,label in [('loginUser','学习昵称'),('nick','昵称')]:
            el=s.find(id=iid); el.insert_before(fragment(f'<label for="{iid}">{label}</label>'))
        upload=s.select_one('input[type="file"]'); upload['id']='avatarUpload'; upload.insert_before(fragment('<label for="avatarUpload">更换头像（不超过2MB）</label>'))
        chatbtn=s.select_one('.chat-float-btn'); chatbtn.name='button'; chatbtn['type']='button'; chatbtn['aria-label']='打开学习留言'; chatbtn['aria-controls']='chatPanel'; chatbtn['aria-expanded']='false'
        panel=s.find(id='chatPanel'); panel['role']='region'; panel['aria-label']='学习留言'
        panel.insert(0,fragment('<div class="chat-header"><strong>学习留言</strong><button type="button" onclick="toggleChat()" aria-label="关闭学习留言">×</button></div>'))
        s.find(id='chatBody')['role']='log'; s.find(id='chatBody')['aria-live']='polite'
        chatinput=s.find(id='chatInput'); send=chatinput.find_next('button'); chatinput.extract(); send.extract()
        panel.append(fragment('<form class="ai-input-bar" onsubmit="event.preventDefault();sendMsg()"><label class="sr-only" for="chatInput">输入学习问题或留言</label><input class="ai-input" id="chatInput" placeholder="记录你的问题…" autocomplete="off"><button type="submit" class="ai-send-btn">发送</button></form>'))
        matter=s.find('script',src='assets/js/matter.min.js'); matter.decompose()
        script=s.find_all('script')[-1].string
        # Clamp carousel by its actual content width, including the last partial step.
        start=script.index('function maxSlideIndex()')
        end=script.index('// 课程数据已抽到',start)
        script=script[:start]+'''function maxOffset(){ return Math.max(0, track.scrollWidth - track.clientWidth); }
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
''' + script[end:]
        script=script.replace("  // 修：搜索/筛选无结果", "  document.getElementById('courseCount').textContent = '共 ' + list.length + ' 门课程';\n  // 修：搜索/筛选无结果")
        script=script.replace('<div class="course-card" onclick="openCourse(${item.id})" style="cursor:pointer;">','<a class="course-card" href="course.html?id=${item.id}">')
        script=script.replace('<img class="course-cover"', '<img width="520" height="320" loading="lazy" decoding="async" class="course-cover"')
        script=script.replace("  </div>\n`).join('');", "  </a>\n`).join('');")
        script=script.replace("document.querySelectorAll('.filter-item').forEach(e=>e.classList.remove('active'));", "document.querySelectorAll('.filter-item').forEach(e=>{e.classList.remove('active');e.setAttribute('aria-pressed','false');});")
        script=script.replace("if(ev && ev.target) ev.target.classList.add('active');", "if(ev && ev.currentTarget){ev.currentTarget.classList.add('active');ev.currentTarget.setAttribute('aria-pressed','true');}")
        begin=script.index('function openLogin()'); finish=script.index('// 修：原代码依赖 window.event',begin)
        script=script[:begin]+'''function openLogin(){openDialog('loginModal');}
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
''' + script[finish:]
        script=script.replace('alert(', 'showToast(')
        script=script.replace("function toggleChat(){const p=document.getElementById('chatPanel');p.style.display=p.style.display==='flex'?'none':'flex'}", "function toggleChat(){const p=document.getElementById('chatPanel');const opened=p.style.display==='flex';p.style.display=opened?'none':'flex';document.querySelector('.chat-float-btn').setAttribute('aria-expanded',String(!opened));(opened?document.querySelector('.chat-float-btn'):document.getElementById('chatInput')).focus();}")
        script=script.replace("  div.scrollIntoView({block:'nearest'});", "  const body=document.getElementById('chatBody');body.scrollTop=body.scrollHeight;")
        begin=script.index('// 修：原来把 Matter'); finish=script.index('window.onload',begin)
        # The old comment contains 'window.onload'; locate the actual assignment.
        finish=script.index('window.onload=()=>',begin)
        script=script[:begin]+'''// Decorative CSS ball: no physics library or perpetual JS loop required.
let ballInited=false;
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function initBall(){
  if(ballInited || motionPreference.matches)return;
  ballInited=true;
  const div=document.createElement('span');div.className='learning-ball';div.textContent='✦';div.setAttribute('aria-hidden','true');document.querySelector('.hero').append(div);
}
motionPreference.addEventListener('change',e=>{if(e.matches){document.querySelector('.learning-ball')?.remove();ballInited=false;}});
''' + script[finish:]
        script=script.replace('  renderCourse();\n  const av=', '  renderCourse();\n  updateSlide();\n  const av=')
        script=script.replace("function onAvatarClick(){ localStorage.getItem('login') ? openProfile() : openLogin(); }", "function onAvatarClick(){try{localStorage.getItem('login')?openProfile():openLogin();}catch(e){openLogin();}}")
        # Storage might be disabled in embedded/private contexts: course rendering must still work.
        script=script.replace("  const av=localStorage.getItem('avatar');", "  try{\n  const av=localStorage.getItem('avatar');").replace("  if(localStorage.getItem('login')) initBall();", "  if(localStorage.getItem('login')) initBall();\n  }catch(e){console.info('本机存储不可用，课程仍可正常浏览');}")
        s.find_all('script')[-1].string=script
        css+='''
.local-note { font-size: 14px; color: var(--text-gray); margin-bottom: 20px; }
.learning-ball { position: absolute; right: 10%; top: 22%; padding: 8px; color: var(--brand); font-size: 32px; pointer-events: none; animation: learning-float 4s ease-in-out infinite alternate; }
@keyframes learning-float { to { transform: translateY(20px) rotate(20deg); } }
'''
    elif name=='course.html':
        css=re.sub(r'\.superhi-header\s*\{.*?\}', '', css, flags=re.S)
        replace(s.select_one('.superhi-header'),nav(name))
        s.select_one('.container')['id']='main'
        s.select_one('.back-btn')['onclick']="location.href='index.html#app'"
        video=s.find('video'); video['poster']='assets/posters/数据读心者.webp'; video['width']='1280'; video['height']='854'; video['preload']='none'
        s.select_one('.course-title').string='AI支教科普课程'
        s.select_one('.ai-info p').string='随堂提问演示 · 回复为预设提示'
        s.select_one('.ai-chat')['role']='log'; s.select_one('.ai-chat')['aria-label']='随堂提问记录'; s.select_one('.ai-chat')['aria-live']='polite'
        el=s.select_one('.ai-input'); el['id']='courseQuestion'; el.insert_before(fragment('<label class="sr-only" for="courseQuestion">输入课程问题</label>'))
        script=s.find_all('script')[-1].string
        script=script.replace("我正在为你解答本节课对应的知识点~", "这是静态演示助手，暂未连接AI服务。建议结合课程视频复习，并把问题记录下来与老师讨论。")
        script=script.replace("if (!id || typeof COURSES === 'undefined') return;", "if (typeof COURSES === 'undefined') return;\n  if(!id) id=1;")
        script=script.replace("if (!c) return;", "if (!c) {document.querySelector('.course-title').textContent='课程暂未找到';document.querySelector('.course-desc').textContent='请返回课程列表，选择一门课程继续学习。';document.querySelector('.video-wrap').hidden=true;return;}")
        script=script.replace("    tagsEl.innerHTML = '';", "    tagsEl.innerHTML = '<span class=\"tag\">AI基础</span><span class=\"tag\">支教教学</span><span class=\"tag\">零基础入门</span>';")
        script=script.replace("  const srcEl = document.getElementById('courseVideoSrc');", "  const srcEl = document.getElementById('courseVideoSrc');\n  videoEl.poster=c.poster;\n  document.querySelector('.ai-chat').replaceChildren();\n  appendBubble('你好！这里是「'+c.title+'」的随堂提问演示区，可记录问题。当前回复为预设学习提示。','ai-bubble');")
        s.find_all('script')[-1].string=script
        css+='''
.main-side, .ai-panel { min-width: 0; }
.container { align-items: start; }
.ai-panel { top: 90px; }
.video-wrap video { aspect-ratio: 1280 / 854; height: auto; }
@media (max-width: 1200px) { .container { grid-template-columns: minmax(0,1fr) 340px; gap: 24px; } }
@media (max-width: 900px) { .container { grid-template-columns: minmax(0,1fr); } .ai-panel { position: static; } }
@media (max-width: 768px) { .container { margin-top: 24px; } .ai-chat { height: 340px; } }
@media (max-width: 560px) { .container { padding-inline: 16px; gap: 24px; } .course-card { padding: 24px; } .course-title { font-size: 24px; } }
@media (max-width: 480px) { .ai-chat, .ai-header { padding: 16px; } .ai-input-bar { padding: 12px; gap: 8px; } .ai-send-btn { padding-inline: 14px; } .course-tags { gap: 8px; } .tag { padding: 5px 10px; } }
'''
    elif name=='game.html':
        css=re.sub(r'body\s*\{.*?\}', 'body { background: var(--bg); }', css, flags=re.S)
        css=re.sub(r'(?m)^button(?=\s|:)', '.game-box button',css)
        css=css.replace('background: #4f46e5;', 'background: var(--brand-dark);')
        s.body.insert(0,fragment(nav(name)))
        box=s.select_one('.game-box'); box.name='main'; box['id']='main'
        inp=s.find(id='guessInput'); inp['step']='1'; inp.insert_before(fragment('<label for="guessInput">猜一个1到100之间的整数</label>'))
        s.find(id='tip')['role']='status'; s.find(id='tip')['aria-live']='polite'
        s.select_one('.ai-info').clear(); s.select_one('.ai-info').append(fragment('<h2>🧠 程序小知识</h2><p>这个游戏使用随机数与条件判断：程序比较你的输入，并提示偏大、偏小或猜中。它可以帮助你练习逻辑推理，但不会从猜测中学习，也不等同于机器学习模型。</p>'))
        script=s.script.string.replace('let userGuess = parseInt(input.value, 10);','let userGuess = Number(input.value);').replace('if (!userGuess || userGuess < 1 || userGuess > 100)', 'if (!Number.isInteger(userGuess) || userGuess < 1 || userGuess > 100)')
        s.script.string=script
        css+='''
.game-box { margin: 48px auto; }
.game-box .ai-info h2 { font-size: 16px; color: var(--green); margin-bottom: 8px; }
@media (max-width: 1200px) { .game-box { max-width: 450px; } }
@media (max-width: 900px) { .game-box { margin-block: 40px; } }
@media (max-width: 768px) { .game-box { margin-block: 32px; } }
@media (max-width: 560px) { .game-box { width: calc(100% - 32px); padding: 32px 24px; } }
@media (max-width: 480px) { .game-box { padding: 24px 20px; } .game-box h1 { font-size: 28px; } }
'''
    else:
        # Keep the established visual sections; remove the unrelated template controls and claims.
        for selector in ['#overlay','#aboutOverlay','#aboutPopup','#catalog-sidebar']:
            s.select_one(selector).decompose()
        replace(s.find('nav'),nav(name))
        s.select_one('.hero')['id']='main'
        s.select_one('.hero h1').string='让每一次好奇\n成为探索AI的起点'
        s.select_one('.hero p').string='从生活中的数据出发，用科普课程和互动练习认识人工智能，与支教团队一起学习和实践。'
        stats=s.select('.stat'); stats[0].select_one('.num').string='20'; stats[0].select_one('.num')['data-value']='20'; stats[0].select_one('.label').string='科普课程'
        stats[1].select_one('.num').string='4'; stats[1].select_one('.num')['data-value']='4'; stats[1].select_one('.label').string='学习方向'
        s.select_one('.hero-btns a').string='浏览科普课程'; s.select_one('.hero-btns a')['href']='index.html#app'
        for link in s.select('a[target]'): del link['target']
        s.select_one('.testimonial-wall h2').string='四个方向，连接日常生活'
        # No verified testimonials were supplied; publish course guidance rather than invented endorsements.
        guides=[('数据','数据读心术','从文字、图像和声音出发，理解AI如何读取和分析数据。'),('交互','人机共舞术','学习智能助手与提示词，探索人与AI协作的方法。'),('伦理','伦理守护盾','认识隐私保护、数据安全和负责任使用AI的原则。'),('跨界','跨界编织者','观察AI在绘画、视频等领域的应用，拓展知识之间的连接。'),('实践','互动练习','从猜数字开始体验输入、判断与反馈，在动手中培养逻辑思维。')]
        for card,(short,heading,content) in zip(s.select('.testimonial-card'),guides):
            card.select_one('.avatar-img').string=short; card.select_one('h4').string=heading; card.select_one('.user-info p').string='学习方向' if short!='实践' else '动手体验'; card.select_one('.testimonial-text').string=content
        s.select_one('.testis h2').string='学习建议'
        tips=[('观察','从身边的数据开始','找一找生活里的文字、图片与声音，思考它们如何变成AI可以处理的信息。'),('提问','带着问题观看课程','先记录一个想弄懂的问题，再结合教学视频寻找答案，和同伴交流理解。'),('实践','用小练习检验理解','学完一个知识点后试着举例或动手操作，再向同伴解释自己的思路。')]
        for card,(short,heading,content) in zip(s.select('.testi-card'),tips):
            card.select_one('.testi-text').string=content; card.select_one('.avatar').string=short; card.select_one('h4').string=heading; card.select_one('.author-info p').string='科普学习建议'
        s.select_one('.faq h2').string='常见问题'
        qa=[('什么时候可以开始学习？','打开课程列表，选择感兴趣的课程即可观看对应分类的教学视频，无需注册付费账号。'),('课程会颁发证书吗？','当前平台提供科普课程浏览和学习练习，暂不提供证书颁发。'),('有哪些课程方向？','目前共有20门课程，分为数据读心术、人机共舞术、伦理守护盾和跨界编织者四个方向。'),('学习记录和AI助手如何使用？','学习昵称与头像仅保存在当前浏览器。随堂提问区为静态交互演示，暂未连接真实AI服务；课程疑问建议记录后与老师交流。')]
        for i,(item,(q,a)) in enumerate(zip(s.select('.faq-item'),qa)):
            question=item.select_one('.faq-question'); question.name='button'; question['type']='button'; question['aria-expanded']='true' if i==0 else 'false'; question['aria-controls']=f'faqAnswer{i}'; question.select_one('span').string=q
            icon=item.select_one('.faq-toggle-btn'); icon.name='span'; icon['aria-hidden']='true'
            answer=item.select_one('.faq-answer'); answer['id']=f'faqAnswer{i}'; answer.string=a
            if i: answer['hidden']=''
        footer=s.find('footer'); footer.clear(); footer.append(fragment('<div class="foot-grid"><div class="foot-col"><h3>AI支教科普</h3><p>在好奇中认识科技，在实践中共同成长。</p></div><div class="foot-col"><h3>开始探索</h3><ul><li><a href="index.html#app">全部20门课程</a></li><li><a href="game.html">互动游戏</a></li><li><a href="#main">回到顶部</a></li></ul></div><div class="foot-col"><h3>学习帮助</h3><ul><li><a href="#faq">常见问题</a></li><li><a href="#testis">学习建议</a></li></ul></div></div><p class="foot-bottom">© 2026 AI支教科普 · 星火科普平台</p>'))
        s.select_one('.faq')['id']='faq'
        # Remove template-only CSS, consolidate the duplicate 768px breakpoint.
        css=re.sub(r'(?<![-\w.])nav\s*\{.*?\}', '', css, flags=re.S)
        for selector in ['.logo','.logo span','.nav-left','.nav-link','.nav-link:hover','.nav-right','.nav-icon','.about-popup','.about-popup.active','.about-popup .about-header','.about-popup .smile-icon','.about-popup h3','.about-popup p','.about-overlay','.about-overlay.active','.catalog-sidebar','.catalog-sidebar.active','.overlay','.overlay.active','.catalog-close','.catalog-title','.catalog-btn','.catalog-subtitle','.course-cards','.course-card-item','.course-card-item.yellow','.course-card-item.green','.course-card-item.pink','.course-card-item.orange','.course-card-item:hover','.course-card-item .free-badge','.course-card-item h4']:
            css=re.sub(re.escape(selector)+r'\s*\{[^{}]*\}', '', css)
        css=css.replace(".faq-item.active .faq-toggle-btn { content: '×'; }",'')
        css=css.replace('color: var(--superhi-gray)', 'color: var(--text-gray)')
        css=css.replace('padding: 10rem 5% 4rem;', 'padding: 8rem 5% 4rem;')
        css=css.replace('padding: 0 5%; } .testimonial-wall:hover', 'padding: 0; } .testimonial-wall:hover')
        css=css.replace('.smile-ball:hover { animation: wave 0.8s ease-in-out; }','').replace('cursor: pointer; box-shadow: 0 4px 15px', 'box-shadow: 0 4px 15px')
        css=css.replace('.course-box.ai { background: linear-gradient(135deg, #6366f1, #8b5cf6); }','.course-box.ai { background: linear-gradient(135deg, var(--brand), var(--brand-dark)); }')
        css=css.replace('.course-box.practice { background: linear-gradient(135deg, #00E08E, #22c55e); }','.course-box.practice { background: linear-gradient(135deg, #15803d, #166534); }')
        css=re.sub(r'@media\s*\(max-width:768px\)\s*\{\s*\.course-box-wrapper\s*\{[^}]*\}\s*\.course-box\s*\{[^}]*\}\s*\}', '',css)
        css=css.replace('background: #4f46e5;', 'background: var(--brand-dark);')
        css+='''
.hero-content { max-width: 800px; }
.hero h1 { white-space: pre-line; }
.hero p { margin-inline: auto; }
.scroll-container { padding: 12px 0; }
.testimonial-card { flex: 0 0 340px; width: 340px; min-width: 0; max-width: none; }
.avatar-img { flex-shrink: 0; font-size: 14px !important; background: var(--brand) !important; }
.testimonial-wall:focus-within .scroll-container { animation-play-state: paused; }
.motion-toggle { margin: 0 5% 16px; padding: 8px 16px; border: 1px solid currentColor; border-radius: 10px; background: white; color: var(--text-dark); }
.faq-question { border: 0; padding: 0; background: transparent; text-align: left; width: 100%; color: var(--text-dark); gap: 16px; }
.faq-item { cursor: default; }
.faq-answer { max-height: none; }
.faq-toggle-btn { flex-shrink: 0; }
.testi-grid { grid-template-columns: repeat(auto-fit,minmax(min(290px,100%),1fr)); }
.balls-fall { height: 240px; }
@media (max-width: 1200px) { .hero { min-height: 80vh; } }
@media (max-width: 900px) { .course-box-wrapper { gap: 24px; } }
@media (max-width: 768px) { .course-box-wrapper { grid-template-columns: 1fr; } .course-box { height: 240px; font-size: 24px; } }
@media (max-width: 560px) { .hero { padding: 100px 20px 48px; } .hero-stats { flex-direction: row; gap: 32px; } .smile-ball { top: 16px; } .faq, .testis { padding: 48px 16px; } .faq-item { padding: 20px; } .testimonial-card { flex-basis: 280px; width: 280px; } .faq-question { font-size: 18px; } }
@media (max-width: 480px) { .course-box { height: 200px; } .testimonial-text { font-size: 16px; } .foot-grid { gap: 24px; } }
@media (prefers-reduced-motion: reduce) { .scroll-container { width: auto; flex-wrap: wrap; justify-content: center; gap: 16px; padding-inline: 16px; } .testimonial-card { margin: 0; flex-basis: min(340px,100%); } .scroll-container [aria-hidden="true"] { display: none; } .motion-toggle, .balls-fall { display: none; } }
'''
        s.select_one('.testimonial-wall h2').insert_after(fragment('<button class="motion-toggle" type="button" aria-pressed="false">暂停滚动</button>'))
        s.script.string='''const scrollTrack=document.querySelector('.scroll-container');
// Two identical halves guarantee a seamless -50% loop, including the final gap.
[...scrollTrack.children].forEach(card=>{const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.inert=true;scrollTrack.append(clone);});
document.querySelector('.motion-toggle').addEventListener('click',function(){const paused=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',String(paused));this.textContent=paused?'继续滚动':'暂停滚动';scrollTrack.style.animationPlayState=paused?'paused':'';});
document.querySelectorAll('.faq-question').forEach(button=>button.addEventListener('click',()=>{
  const willOpen=button.getAttribute('aria-expanded')!=='true';
  document.querySelectorAll('.faq-question').forEach(other=>{
    const open=other===button && willOpen;other.setAttribute('aria-expanded',String(open));
    other.parentElement.classList.toggle('active',open);document.getElementById(other.getAttribute('aria-controls')).hidden=!open;
    other.querySelector('.faq-toggle-btn').textContent=open?'×':'+';
  });
}));
'''
    # Extract page-specific styles; all shared reset/tokens live in base.css.
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    if name=='ai-series.html': css=css.replace('} ', '}\n')
    stylepath='assets/css/'+name.replace('.html','.css')
    (root/stylepath).write_text(css.strip()+'\n',encoding='utf-8')
    s.style.decompose()
    s.head.append(fragment(f'<link rel="icon" type="image/png" href="assets/favicon.png"><link rel="stylesheet" href="assets/css/base.css"><link rel="stylesheet" href="{stylepath}">'))
    s.head.append(fragment(f'<meta name="description" content="{desc}"><meta property="og:type" content="website"><meta property="og:locale" content="zh_CN"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:image" content="assets/images/数据读心者.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="assets/images/数据读心者.webp">'))
    for img in s.find_all('img'):
        src=img.get('src','')
        if '院徽（金）.png' in src: img['src']='assets/images/college-badge.webp'
        elif src.endswith(('.png','.jpg')): img['src']=src.rsplit('.',1)[0]+'.webp'
        isavatar='avatar' in img.get('class',[]) or img.get('id')=='profileAvatar'
        img['width']=img.get('width', '80' if isavatar else '520'); img['height']=img.get('height','80' if isavatar else '320')
        img['decoding']='async'; img['alt']=img.get('alt','')
        if not img.find_parent('header'): img['loading']='lazy'
    # Shared JS must be available before the page's event handlers run.
    firstscript=s.find('script')
    firstscript.insert_before(fragment('<script src="assets/js/site.js"></script>'))
    # Move inline behavior to readable page-specific files.
    for script in s.find_all('script'):
        if script.get('src') or not script.string: continue
        jsfile='assets/js/'+name.replace('.html','.js')
        (root/jsfile).write_text(script.string.strip()+'\n',encoding='utf-8')
        script.clear(); script['src']=jsfile
    # Drop old comments claiming template fidelity; keep product markup readable.
    from bs4 import Comment
    for comment in s.find_all(string=lambda t:isinstance(t,Comment)): comment.extract()
    file.write_text(str(s),encoding='utf-8')

courses=(root/'assets/courses.js').read_text(encoding='utf-8')
courses=re.sub(r'(assets/course/\d+)\.jpg',r'\1.webp',courses)
courses=courses.replace('  c.video = COURSE_VIDEO[c.type] || COURSE_VIDEO.data;', "  c.video = COURSE_VIDEO[c.type] || COURSE_VIDEO.data;\n  c.poster = c.video.replace('assets/videos/', 'assets/posters/').replace('.mp4', '.webp');")
(root/'assets/courses.js').write_text(courses,encoding='utf-8')
print('Updated all four pages, shared CSS/JS, metadata and course data.')
