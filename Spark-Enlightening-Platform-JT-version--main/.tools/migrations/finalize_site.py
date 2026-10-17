"""Finalize metadata, semantic landmarks and remove superseded source rasters."""
from pathlib import Path
import sys,re,hashlib
sys.path.insert(0,str(Path('.tools/python').resolve()))
from bs4 import BeautifulSoup
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path.cwd()
backup=root.parent/'_original_media_before_optimization'
im=Image.new('RGB',(1200,630),'#f8fafc')
d=ImageDraw.Draw(im)
regular='C:/Windows/Fonts/msyh.ttc'; bold='C:/Windows/Fonts/msyhbd.ttc'
d.rounded_rectangle((720,-80,1300,710),radius=200,fill='#ede9fe')
with Image.open(backup/'assets/images/数据读心者.png') as original:
    art=ImageOps.fit(original.convert('RGB'),(460,360))
    im.paste(art,(700,130))
with Image.open(backup/'assets/images/院徽（金）.png') as badge:
    badge=ImageOps.contain(badge.convert('RGBA'),(64,64));im.paste(badge,(46,42),badge)
d.text((126,48),'星火 · AI支教科普',font=ImageFont.truetype(bold,30),fill='#6338f5')
d.text((48,172),'让好奇心',font=ImageFont.truetype(bold,68),fill='#111827')
d.text((48,266),'遇见人工智能',font=ImageFont.truetype(bold,68),fill='#111827')
d.text((52,380),'20门科普课程 · 4个学习方向',font=ImageFont.truetype(regular,32),fill='#4b5563')
d.rounded_rectangle((48,474,458,548),radius=18,fill='#6338f5')
d.text((75,491),'在实践中探索，一起成长',font=ImageFont.truetype(bold,28),fill='white')
im.save(root/'assets/images/share-card.jpg',quality=88,optimize=True)
for name in ['index.html','course.html','game.html','ai-series.html']:
    p=root/name;s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    if name=='course.html': s.select_one('.container').name='main'
    elif name in ['index.html','ai-series.html']:
        hero=s.select_one('.hero');hero.attrs.pop('id',None)
        existing=s.select_one('main')
        if existing: existing.name='div'
        main=s.new_tag('main',id='main')
        if name=='index.html':
            hero.insert_before(main)
            for el in [hero,s.select_one('.manual-slide-box'),s.select_one('#app')]: main.append(el.extract())
        else:
            hero.insert_before(main)
            for el in list(s.body.find_all('section',recursive=False)):main.append(el.extract())
    for selector in ['meta[property="og:image"]','meta[name="twitter:image"]']:s.select_one(selector)['content']='assets/images/share-card.jpg'
    for prop,content in [('og:image:width','1200'),('og:image:height','630'),('og:image:alt','星火AI支教科普：20门科普课程，4个学习方向')]:
        t=s.new_tag('meta');t['property']=prop;t['content']=content;s.head.append(t)
    p.write_text(s.prettify(),encoding='utf-8')

# The transformed WebP is now the site asset; exact original bytes already exist outside the site.
for folder in ['images','course']:
    for p in (root/'assets'/folder).iterdir():
        if p.suffix.lower() not in ['.jpg','.jpeg','.png'] or p.name=='share-card.jpg':continue
        old=backup/p.relative_to(root)
        assert old.is_file() and hashlib.sha256(old.read_bytes()).digest()==hashlib.sha256(p.read_bytes()).digest()
        p.unlink()

# Remove duplicate shared input component declarations and obsolete navigation styles.
for name,selectors in {
 'course.css':['.header-inner','.header-title','.ai-input-bar','.ai-input','.ai-send-btn'],
 'index.css':['.logo-icon','.avatar','.ball']
}.items():
    p=root/'assets/css'/name;text=p.read_text(encoding='utf-8')
    for selector in selectors:text=re.sub(re.escape(selector)+r'\s*\{[^{}]*\}','',text,count=1 if selector in ['.ai-input-bar','.ai-input','.ai-send-btn'] else 0)
    p.write_text(text,encoding='utf-8')
print('Finalized semantic landmarks, share image and retained originals in',backup)
