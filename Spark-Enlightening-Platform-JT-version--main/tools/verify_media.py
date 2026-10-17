"""Verify real files and sample decoded frames; retain machine-readable evidence."""
import sys, json, subprocess, re
from pathlib import Path
sys.path.insert(0,str(Path('.tools/python').resolve()))
import imageio_ffmpeg
from PIL import Image, ImageOps, ImageDraw, ImageFont
root=Path.cwd()
backup=root.parent/'_original_media_before_optimization'
ff=imageio_ffmpeg.get_ffmpeg_exe()
out=root/'docs/verification'
out.mkdir(exist_ok=True)
report={'videos':[],'covers':[]}
def info(p):
    log=subprocess.run([ff,'-hide_banner','-i',str(p)],capture_output=True).stderr.decode('utf-8','replace')
    h,m,s=map(float,re.search(r'Duration: (\d+):(\d+):([\d.]+)',log).groups())
    return log,h*3600+m*60+s
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',18)
sheet=Image.new('RGB',(1280,4*454),'#f8fafc')
draw=ImageDraw.Draw(sheet)
for row,p in enumerate(sorted((root/'assets/videos').glob('*.mp4'))):
    log,duration=info(p); original=backup/p.relative_to(root); original_log,old_duration=info(original)
    assert abs(duration-old_duration)<.2, p.name+' changed duration'
    assert '1280x854' in log and 'Video: h264' in log and 'Audio: aac' in log and 'mono' in log
    with p.open('rb') as f: head=f.read(1024*1024)
    assert 0<=head.find(b'moov')<head.find(b'mdat'), p.name+' missing faststart'
    # Decode a full second at the beginning, middle and end; no corrupt-frame errors allowed.
    for at in [.5,duration/2,duration-2]:
        subprocess.run([ff,'-v','error','-ss',str(at),'-i',str(p),'-t','1','-f','null','-'],check=True,capture_output=True)
    for col,source in enumerate([original,p]):
        frame=out/f'frame-{row}-{col}.png'
        subprocess.run([ff,'-v','error','-y','-ss',str(duration/2),'-i',str(source),'-frames:v','1',str(frame)],check=True)
        with Image.open(frame) as im:
            im=ImageOps.contain(im.convert('RGB'),(620,414))
            sheet.paste(im,(col*640+(640-im.width)//2,row*454+32))
        draw.text((col*640+12,row*454+8),p.stem+(' · 原图' if col==0 else ' · 压缩后'),font=font,fill='#111827')
    report['videos'].append({'name':p.name,'before':original.stat().st_size,'after':p.stat().st_size,'duration':duration,'dimensions':'1280x854','codec':'H.264/AAC mono','faststart':True,'decoded_sample_seconds':[.5,duration/2,duration-2]})
sheet.save(out/'video-quality-comparison.jpg',quality=90)
for id in range(1,21):
    p=root/f'assets/course/{id}.webp'
    with Image.open(p) as im: assert im.size==(520,320)
    report['covers'].append({'id':id,'bytes':p.stat().st_size})
names=['数据读心者','人机舞蹈家','伦理守护者','跨界编织术']
report['featured_images_bytes']=sum((root/f'assets/images/{name}.webp').stat().st_size for name in names)+(root/'assets/images/college-badge.webp').stat().st_size
assert report['featured_images_bytes']<200000
report['video_total_before']=sum(v['before'] for v in report['videos'])
report['video_total_after']=sum(v['after'] for v in report['videos'])
assert report['video_total_after']<50000000
(out/'media-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'featured_images_bytes':report['featured_images_bytes'],'video_total_after':report['video_total_after'],'covers':len(report['covers'])}))
