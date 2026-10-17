const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/22279/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='http://127.0.0.1:4173';
const results={pages:[],playback:[],loops:[],contrast:[]};
const root=path.resolve(__dirname,'..');
function luminance(rgb){const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812}});
  for(const name of ['index.html','course.html?id=7','game.html','ai-series.html']){
   await page.goto(base+'/'+name,{waitUntil:'networkidle'});
   const data=await page.evaluate(()=>({main:document.querySelectorAll('main').length,description:document.querySelector('meta[name="description"]')?.content,og:document.querySelector('meta[property="og:title"]')?.content,icon:document.querySelector('link[rel="icon"]')?.href,unlabelled:[...document.querySelectorAll('input,button')].filter(el=>!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')&&!el.labels?.length&&!el.textContent.trim()).map(el=>el.outerHTML),fakeLinks:[...document.querySelectorAll('a')].filter(a=>!a.getAttribute('href')||a.getAttribute('href')==='#').map(a=>a.outerHTML),fakeDivs:document.querySelectorAll('div[onclick],img[onclick]').length}));
   assert.equal(data.main,1,name+' main landmark');assert.ok(data.description&&data.og&&data.icon);assert.deepEqual(data.unlabelled,[]);assert.deepEqual(data.fakeLinks,[]);assert.equal(data.fakeDivs,0);
   results.pages.push({name,...data});
  }
  await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  const colors=await page.locator('.card-green-btn,.course-tag,.filter-item.active').evaluateAll(els=>els.map(el=>({selector:el.className,color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor})));
  for(const c of colors){const a=luminance(c.color),b=luminance(c.background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,c.selector+' contrast '+ratio);results.contrast.push({...c,ratio});}
  for(const [id,category] of [[1,'data'],[4,'inter'],[7,'ethic'],[8,'cross']]){
   await page.goto(base+'/course.html?id='+id,{waitUntil:'networkidle'});
   await page.locator('video').evaluate(async video=>{video.muted=true;await video.play();});
   await page.waitForFunction(()=>document.querySelector('video').currentTime>.5,{},{timeout:15000});
   const data=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,time:v.currentTime,error:v.error?.message||null,poster:v.poster,src:v.currentSrc}));
   assert.equal(data.width,1280);assert.equal(data.height,854);assert.equal(data.error,null);
   await page.locator('video').evaluate(v=>{v.currentTime=v.duration/2;});
   await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.seeking&&v.currentTime>=v.duration/2;},{},{timeout:15000});
   await page.locator('video').evaluate(v=>v.pause());
   results.playback.push({id,category,...data,seek:true});console.log('PASS video playback and seek',id);
  }
  await page.goto(base+'/ai-series.html',{waitUntil:'networkidle'});
  for(const width of [320,375,768,1200,1920,2560]){
   await page.setViewportSize({width,height:900});
   const data=await page.evaluate(()=>{const track=document.querySelector('.scroll-container'),wall=track.parentElement,animation=track.getAnimations()[0];animation.pause();const gaps=[];for(let ms=0;ms<=90000;ms+=250){animation.currentTime=ms;const rect=[...track.children].map(c=>c.getBoundingClientRect()),bounds=wall.getBoundingClientRect();if(rect[0].left>bounds.left+1||rect.at(-1).right<bounds.right-1)gaps.push(ms);}const a=track.children[0].getBoundingClientRect(),b=track.children[5].getBoundingClientRect();return{gaps,seam:Math.abs(b.left-a.left-track.scrollWidth/2)};});
   assert.deepEqual(data.gaps,[],width+'px scroll loop gaps');assert.ok(data.seam<1);results.loops.push({width,...data});
  }
  const response=await page.goto(base+'/missing/deep/page');assert.equal(response.status(),404);await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('#home').getAttribute('href'),'/index.html');
  console.log('PASS semantic labels, metadata, contrast, 90-second loops at six widths and nested 404');
 }finally{fs.writeFileSync(path.join(root,'docs/verification/asset-browser-report.json'),JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
