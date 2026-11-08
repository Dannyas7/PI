const PORTRAIT_DATA = {"daniel": "assets/portraits/daniel.webp", "pancho": "assets/portraits/pancho.webp", "alexis": "assets/portraits/alexis.webp", "lucho": "assets/portraits/lucho.webp"};
const SPRITE_DATA = {"daniel": "assets/sprites/daniel.png", "pancho": "assets/sprites/pancho.png", "alexis": "assets/sprites/alexis.png", "lucho": "assets/sprites/lucho.png"};
(() => {
'use strict';

const $ = id => document.getElementById(id);
const Engine = window.BatallaCombat;
if (!Engine) throw new Error('No se pudo cargar combat-core.js');
const roster = [
 {id:'daniel',name:'Daniel',tag:'CONTROL DE PROCESOS',color:'#20436c',dark:'#111b33',skin:'#e8aa85',hair:'#d5dce3',accent:'#54caff',special:'EMBESTIDA CIO',power:1.02,speed:3.65,reach:57,beard:false},
 {id:'pancho',name:'Pancho',tag:'MAESTRO DEL CONTRAATAQUE',color:'#272c3d',dark:'#192137',skin:'#d99b75',hair:'#251d1e',accent:'#ff9c42',special:'GANCHO VELOZ',power:1.06,speed:3.8,reach:59,glasses:true,beard:true},
 {id:'alexis',name:'Alexis',tag:'MIYAGI · COMBATE TÉCNICO',color:'#66533a',dark:'#283d45',skin:'#c78a66',hair:'#aab6ba',accent:'#53d9ef',special:'FURIA MIYAGI',power:1.12,speed:3.25,reach:67,beard:true},
 {id:'lucho',name:'Lucho',tag:'PODER INDUSTRIAL',color:'#a7cceb',dark:'#283b56',skin:'#c58662',hair:'#292326',accent:'#ffbe4a',special:'GOLPE INDUSTRIAL',power:1.15,speed:3.05,reach:65,beard:true,stamina:1.05}
];
roster.push(
 {id:'mati',name:'Mati',tag:'NUEVO · ESTILO Y PRECISIÓN · LENTES REDONDOS',color:'#355da8',dark:'#18233c',skin:'#dfa07a',hair:'#211a1c',accent:'#ff6f63',special:'MODO CUICO',power:1.09,speed:3.82,reach:62,beard:false,isNew:true,specialMessages:['¡MODO CUICO!','¡PRESENCIA EJECUTIVA!','¡GOLPE DE ÉLITE!']},
 {id:'yerko',name:'Yerko',tag:'NUEVO · JEFE SALA CIO · RUNNER',color:'#21375f',dark:'#101a33',skin:'#d99b75',hair:'#241d1c',accent:'#5bc0ff',special:'PERMISO DENEGADO',power:1.18,speed:3.66,reach:64,beard:true,isNew:true,specialMessages:['¡VACACIONES DENEGADAS!','¡PERMISO RECHAZADO!','¡CALLAMPA!']}
);
const STAGES = [
 {id:'pampa',name:'PAMPA',subtitle:'DESIERTO DE ATACAMA',src:'assets/stages/pampa.png'},
 {id:'concentradora',name:'PLANTA CONCENTRADORA',subtitle:'EL SALVADOR',src:'assets/stages/concentradora.png'},
 {id:'cio',name:'SALA CIO',subtitle:'CENTRO DE OPERACIONES',src:'cio_control_room.png'}
];
Object.assign(PORTRAIT_DATA,{mati:'assets/portraits/mati_v7.webp',yerko:'assets/portraits/yerko_v7.webp'});
Object.assign(SPRITE_DATA,{mati:'assets/sprites/mati.png',yerko:'assets/sprites/yerko.png'});
let stagePick = 0;
const loadedStages = Object.fromEntries(STAGES.map(s => { const img = new Image(); img.src = s.src; return [s.id,img]; }));
const loadedSprites = Object.fromEntries(roster.map(f => { const img = new Image(); img.src = SPRITE_DATA[f.id]; return [f.id,img]; }));


const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
// The flash is composited on a TRANSPARENT buffer, never on the stage.
const flashCanvas = document.createElement('canvas');
flashCanvas.width = 168; flashCanvas.height = 132;
const flashCtx = flashCanvas.getContext('2d', { alpha: true });
flashCtx.imageSmoothingEnabled = false;

let mode = 'cpu';
let difficulty = 'normal';
let pick1 = 0;
let pick2 = 1;
let match = null;
let menuStep = 0;
let vsToken = 0;
let renderAlpha = 1;
const VS_MIN_DURATION = 4700;
let onlineSlot = 0;
let onlineCode = "";
let onlineLastInput = 0;
let onlineLastSnapshot = 0;
let onlinePreparing = false;
let onlineChoice = "daniel";
let onlineWaitingNext = false;
const onlineNet = new window.CIOOnlineClient(onOnlinePacket,onOnlineDisconnect);
const analog = {pointerId:null,x:0,y:0,jumpQueued:false,dashQueued:false,previousMove:0};
let stageCacheId = '';
let stageGradient = null;
let hudLastUpdate=0;
const MENU_STEPS = ['mode-screen','p1-screen','p2-screen','stage-screen'];
const MENU_HINTS = [
  'Primero elige si quieres jugar contra la CPU o en versus local.',
  'Pantalla dedicada de selección: revisa rostros y estilos antes de confirmar.',
  'Aquí eliges al rival. Yerko llega con energía de jefe de sala CIO.',
  'Último paso: define el escenario y entra al combate sin cuenta regresiva.'
];
const HERO_STEPS = [
  {eyebrow:'DIVISIÓN SALVADOR · MODO ARCADE', title:'¡Que comience<br><em>el turno!</em>', copy:'El flujo de selección ahora cambia por pantallas para sentirse mucho más arcade y menos saturado.'},
  {eyebrow:'SELECCIÓN DE PERSONAJE', title:'Elige tu<br><em>luchador</em>', copy:'Retratos fieles a las tarjetas originales, encuadrados como los cuatro primeros luchadores.'},
  {eyebrow:'RIVAL / CPU', title:'Define al<br><em>oponente</em>', copy:'Yerko entra como jefe de sala CIO con ataques más cabrones. Mati vuelve con un look más propio y elegante.'},
  {eyebrow:'SELECCIÓN DE ESCENARIO', title:'Escenario y<br><em>combate</em>', copy:'Sin espera antes de pelear: eliges la arena y entras directo a la acción.'}
];
let paused = false;
let raf = 0;
let lastFrame = 0;
let accumulator = 0;
let audioCtx = null;
let muted = false;
const audio = window.CIOAudio;
let pendingResult = null;
let koShown = false;
let hitboxesVisible = false;
let message = '';
let messageFrames = 0;
let particles = [];
let comboText = '';
let comboFrames = 0;
let impactRings = [];
let impactFlashFrames = 0;
const heldKeys = new Set();
const edgeKeys = new Set();
const touchHeld = new Set();
const touchEdges = new Set();
const pointerKeys = new Map();
const padWasDown = [[], []];
const CONTROLS = [
  { left: 'a', right: 'd', jump: 'w', crouch: 's', quick: 'j', heavy: 'k', kick: 'l', guard: 'i', special: 'u', dash: 'shift' },
  { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', crouch: 'arrowdown', quick: '1', heavy: '2', kick: '3', guard: '0', special: '4', dash:'5' }
];
const ignoredBrowserKeys = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'shift']);
const soundByMove = {
  quick: [335, .045, 'square'], heavy: [220, .065, 'sawtooth'],
  kick: [270, .06, 'square'], special: [145, .14, 'sawtooth'],
  airQuick: [345, .05, 'square'], airHeavy: [240, .06, 'sawtooth'],
  airKick: [295, .05, 'square']
};

function makeCard(person, index, selected, side) {
  const button = document.createElement('button');
  button.className = 'char-card' + (selected ? ' selected' : '');
  button.type = 'button'; button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', person.name + ', ' + person.tag + (person.isNew ? ', NUEVO' : ''));
  const img = document.createElement('img'); img.src = PORTRAIT_DATA[person.id]; img.alt = person.name; img.loading = 'eager';
  button.appendChild(img);
  if (person.isNew) { const badge=document.createElement('span'); badge.className='new-badge'; badge.textContent='NUEVO'; button.appendChild(badge); }
  const name=document.createElement('b'); name.textContent=person.name; button.appendChild(name);
  button.addEventListener('click', () => { if(side===1) pick1=index; else pick2=index; renderRosters(); beep(620,.036,'triangle'); });
  return button;
}
function renderRosters() {
  $('chars1').replaceChildren(...roster.map((p,i)=>makeCard(p,i,pick1===i,1)));
  $('chars2').replaceChildren(...roster.map((p,i)=>makeCard(p,i,pick2===i,2)));
  updateFighterFeature();
}
function updateFighterFeature(){
  const selected=roster[menuStep===2?pick2:pick1];
  if(!selected) return;
  $('focus-portrait').src=PORTRAIT_DATA[selected.id]; $('focus-portrait').alt='Retrato de '+selected.name;
  document.querySelector('.feature-image-wrap').style.backgroundImage=`linear-gradient(#11203a66,#101a30a6),url("${PORTRAIT_DATA[selected.id]}")`;
  $('focus-name').textContent=selected.name.toUpperCase();
  $('focus-tag').textContent=selected.tag;
  $('focus-special').textContent=selected.special;
  $('focus-new').classList.toggle('hidden',!selected.isNew);
  const p=Math.max(20,Math.min(95,(selected.power-0.9)*310));
  const s=Math.max(20,Math.min(95,(selected.speed-2.9)*74));
  $('stat-power').style.background=`linear-gradient(90deg,#61ddeb 0 ${p}%,#374963 ${p}%)`;
  $('stat-speed').style.background=`linear-gradient(90deg,#fcca69 0 ${s}%,#374963 ${s}%)`;
}
function renderStages(){
  $('stages').replaceChildren(...STAGES.map((stage,i)=>{
    const btn=document.createElement('button'); btn.type='button';btn.className='stage-card'+(i===stagePick?' selected':'');
    btn.setAttribute('aria-pressed',String(i===stagePick));
    const img=document.createElement('img');img.src=stage.src;img.alt='';img.loading='eager';
    const text=document.createElement('div');const title=document.createElement('strong');title.textContent=stage.name;
    const sub=document.createElement('small');sub.textContent=stage.subtitle;text.append(title,sub);btn.append(img,text);
    btn.addEventListener('click',()=>{stagePick=i;renderStages();beep(420,.06,'triangle');});return btn;
  }));
  const stage=STAGES[stagePick];
  $('stage-hero').src=stage.src;$('stage-title').textContent=stage.name;$('stage-description').textContent=stage.subtitle;
  $('stage-ambient').style.backgroundImage=`linear-gradient(90deg,#061120d1,#101c30be),url('${stage.src}')`;
  $('summary-p1').textContent=roster[pick1].name.toUpperCase();$('summary-p2').textContent=roster[pick2].name.toUpperCase();
}
function setMode(next){
  mode=['cpu','versus','online'].includes(next)?next:'cpu';
  document.querySelectorAll('.mode').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('cpu-options').classList.toggle('hidden',mode!=='cpu');
}
function setDifficulty(next){
  if(!Engine.AI_LEVELS[next]) return; difficulty=next;
  document.querySelectorAll('[data-difficulty]').forEach(b=>{const active=b.dataset.difficulty===difficulty;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function showMenuStep(step){
  audio?.setScene(step===0?'menu':step===3?'stage':'select');
  menuStep=Math.max(0,Math.min(3,step));
  $('online-screen').classList.add('hidden');
  $('menu').classList.toggle('hidden',menuStep!==0);
  $('fighter-screen').classList.toggle('hidden',menuStep!==1&&menuStep!==2);
  $('stage-screen').classList.toggle('hidden',menuStep!==3);
  $('chars1').classList.toggle('hidden',menuStep!==1);
  $('chars2').classList.toggle('hidden',menuStep!==2);
  $('fighter-screen-title').textContent=menuStep===2?'ELIGE TU RIVAL':'SELECCIONA TU LUCHADOR';
  $('fighter-side').textContent=menuStep===2?(mode==='cpu'?'CPU':'JUGADOR 2'):'JUGADOR 1';
  $('roster-player-label').textContent=menuStep===2?(mode==='cpu'?'RIVAL CPU':'JUGADOR 2'):'JUGADOR 1';
  $('roster-next').textContent=menuStep===2?'IR A ESCENARIOS →':'CONFIRMAR LUCHADOR →';
  updateFighterFeature();if(menuStep===3) renderStages();
}
function nextMenuStep(){showMenuStep(menuStep+1)}
function prevMenuStep(){showMenuStep(menuStep-1)}
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>setDifficulty(b.dataset.difficulty)));
$('nav-next').addEventListener('click',()=>mode==='online'?showOnlineLobby():showMenuStep(1));
$('fighter-back').addEventListener('click',()=>showMenuStep(menuStep-1));
$('roster-next').addEventListener('click',()=>showMenuStep(menuStep+1));
$('stage-back').addEventListener('click',()=>showMenuStep(2));
$('help-button').addEventListener('click',()=>$('help-dialog').showModal());
$('help-close').addEventListener('click',()=>$('help-dialog').close());
$('help-play').addEventListener('click',()=>$('help-dialog').close());

function clearInputs() {
  heldKeys.clear();
  edgeKeys.clear();
  touchHeld.clear();
  touchEdges.clear();
  pointerKeys.clear();
  document.querySelectorAll('[data-touch]').forEach(b => b.classList.remove('is-down'));
  padWasDown[0] = [];
  padWasDown[1] = [];
  resetAnalog();
}

// Pantalla VS independiente: precarga recursos y anuncia cuándo están realmente listos.
async function showVersus() {
  const token=++vsToken;
  audio?.setScene('versus');
  $('stage-screen').classList.add('hidden');$('vs-screen').classList.remove('hidden');
  $('vs-p1').src=PORTRAIT_DATA[roster[pick1].id];$('vs-p2').src=PORTRAIT_DATA[roster[pick2].id];
  $('vs-name1').textContent=roster[pick1].name.toUpperCase();$('vs-name2').textContent=roster[pick2].name.toUpperCase();
  $('vs-rival-type').textContent=mode==='cpu'?'RIVAL CPU':'JUGADOR 2';
  const stage=STAGES[stagePick];
  $('vs-stage-name').textContent=stage.name+' · '+stage.subtitle;
  $('vs-stage-back').style.backgroundImage=`linear-gradient(115deg,#05264ddd,#170b2add),url("${stage.src}")`;
  $('vs-abilities').textContent=roster[pick1].special+'  ✦  '+roster[pick2].special;
  const startAt=performance.now();
  const progress=$('loading-progress'),label=$('loading-text');
  progress.style.width='7%';label.textContent='SINCRONIZANDO LUCHADORES…';
  const images=[loadedSprites[roster[pick1].id],loadedSprites[roster[pick2].id],loadedStages[stage.id],$('vs-p1'),$('vs-p2')];
  let completed=0;
  const success=await Promise.all(images.map(async img=>{
    try{
      if(img.decode) await img.decode();
      else if(!img.complete) await new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true})});
      return !!img.naturalWidth;
    }catch(_){return false}
    finally{
      completed++;
      if(token===vsToken){progress.style.width=(7+Math.round(78*completed/images.length))+'%';label.textContent='CARGANDO RECURSOS: '+completed+'/'+images.length;}
    }
  }));
  if(token!==vsToken)return;
  label.textContent=success.every(Boolean)?'¡TODO LISTO PARA EL COMBATE!':'PREPARADO CON RECURSOS ALTERNATIVOS';
  const elapsed=performance.now()-startAt;
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,VS_MIN_DURATION-elapsed)));
  if(token!==vsToken)return;
  progress.style.width='100%';
  if(mode==='online'){onlineNet.send({t:'loaded'});label.textContent='ESPERANDO AL OTRO JUGADOR…';return;}
  beginMatch();
}
function beginMatch() {
  cancelAnimationFrame(raf); clearInputs();
  match=Engine.createMatch(roster[pick1],roster[pick2],{pick1,pick2,mode:mode==='online'?'versus':mode,difficulty});match.stage=STAGES[stagePick].id;
  paused=false;particles=[];impactRings=[];impactFlashFrames=0;comboFrames=0;messageFrames=0;pendingResult=null;koShown=false;lastFrame=performance.now();accumulator=0;
  audio?.setScene('fight');
  $('vs-screen').classList.add('hidden');$('stage-screen').classList.add('hidden');$('menu').classList.add('hidden');$('fighter-screen').classList.add('hidden');$('online-screen').classList.add('hidden');
  $('arena').classList.remove('hidden');$('overlay').classList.add('hidden');$('pause-tag').classList.add('hidden');
  $('special1').textContent='⚡ '+match.p1.def.special;
  $('special2').textContent='⚡ '+match.p2.def.special;
  $('touch-controls').classList.toggle('hidden',mode==='versus' || !('ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches));
  $('pause-button').classList.toggle('hidden',mode==='online');
  message='¡PELEEN!';messageFrames=58;updateHud();
  resetAnalog();
  beep(520,.09,'triangle');resizeCanvas();raf=requestAnimationFrame(frame);
}
function advanceRoundOrRematch(){
  if(!match||!match.betweenRounds)return;
  if(mode==='online'){onlineNet.send({t:'next'});onlineWaitingNext=true;$('rematch').disabled=true;$('rematch').textContent='ESPERANDO AL RIVAL…';return;}
  if(match.matchOver)return beginMatch();
  Engine.nextRound(match);$('overlay').classList.add('hidden');particles=[];impactRings=[];comboFrames=0;clearInputs();accumulator=0;
  pendingResult=null;koShown=false;$('ko-burst').classList.add('hidden');audio?.setScene('fight');
  message='¡PELEEN!';messageFrames=39;updateHud();
}
function backMenu(){
  if(mode==='online')onlineNet.disconnect(true);onlineCode='';onlinePreparing=false;onlineWaitingNext=false;
  ++vsToken;cancelAnimationFrame(raf);raf=0;match=null;paused=false;pendingResult=null;koShown=false;$('ko-burst').classList.add('hidden');clearInputs();audio?.setScene('menu');
  $('arena').classList.add('hidden');$('vs-screen').classList.add('hidden');$('online-screen').classList.add('hidden');
  $('touch-controls').classList.add('hidden');$('pause-tag').classList.add('hidden');
  showMenuStep(0);
}

$('start').addEventListener('click', showVersus);
$('rematch').addEventListener('click', advanceRoundOrRematch);
$('back-menu').addEventListener('click', backMenu);
$('back-from-pause').addEventListener('click', backMenu);
$('resume').addEventListener('click', () => togglePause(false));
$('pause-button').addEventListener('click', () => togglePause());
$('mute-button').addEventListener('click', toggleMute);
async function requestFullscreenForPlay(){
  const hint=$('fullscreen-hint');
  try{
    if(!document.fullscreenElement){
      if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
      else if(document.documentElement.webkitRequestFullscreen)await document.documentElement.webkitRequestFullscreen();
      else throw new Error('Fullscreen API unavailable');
    }
    if(document.fullscreenElement&&screen.orientation?.lock){await screen.orientation.lock('landscape').catch(()=>{});}
    if(hint)hint.textContent='PANTALLA COMPLETA ACTIVADA · GIRA EL TELÉFONO PARA JUGAR';
  }catch(_){if(hint)hint.textContent='TU NAVEGADOR NO PERMITE PANTALLA COMPLETA DESDE ESTE ARCHIVO. PUEDES JUGAR NORMALMENTE.';}
  resizeCanvas();
}
$('home-fullscreen').addEventListener('click',()=>{audio?.unlock();requestFullscreenForPlay()});
// El primer gesto de JUGAR puede activar pantalla completa en móvil, sin abrirla automáticamente sin consentimiento.
$('nav-next').addEventListener('click',()=>{if(window.matchMedia('(pointer:coarse)').matches)requestFullscreenForPlay()},{capture:true});
$('fullscreen-button').addEventListener('click',()=>{audio?.unlock();requestFullscreenForPlay()});
document.addEventListener('pointerdown',()=>{audio?.unlock()},{once:true,capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio?.setMuted(true);else audio?.setMuted(muted)});
window.addEventListener('resize', resizeCanvas, {passive:true});
window.addEventListener('orientationchange', resizeCanvas, {passive:true});

function resizeCanvas(){
  const holder=document.querySelector('.game-wrap');if(!holder)return;
  const w=holder.clientWidth,h=holder.clientHeight;if(!w||!h)return;
  const factor=Math.min(w/960,h/540);
  const dw=Math.max(1,Math.floor(factor*960)),dh=Math.max(1,Math.floor(factor*540));
  canvas.style.width=dw+'px';canvas.style.height=dh+'px';
}

function toggleMute() {
  muted = !muted; audio?.setMuted(muted);
  $('mute-button').textContent = muted ? '×' : '♪';
  $('mute-button').setAttribute('aria-pressed', String(muted));
}

function togglePause(force) {
  if (!match || match.betweenRounds || mode==='online') return;
  paused = typeof force === 'boolean' ? force : !paused;
  $('pause-tag').classList.toggle('hidden', !paused);
  audio?.setMuted(muted || paused);
  if (!paused) {
    edgeKeys.clear();
    touchEdges.clear();
    accumulator = 0;
    lastFrame = performance.now();
  }
}

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (match && (ignoredBrowserKeys.has(k) || Object.values(CONTROLS[0]).includes(k) || Object.values(CONTROLS[1]).includes(k))) {
    e.preventDefault();
  }
  if (!match) return;
  if (!heldKeys.has(k)) {
    if (k === 'escape') { e.preventDefault(); togglePause(); }
    else if (k === 'enter' && match.betweenRounds) { e.preventDefault(); advanceRoundOrRematch(); }
    else if (k === 'm') toggleMute();
    else if (k === 'h') {
      hitboxesVisible = !hitboxesVisible;
      message = hitboxesVisible ? 'CAJAS DE COLISIÓN: ON' : 'CAJAS DE COLISIÓN: OFF';
      messageFrames = 90;
    }
    if (!paused && !match.betweenRounds) edgeKeys.add(k);
  }
  heldKeys.add(k);
});
window.addEventListener('keyup', e => heldKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => {
  if (match && !match.betweenRounds) togglePause(true);
  clearInputs();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && match && !match.betweenRounds) {
    togglePause(true);
    clearInputs();
  }
});

