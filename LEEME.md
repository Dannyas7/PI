# BATALLA CIO · Ultimate Arcade V6

**Edición independiente: incluye todos los archivos del juego.** No es un parche y no necesita versiones anteriores.

## Cómo jugar

- **Más fácil (PC y Android):** abre `Batalla_CIO_Arcade_V6_Jugar.html`. Incluye los recursos internamente y no requiere internet después de descargarlo.
- **Proyecto editable:** abre `index.html` con Chrome, Edge u otro navegador moderno. Mantén las carpetas `assets`, `game.js`, `style.css` y `combat-core.js` juntas.
- **Móvil:** juega preferentemente con el teléfono **en horizontal**. Los controles táctiles aparecen automáticamente en el modo de un jugador. También es posible jugar en vertical, pero el área de combate es más pequeña. Usa el botón ⛶ para intentar pantalla completa (según compatibilidad del navegador).
- **Dos jugadores:** requiere teclado o dos mandos. El control táctil está optimizado para un jugador.

## Pantallas renovadas

1. Menú principal independiente: arcade o versus local y dificultad.
2. Selección de personaje 1: retratos y habilidades.
3. Selección del rival: segunda vista de selección.
4. Selección de escenario: vista previa grande de Pampa, Planta Concentradora o Sala CIO.
5. Pantalla de enfrentamiento VS: verifica/prepara los recursos visuales antes del combate.
6. Arena de combate: HUD, rondas, impactos, especiales y controles táctiles.

## Controles

| Acción | Jugador 1 | Jugador 2 |
| --- | --- | --- |
| Movimiento | A / D | ← / → |
| Salto | W | ↑ |
| Agacharse | S | ↓ |
| Golpe rápido | J | 1 |
| Fuerte | K | 2 |
| Patada baja | L | 3 |
| Bloqueo | I | 0 |
| Especial (50 energía) | U | 4 |
| Dash | Shift + dirección | 5 + dirección |
| Pausa | Esc | Esc |
| Hitboxes de depuración | H | H |
| Sonido | M | M |

**Móvil:** los botones digitales se pueden pulsar con varios dedos a la vez. DASH es un impulso rápido, con enfriamiento para que no se pueda usar continuamente.

## Habilidades especiales

- **Yerko (jefe de sala CIO):** los especiales conectados alternan entre *Vacaciones denegadas* (quita energía), *Permiso rechazado* (ralentiza temporalmente) y *¡Callampa!* (derribo reforzado).
- **Mati:** *Modo cuico*, que otorga un aumento temporal de velocidad al conectar.
- **Daniel, Pancho, Alexis/Miyagi y Lucho:** conservan sus características y ataques del motor previo.

## Motor gráfico y técnico

- Simulación del combate fija a 60 Hz, separada del dibujado.
- Recorte de sprites por celda, renderizado sin suavizado, coordenadas enteras y sombras ancladas al piso.
- Fotogramas de acción con desplazamiento de anticipación e impacto, efectos especiales, partículas y pequeñas animaciones ambientales de escenario.
- Límites en partículas y actualización del HUD de menor frecuencia para dispositivos móviles.
- Pausa automática al salir de la aplicación y soporte para teclado, mando y controles táctiles.
- Respecto a los retratos: se conservaron los rostros originales de Mati y Yerko, como solicitaste.

## Archivos

- `index.html`: juego modular.
- `game.js`: interfaz, renderizado, controles, audiovisual y flujo de pantallas.
- `combat-core.js`: simulación, física y reglas del combate.
- `style.css`: presentación y diseño responsive.
- `assets/sprites/`: hojas de sprites de seis personajes.
- `assets/portraits/`: retratos originales de los seis personajes.
- `assets/stages/`: fondos Pampa y Planta Concentradora (Sala CIO en la raíz).
- `test_engine.js` y `test_v6_features.js`: pruebas en Node.js.
- `build_standalone.py`: regenera la versión de un único HTML (requiere Python 3).

## Validación

- 14 pruebas del motor original y 3 pruebas adicionales de dash y poderes.
- Recorrido de navegador en escritorio, móvil horizontal y móvil vertical, incluyendo selección, VS, pelea, pausa y reanudación.

**Nota de producción:** esta V6 es jugable y tiene una presentación muy superior, pero los seis personajes conservan un sistema de sprites de 12 poses base. Una animación profesional con decenas de fotogramas exclusivos por técnica requerirá otra fase de producción de arte.
