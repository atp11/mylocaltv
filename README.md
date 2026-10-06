# My Local TV

Televisor web local para ver canales en abierto desde el navegador, sin instalar nada y sin levantar un servidor. Se abre el archivo `index.html` directamente (`file://`).

## Qué hace

- Zapping y lista de canales con logos, búsqueda y filtros por grupo.
- Reproducción HLS en el propio televisor (con [hls.js](https://github.com/video-dev/hls.js)).
- Guía de programación (EPG) cuando el canal tiene identificador en TDTChannels.
- Canales con varias señales: si una falla, prueba la siguiente o consulta la lista oficial de TDTChannels.
- Canales sin HLS abierto (Atresmedia, Mediaset y algunos autonómicos): se abren en su web oficial.
- Algunos directos solo por YouTube: desde `file://` YouTube bloquea el embed (error 153); la app ofrece abrir el directo en YouTube.
- Canales FAST de Rakuten / Samsung / Vevo añadidos como HLS embebido (grupo Rakuten y afines).

## Cómo usarla

1. Descarga o clona este repositorio.
2. Abre `index.html` con el navegador (doble clic o «Abrir con…»).

No hace falta `npm`, Python ni ningún servidor HTTP local.
Hace falta conexión a internet: los streams, logos, la EPG en vivo y hls.js se cargan desde la red.

## Controles


| Acción                                      | Teclado / UI                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Canal anterior / siguiente                  | Flechas arriba / abajo, rueda del ratón sobre el vídeo, botones de zapping |
| Número de canal                             | Teclas `0`–`9`                                                             |
| Pausa / reanudar                            | Espacio o botón de reproducción                                            |
| Silencio                                    | `M`                                                                        |
| Pantalla completa                           | `F`                                                                        |
| Guía                                        | `G` o pestaña Guía                                                         |
| Salir de guía / detalle / pantalla completa | `Esc`                                                                      |


## Origen de los canales


| Fuente                                                           | Uso                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `tdt.m3u8` + `js/channels.js`                                    | Lista base (proyecto [TDTChannels](https://github.com/LaQuay/TDTChannels) / mylocaltv) |
| `TELEVISION.md` (TDTChannels)                                    | Contraste y sustitutos de URL cuando una señal no responde                             |
| Canales externos en `js/app.js`                                  | Atresmedia, Mediaset y autonómicos sin HLS usable                                      |
| Canales extra en `js/app.js`                                     | Completar huecos (À Punt, internacionales, Rakuten, etc.)                              |
| Listas `es*.m3u` de [iptv-org](https://github.com/iptv-org/iptv) | Referencia para FAST abiertos (Rakuten/Samsung), no se importan enteras                |


Solo se incluyen emisiones en abierto o con HLS público. No se añaden feeds de pago ni streams dudosos.

## Guía de programación

- Fuente principal: `https://www.tdtchannels.com/epg/TV.json`.
- Hay una copia embebida en `js/epg.js` para el primer arranque; luego se intenta actualizar en vivo (y se guarda en IndexedDB).
- La guía se enlaza por el `id` del canal (p. ej. `La1.TV`). Si un canal no tiene `id` o no está en esa EPG, no tendrá parrilla.
- Los canales Rakuten / Samsung / Vevo suelen quedar sin guía: TDTChannels no los cubre y las APIs de esos servicios no son usables desde `file://` por CORS.

## Limitaciones conocidas

- **Sin servidor a propósito.** La app está pensada solo como archivo local.
- **YouTube embebido desde** `file://`**:** imposible (Referer); se abre en el navegador.
- **Pluto TV / Tivify embebidos:** no; CORS o plataforma cerrada. No se añaden como HLS interno.
- **Atresmedia / Mediaset:** sin HLS estable en abierto; van como externos a Atresplayer / Mitele / Infinity.
- Algunas señales regionales o internacionales pueden caer, geo-bloquearse o exigir un clic de reproducción del navegador.
- La EPG en vivo depende de que TDTChannels responda; si falla, se usa la guía guardada.

## Estructura

```
mylocaltv/
  index.html      Interfaz y estilos
  tdt.m3u8        Lista M3U de referencia
  js/
    channels.js   Canales base (generado / embebido)
    epg.js        EPG embebida de respaldo
    app.js        Lógica: sintonía, EPG, externos, extras, UI
```

## Requisitos

- Navegador reciente con soporte de ES modules no estricto (scripts clásicos), HLS vía hls.js y, idealmente, IndexedDB y `localStorage`.
- Red con acceso a los CDN de los broadcasters y a jsDelivr (hls.js).

## Aviso

Mi Tele es un frontal local para streams públicos. Respeta las condiciones de cada emisor y la legislación aplicable. Si un canal deja de ofrecer HLS abierto, la app no puede "arreglar" ese cierre: o prueba un sustituto, o lo trata como externo, o deja de estar disponible.