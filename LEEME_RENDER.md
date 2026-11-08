# Publicar servidor V9 con Render (noviembre de 2026)

## Opción A: el proyecto completo

1. Descomprime el ZIP completo V9 actualizado y copia **su contenido** a la raíz del repositorio `Dannyas7/PI` con GitHub Desktop. Haz Commit y Push.
2. Abre https://dashboard.render.com/ y entra en New > Blueprint.
3. Conecta el repositorio `Dannyas7/PI`, rama `main`. Render lee automáticamente `render.yaml` (plan `free`).
4. Comprueba el log y la URL real asignada por Render. Abre `https://TU-SERVICIO.onrender.com/health`: debe devolver JSON con `ok: true`.
5. En el juego abre ONLINE, escribe `wss://TU-SERVICIO.onrender.com/ws` (sustituye por la URL REAL, nunca una inventada) y pulsa Crear sala. En el otro móvil introduce el mismo servidor y el código de sala.

## Opción B: sólo archivos planos (sin subir carpetas)

Usa el ZIP separado `Batalla_CIO_V9_Render_Subida_Facil.zip`: contiene archivos de raíz que puedes subir juntos desde GitHub > Add file > Upload files. Esto deja la V4.1 intacta como index y agrega `jugar-v9.html` para probar la nueva beta. El render.yaml de ese kit usa comandos diferentes.

## Consideraciones
- GitHub Pages NO ejecuta servidores: Render ejecuta el backend.
- Render gratuito se suspende tras unos 15 minutos sin peticiones entrantes y puede tardar alrededor de un minuto en activarse. El cliente V9 permite 105 segundos para la conexión.
- Las salas están solo en memoria; si Render reinicia el proceso se pierden las salas activas.
- La prueba de la partida real entre dos teléfonos requiere un despliegue real, no se puede garantizar solo con tests unitarios.
- Las URLs `onrender.com` mostradas aquí son ejemplos: usa la dirección real que Render te asigne.
