import { createRequire } from 'node:module';
import { randomInt, randomUUID } from 'node:crypto';
import { BY_ID, STAGES } from './roster.mjs';
const require = createRequire(import.meta.url);
const Engine = require('../combat-core.js');
const EMPTY = Object.freeze({dir:0,crouch:false,guard:false,jump:false,dash:false,attack:null});
const LETTERS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const CLOSED=3;
const maxRooms=250;
const validWS=s=>s && (s.readyState===undefined || s.readyState===1);
function send(s,packet){if(validWS(s))try{s.send(JSON.stringify(packet))}catch(_){}}
function cleanMove(f){if(!f)return null;return {
 x:f.x,y:f.y,vx:f.vx,vy:f.vy,face:f.face,hp:f.hp,meter:f.meter,guard:f.guard,
 action:f.action,anim:f.anim,ground:f.ground,hitstun:f.hitstun,downFrames:f.downFrames,
 flash:f.flash,blocking:f.blocking,crouch:f.crouch,invuln:f.invuln,wakeup:f.wakeup,
 move:f.move?{type:f.move.type,frame:f.move.frame,startup:f.move.startup,active:f.move.active}:null,
 dashFrames:f.dashFrames,dashCooldown:f.dashCooldown,speedBuff:f.speedBuff,slowFrames:f.slowFrames
}}
function snapshot(m){return {round:m.round,tick:m.tick,roundFrames:m.roundFrames,countdown:m.countdown,
 wins:m.wins,betweenRounds:m.betweenRounds,matchOver:m.matchOver,hitStop:m.hitStop,shake:m.shake,
 p1:cleanMove(m.p1),p2:cleanMove(m.p2)};}
