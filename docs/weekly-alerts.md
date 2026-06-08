# Weekly Alerts

El radar semanal usa `src/tools/watchlist/watchlist.js` como universo inicial y `src/tools/watchlist/screen.js` como motor de clasificacion.

## Ejecutar

```bash
npm run weekly:screen
npm run weekly:screen -- --ticker KBH --format csv --no-telegram
npm run weekly:screen -- --ticker KBH --format html --no-telegram
```

El script intenta actualizar precios desde Yahoo Chart y Stooq fallback sin API key. Si la fuente falla, usa el precio snapshot guardado en la watchlist y lo indica en el reporte.

## Salida

Genera un archivo:

```text
reports/weekly/YYYY-MM-DD.md
data/export/weekly-YYYY-MM-DD-TICKER.csv
data/export/weekly-YYYY-MM-DD-TICKER.html
```

El reporte separa:

- Aprobadas Graham
- Cerca de aprobar
- En observacion
- Pendientes de primer analisis

Los lunes y viernes agrega una seccion `Resumen Semanal`:

- Lunes: foco en arranque de semana y captura manual prioritaria.
- Viernes: foco en cierre semanal, aprobadas vigentes y preparacion del siguiente lote.

De martes a jueves el reporte queda como `Revision ligera` para no inflar ruido operativo.

## Telegram y multiordenador

Telegram solo se envia si:

- El reporte cae en lunes o viernes.
- `.env.local` tiene `ENABLE_TELEGRAM_ALERTS=true`, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
- `.local_runtime/device.json` indica `device_role` como `principal` o `primary`.

Usar `--no-telegram` para pruebas manuales de export sin mandar alertas. Los reportes incluyen un bloque `Origen` con `device_name`, `device_id` y rol para rastrear desde que equipo se genero la senal.

## Modo watch

```bash
npm run run:mode -- --mode watch --interval-minutes 15
```

El modo watch ejecuta `weekly:screen` al iniciar y luego cada intervalo configurado mientras el equipo este encendido. Registra `heartbeat.json` en `.local_runtime/`, que no se sube a GitHub.

## Criterios

Aprobada Graham usa la misma logica de `classify()`:

- `P/E x P/B <= 22.5`
- `P/E <= 20`
- `P/B <= 2`
- `debtRatio < 1`
- `currentRatio >= 2`
- `epsAllPositive = true`

Cerca de aprobar usa umbrales un poco mas amplios:

- `P/E x P/B <= 28`
- `P/E <= 22`
- `P/B <= 2.3`
- `debtRatio < 1.2`
- `currentRatio >= 1.8`

## Siguiente mejora

Agregar historico de reportes comparables para detectar:

- Nueva aprobada
- Salio de aprobada
- Se acerco a precio defensivo
- Empeoro balance o EPS
