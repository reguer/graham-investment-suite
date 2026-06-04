# 15 - Estrategia de Universo Masivo Yahoo/BMV

## Objetivo

Mantener un universo amplio de empresas con actualizacion periodica, sin confundir tickers pendientes con empresas aprobadas por Graham.

El primer lote versionado queda en:

- `src/tools/watchlist/universe.js`
- `requestedTickers`: lote solicitado por el usuario
- `bmvSicUniverse`: 200 acciones BMV/SIC validadas contra Yahoo Finance Search

## Fuentes

- Grupo BMV Mercado Global/SIC: confirma que el SIC permite invertir en acciones y ETFs listados en otros mercados desde Mexico.
- Yahoo Finance Search: valida simbolo, exchange `MEX`, tipo `EQUITY`, nombre, sector e industria cuando esta disponible.
- Yahoo Finance Chart: fuente primaria para precio, moneda, volumen y mercado en scripts locales.

## Estados del ciclo de vida

| Estado | Significado | Accion |
|--------|-------------|--------|
| `pending_fundamentals` | Existe ticker, pero faltan fundamentales Graham | Mostrar en dashboard sin ratios |
| `analyzed` | Tiene snapshot financiero completo | Calcular ratios y clasificacion |
| `needs_manual_review` | Yahoo no valida el simbolo esperado o usa alias | Revisar ticker manualmente |
| `missing_data` | Yahoo no entrega datos suficientes | Mantener sin alertas Graham |

## Flujo al agregar tickers

1. Agregar ticker al catalogo o importarlo desde CSV/JSON.
2. Validar simbolo en Yahoo Search.
3. Si es BMV/SIC, preferir simbolo `.MX`.
4. Si Yahoo usa alias, guardarlo explicitamente, por ejemplo `MRVL1.MX`, `SNDK1.MX`, `BIDUN.MX`.
5. Ejecutar `npm run universe:refresh` para obtener precio y metadata de mercado.
6. Capturar fundamentales manualmente o implementar extraccion validada.
7. Recalcular ratios con `calcRatios()`.
8. Clasificar con `classify()`.
9. Registrar primer analisis y empezar seguimiento semanal.

## Cadencia recomendada

| Dato | Frecuencia | Fuente |
|------|------------|--------|
| Precio | Diario 18:00 CDMX | Yahoo Chart + Stooq fallback |
| Reporte formal | Lunes y viernes 18:00 CDMX | `npm run weekly:screen` |
| Fundamentales | Trimestral o al agregar empresa | Yahoo Finance + revision manual |
| EPS historico | Al cierre anual o resultados | Yahoo Finance + revision manual |
| Primer analisis | Al agregar ticker | Captura manual asistida |

## Automatizacion local

Comandos actuales:

```bash
npm run universe:refresh
npm run universe:refresh:requested
npm run weekly:screen
```

`universe:refresh` guarda snapshots en `data/cache/`, carpeta ignorada por Git. Esto evita subir datos temporales o cache de proveedores.

## Limites actuales

Yahoo Chart funciona sin credenciales para precios. Yahoo Quote Summary puede requerir cookies/crumb y puede responder `401`; por eso no debe considerarse fuente automatica confiable de fundamentales hasta implementar un cliente robusto y tests de calidad.

Mientras no exista extraccion fundamental validada:

- No emitir alertas Graham para tickers pendientes.
- No inventar EPS, book value, deuda o cash flow.
- No convertir moneda sin documentar tipo de cambio.
- No mezclar precio en MXN con fundamentales en USD sin validacion.

## Siguiente fase

Implementar `scripts/update-fundamentals.js` con:

- Cliente Yahoo robusto con manejo de cookies/crumb si es necesario.
- Fallback a captura manual desde Yahoo Finance.
- Validacion de moneda y magnitud.
- Persistencia local SQLite.
- Historial de cambios de estado.
- Alertas lunes/viernes basadas en cambios reales.
