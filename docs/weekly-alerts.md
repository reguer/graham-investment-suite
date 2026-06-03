# Weekly Alerts

El radar semanal usa `src/tools/watchlist/watchlist.js` como universo inicial y `src/tools/watchlist/screen.js` como motor de clasificacion.

## Ejecutar

```bash
npm run weekly:screen
```

El script intenta actualizar precios desde Stooq sin API key. Si la fuente falla, usa el precio snapshot guardado en la watchlist y lo indica en el reporte.

## Salida

Genera un archivo:

```text
reports/weekly/YYYY-MM-DD.md
```

El reporte separa:

- Aprobadas Graham
- Cerca de aprobar
- En observacion

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