// Joystick analógico independiente y multitáctil: un dedo mueve mientras los demás atacan.
const stickZone=$('joystick-zone'),stickThumb=$('joystick-thumb');
function resetAnalog(){
  analog.pointerId=null;analog.x=0;analog.y=0;analog.jumpQueued=false;analog.dashQueued=false;
  if(stickThumb)stickThumb.style.transform='translate(0px, 0px)';
  if(stickZone)stickZone.classList.remove('engaged');
}
function applyAnalog(event){
  const face=stickZone.querySelector('.analog-face');
  const rect=face.getBoundingClientRect();
  const radius=Math.min(rect.width,rect.height)*.36;
  let dx=(event.clientX-(rect.left+rect.width/2))/radius;
  let dy=(event.clientY-(rect.top+rect.height/2))/radius;
  const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len}
  const oldY=analog.y,oldX=analog.x;
  analog.x=Math.abs(dx)<.21?0:Math.sign(dx)*Math.pow((Math.abs(dx)-.21)/.79,.72);
  analog.y=Math.abs(dy)<.32?0:dy;
  if(analog.y<-.65&&oldY>=-.65)analog.jumpQueued=true;
  if(Math.abs(dx)>.87 && Math.abs(oldX)<.40){
    const now=performance.now();
    if(now-analog.previousMove<260)analog.dashQueued=true;
    analog.previousMove=now;
  }
  stickThumb.style.transform=`translate(${Math.round(dx*radius*.57)}px,${Math.round(dy*radius*.57)}px)`;
}
stickZone.addEventListener('pointerdown',event=>{
  if(!match||paused||match.betweenRounds||analog.pointerId!==null)return;
  event.preventDefault();analog.pointerId=event.pointerId;
  try{stickZone.setPointerCapture(event.pointerId)}catch(_){}
  stickZone.classList.add('engaged');applyAnalog(event);
});
stickZone.addEventListener('pointermove',event=>{
  if(event.pointerId!==analog.pointerId)return;
  event.preventDefault();applyAnalog(event);
});
function analogReleased(event){if(event.pointerId===analog.pointerId)resetAnalog()}
stickZone.addEventListener('pointerup',analogReleased);
stickZone.addEventListener('pointercancel',analogReleased);
stickZone.addEventListener('lostpointercapture',analogReleased);

