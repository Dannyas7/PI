/* Cliente de transporte V9: sólo WebSocket, sin lógica de combate ni secretos. */
(function(root){
'use strict';
class CIOOnlineClient {
  constructor(onPacket,onDisconnect){
    this.socket=null;this.onPacket=onPacket;this.onDisconnect=onDisconnect;this.seq=0;this.connected=false;
  }
  connect(url,firstPacket){
    this.disconnect(false);
    return new Promise((resolve,reject)=>{
      let socket;
      try{socket=new WebSocket(url)}catch(e){reject(e);return}
      this.socket=socket;
      const tid=setTimeout(()=>{if(!this.connected){try{socket.close()}catch(_){}reject(new Error('El servidor no respondió. Si es gratuito puede necesitar tiempo para reactivarse. Intenta nuevamente.'))}},105000);
      socket.onopen=()=>{clearTimeout(tid);this.connected=true;resolve();if(firstPacket)this.send(firstPacket)};
      socket.onmessage=e=>{try{const msg=JSON.parse(e.data);this.onPacket(msg)}catch(_){}};
      socket.onerror=()=>{if(!this.connected){clearTimeout(tid);reject(new Error('No se pudo conectar al servidor WebSocket.'))}};
      socket.onclose=()=>{clearTimeout(tid);const wasConnected=this.connected;this.connected=false;if(this.socket===socket){this.socket=null;this.onDisconnect(wasConnected)}};
    });
  }
  send(packet){if(!this.socket||this.socket.readyState!==WebSocket.OPEN)return false;
    if(this.socket.bufferedAmount>32_000 && packet.t==='input')return false;
    this.socket.send(JSON.stringify(packet));return true}
  sendInput(controls){return this.send({t:'input',seq:++this.seq,c:controls})}
  disconnect(notify=false){const s=this.socket;this.socket=null;this.connected=false;if(s){
    if(notify && s.readyState===WebSocket.OPEN)try{s.send(JSON.stringify({t:'leave'}))}catch(_){}
    try{s.close()}catch(_){}
  }}
}
root.CIOOnlineClient=CIOOnlineClient;
})(window);
