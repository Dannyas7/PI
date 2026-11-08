// Mismos parámetros del roster V8; el servidor es autoridad para daño y estadísticas.
export const FIGHTERS = Object.freeze([
 {id:'daniel',name:'Daniel',tag:'CONTROL DE PROCESOS',color:'#20436c',dark:'#111b33',skin:'#e8aa85',hair:'#d5dce3',accent:'#54caff',special:'EMBESTIDA CIO',power:1.02,speed:3.65,reach:57,beard:false},
 {id:'pancho',name:'Pancho',tag:'MAESTRO DEL CONTRAATAQUE',color:'#272c3d',dark:'#192137',skin:'#d99b75',hair:'#251d1e',accent:'#ff9c42',special:'GANCHO VELOZ',power:1.06,speed:3.8,reach:59,glasses:true,beard:true},
 {id:'alexis',name:'Alexis',tag:'MIYAGI · COMBATE TÉCNICO',color:'#66533a',dark:'#283d45',skin:'#c78a66',hair:'#aab6ba',accent:'#53d9ef',special:'FURIA MIYAGI',power:1.12,speed:3.25,reach:67,beard:true},
 {id:'lucho',name:'Lucho',tag:'PODER INDUSTRIAL',color:'#a7cceb',dark:'#283b56',skin:'#c58662',hair:'#292326',accent:'#ffbe4a',special:'GOLPE INDUSTRIAL',power:1.15,speed:3.05,reach:65,beard:true,stamina:1.05},
 {id:'mati',name:'Mati',tag:'NUEVO · ESTILO Y PRECISIÓN · LENTES REDONDOS',color:'#355da8',dark:'#18233c',skin:'#dfa07a',hair:'#211a1c',accent:'#ff6f63',special:'MODO CUICO',power:1.09,speed:3.82,reach:62,beard:false,isNew:true,specialMessages:['¡MODO CUICO!','¡PRESENCIA EJECUTIVA!','¡GOLPE DE ÉLITE!']},
 {id:'yerko',name:'Yerko',tag:'NUEVO · JEFE SALA CIO · RUNNER',color:'#21375f',dark:'#101a33',skin:'#d99b75',hair:'#241d1c',accent:'#5bc0ff',special:'PERMISO DENEGADO',power:1.18,speed:3.66,reach:64,beard:true,isNew:true,specialMessages:['¡VACACIONES DENEGADAS!','¡PERMISO RECHAZADO!','¡CALLAMPA!']}
]);
export const BY_ID = new Map(FIGHTERS.map(f=>[f.id,f]));
export const STAGES = Object.freeze(['pampa','concentradora','cio']);
