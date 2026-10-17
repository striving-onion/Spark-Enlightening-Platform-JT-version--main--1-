"""Run from the project root. Originals are kept outside the deployable site."""
import sys, json, subprocess, shutil, re
from pathlib import Path
sys.path.insert(0, str(Path('.tools/python').resolve()))
from PIL import Image, ImageOps, ImageDraw, ImageFont
import imageio_ffmpeg

root = Path.cwd()
backup = root.parent / '_original_media_before_optimization'
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
report = {'videos': [], 'images': [], 'covers': []}
badge_names = {'校徽（白底）':'university-badge-white', '校徽（透明底）':'university-badge-transparent', '院徽（白）':'college-badge-white', '院徽（白底）':'college-badge-white-background', '院徽（蓝 稍亮）':'college-badge-blue-bright', '院徽（浅蓝）':'college-badge-light-blue', '院徽（深蓝）':'college-badge-dark-blue', '院徽（紫）':'college-badge-purple'}
def preserve(p):
    dst = backup / p.relative_to(root)
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists(): shutil.copy2(p, dst)
    return dst
def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

for p in ([] if '--images-only' in sys.argv else sorted(p for p in (root / 'assets/videos').glob('*.mp4') if '.optimized' not in p.name)):
    original = preserve(p)
    temp = p.with_name(p.stem + '.optimized.mp4')
    if '--reencode' in sys.argv or p.stat().st_size == original.stat().st_size:
        print('Encoding', p.name, flush=True)
        run(['-i', str(original), '-vf', 'fps=15,scale=1280:854:force_original_aspect_ratio=decrease,pad=1280:854:(ow-iw)/2:(oh-ih)/2,setsar=1', '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-threads', '6', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '48k', '-ac', '1', '-movflags', '+faststart', str(temp)])
        temp.replace(p)
    poster = root / 'assets/posters' / (p.stem + '.webp')
    run(['-ss', '0.5', '-i', str(original), '-frames:v', '1', '-vf', 'scale=960:-1', '-quality', '82', str(poster)])
    report['videos'].append({'file': str(p.relative_to(root)), 'before': original.stat().st_size, 'after': p.stat().st_size})

for folder in ['images', 'course']:
    originals = backup / 'assets' / folder
    sources = originals if originals.exists() else root / 'assets' / folder
    for source in sorted(sources.iterdir()):
        p = root / 'assets' / folder / source.name
        if p.suffix.lower() not in ['.png', '.jpg', '.jpeg']: continue
        if source == p: preserve(p)
        with Image.open(source) as im:
            size = (76,76) if p.name == '院徽（金）.png' else (520,320)
            out = p.with_suffix('.webp')
            if p.stem in badge_names: out=p.with_name(badge_names[p.stem]+'.webp')
            if p.name == '院徽（金）.png': out = p.with_name('college-badge.webp')
            im = ImageOps.fit(im.convert('RGBA' if im.mode == 'RGBA' else 'RGB'), size, method=Image.Resampling.LANCZOS)
            im.save(out, 'WEBP', quality=83, method=6)
            report['images'].append({'source': str(p.relative_to(root)), 'file': str(out.relative_to(root)), 'bytes': out.stat().st_size})

# Missing course art uses authentic frames from its category's teaching video.
data = (root / 'assets/courses.js').read_text(encoding='utf-8')
font = ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc', 25)
small = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 16)
video = {'data':'数据读心者', 'inter':'人机舞蹈家', 'ethic':'伦理守望者', 'cross':'跨界编织者'}
for m in re.finditer(r'\{id:\s*(\d+),\s*title:"([^"]+)",\s*type:"([^"]+)"', data):
    id, title, category = m.groups()
    path = root / f'assets/course/{id}.webp'
    if (backup / f'assets/course/{id}.jpg').exists(): continue
    source = preserve(root / f'assets/videos/{video[category]}.mp4')
    report['covers'].append({'id': int(id), 'source': str(source.relative_to(backup)), 'frame_seconds': 4+int(id)*1.5})
    if path.exists(): continue
    frame = root / '.tools' / f'frame-{id}.png'
    run(['-ss', str(4 + int(id)*1.5), '-i', str(source), '-frames:v', '1', str(frame)])
    with Image.open(frame) as im:
        canvas = ImageOps.fit(im.convert('RGB'), (520,320), method=Image.Resampling.LANCZOS).convert('RGBA')
        overlay = Image.new('RGBA', canvas.size)
        d = ImageDraw.Draw(overlay)
        d.rectangle((0,195,520,320), fill=(17,24,39,220))
        d.text((22,211), f'AI 支教科普 · 第 {id} 课', font=small, fill='white')
        lines = [title] if len(title)<=17 else [title[:15], title[15:]]
        for i,line in enumerate(lines): d.text((22,242+i*32), line, font=font, fill='white')
        Image.alpha_composite(canvas,overlay).convert('RGB').save(path,'WEBP',quality=85,method=6)
with Image.open(backup/'assets/images/院徽（金）.png') as im:
    ImageOps.contain(im.convert('RGBA'),(64,64)).save(root/'assets/favicon.png')
(root/'docs/media-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Finished. Video total:',sum(v['after'] for v in report['videos']),flush=True)
