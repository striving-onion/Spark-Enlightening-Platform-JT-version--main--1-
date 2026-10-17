"""Package static files only; --base-url configures crawler-visible absolute metadata."""
from pathlib import Path
from urllib.parse import urljoin,urlparse
import argparse,re,zipfile,json
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',help='Public deployment root, including subdirectory and trailing slash')
parser.add_argument('--output-dir',default='dist',help='Output directory relative to the project root')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
if args.base_url:
    base=args.base_url.rstrip('/')+'/'
    u=urlparse(base)
    if u.scheme not in ['http','https'] or not u.netloc:parser.error('--base-url must be an absolute http(s) URL')
else:base=None
dest=(root/args.output_dir).resolve()
if not dest.is_relative_to(root):parser.error('--output-dir must remain inside the project')
dest.mkdir(parents=True,exist_ok=True)
pages=['index.html','course.html','game.html','ai-series.html','404.html']
files=[root/name for name in pages]+[p for p in (root/'assets').rglob('*') if p.is_file() and p.name!='matter.min.js']
with zipfile.ZipFile(dest/'ai-science-site.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:
        content=p.read_bytes();rel=p.relative_to(root).as_posix()
        if p.name in pages:
            text=content.decode('utf-8')
            if base:
                text=re.sub(r'(<meta\s+[^>]*(?:property="og:image"|name="twitter:image")[^>]*content=")([^"]+)',lambda m:m[1]+urljoin(base,m[2]),text)
                # BeautifulSoup may serialize content before the property/name attribute.
                text=re.sub(r'(<meta content=")assets/images/share-card.jpg("[^>]*(?:property="og:image"|name="twitter:image"))',lambda m:m[1]+urljoin(base,'assets/images/share-card.jpg')+m[2],text)
                canonical=urljoin(base,p.name)
                text=text.replace('</head>',f'<link rel="canonical" href="{canonical}">\n<meta property="og:url" content="{canonical}">\n</head>')
                if p.name=='404.html':
                    text=text.replace('href="/assets/','href="'+urlparse(base).path+'assets/').replace('href="/index.html"','href="'+urlparse(base).path+'index.html"')
            content=text.encode('utf-8')
        z.writestr(rel,content)
manifest={'pages':pages,'files':len(files),'bytes':(dest/'ai-science-site.zip').stat().st_size,'base_url':base,'sharing_ready':bool(base)}
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False))
if not base:print('Public domain not supplied: share-card absolute URLs/canonical URLs remain pending. Run with --base-url before publication.')
