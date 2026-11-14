import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { snapshot } from './data.mjs';
const port = Number(process.env.PORT || 4174);
const assets = {'/':['index.html','text/html'], '/app.js':['app.js','text/javascript'], '/style.css':['style.css','text/css']};
let cached, pending;
async function current() {
  if (cached && Date.now()-cached.time<10000) return cached.data;
  if (!pending) pending = snapshot().then(data=>{cached={time:Date.now(),data};return data;}).finally(()=>{pending=null;});
  return pending;
}
createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  const path = new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET') {res.writeHead(405);return res.end('Method not allowed');}
  try {
    if(path==='/api/progress') {const data=await current();res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(data));}
    if(!assets[path]) {res.writeHead(404);return res.end('Not found');}
    const [file,type]=assets[path];const body=await readFile(new URL(`./public/${file}`,import.meta.url));res.writeHead(200,{'Content-Type':type});res.end(body);
  } catch(error) {console.error(error.message);res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Repository unavailable. Check REPO_PATH and Git access.'}));}
}).listen(port,'127.0.0.1',()=>console.log(`Progress dashboard: http://localhost:${port}`));
