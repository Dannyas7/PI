import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomHub} from './rooms.mjs';
const socket=()=>({readyState:1, packets:[],send(s){this.packets.push(JSON.parse(s))}});
const last=(s,t)=>[...s.packets].reverse().find(x=>x.t===t);
test('crear sala, unir rival y sincronizar elecciones',()=>{
 const h=new RoomHub({autoTimers:false,makeCode:()=> 'CIO222'});const a=socket(),b=socket();h.attach(a);h.attach(b);
 h.receive(a,JSON.stringify({t:'create'}));h.receive(b,JSON.stringify({t:'join',code:'CIO222'}));
 assert.equal(last(a,'lobby').players.length,2);assert.equal(last(b,'lobby').code,'CIO222');
 h.receive(a,JSON.stringify({t:'choose',fighter:'mati'}));h.receive(b,JSON.stringify({t:'choose',fighter:'yerko'}));
 h.receive(a,JSON.stringify({t:'stage',stage:'pampa'}));
 h.receive(a,JSON.stringify({t:'ready'}));h.receive(b,JSON.stringify({t:'ready'}));
 assert.deepEqual(last(a,'prepare').fighters,['mati','yerko']);
 h.receive(a,JSON.stringify({t:'loaded'}));assert.equal(last(a,'start'),undefined);
 h.receive(b,JSON.stringify({t:'loaded'}));assert.equal(last(a,'start').stage,'pampa');
 for(let i=0;i<8;i++)h.tick(h.rooms.get('CIO222'));
 assert.equal(last(a,'snapshot').s.round,1);
 h.shutdown();
});
test('ignorar entrada inválida y no duplicar secuencias',()=>{
 let now=1000;const h=new RoomHub({autoTimers:false,clock:()=>now,makeCode:()=> 'TEST88'});
 const a=socket(),b=socket();h.attach(a);h.attach(b);h.receive(a,JSON.stringify({t:'create'}));h.receive(b,JSON.stringify({t:'join',code:'TEST88'}));
 for(const s of [a,b])h.receive(s,JSON.stringify({t:'ready'}));for(const s of [a,b])h.receive(s,JSON.stringify({t:'loaded'}));
 h.receive(a,JSON.stringify({t:'input',seq:5,c:{dir:999,attack:'__hack__'}}));
 h.receive(a,JSON.stringify({t:'input',seq:4,c:{dir:-1,attack:'special'}}));
 const p=h.peers.get(a);assert.equal(p.input.dir,1);assert.equal(p.edge.attack,undefined);
 now=1900;assert.equal(h.take(p).dir,0);
 h.detach(b);assert.equal(h.rooms.size,0);assert.equal(last(a,'peer_left').t,'peer_left');h.shutdown();
});
test('sólo host puede cambiar el escenario',()=>{
 const h=new RoomHub({autoTimers:false,makeCode:()=> 'ROOM22'}),a=socket(),b=socket();h.attach(a);h.attach(b);h.receive(a,JSON.stringify({t:'create'}));h.receive(b,JSON.stringify({t:'join',code:'ROOM22'}));
 h.receive(b,JSON.stringify({t:'stage',stage:'cio'}));assert.equal(h.rooms.get('ROOM22').stage,'pampa');
 h.receive(a,JSON.stringify({t:'stage',stage:'cio'}));assert.equal(h.rooms.get('ROOM22').stage,'cio');h.shutdown();
});
