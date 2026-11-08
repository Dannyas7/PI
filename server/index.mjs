import http from 'node:http';
import { WebSocketServer } from 'ws';
import { RoomHub } from './rooms.mjs';

const PORT = Number(process.env.PORT||8787);
const ALLOWED_ORIGINS=String(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
const hub=new RoomHub();
const server=http.createServer((req,res)=>{
 if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,rooms:hub.rooms.size,version:'v9-beta'}));return;}
 res.writeHead(404);res.end('Not found');
});
const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{
 const origin=req.headers.origin;
 if(req.url!=='/ws'||(ALLOWED_ORIGINS.length&&!ALLOWED_ORIGINS.includes(origin))){
  socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;
 }
 wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
});
wss.on('connection',ws=>{
 ws.isAlive=true;hub.attach(ws);
 ws.on('pong',()=>{ws.isAlive=true});
 ws.on('message',(data,isBinary)=>{if(!isBinary)hub.receive(ws,data.toString('utf8'))});
 ws.on('close',()=>hub.detach(ws));ws.on('error',()=>hub.detach(ws));
});
const heartbeat=setInterval(()=>{
 for(const ws of wss.clients){if(ws.isAlive===false){ws.terminate();continue}ws.isAlive=false;ws.ping()}
},25000);
server.listen(PORT,'0.0.0.0',()=>console.log(`Batalla CIO online WebSocket server on :${PORT}/ws`));
function shutdown(){clearInterval(heartbeat);hub.shutdown();wss.close();server.close()}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