// Cada dedo controla independientemente su botón; no bloquea los demás toques.
for (const button of document.querySelectorAll('[data-touch]')) {
  button.addEventListener('pointerdown', event => {
    if (!match || paused || match.betweenRounds) return;
    event.preventDefault();
    const key = button.dataset.touch;
    pointerKeys.set(event.pointerId, { button, key });
    if (!touchHeld.has(key)) touchEdges.add(key);
    touchHeld.add(key);
    button.classList.add('is-down');
    try { button.setPointerCapture(event.pointerId); } catch (_) { /* no-op */ }
  });
}
function releasePointer(event) {
  const press = pointerKeys.get(event.pointerId);
  if (!press) return;
  pointerKeys.delete(event.pointerId);
  if (![...pointerKeys.values()].some(p => p.key === press.key)) touchHeld.delete(press.key);
  if (![...pointerKeys.values()].some(p => p.button === press.button)) press.button.classList.remove('is-down');
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);
window.addEventListener('pointerup',analogReleased);
window.addEventListener('pointercancel',analogReleased);

function gamepadInput(player) {
  const empty = { dir: 0, crouch: false, guard: false, jump: false, dash: false, attack: null };
  if (typeof navigator.getGamepads !== 'function') return empty;
  const pads = navigator.getGamepads();
  const pad = pads && [...pads].filter(Boolean)[player - 1];
  if (!pad) { padWasDown[player - 1] = []; return empty; }
  const was = padWasDown[player - 1];
  const down = i => !!(pad.buttons[i] && pad.buttons[i].pressed);
  const edge = i => down(i) && !was[i];
  const x = pad.axes && pad.axes.length ? pad.axes[0] : 0;
  empty.dir = down(14) || x < -.35 ? -1 : down(15) || x > .35 ? 1 : 0;
  empty.crouch = down(13) || (pad.axes && pad.axes.length > 1 && pad.axes[1] > .65);
  empty.guard = down(4) || down(6);
  empty.dash = edge(7);
  empty.jump = edge(5) || edge(12);
  empty.attack = edge(3) ? 'special' : edge(2) ? 'heavy' : edge(1) ? 'kick' : edge(0) ? 'quick' : null;
  padWasDown[player - 1] = Array.from({ length: pad.buttons.length }, (_, i) => down(i));
  return empty;
}

