// Dependency-free local preview with byte ranges for HTML5 video seeking.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.json':'application/json; charset=utf-8'};
const port=Number(process.env.PORT||4173);
http.createServer((req,res)=>{
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(e){res.writeHead(400);return res.end();}
  let file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!file.startsWith(root+path.sep)||name.split('/').some(x=>x.startsWith('.'))){res.writeHead(403);return res.end();}
  let status=200;
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){file=path.join(root,'404.html');status=404;}
  const size=fs.statSync(file).size;
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  let start=0,end=size-1;
  if(req.headers.range&&status===200){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(!match){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
    start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;
    if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length']=end-start+1;
  res.writeHead(status,headers);
  if(req.method==='HEAD'||size===0)return res.end();
  const stream=fs.createReadStream(file,{start,end});
  stream.on('error',()=>res.destroy());req.on('close',()=>stream.destroy());stream.pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}`));