function neutral(){return {...EMPTY};}
export class RoomHub {
 constructor({clock=()=>Date.now(),makeCode=null,autoTimers=true}={}){
  this.rooms=new Map();this.peers=new Map();this.clock=clock;this.autoTimers=autoTimers;
  this.makeCode=makeCode||(()=>Array.from({length:6},()=>LETTERS[randomInt(LETTERS.length)]).join(''));
 }
 attach(socket){const peer={socket,id:randomUUID(),room:null,slot:-1,choice:'daniel',ready:false,loaded:false,
  nextReady:false,seq:-1,input:neutral(),edge:{},lastInput:this.clock(),rateStart:this.clock(),rateCount:0};
  this.peers.set(socket,peer);
  send(socket,{t:'hello',protocol:1});
  return peer;
 }
 send(peer,packet){if(peer)send(peer.socket,packet)}
 emit(room,packet){room.players.forEach(p=>this.send(p,packet))}
 info(room){return {t:'lobby',code:room.code,stage:room.stage,status:room.status,
  players:room.players.map(p=>p?{slot:p.slot+1,choice:p.choice,ready:p.ready,loaded:p.loaded}:null)};}
 create(peer){if(peer.room)return this.send(peer,{t:'error',message:'Ya estás en una sala.'});
  if(this.rooms.size>=maxRooms)return this.send(peer,{t:'error',message:'Servidor ocupado.'});
  let code;for(let i=0;i<10;i++){code=this.makeCode();if(/^[A-Z2-9]{4,8}$/.test(code)&&!this.rooms.has(code))break;code=null;}
  if(!code)return this.send(peer,{t:'error',message:'No se pudo generar una sala.'});
  const room={code,status:'lobby',stage:'pampa',players:[peer,null],match:null,tickCount:0,timer:null,lastActive:this.clock(),resultSent:false};
  this.rooms.set(code,room);peer.room=room;peer.slot=0;this.emit(room,this.info(room));
 }
 join(peer,code){code=String(code||'').trim().toUpperCase();const room=this.rooms.get(code);
  if(peer.room)return this.send(peer,{t:'error',message:'Ya estás en una sala.'});
  if(!room||room.status!=='lobby'||room.players[1])return this.send(peer,{t:'error',message:'Sala no disponible.'});
  peer.room=room;peer.slot=1;peer.choice='pancho';room.players[1]=peer;room.lastActive=this.clock();this.emit(room,this.info(room));
 }
 choose(peer,msg){const room=peer.room;if(!room||room.status!=='lobby')return;
  const id=String(msg.fighter||'');if(!BY_ID.has(id))return this.send(peer,{t:'error',message:'Personaje no válido.'});
  peer.choice=id;peer.ready=false;room.players.forEach(p=>{if(p)p.ready=false});this.emit(room,this.info(room));
 }
 stage(peer,msg){const room=peer.room;if(!room||room.status!=='lobby'||peer.slot!==0)return;
  if(!STAGES.includes(msg.stage))return;room.stage=msg.stage;room.players.forEach(p=>{if(p)p.ready=false});this.emit(room,this.info(room));
 }
 ready(peer){const room=peer.room;if(!room||room.status!=='lobby'||!room.players.every(Boolean))return;
  peer.ready=true;this.emit(room,this.info(room));
  if(room.players.every(p=>p.ready)){
   room.status='preparing';room.players.forEach(p=>p.loaded=false);
   this.emit(room,{t:'prepare',fighters:room.players.map(p=>p.choice),stage:room.stage,code:room.code});
  }
 }
 loaded(peer){const room=peer.room;if(!room||room.status!=='preparing')return;
  peer.loaded=true;if(room.players.every(p=>p.loaded))this.start(room);
 }
 start(room){if(room.status!=='preparing')return;
  const [a,b]=room.players;
  room.match=Engine.createMatch(BY_ID.get(a.choice),BY_ID.get(b.choice),{mode:'versus',pick1:0,pick2:1});
  room.match.stage=room.stage;room.resultSent=false;room.tickCount=0;room.status='fighting';
  a.nextReady=b.nextReady=false;
  this.emit(room,{t:'start',fighters:[a.choice,b.choice],stage:room.stage});
  this.emit(room,{t:'snapshot',s:snapshot(room.match)});
  if(this.autoTimers)room.timer=setInterval(()=>this.tick(room),Engine.STEP_MS);
 }
 input(peer,msg){const room=peer.room;if(!room||room.status!=='fighting')return;
  const now=this.clock();if(now-peer.rateStart>1000){peer.rateStart=now;peer.rateCount=0}
  if(++peer.rateCount>75)return;
  const n=Number(msg.seq);if(!Number.isSafeInteger(n)||n<=peer.seq)return;peer.seq=n;
  const v=msg.c||{};peer.input={dir:clamp(Number.isFinite(v.dir)?v.dir:0,-1,1),
   crouch:v.crouch===true,guard:v.guard===true,jump:false,dash:false,attack:null};
  if(v.jump===true)peer.edge.jump=true;
  if(v.dash===true)peer.edge.dash=true;
  if(['quick','heavy','kick','special'].includes(v.attack))peer.edge.attack=v.attack;
  peer.lastInput=now;room.lastActive=now;
 }
 take(peer){if(!peer||this.clock()-peer.lastInput>700)return neutral();
  const result={...peer.input,jump:!!peer.edge.jump,dash:!!peer.edge.dash,attack:peer.edge.attack||null};
  peer.edge={};return result;
 }
 tick(room){if(room.status!=='fighting'||!room.match)return;
  const [a,b]=room.players;
  Engine.advance(room.match,[this.take(a),this.take(b)]);
  room.tickCount++;
  if(room.match.events.length)this.emit(room,{t:'events',events:room.match.events});
  if(room.tickCount%3===0||room.match.betweenRounds)this.emit(room,{t:'snapshot',s:snapshot(room.match)});
  if(room.match.betweenRounds){room.status='between';if(room.timer){clearInterval(room.timer);room.timer=null}
    this.emit(room,{t:'round_complete',snapshot:snapshot(room.match)});
  }
 }
 next(peer){const room=peer.room;if(!room||room.status!=='between')return;
  peer.nextReady=true;this.emit(room,{t:'next_wait',player:peer.slot+1});
  if(room.players.every(p=>p.nextReady)){
   if(room.match.matchOver){room.match=Engine.createMatch(BY_ID.get(room.players[0].choice),BY_ID.get(room.players[1].choice),{mode:'versus'});room.match.stage=room.stage;}
   else Engine.nextRound(room.match);
   room.status='fighting';room.players.forEach(p=>{p.nextReady=false;p.input=neutral();p.edge={}});
   this.emit(room,{t:'next_round',snapshot:snapshot(room.match)});
   if(this.autoTimers)room.timer=setInterval(()=>this.tick(room),Engine.STEP_MS);
  }
 }
 receive(socket,raw){let peer=this.peers.get(socket);if(!peer)peer=this.attach(socket);
  if(typeof raw!=='string'||raw.length>2048)return;
  let msg;try{msg=JSON.parse(raw)}catch(_){return}
  if(!msg||typeof msg!=='object'||typeof msg.t!=='string')return;
  if(msg.t==='create')this.create(peer);
  else if(msg.t==='join')this.join(peer,msg.code);
  else if(msg.t==='choose')this.choose(peer,msg);
  else if(msg.t==='stage')this.stage(peer,msg);
  else if(msg.t==='ready')this.ready(peer);
  else if(msg.t==='loaded')this.loaded(peer);
  else if(msg.t==='input')this.input(peer,msg);
  else if(msg.t==='next')this.next(peer);
  else if(msg.t==='leave')this.leave(peer);
 }
 leave(peer){if(!peer?.room)return;const room=peer.room;peer.room=null;peer.slot=-1;
  if(room.timer)clearInterval(room.timer);room.timer=null;this.rooms.delete(room.code);
  room.players.filter(p=>p&&p!==peer).forEach(p=>{p.room=null;p.slot=-1;this.send(p,{t:'peer_left',message:'El rival abandonó la sala.'})});
  room.players=[];
 }
 detach(socket){const peer=this.peers.get(socket);if(peer)this.leave(peer);this.peers.delete(socket)}
 shutdown(){for(const r of this.rooms.values()){if(r.timer)clearInterval(r.timer)}this.rooms.clear();this.peers.clear()}
}
export { snapshot };
