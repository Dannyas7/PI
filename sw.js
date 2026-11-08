/* Batalla CIO V8: caché offline para instalación HTTPS. */
const CACHE_NAME='batalla-cio-v10-20261108';
const RESOURCES=["index.html", "style.css", "game.js", "online-client.js", "net-config.js", "combat-core.js", "audio-engine.js", "cio_control_room.png", "manifest.webmanifest", "assets/portraits/daniel.webp", "assets/portraits/pancho.webp", "assets/portraits/yerko_original.webp", "assets/portraits/lucho.webp", "assets/portraits/mati_original.webp", "assets/portraits/yerko_v10.webp", "assets/portraits/alexis.webp", "assets/portraits/mati_v7.webp", "assets/stages/concentradora.png", "assets/stages/pampa.png", "assets/sprites/mati.png", "assets/sprites/pancho.png", "assets/sprites/yerko.png", "assets/sprites/lucho.png", "assets/sprites/daniel.png", "assets/sprites/alexis.png", "assets/icons/cio-512.png", "assets/icons/cio-192.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(RESOURCES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{if(res.ok){const clone=res.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,clone)).catch(()=>{})}return res}).catch(()=>caches.match(e.request)));return;}
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{if(res&&res.ok){const clone=res.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));}return res})));
});