function readInput(player) {
  const c = CONTROLS[player - 1];
  const touch = player === 1;
  const down = name => heldKeys.has(c[name]) || (touch && touchHeld.has(name));
  const edge = name => edgeKeys.has(c[name]) || (touch && touchEdges.has(name));
  const gp = gamepadInput(player);
  const dir = (down('right') ? 1 : 0) - (down('left') ? 1 : 0);
  return {
    dir: dir || (touch&&Math.abs(analog.x)>.01?analog.x:0) || gp.dir,
    crouch: down('crouch') || (touch&&analog.y>.62) || gp.crouch,
    guard: down('guard') || gp.guard,
    jump: edge('jump') || (touch&&analog.jumpQueued) || gp.jump,
    dash: edge('dash') || (touch&&analog.dashQueued) || gp.dash,
    attack: edge('special') ? 'special' : edge('heavy') ? 'heavy' :
      edge('kick') ? 'kick' : edge('quick') ? 'quick' : gp.attack
  };
}

function resetEdges() {
  edgeKeys.clear();touchEdges.clear();
  analog.jumpQueued=false;analog.dashQueued=false;
}

function spawnImpact(hit) {
  const actor = hit.player === 1 ? match.p1.def : match.p2.def;
  const color = hit.blocked ? '#74e1ff' : hit.move === 'special'
    ? (actor.id === 'mati' ? '#ff9f68' : actor.id === 'yerko' ? '#65cfff' : '#ffe45c')
    : '#ffa85d';
  const count = hit.blocked ? 7 : hit.move === 'special' ? 19 : 11;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 1.8 + Math.random() * 4;
    particles.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: 13 + Math.floor(Math.random() * 14), max: 27, color,
      size: hit.move === 'special' ? 5 : 3 });
  }
  impactRings.push({x:hit.x,y:hit.y,r:hit.blocked?7:11,life:hit.move==='special'?24:15,max:hit.move==='special'?24:15,color});
  impactRings=impactRings.slice(-24);
  if(!hit.blocked && hit.move==='special')impactFlashFrames=3;
  // Limit particle budget on memory-constrained mobile devices.
  particles=particles.slice(-110);
}

function playEvents(){
  for(const e of match.events){
    if(e.type==='attack'){
      if(e.move==='special')audio?.play('special');
      else audio?.play(e.move?.includes('heavy')?'heavy':e.move?.includes('kick')?'kick':'quick');
    } else if(e.type==='hit'){
      spawnImpact(e);
      audio?.play(e.blocked?'blocked':e.move==='special'?'special':e.move?.toLowerCase().includes('heavy')?'heavy':e.move?.toLowerCase().includes('kick')?'kick':'quick');
      if(!e.blocked){
        const attacker=e.player===1?match.p1.def:match.p2.def;
        if(e.move==='special')comboText=e.specialLabel||attacker.specialMessages?.[(match.tick+e.player)%attacker.specialMessages.length]||'¡PODER ESPECIAL!';
        else comboText=e.combo>=2?`${e.combo} GOLPES · COMBO`:'';
        comboFrames=comboText?55:0;
      }
    } else if(e.type==='dash') audio?.play('dash');
    else if(e.type==='guardBreak'){message=`¡GUARDIA ROTA! · JUGADOR ${e.player}`;messageFrames=75;audio?.play('guardBreak')}
    else if(e.type==='fight'){message='¡PELEEN!';messageFrames=55;audio?.play('fight')}
    else if(e.type==='roundEnd'){
      // Do not cover the fall with a result card: maintain the full arena visible.
      pendingResult={event:e,showAt:performance.now()+2100,koAt:performance.now()+560};
      koShown=false;
      audio?.play('ko');
    }
  }
}

