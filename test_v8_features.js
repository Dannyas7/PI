'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Engine=require('./combat-core.js');
const def=n=>({id:n,name:n,speed:3.5,reach:64,power:1});
// Force a finish through the core. The loser must stay down while the winner celebrates.
const m=Engine.createMatch(def('daniel'),def('yerko'),{mode:'versus'});
m.p2.hp=0;
Engine.advance(m,[Engine.freshInput(),Engine.freshInput()]);
assert.equal(m.betweenRounds,true);
assert.equal(m.p1.action,'victory');
assert.equal(m.p2.action,'ko');
assert.equal(m.p2.ko,true);
assert.equal(m.wins[0],1);
assert.equal(m.p2.y,Engine.FLOOR);
assert.equal(Engine.nextRound(m),true);
assert.equal(m.p2.action,'idle');
assert.equal(m.p2.ko,undefined);
console.log('PASS KO and victory states persist until next round');

// Original generative synthesis and menu music variants are bundled, no licensed tracks.
const aud=fs.readFileSync('./audio-engine.js','utf8');
for(const scene of ['menu','select','stage','versus','fight','victory']) assert(aud.includes(scene+':'));
for(const fx of ['quick','heavy','kick','blocked','special','dash','guardBreak','ko','victory']) assert(aud.includes("case '"+fx+"'"));
console.log('PASS six music scenes and nine audio effects');

const html=fs.readFileSync('./index.html','utf8');
const js=fs.readFileSync('./game.js','utf8');
const css=fs.readFileSync('./style.css','utf8');
for(const id of ['home-fullscreen','fullscreen-hint','ko-burst','touch-controls','joystick-zone','vs-screen'])assert(html.includes('id="'+id+'"'));
assert(js.includes('requestFullscreenForPlay'));
assert(js.includes('pendingResult'));
assert(js.includes('const VS_MIN_DURATION = 4700;'));
assert(css.includes('.victory-title'));
console.log('PASS fullscreen, cinematic KO, long VS screen and floating controls');
