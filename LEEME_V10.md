# Batalla CIO Arcade V10 — Online Polish

## Cambios
- Servidor online configurado automáticamente (Render): `wss://batalla-cio-online-v9.onrender.com/ws`.
- Pantalla de salas compacta con código copiable y botones siempre accesibles; el botón LISTO queda bajo el roster.
- Altura visible ajustada para Safari en iPhone/iPad, safe areas, pantalla horizontal y vertical, Android y PC.
- Mati: ATAQUE ZORRÓN en el roster, eventos y combate.
- Yerko: nuevo retrato recortado del material original a 768x768, centrado y con suavizado para mejorar su aspecto.
- El combate online continúa usando el mismo servidor, protocolo y códigos de sala.

## Publicar sin carpetas en GitHub
1. Descomprime `Batalla_CIO_V10_Subida_Facil_2_Archivos.zip`.
2. En `https://github.com/Dannyas7/PI` ve a **Add file / Upload files**.
3. Sube `index.html` y `sw.js` desde dentro del ZIP (no subas el archivo ZIP ni INSTRUCCIONES.txt).
4. Commit changes. El `index.html` incluye imágenes, lógica y estilos, sin carpetas adicionales.
5. Recarga la web. Si el navegador sigue mostrando V9, cierra la pestaña y vuelve a cargar una vez para actualizar el service worker.

## Publicar el código modular
Usa GitHub Desktop para copiar los archivos completos de este proyecto en el repositorio `PI`. Si subes además `combat-core.js` y `server/roster.mjs`, Render puede redesplegar automáticamente el servicio, pero el backend anterior ya funciona y los mensajes se adaptan en el cliente.

## Limitaciones
No se puede obligar a Safari de iPhone a entrar a fullscreen real de la misma forma que Android. Se usa el viewport disponible y un diseño adaptable. Se debe comprobar visualmente en iPhone físico; las pruebas automatizadas usan Chromium emulado.