function showRoundResult(result) {
  const wins = result.wins;
  const name = result.winner === 1 ? match.p1.def.name : match.p2.def.name;
  $('ko-burst').classList.add('hidden');
  $('overlay').classList.remove('hidden');
  audio?.setScene('victory');audio?.play('victory');
  $('result-kicker').textContent = match.matchOver ? 'RESULTADO FINAL' : `FIN DE LA RONDA ${result.round}`;
  $('result-title').textContent = result.winner ? `${name.toUpperCase()} WINS!` : '¡DRAW!';
  $('result-sub').textContent = match.matchOver
    ? `¡Victoria al mejor de 3! · ${wins[0]} - ${wins[1]}`
    : result.winner ? `Marcador: ${wins[0]} - ${wins[1]} · ¡La siguiente ronda decide!` : 'Ningún punto otorgado. Se repite la ronda.';
  $('rematch').textContent = match.matchOver ? 'REVANCHA ↻' : result.winner ? 'SIGUIENTE RONDA ▶' : 'REPETIR RONDA ↻';
  resetEdges();
}

function updateHud() {
  if (!match) return;
  const { p1, p2 } = match;
  for (const [n, f] of [[1, p1], [2, p2]]) {
    $('health' + n).style.width = f.hp + '%';
    $('meter' + n).style.width = f.meter + '%';
    $('guard' + n).style.width = f.guard + '%';
    $('health' + n).setAttribute('aria-label', `Vida jugador ${n}: ${Math.ceil(f.hp)}%`);
    $('name' + n).textContent = f.def.name.toUpperCase();
    $('tag' + n).textContent = f.def.tag;
    const portrait=$('portrait'+n);
    if(portrait.dataset.fighter!==f.def.id){
      portrait.dataset.fighter=f.def.id;
      portrait.style.backgroundImage=`url(${PORTRAIT_DATA[f.def.id]})`;
      portrait.setAttribute('aria-label',`Retrato de ${f.def.name}`);
    }
  }
  $('timer').textContent = String(Math.ceil(match.roundFrames / Engine.FPS)).padStart(2, '0');
  $('round-label').textContent = 'RONDA ' + match.round;
  $('score1').textContent = '●'.repeat(match.wins[0]) + '○'.repeat(2 - match.wins[0]);
  $('score2').textContent = '●'.repeat(match.wins[1]) + '○'.repeat(2 - match.wins[1]);
  $('status').textContent = match.betweenRounds ? 'FIN' : 'COMBATE';
  $('combo').textContent = comboFrames > 0 ? comboText : '';
}

// Bucle de simulación con timestep fijo. Si hay retrasos, se limita el catch-up.
// El navegador solo dibuja; no determina la rapidez del combate.
function frame(now) {
  if (!match) return;
  if(pendingResult){
    if(!koShown && now>=pendingResult.koAt){koShown=true;$('ko-burst').classList.remove('hidden');}
    if(now>=pendingResult.showAt){const r=pendingResult.event;pendingResult=null;showRoundResult(r);}
  }
  const delta = Math.max(0, Math.min(now - lastFrame, 100));
  lastFrame = now;
  if(mode==='online'){
    if(!match.betweenRounds && now-onlineLastInput>=33){
      onlineLastInput=now;
      onlineNet.sendInput(readInput(1));resetEdges();
    }
    // El servidor es autoridad: cliente interpola fotogramas, pero nunca aplica daño.
    renderAlpha=Math.max(0,Math.min(1,(now-onlineLastSnapshot)/70));
    if(now-hudLastUpdate>85){updateHud();hudLastUpdate=now;}
    for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.10;p.life--;}
    particles=particles.filter(p=>p.life>0);
    for(const ring of impactRings){ring.life--;ring.r+=2.6;}
    impactRings=impactRings.filter(r=>r.life>0);
    if(comboFrames>0)comboFrames--;if(messageFrames>0)messageFrames--;if(impactFlashFrames>0)impactFlashFrames--;
    draw();raf=requestAnimationFrame(frame);return;
  }
  if (!paused && !match.betweenRounds) {
    accumulator += delta;
    let steps = 0;
    while (accumulator >= Engine.STEP_MS && steps < 6 && !match.betweenRounds) {
      const i1 = readInput(1);
      const i2 = match.mode === 'versus' ? readInput(2) : null;
      for(const f of [match.p1,match.p2]){f.prevX=f.x;f.prevY=f.y;}
      Engine.advance(match, [i1, i2]);
      playEvents();
      resetEdges();
      accumulator -= Engine.STEP_MS;
      steps++;
      if (comboFrames > 0) comboFrames--;
      if (messageFrames > 0) messageFrames--;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += .10;
        p.life--;
      }
      particles = particles.filter(p => p.life > 0);
      for(const ring of impactRings){ring.life--;ring.r+=2.6;}
      impactRings=impactRings.filter(r=>r.life>0);
      if(impactFlashFrames>0)impactFlashFrames--;
    }
    if (steps === 6) accumulator = 0;
  }
  renderAlpha=paused?1:Math.max(0,Math.min(1,accumulator/Engine.STEP_MS));
  if(now-hudLastUpdate>=85 || match.betweenRounds){ updateHud();hudLastUpdate=now; }
  draw();
  raf = requestAnimationFrame(frame);
}

function drawCollisionBox(b, stroke, fill) {
  if (!b) return;
  ctx.fillStyle = fill;
  ctx.fillRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
}

