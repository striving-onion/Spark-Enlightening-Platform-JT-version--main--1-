"""One-time presentation migration. Does not touch application scripts or course data."""
from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
css=root/'assets/css'
# Extract every existing CSS color into a token without changing its light value.
color=re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black|red|transparent)\b')
tokens={}
def token(m):
    value=m.group(0)
    key=value.lower()
    if key not in tokens: tokens[key]=(f'--legacy-{len(tokens)+1}',value)
    return f'var({tokens[key][0]})'
for name in ['base.css','index.css','course.css','ai-series.css','game.css']:
    p=css/name
    p.write_text(color.sub(token,p.read_text(encoding='utf-8')),encoding='utf-8')
doc=root/'资源广场-技术方案.html'
s=doc.read_text(encoding='utf-8')
s=re.sub(r'<style>(.*?)</style>',lambda m:'<style>'+color.sub(token,m[1])+'</style>',s,flags=re.S)
# Inline styles and SVG presentation attributes also resolve through tokens.
s=re.sub(r'style="([^"]*)"',lambda m:'style="'+color.sub(token,m[1])+'"',s)
s=re.sub(r'(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,8}|white|black|red)"',lambda m:m[1]+'="'+token(re.match(color,m[2]))+'"',s)
doc.write_text(s,encoding='utf-8')
foundation=':root {\n'+''.join(f'  {name}: {value};\n' for name,value in tokens.values())+'}\n'
(css/'legacy-tokens.css').write_text(foundation,encoding='utf-8')
for name in ['index.html','course.html','ai-series.html','game.html','404.html','资源广场-技术方案.html']:
    p=root/name;s=p.read_text(encoding='utf-8')
    prefix='/assets/' if name=='404.html' else 'assets/'
    s=s.replace('<head>','<head>\n<script src="'+prefix+'js/theme-init.js"></script>\n<link rel="stylesheet" href="'+prefix+'css/legacy-tokens.css">',1)
    s=s.replace('</head>','<link rel="stylesheet" href="'+prefix+'css/visual.css">\n</head>',1)
    s=s.replace('</body>','<script src="'+prefix+'js/visual.js"></script>\n</body>',1)
    if name=='资源广场-技术方案.html':
        s=s.replace('<style>','<link rel="stylesheet" href="assets/css/base.css">\n<style>',1)
        s=s.replace('<body>','<body class="resource-plan">',1)
    if name=='ai-series.html':
        s=re.sub(r' style="display:flex;align-items:center;justify-content:center;color:[^"]+"','',s)
    if name=='404.html':s=s.replace('color: white','color: var(--text-on-accent)')
    p.write_text(s,encoding='utf-8')
# Keep a round-2 extraction checkpoint for review before the later visual restyling.
(root/'docs/visual-verification/round-2-token-extraction.md').write_text(
    '# 第2轮：Token 抽取\n\n原样抽取现有 CSS 色值，亮色值保持不变；后续轮次通过语义变量统一视觉。\n\n'+
    '\n'.join(f'- `{name}` = `{value}`' for name,value in tokens.values()),encoding='utf-8')
