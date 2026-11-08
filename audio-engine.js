/* BATALLA CIO — Música y FX originales de síntesis WebAudio. Sin archivos ni librerías. */
(function(root){
'use strict';
class CIOAudio {
 constructor(){this.ctx=null;this.master=null;this.musicBus=null;this.fxBus=null;this.active=false;this.muted=false;this.scene='menu';this.volume=.55;this.timer=null;this.tick=0;this.nextTime=0;this.noise=null;this.bank={
   menu:{bpm:104,root:43,bass:[0,0,7,0,3,3,10,3,5,5,12,5,3,3,10,3],lead:[12,null,15,17,null,12,10,null,15,null,17,19,null,17,15,null]},
   select:{bpm:112,root:45,bass:[0,0,7,0,5,5,12,5,3,3,10,3,7,7,14,7],lead:[12,null,17,null,19,null,17,null,15,null,19,null,22,null,19,null]},
   stage:{bpm:98,root:38,bass:[0,0,7,0,3,3,10,3,8,8,15,8,5,5,12,5],lead:[12,null,null,19,17,null,15,null,12,null,14,null,17,null,19,null]},
   versus:{bpm:126,root:40,bass:[0,0,0,7,3,3,10,3,0,0,12,7,5,5,10,5],lead:[12,null,19,null,24,null,19,null,22,null,17,null,19,null,15,null]},
   fight:{bpm:136,root:40,bass:[0,0,7,0,3,3,10,3,5,5,12,5,7,7,14,7],lead:[12,null,15,19,null,12,17,null,15,null,19,22,17,null,15,null]},
   victory:{bpm:116,root:48,bass:[0,0,7,0,4,4,11,4,7,7,14,7,12,12,19,12],lead:[12,16,19,24,19,24,28,31,24,19,16,19,24,null,31,null]}
 } }
 unlock(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;this.ctx=new AC();this.master=this.ctx.createGain();this.musicBus=this.ctx.createGain();this.fxBus=this.ctx.createGain();this.master.gain.value=.65*this.volume;this.musicBus.gain.value=.23;this.fxBus.gain.value=.48;this.musicBus.connect(this.master);this.fxBus.connect(this.master);this.master.connect(this.ctx.destination);const count=this.ctx.sampleRate*1;const buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<count;i++)data[i]=Math.random()*2-1;this.noise=buffer;}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});if(!this.active){this.active=true;this.tick=0;this.nextTime=this.ctx.currentTime+.08;this.timer=setInterval(()=>this.schedule(),85);}this.applyVolume();return true}catch(_){return false}}
 applyVolume(){if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.65*this.volume,this.ctx.currentTime,.018)}
 setMuted(m){this.muted=!!m;this.applyVolume()}
 setScene(name){if(!this.bank[name])return; if(name!==this.scene){this.scene=name;this.tick=0;this.nextTime=this.ctx?this.ctx.currentTime+.08:0}}
 tone(freq,at,duration,volume=.15,kind='triangle',dest=this.musicBus){if(!this.ctx||!Number.isFinite(freq))return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=kind;osc.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+.009);g.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(g);g.connect(dest);osc.start(at);osc.stop(at+duration+.025)}
 noiseHit(at,duration,volume=.12,highpass=500){if(!this.ctx||!this.noise)return;const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=this.noise;filter.type='highpass';filter.frequency.value=highpass;g.gain.setValueAtTime(Math.max(.001,volume),at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);src.connect(filter);filter.connect(g);g.connect(this.fxBus);src.start(at);src.stop(at+duration+.02)}
 note(n){return 440*Math.pow(2,(n-69)/12)}
 schedule(){if(!this.ctx||this.muted||this.ctx.state!=='running')return;const cfg=this.bank[this.scene]||this.bank.menu;const step=.25*60/cfg.bpm; if(this.nextTime<this.ctx.currentTime-.20)this.nextTime=this.ctx.currentTime+.05;let count=0;while(this.nextTime<this.ctx.currentTime+.18 && count++<5){const i=this.tick%16, t=this.nextTime; if(i%4===0){this.tone(72,t,.19,.22,'sine');this.tone(53,t+.015,.13,.07,'triangle')}if(i%4===2){this.noiseHit(t,.115,.09,560)}if(i%2===1)this.noiseHit(t,.045,.026,3900);
 const root=cfg.root;const bass=cfg.bass[i];if(bass!==null)this.tone(this.note(root+bass),t,step*.90,.095,'sawtooth');const lead=cfg.lead[i];if(lead!==null&&lead!==undefined)this.tone(this.note(root+lead),t,step*.78,.04,'triangle');this.nextTime+=step;this.tick++;}}
 play(kind){if(!this.ctx||this.muted)return;const at=this.ctx.currentTime+.002;switch(kind){
 case 'quick':this.noiseHit(at,.050,.16,900);this.tone(190,at,.06,.09,'triangle',this.fxBus);break;
 case 'heavy':this.noiseHit(at,.16,.28,310);this.tone(100,at,.15,.21,'sawtooth',this.fxBus);this.tone(66,at+.02,.11,.10,'triangle',this.fxBus);break;
 case 'kick':this.noiseHit(at,.13,.18,450);this.tone(125,at,.12,.17,'triangle',this.fxBus);break;
 case 'blocked':this.noiseHit(at,.045,.10,2200);this.tone(560,at,.09,.08,'square',this.fxBus);break;
 case 'special':this.tone(330,at,.24,.15,'sawtooth',this.fxBus);this.tone(494,at+.06,.25,.12,'triangle',this.fxBus);this.noiseHit(at+.05,.20,.10,780);break;
 case 'dash':this.noiseHit(at,.07,.06,1000);break;
 case 'guardBreak':this.noiseHit(at,.20,.24,450);this.tone(82,at,.22,.16,'sawtooth',this.fxBus);break;
 case 'ko':this.noiseHit(at,.40,.31,250);this.tone(100,at,.4,.20,'sawtooth',this.fxBus);this.tone(64,at+.11,.49,.15,'triangle',this.fxBus);break;
 case 'victory':for(let j=0;j<4;j++)this.tone(this.note(64+[0,4,7,12][j]),at+j*.14,.28,.16,'triangle',this.fxBus);break;
 case 'select':this.tone(660,at,.05,.05,'triangle',this.fxBus);break;
 case 'fight':this.noiseHit(at,.20,.13,700);this.tone(440,at,.22,.11,'square',this.fxBus);break;
 default:this.tone(560,at,.05,.04,'triangle',this.fxBus);
 }}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=null;this.active=false;}
}
root.CIOAudio=new CIOAudio();
})(window);
