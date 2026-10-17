const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/22279/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='http://127.0.0.1:4173';
const out=path.resolve(__dirname,'../docs/verification');
fs.mkdirSync(out,{recursive:true});
const report={viewports:[],interactions:[],errors:[],requests:[]};
function check(value,label){assert.ok(value,label);report.interactions.push(label);console.log('PASS',label);}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
 const context=await browser.newContext();
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.requests.push({url:r.url(),status:r.status()});});
 await page.addInitScript(()=>{
   window.__cls=0;
   new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__cls+=entry.value;}).observe({type:'layout-shift',buffered:true});
 });
 for(const width of [320,375,480,560,768,900,1200,1920]){
   await page.setViewportSize({width,height:900});
   for(const name of ['index.html','course.html?id=7','game.html','ai-series.html']){
     await page.goto(base+'/'+name,{waitUntil:'networkidle'});
     const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,cls:window.__cls,images:[...document.images].filter(i=>!i.hasAttribute('alt')||!i.hasAttribute('width')||!i.hasAttribute('height')).length,lang:document.documentElement.lang,font:getComputedStyle(document.body).fontFamily,brand:getComputedStyle(document.querySelector('.site-brand')).color}));
     assert.ok(state.scrollWidth<=width+1 && state.bodyWidth<=width+1,`${name} at ${width}: horizontal overflow ${state.scrollWidth}/${state.bodyWidth}`);
     assert.equal(state.images,0,`${name}: image attributes`);
     assert.equal(state.lang,'zh-CN');
     report.viewports.push({page:name,width,...state});
     if([375,1200].includes(width)){
       // Scroll through the page so full-page screenshots include lazy-loaded covers.
       await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}scrollTo(0,0);});
       await page.waitForTimeout(200);
       await page.screenshot({path:path.join(out,`${name.split('.')[0]}-${width}.png`),fullPage:true});
     }
   }
   console.log('PASS viewport',width);
 }
 await page.setViewportSize({width:375,height:812});
 await page.goto(base+'/index.html',{waitUntil:'networkidle'});
 check(await page.locator('.course-card').count()===20,'All 20 course links render');
 check(await page.locator('.course-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length===1),'375px course grid is a single column');
 const filter=page.getByRole('button',{name:'伦理守护盾',exact:true});
 await filter.focus();await page.keyboard.press('Enter');
 check(await page.locator('.course-card').count()===3,'Keyboard course filter returns three ethics courses');
 check(await filter.getAttribute('aria-pressed')==='true','Filter state announced');
 await page.locator('.search-input').fill('不存在的课程');
 check(await page.locator('.course-empty').isVisible(),'Search empty state visible');
 await page.locator('.search-input').fill('');
 await page.locator('.course-card').first().focus();await page.keyboard.press('Enter');
 await page.waitForURL('**/course.html?id=7');
 check((await page.title()).startsWith('AI伦理与安全'),'Keyboard course navigation uses correct id/title');
 check(await page.locator('.course-tags .tag').count()>=3,'Course tags retain three base tags plus category');
 check((await page.locator('video').getAttribute('poster')).endsWith('伦理守望者.webp'),'Course poster follows selected category');
 await page.goto(base+'/index.html',{waitUntil:'networkidle'});
 await page.locator('.site-account').focus();await page.keyboard.press('Enter');
 check(await page.locator('#loginModal').isVisible(),'Keyboard opens learning profile dialog');
 check(await page.locator('#loginUser').evaluate(el=>el===document.activeElement),'Dialog initially focuses input');
 await page.keyboard.press('Shift+Tab');
 check(await page.locator('#loginModal button').last().evaluate(el=>el===document.activeElement),'Dialog traps backward Tab');
 await page.keyboard.press('Tab');
 check(await page.locator('#loginUser').evaluate(el=>el===document.activeElement),'Dialog traps forward Tab');
 await page.keyboard.press('Escape');
 check(!await page.locator('#loginModal').isVisible(),'Escape closes dialog');
 check(await page.locator('.site-account').evaluate(el=>el===document.activeElement),'Dialog restores opening control focus');
 await page.locator('.site-account').click();
 await page.locator('#loginModal').click({position:{x:3,y:3}});
 check(!await page.locator('#loginModal').isVisible(),'Backdrop closes dialog');
 await page.locator('.site-account').click();
 await page.locator('#loginModal .modal-btn').first().click();
 check((await page.locator('.toast').textContent()).includes('请输入'),'Missing nickname produces inline feedback');
 await page.locator('#loginUser').fill('科普学习者');
 await page.locator('#loginModal .modal-btn').first().click();
 await page.locator('.site-account').click();
 check(await page.locator('#profileModal').isVisible(),'Saved profile opens personal center');
 await page.locator('#nick').fill('小星');await page.locator('#profileModal .modal-btn').first().click();
 check(await page.evaluate(()=>localStorage.getItem('nick'))==='小星','Profile save persists nickname');
 await page.getByRole('button',{name:'打开学习留言',exact:true}).click();
 await page.evaluate(()=>{for(let i=0;i<20;i++){document.getElementById('chatInput').value='测试消息 '+i;sendMsg();}});
 const chatState=await page.evaluate(()=>{const p=document.querySelector('.chat-panel'), b=document.querySelector('.chat-body'),m=b.lastElementChild, inp=document.getElementById('chatInput');return{panel:p.getBoundingClientRect().toJSON(),input:inp.getBoundingClientRect().toJSON(),scroll:b.scrollHeight>b.clientHeight,right:Math.abs(m.getBoundingClientRect().right-(b.getBoundingClientRect().right-16))<2};});
 check(chatState.panel.top>=0 && chatState.input.bottom<=812,'20 chat messages keep panel and input inside viewport');
 check(chatState.scroll,'Chat message area scrolls internally');check(chatState.right,'User chat bubbles align right');
 await page.locator('#chatInput').fill('<img src=x onerror=alert(1)>');await page.locator('#chatInput').press('Enter');
 check(await page.locator('.chat-body img').count()===0,'Chat renders user input as plain text');
 await page.getByRole('button',{name:'关闭学习留言'}).click();
 await page.locator('.arrow-right').click({force:true});
 await page.evaluate(()=>{for(let i=0;i<10;i++)nextSlide();});
 check(await page.locator('.arrow-right').isDisabled(),'Carousel stops at the final card');
 await page.goto(base+'/ai-series.html',{waitUntil:'networkidle'});
 check(await page.locator('.testimonial-card').count()===10,'Scrolling track duplicates five cards');
 check(await page.locator('.testimonial-card[aria-hidden="true"]').count()===5,'Clones hidden from accessibility tree');
 const faq=page.locator('.faq-question').nth(1);await faq.focus();await page.keyboard.press('Enter');
 check(await faq.getAttribute('aria-expanded')==='true','FAQ works via keyboard with expanded state');
 check(await page.locator('#faqAnswer1').isVisible(),'FAQ answer visible');
 // Sample the complete 90-second cycle deterministically through the animation timeline.
 const loop=await page.evaluate(()=>{
   const track=document.querySelector('.scroll-container'),wall=track.parentElement,animation=track.getAnimations()[0];
   animation.pause();
   const errors=[];
   for(let ms=0;ms<=90000;ms+=500){animation.currentTime=ms;const visible=[...track.children].map(c=>c.getBoundingClientRect());const bounds=wall.getBoundingClientRect();if(visible[0].left>bounds.left+1||visible.at(-1).right<bounds.right-1)errors.push(ms);}
   const half=track.scrollWidth/2,first=track.children[0].getBoundingClientRect(),copy=track.children[5].getBoundingClientRect();
   return{errors,seam:Math.abs((copy.left-first.left)-half)};
 });
 check(loop.errors.length===0&&loop.seam<1,'90-second scrolling timeline has complete coverage and matching loop halves');
 await page.emulateMedia({reducedMotion:'reduce'});
 check(await page.locator('.scroll-container').evaluate(el=>getComputedStyle(el).animationName==='none'),'Reduced motion disables scrolling');
 check(!await page.locator('.smile-ball').evaluate(el=>el.getAnimations().length>0),'Reduced motion disables decorative animation');
 await page.goto(base+'/index.html',{waitUntil:'networkidle'});
 check(await page.locator('.learning-ball').count()===0,'Reduced motion skips decorative ball initialization');
 check(!await page.locator('script[src*="matter"]').count(),'Matter.js removed from page requests');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(base+'/game.html',{waitUntil:'networkidle'});
 await page.locator('#guessInput').fill('1.5');await page.locator('#guessInput').press('Enter');
 check((await page.locator('#tip').textContent()).includes('请输入'),'Game rejects non-integer guesses');
 await page.locator('#guessInput').fill('101');await page.locator('#guessInput').press('Enter');
 check((await page.locator('#tip').textContent()).includes('请输入'),'Game rejects out-of-range guesses');
 await page.evaluate(()=>document.getElementById('guessInput').value=String(aiNumber));await page.locator('#guessInput').press('Enter');
 check((await page.locator('#tip').textContent()).includes('猜对'),'Game win feedback works');
 await page.getByRole('button',{name:'再来一局'}).click();
 check(await page.locator('#guessInput').inputValue()==='','Game reset clears guess');
 await page.goto(base+'/course.html?id=999',{waitUntil:'networkidle'});
 check((await page.locator('.course-title').textContent()).includes('未找到'),'Invalid course id displays an actionable state');
 const noStorage=await browser.newContext();await noStorage.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled');}});});
 const privatePage=await noStorage.newPage();await privatePage.goto(base+'/index.html',{waitUntil:'networkidle'});
 check(await privatePage.locator('.course-card').count()===20,'Course rendering works when localStorage is disabled');await noStorage.close();
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));
 check(report.errors.length===0,'No uncaught browser exceptions');
 check(report.requests.length===0,'All requested resources return successfully');
 }finally{fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