function draw() {
  if (!match) return;
  // Clear in untransformed screen space first: no stale border pixels during hit shake.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const shake = match.shake || 0;
  ctx.save();
  if (!paused && !match.betweenRounds && shake >= 1) {
    // Integer screen shake prevents fractional sampling of pixel art.
    ctx.translate(Math.round((Math.random() - .5) * shake), Math.round((Math.random() - .5) * shake));
  }
  drawStage();
  drawAtmosphere();
  // Shadows always stay on the ground, also when the fighter is in the air.
  for (const f of [match.p1, match.p2]) {
    const height = Math.max(0, Engine.FLOOR - f.y);
    const shrink = Math.max(.55, 1 - height / 240);
    ctx.save();
    ctx.globalAlpha = Math.max(.16, .44 - height / 360);
    ctx.fillStyle = '#050917';
    ctx.beginPath();
    ctx.ellipse(Math.round(f.prevX===undefined?f.x:f.prevX+(f.x-f.prevX)*renderAlpha), Engine.FLOOR + 1, Math.round(42*shrink), Math.round(8*shrink),0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  for (const f of [match.p1, match.p2]) {
    drawSpriteFighter(f);
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / 13);
    rect(ctx, p.x, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha=1;
  for(const ring of impactRings){
    ctx.save();ctx.globalAlpha=Math.max(0,ring.life/ring.max)*.82;
    ctx.lineWidth=ring.life>9?5:3;ctx.strokeStyle=ring.color;
    ctx.beginPath();ctx.ellipse(Math.round(ring.x),Math.round(ring.y),Math.round(ring.r*1.3),Math.round(ring.r*.66),0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  if(impactFlashFrames>0){ctx.save();ctx.globalAlpha=impactFlashFrames*.024;ctx.fillStyle='#fff1c8';ctx.fillRect(0,0,960,540);ctx.restore();}
  if (hitboxesVisible) {
    for (const f of [match.p1, match.p2]) {
      drawCollisionBox(Engine.getHurtBox(f), '#54d7ff', '#54d7ff25');
      drawCollisionBox(Engine.getAttackBox(f), '#ff5a75', '#ff5a7533');
    }
  }
  if (comboFrames > 0 && comboText) {
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#35112a';
    ctx.strokeText(comboText, 480, 147);
    ctx.fillStyle = '#ffe45c';
    ctx.fillText(comboText, 480, 147);
  }
  if (messageFrames > 0 && message && !match.betweenRounds) {
    ctx.font = 'bold 27px monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#15162e';
    ctx.strokeText(message, 480, 185);
    ctx.fillStyle = '#fef4bc';
    ctx.fillText(message, 480, 185);
  }
  ctx.restore();
}

// Static arena prerender: the stage, floor, and labels are rebuilt only when
// a stage changes or its image finishes decoding. Saves hundreds of canvas
// paint operations per frame on phones, without affecting collision logic.
const staticStageCanvas=document.createElement('canvas');
staticStageCanvas.width=960; staticStageCanvas.height=540;
const staticStageCtx=staticStageCanvas.getContext('2d',{alpha:false});
staticStageCtx.imageSmoothingEnabled=false;
let staticStageId='',staticStageReady=false;
function paintStaticStage(c,stageId,img){
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,960,540);
 if(img?.complete&&img.naturalWidth)c.drawImage(img,0,0,960,451);
 else{c.fillStyle='#284776';c.fillRect(0,0,960,455)}
 const isPampa=stageId==='pampa',isPlant=stageId==='concentradora';
 const ground=c.createLinearGradient(0,415,0,540);
 const colors=isPampa?['#9c5a35','#68402d','#372937']:isPlant?['#47546a','#272e42','#141d30']:['#414e69','#273552','#141d30'];
 ground.addColorStop(0,colors[0]);ground.addColorStop(.43,colors[1]);ground.addColorStop(1,colors[2]);
 c.fillStyle=ground;c.fillRect(0,420,960,120);
 c.fillStyle=isPampa?'#d48b4e':isPlant?'#e3a736':'#e9b74e';c.fillRect(0,419,960,4);
 c.strokeStyle=isPampa?'#a36746':'#52617a';c.lineWidth=1;
 for(let i=0;i<15;i++){c.beginPath();c.moveTo(i*82-55,445);c.lineTo(480+(i-7)*135,540);c.stroke()}
 for(let i=0;i<16;i++){const x=(i*109+47)%960,y=436+(i*33)%94;rect(c,x,y,isPampa?12:17,2,isPampa?'#c27b4b':'#59677c')}
 c.save();c.fillStyle='#071427aa';c.fillRect(13,12,303,37);c.strokeStyle='#ffce65';c.strokeRect(13,12,303,37);
 c.fillStyle='#f8f6ef';c.font='bold 16px monospace';c.textAlign='left';
 const selected=STAGES.find(st=>st.id===stageId);if(selected)c.fillText(selected.name,24,35);c.restore();
}
function drawStage(){
 const id=match?.stage||STAGES[stagePick].id,img=loadedStages[id];
 const ready=!!(img?.complete&&img.naturalWidth);
 if(id!==staticStageId||(ready&&!staticStageReady)){
   paintStaticStage(staticStageCtx,id,img);staticStageId=id;staticStageReady=ready;
 }
 ctx.drawImage(staticStageCanvas,0,0);
}
// Ambient animation is deterministic and inexpensive: no per-frame DOM work.
function drawAtmosphere(){
 if(!match)return;
 const t=match.tick, stageId=match.stage;
 ctx.save();
 if(stageId==='pampa'){
   ctx.fillStyle='#fbd4a2';
   for(let i=0;i<19;i++){
     const x=Math.round((i*137+t*(.12+i%4*.045))%990)-10;
     const y=205+(i*41)%219;
     ctx.globalAlpha=.09+((i%4)*.037);
     ctx.fillRect(x,y,2+(i%3),2);
   }
 } else if(stageId==='concentradora'){
   for(let i=0;i<6;i++){
     const x=110+i*130,y=118+(i*39)%210;
     ctx.globalAlpha=.14+Math.max(0,Math.sin(t*.041+i*1.4))*.23;
     ctx.fillStyle=i%2?'#74e5b0':'#ffbc55';ctx.fillRect(x,y,4,5);
   }
 } else {
   for(let i=0;i<6;i++){
     ctx.globalAlpha=.1+.16*Math.abs(Math.sin(t*.045+i));ctx.fillStyle='#5af5b9';
     ctx.fillRect(80+i*134,132+(i%2)*91,24,2);
   }
 }
 ctx.restore();
}

function drawSpriteFighter(f) {
 const sprite = loadedSprites[f.def.id];
 if (!sprite?.complete || !sprite.naturalWidth) {
   drawFighter(ctx,f.def,Math.round(f.x),Math.round(f.y),1,f.action,f.face,f.anim,f.move,f.flash);
   return;
 }
 const t=Math.floor(f.anim*6.5);
 let frameIndex=0;
 switch (f.action) {
  case 'walk': case 'dash': frameIndex=1+(t%3); break;
  case 'jump': frameIndex=5; break;
  case 'crouch':case 'getup': frameIndex=6; break;
  case 'block': frameIndex=7; break;
  case 'quick':case 'airQuick': frameIndex=f.move&&f.move.frame<f.move.startup?7:8; break;
  case 'heavy':case 'airHeavy': frameIndex=f.move&&f.move.frame<f.move.startup?7:10; break;
  case 'kick':case 'airKick': frameIndex=f.move&&f.move.frame<f.move.startup?7:9; break;
  case 'special': frameIndex=f.move&&f.move.frame<f.move.startup?7:11; break;
  case 'ko': frameIndex=12; break;
  case 'victory': frameIndex=13; break;
  case 'hurt': frameIndex=7; break;
  default: frameIndex=0;
 }
 const w=202, h=158; // Integer pixel dimensions for stable nearest-neighbor sampling.
 const bob=f.action==='idle'?Math.round(Math.sin(f.anim*4)*2):(f.action==='walk'||f.action==='dash')?Math.round(Math.sin(f.anim*12)*2):0;
 const sx=(frameIndex%4)*168, sy=Math.floor(frameIndex/4)*132;
 ctx.save();
 const px=f.prevX===undefined?f.x:f.prevX+(f.x-f.prevX)*renderAlpha;
 const py=f.prevY===undefined?f.y:f.prevY+(f.y-f.prevY)*renderAlpha;
 ctx.translate(Math.round(px),Math.round(py)+bob);
 ctx.scale(f.face,1);
 // Motion arcs: anticipación, impacto y recuperación entre poses disponibles.
 if(f.move){
   const total=f.move.startup+f.move.active+f.move.recovery;
   const local=f.move.frame/Math.max(1,total);
   const advance=f.move.type==='special'?10:f.move.type==='heavy'?6:f.move.type==='kick'?5:3;
   const lunge=Math.max(0,Math.sin(local*Math.PI))*advance;
   ctx.translate(Math.round(lunge),0);
 }
 // La sombra se dibuja a nivel del piso en draw() y no sigue al luchador durante el salto.
 if(f.action==='down') {ctx.translate(0,-18);ctx.rotate(-Math.PI/2);ctx.translate(25,0);frameIndex=0;}
 const fsx=(frameIndex%4)*168, fsy=Math.floor(frameIndex/4)*132;
 // Trail de carrera mínimo para Yerko; solo usa sus propios píxeles y nunca deja rastros permanentes.
 if ((f.action==='dash'||(f.def.id === 'yerko' && f.action === 'walk')) && f.ground && Math.abs(f.vx)>2.4) {
   ctx.save();
   ctx.globalAlpha = f.action==='dash'?.25:.12;
   ctx.drawImage(sprite,fsx,fsy,168,132,-101-16,-148,w,h);
   ctx.restore();
 }
 // Draw the selected frame only; no neighbouring frame may enter the canvas.
 if (f.flash>0) {
   flashCtx.setTransform(1,0,0,1,0,0);
   flashCtx.globalAlpha=1;
   flashCtx.globalCompositeOperation='source-over';
   flashCtx.clearRect(0,0,168,132);
   flashCtx.drawImage(sprite,fsx,fsy,168,132,0,0,168,132);
   // source-atop is safe only because this offscreen surface contains NO stage pixels.
   flashCtx.globalCompositeOperation='source-atop';
   flashCtx.fillStyle=f.flash>5?'#fff2e477':'#ff393951';
   flashCtx.fillRect(0,0,168,132);
   flashCtx.globalCompositeOperation='source-over';
   ctx.drawImage(flashCanvas,0,0,168,132,-101,-148,w,h);
 } else {
   ctx.drawImage(sprite,fsx,fsy,168,132,-101,-148,w,h);
 }
 if(f.move && f.move.frame>=f.move.startup-2 && f.move.frame<=f.move.startup+f.move.active+2){
   const m=f.move;
   ctx.save();ctx.lineCap='round';
   ctx.globalAlpha=.8;ctx.lineWidth=m.type==='special'?8:4;
   ctx.strokeStyle=m.type==='special'?(f.def.id==='yerko'?'#75e7ff':f.def.id==='mati'?'#ffca65':'#ffe49d'):'#fff1d5';
   ctx.beginPath();
   const arcY=m.type==='kick'?-40:-82;
   ctx.ellipse(m.type==='special'?89:65,arcY,m.type==='special'?48:27,m.type==='kick'?27:17,-.25,-1.15,1.3);
   ctx.stroke();ctx.restore();
 }
 if(f.slowFrames>0){ctx.save();ctx.strokeStyle='#8bc7ff';ctx.lineWidth=2;ctx.globalAlpha=.48;ctx.strokeRect(-35,-140,70,135);ctx.restore();}
 if(f.premiumFrames>0){ctx.save();ctx.globalAlpha=.25;ctx.strokeStyle='#ffe079';ctx.lineWidth=3;ctx.strokeRect(-42,-152,84,147);ctx.restore();}
 ctx.restore();
}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function drawFighter(c,p,x,y,scale,action,face,anim,attack=null,flash=0){c.save();c.translate(x,y);c.scale(face,1);c.scale(scale||1,scale||1);if(action==='down'){c.translate(0,-20);c.rotate(-Math.PI/2);c.translate(0,65)}const bob=action==='idle'?Math.sin(anim*5)*2:action==='walk'?Math.sin(anim*13)*3:0;const crouch=(action==='crouch'||action==='getup')?13:0;const hurt=action==='hurt';const lean=attack?(attack.type==='heavy'?8:attack.type==='kick'?4:2):0;const legSwing=action==='walk'?Math.sin(anim*13)*7:0;
// shadow
c.fillStyle='#090d1b88';c.beginPath();c.ellipse(0,4,34,7,0,0,Math.PI*2);c.fill();
// boots and legs
rect(c,-17+legSwing*.25,-36+crouch,13,35,p.dark);rect(c,5-legSwing*.25,-36+crouch,13,35,p.dark);rect(c,-20+legSwing*.25,-5+crouch,19,7,'#49352d');rect(c,3-legSwing*.25,-5+crouch,20,7,'#49352d');rect(c,-16,-31+crouch,10,4,p.accent);rect(c,6,-31+crouch,10,4,p.accent);
// body and vest
const bulk=p.bulk||1;rect(c,-22*bulk,-83+crouch+ bob,44*bulk,48,p.dark);rect(c,-20*bulk,-82+crouch+bob,40*bulk,42,p.color);rect(c,-4,-80+crouch+bob,8,38,p.dark);rect(c,-17,-75+crouch+bob,8,5,'#f4d86a');rect(c,9,-75+crouch+bob,8,5,'#f4d86a');rect(c,-19,-44+crouch+bob,38,6,p.dark);
// arms with attack pose
let armX=attack? (attack.type==='kick'?16:28+lean): action==='block'?15:action==='hurt'?-21:20;let armY=attack?-73:action==='block'?-91:action==='hurt'?-68:-70;rect(c,armX-4,armY+crouch+bob,13,25,p.color);rect(c,armX+1,armY+17+crouch+bob,14,12,p.skin);rect(c,-27,action==='block'?-90+crouch+bob:-70+crouch+bob,12,24,p.color);rect(c,-29,action==='block'?-96+crouch+bob:-51+crouch+bob,14,12,p.skin);
// neck/head
rect(c,-8,-94+crouch+bob,16,13,p.skin);rect(c,-17,-121+crouch+bob,34,30,p.skin);rect(c,-18,-125+crouch+bob,36,12,p.hair);rect(c,-21,-119+crouch+bob,7,19,p.hair);rect(c,13,-118+crouch+bob,7,13,p.hair);if(p.whiteHair){rect(c,-23,-132+crouch+bob,12,12,p.hair);rect(c,-9,-137+crouch+bob,11,13,p.hair);rect(c,5,-133+crouch+bob,14,10,p.hair);rect(c,16,-126+crouch+bob,9,8,p.hair)}if(p.hairLong){rect(c,15,-116+crouch+bob,9,32,p.hair);rect(c,17,-91+crouch+bob,7,10,p.hair)}
// eyes, expression, facial hair and glasses
rect(c,-9,-111+crouch+bob,5,4,'#171827');rect(c,6,-111+crouch+bob,5,4,'#171827');rect(c,1,-105+crouch+bob,4,8,'#a96951');rect(c,-4,-99+crouch+bob,11,3,'#713e36');if(p.beard){rect(c,-11,-101+crouch+bob,23,8,p.hair);rect(c,-6,-96+crouch+bob,13,4,p.hair)}if(p.glasses){rect(c,-13,-115+crouch+bob,12,10,'#171827');rect(c,2,-115+crouch+bob,12,10,'#171827');rect(c,-1,-112+crouch+bob,4,2,'#171827');rect(c,-11,-113+crouch+bob,7,5,'#9fdcff');rect(c,4,-113+crouch+bob,7,5,'#9fdcff')}
// pixel highlights
rect(c,-17,-121+crouch+bob,8,3,p.accent);rect(c,-20,-80+crouch+bob,5,20,'#ffffff22');if(flash>0){rect(c,-23,-126,47,124,'#ffffff55')}
// attack effect
if(attack&&attack.frame>=attack.startup-2&&attack.frame<=attack.startup+attack.active){c.fillStyle=attack.type==='special'?'#ffe45c':'#f9f3d0';c.beginPath();c.ellipse(attack.type==='special'?95:55,attack.type==='kick'?-42:-78,attack.type==='special'?34:20,attack.type==='special'?22:12,-.3,0,Math.PI*2);c.fill();c.fillStyle=attack.type==='special'?'#ff743f':'#ffffff';c.fillRect(attack.type==='special'?68:40,attack.type==='kick'?-48:-82,attack.type==='special'?48:24,5)}
// special flare
if(attack&&attack.type==='special'){c.fillStyle='#ffd34d';for(let i=0;i<6;i++)c.fillRect(48+i*9,-100-(i%2)*12,5,5)}c.restore()}

function beep(freq,duration,wave){ audio?.play('select'); }


// ========== ONLINE V9 BETA: navegador = cliente; Node = motor autoritativo ==========
const onlineStatus=$('online-status');
let savedOnlineUrl='';try{savedOnlineUrl=localStorage.getItem('cio-online-server-url')||''}catch(_){}
$('online-server').value=new URLSearchParams(location.search).get('server')||window.BATALLA_NET_URL||savedOnlineUrl||'';
function showOnlineStatus(text){onlineStatus.textContent=text}
function renderOnlineRoster(){
  const holder=$('online-roster');holder.replaceChildren(...roster.map(p=>{
    const btn=document.createElement('button');btn.type='button';btn.className=p.id===onlineChoice?'selected':'';
    const img=document.createElement('img');img.src=PORTRAIT_DATA[p.id];img.alt='';
    const name=document.createElement('span');name.textContent=p.name;btn.append(img,name);
    btn.addEventListener('click',()=>{onlineChoice=p.id;renderOnlineRoster();onlineNet.send({t:'choose',fighter:p.id});
      $('online-ready').disabled=!onlineNet.connected;});
    return btn;
  }));
}
function showOnlineLobby(){
  $('menu').classList.add('hidden');$('online-screen').classList.remove('hidden');
  $('fighter-screen').classList.add('hidden');$('stage-screen').classList.add('hidden');$('arena').classList.add('hidden');
  audio?.setScene('select');renderOnlineRoster();
}
function validatedUrl(){
  const input=$('online-server').value.trim();
  if(!/^wss?:\/\//i.test(input))throw new Error('Escribe una dirección que empiece por wss://');
  const parsed=new URL(input);
  if(location.protocol==='https:' && parsed.protocol!=='wss:')throw new Error('En GitHub Pages debes usar wss://');
  if(parsed.protocol==='ws:' && !['localhost','127.0.0.1'].includes(parsed.hostname))throw new Error('Usa wss:// fuera de localhost.');
  return input;
}
async function onlineConnect(action){
  try{
    onlineSlot=action==='create'?1:2;
    const url=validatedUrl();
    let msg={t:'create'};
    if(action==='join'){
      const code=$('online-code').value.trim().toUpperCase();
      if(!/^[A-Z2-9]{4,8}$/.test(code))throw new Error('Introduce un código de sala válido.');
      msg={t:'join',code};
    }
    showOnlineStatus('CONECTANDO AL SERVIDOR…');
    $('online-ready').disabled=true;
    await onlineNet.connect(url,msg);
    try{localStorage.setItem('cio-online-server-url',url)}catch(_){}
  }catch(e){showOnlineStatus(e.message||'Error de conexión.');}
}
$('online-create').addEventListener('click',()=>onlineConnect('create'));
$('online-join').addEventListener('click',()=>onlineConnect('join'));
$('online-back').addEventListener('click',backMenu);
$('online-stage').addEventListener('change',()=>onlineNet.send({t:'stage',stage:$('online-stage').value}));
$('online-ready').addEventListener('click',()=>{onlineNet.send({t:'ready'});$('online-ready').disabled=true;showOnlineStatus('LISTO · ESPERANDO AL OTRO JUGADOR…')});
function applyOnlineSnapshot(s){if(!match||!s)return;
  for(const n of [1,2]){
    const f=match['p'+n],b=s['p'+n];if(!f||!b)continue;
    const x=f.x,y=f.y;
    Object.assign(f,b);
    f.prevX=x;f.prevY=y;
  }
  for(const key of ['round','tick','roundFrames','countdown','wins','betweenRounds','matchOver','hitStop','shake']){
    if(Object.prototype.hasOwnProperty.call(s,key))match[key]=s[key];
  }
  onlineLastSnapshot=performance.now();
}
function onOnlinePacket(msg){
  if(!msg||typeof msg.t!=='string')return;
  if(msg.t==='error'){showOnlineStatus(msg.message||'Error del servidor');return}
  if(msg.t==='lobby'){
    onlineCode=msg.code;
    // La primera conexión que crea sala ocupa el jugador 1; el invitado, el jugador 2.
    $('online-room-label').textContent='SALA '+msg.code;
    $('online-player1').textContent='J1: '+(msg.players[0]?.choice?.toUpperCase()||'ESPERANDO')+(msg.players[0]?.ready?' ✓':'');
    $('online-player2').textContent='J2: '+(msg.players[1]?.choice?.toUpperCase()||'ESPERANDO')+(msg.players[1]?.ready?' ✓':'');
    $('online-stage').value=msg.stage;
    $('online-stage').disabled=onlineSlot!==1;
    $('online-ready').disabled=!(msg.players[0]&&msg.players[1]) || !!msg.players[onlineSlot-1]?.ready;
    showOnlineStatus('CÓDIGO '+msg.code+' · '+(msg.players[1]?'DOS JUGADORES CONECTADOS':'COMPÁRTELO CON TU AMIGO'));
    // Sincroniza la selección local por si el rival entra con otro personaje inicial.
    if(msg.status==='lobby' && msg.players[onlineSlot-1]?.choice!==onlineChoice) onlineNet.send({t:'choose',fighter:onlineChoice});
    return;
  }
  if(msg.t==='prepare'){
    const [a,b]=msg.fighters;
    pick1=roster.findIndex(f=>f.id===a);pick2=roster.findIndex(f=>f.id===b);
    stagePick=Math.max(0,STAGES.findIndex(s=>s.id===msg.stage));
    onlinePreparing=true;showVersus();return;
  }
  if(msg.t==='start'){
    onlinePreparing=false;beginMatch();return;
  }
  if(msg.t==='snapshot'){applyOnlineSnapshot(msg.s);return;}
  if(msg.t==='events'){
    if(match){match.events=msg.events||[];playEvents();}
    return;
  }
  if(msg.t==='round_complete'){applyOnlineSnapshot(msg.snapshot);return;}
  if(msg.t==='next_wait'){
    if(onlineWaitingNext)showOnlineStatus('Esperando que el rival confirme la próxima ronda…');
    return;
  }
  if(msg.t==='next_round'){
    onlineWaitingNext=false;applyOnlineSnapshot(msg.snapshot);
    $('overlay').classList.add('hidden');$('ko-burst').classList.add('hidden');
    $('rematch').disabled=false;pendingResult=null;koShown=false;particles=[];impactRings=[];
    comboFrames=0;clearInputs();audio?.setScene('fight');updateHud();return;
  }
  if(msg.t==='peer_left'){
    showOnlineStatus('EL RIVAL SE DESCONECTÓ. REGRESANDO AL MENÚ ONLINE.');
    match=null;cancelAnimationFrame(raf);raf=0;
    $('arena').classList.add('hidden');$('vs-screen').classList.add('hidden');
    $('touch-controls').classList.add('hidden');showOnlineLobby();
    onlineCode='';onlineSlot=0;$('online-ready').disabled=true;
    return;
  }
}
function onOnlineDisconnect(wasConnected){
  if(!wasConnected)return;
  onlineCode='';onlineSlot=0;
  if(mode==='online'){
    match=null;cancelAnimationFrame(raf);raf=0;
    $('arena').classList.add('hidden');$('vs-screen').classList.add('hidden');
    $('touch-controls').classList.add('hidden');showOnlineLobby();
    $('online-ready').disabled=true;showOnlineStatus('CONEXIÓN FINALIZADA · VUELVE A CREAR O UNIRTE A UNA SALA');
  }
}

renderRosters();
renderStages();
setDifficulty('normal');
showMenuStep(0);
})();

// Instalación opcional tipo app (solo HTTPS/localhost, no content://).
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}),{once:true});
}
