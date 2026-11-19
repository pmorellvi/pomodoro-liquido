# Pomodoro líquido — PEC3

Extensión de Firefox con dos pestañas: **Temporizador** y **Sesiones**.

El código se divide en tres archivos:

- `popup.html`: estructura de la interfaz y plantilla de las sesiones.
- `style.css`: aspecto visual.
- `js/popup.js`: sesiones, temporizador, guardado y dibujo con p5.js.

`manifest.json` es la configuración de la extensión, `vendor/` contiene p5.js y su licencia. `icons/` contiene los iconos PNG.

## Requisitos de la práctica

Se utilizo Manifest V3, un popup, controles del DOM, CSS externo y p5.js. `storeItem()` y `getItem()` usan localStorage y se declara en el manifest el  permiso `storage` para poder hacer uso de `browser.storage`

Los datos son locales y se almacenan en el navegador, por lo que si se borra el navegador se perderan los datos.

## Fuentes y proceso

- [storeItem()](https://p5js.org/reference/p5/storeItem/) y [getItem()](https://p5js.org/reference/p5/getItem/).
- [noLoop()](https://p5js.org/reference/p5/noLoop/) y [redraw()](https://p5js.org/reference/p5/redraw/).
- [Popup y acción de Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/action).
- [Almacenamiento de extensiones](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage).

