# Batalla CIO Arcade V9 — beta multijugador online

**Estado:** prototipo funcional en código con servidor autoritativo y salas privadas. No está desplegado aún. Conserva todos los modos y archivos visuales de la V8. Esta versión no sustituye automáticamente lo que tienes en GitHub; el repositorio `Dannyas7/PI` sigue en V4.1 hasta que se actualice.

## Arquitectura

- **Sitio estático / GitHub Pages:** `index.html`, `game.js`, `online-client.js`, `net-config.js`, `style.css`, `assets/`, etc.
- **Servidor Node.js WebSocket:** `server/index.mjs`, `server/rooms.mjs`, `server/roster.mjs`. Usa `ws`.
- **Motor autoritativo:** el servidor importa `combat-core.js`, calcula ataques y daños a 60 Hz y envía estados 20 Hz, además de eventos de combate.
- **Salas:** código privado de seis caracteres, máximo dos jugadores; anfitrión elige arena, ambos eligen luchadores y pulsan LISTO; pantalla VS sincronizada antes del combate.
- **Controles:** el jugador local utiliza los mismos controles P1 (teclado, joystick y botones táctiles) en ambos teléfonos.

## Cómo probar en una red local (se necesita Node.js 20+)

Desde la carpeta del proyecto:

```sh
cd server
npm install
npm start
```

En otra terminal, desde la carpeta raíz del proyecto:

```sh
python3 -m http.server 8000
```

Abre `http://localhost:8000/` en dos pestañas o dispositivos con acceso al servidor. Para una prueba desde el mismo computador, en la pantalla ONLINE introduce `ws://localhost:8787/ws`. Desde otro teléfono en la LAN, usa la IP privada del computador (por ejemplo, `ws://192.168.1.10:8787/ws`), pero algunos navegadores pueden bloquear WebSockets sin TLS desde páginas HTTPS. Para pruebas reales remotas, despliega el servidor con **WSS**.

## Publicar la web en GitHub Pages

1. Crea una rama o respaldo de la V4.1 de `Dannyas7/PI`.
2. Sube el **contenido de la raíz del ZIP V9** (no una carpeta contenedora) al repositorio. Para probar sin riesgo, usa una rama de trabajo y un pull request antes de actualizar `main`.
3. Activa GitHub Pages desde la rama de publicación, ruta `/` (si no está activo).
4. Publica el servidor Node.js por separado en un proveedor que soporte WebSockets persistentes (Render, Railway, Fly.io, VPS u otro compatible). Su dirección WebSocket debe estar disponible mediante **WSS**.
5. En `net-config.js` escribe la URL pública, por ejemplo `window.BATALLA_NET_URL = 'wss://mi-servidor.example/ws';` y publícalo. No se necesita una API key en el navegador.
6. Si configuras `ALLOWED_ORIGINS` para mayor seguridad, añade el origen de GitHub Pages: `https://dannyas7.github.io`. Si pruebas desde otra web, añade también ese origen a la lista, separado por comas.
7. Abre el mismo juego desde dos teléfonos, selecciona ONLINE, crea sala, comparte el código y pulsa LISTO en ambos.

### Variables del servidor

- `PORT`: puerto HTTP/WS. Predeterminado: `8787`.
- `ALLOWED_ORIGINS`: lista opcional separada por comas con orígenes permitidos; recomendable en producción (ej. `https://dannyas7.github.io`).

Punto de salud: `GET /health`. WebSocket: `GET /ws` con actualización de protocolo.

## Pruebas

```sh
node test_engine.js
node test_v6_features.js
node test_v8_features.js
node --test server/test-rooms.mjs
node --check game.js
```

## Limitaciones actuales de esta beta

- **No se incluye servidor alojado** ni servicio WSS activo: publicar en GitHub Pages no basta por sí solo para habilitar batallas online.
- El cliente dibuja snapshots con interpolación, **todavía sin rollback ni predicción local de alta calidad**: notarás latencia si hay conexión lenta.
- No incluye emparejamiento público, cuentas, rankings, chat ni persistencia de resultados.
- Sólo salas privadas de dos jugadores, con un único proceso servidor en memoria. Si el proveedor reinicia o escala a múltiples instancias, las salas activas se pierden. Para escalar habrá que usar una arquitectura de salas persistentes, como Cloudflare Durable Objects.
- La interfaz está preparada pero la integración completa entre dos teléfonos no ha podido probarse contra un servidor WSS desplegado desde este entorno.
