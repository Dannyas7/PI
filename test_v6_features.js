const assert=require('node:assert/strict');
const E=require('./combat-core.js');
const D={id:'daniel',name:'Daniel',speed:3.6,reach:60,power:1};
const Y={id:'yerko',name:'Yerko',speed:3.66,reach:64,power:1.18};
const M={id:'mati',name:'Mati',speed:3.82,reach:62,power:1.09};
const blank=()=>E.freshInput();
function step(s,i={},j={}){ E.advance(s,[{...blank(),...i},{...blank(),...j}]); }
function testDash(){
 const s=E.createMatch(D,Y,{mode:'versus'});const start=s.p1.x;
 step(s,{dir:1,dash:true});assert.equal(s.p1.action,'dash');assert.ok(s.p1.x-start>7,'dash moves faster than walk');
 assert.ok(s.p1.dashCooldown>0);const cd=s.p1.dashCooldown;step(s,{dir:1,dash:true});assert.equal(s.p1.dashCooldown,cd-1,'dash respects cooldown');
 console.log('PASS dash acelerado y cooldown');
}
function specialHit(def){
 const s=E.createMatch(def,D,{mode:'versus'});s.p1.x=280;s.p2.x=355;s.p1.meter=100;s.p2.meter=45;
 let hit;
 for(let n=0;n<100;n++){step(s,n===0?{attack:'special'}:{},{});hit=s.events.find(e=>e.type==='hit'&&e.move==='special');if(hit)break;}
 assert.ok(hit,'special hit registered');return {s,hit};
}
function testYerko(){
 const {s,hit}=specialHit(Y);assert.equal(hit.specialLabel,'¡VACACIONES DENEGADAS!');assert.ok(s.p2.meter<45,'vacaciones drains enemy meter');
 s.p1.specialCounter=1;s.p1.move=null;s.p1.meter=100;s.p2.hitstun=0;s.p2.downFrames=0;s.p2.wakeup=0;s.p2.invuln=0;s.p2.ground=true;s.p2.y=E.FLOOR;s.p2.hp=100;s.hitStop=0;s.p2.x=s.p1.x+76;
 let second;for(let i=0;i<100;i++){step(s,i===0?{attack:'special'}:{},{});second=s.events.find(e=>e.type==='hit'&&e.move==='special');if(second)break;}
 assert.ok(second);assert.equal(second.specialLabel,'¡PERMISO RECHAZADO!');assert.ok(s.p2.slowFrames>0);
 console.log('PASS Yerko quita energía y deniega permiso');
}
function testMati(){const {s,hit}=specialHit(M);assert.equal(hit.specialLabel,'¡MODO CUICO!');assert.ok(s.p1.premiumFrames>0);console.log('PASS Mati activa velocidad premium');}
testDash();testYerko();testMati();
