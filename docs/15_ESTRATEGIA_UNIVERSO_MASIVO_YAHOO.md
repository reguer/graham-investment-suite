# 15 - Estrategia de Universo Masivo Yahoo/BMV

## Objetivo

Mantener un universo amplio de empresas con actualizacion periodica, sin confundir tickers pendientes con empresas aprobadas por Graham.

El lote versionado queda en:

- `src/tools/watchlist/universe.js`
- `requestedTickers`: lote solicitado por el usuario
- `bmvSicUniverse`: universo BMV/SIC ampliado por sectores, incluyendo tecnologia, salud, consumo defensivo, utilities, financieras e infraestructura electrica
- `data/import/ai-infrastructure-universe-2026-06-09.json`: lote auditable de expansion energia/infraestructura AI

Estado 2026-06-09:

- Export publico: 306 instrumentos.
- Analizadas: 290.
- Referencias indice/ETF: 8.
- Referencias macro: 3.
- Pendientes por fuente/captura: 5.
- Precios resueltos: 287 de 306.

## Fuentes

- Grupo BMV Mercado Global/SIC: confirma que el SIC permite invertir en acciones y ETFs listados en otros mercados desde Mexico.
- Yahoo Finance Search: valida simbolo, exchange `MEX`, tipo `EQUITY`, nombre, sector e industria cuando esta disponible.
- Yahoo Finance Chart: fuente primaria para precio, moneda, volumen y mercado en scripts locales.

## Estados del ciclo de vida

| Estado | Significado | Accion |
|--------|-------------|--------|
| `pending_fundamentals` | Existe ticker, pero faltan fundamentales Graham | Mostrar en dashboard sin ratios |
| `analyzed` | Tiene snapshot financiero completo | Calcular ratios y clasificacion |
| `index_reference` | Indice o ETF de benchmark | Mostrar como referencia, sin Graham |
| `market_reference` | Futuro o commodity macro | Mostrar como referencia, sin Graham |
| `analysis_external_pending` | Yahoo/SEC no entregaron snapshot suficiente | Resolver alias, SEC EDGAR o captura manual |
| `needs_manual_review` | Yahoo no valida el simbolo esperado o usa alias | Revisar ticker manualmente |
| `missing_data` | Yahoo no entrega datos suficientes | Mantener sin alertas Graham |

## Flujo al agregar tickers

1. Agregar ticker al catalogo o importarlo desde CSV/JSON.
2. Validar simbolo en Yahoo Search.
3. Si es BMV/SIC, preferir simbolo `.MX`.
4. Si Yahoo usa alias, guardarlo explicitamente, por ejemplo `MRVL1.MX`, `SNDK1.MX`.
5. Ejecutar `npm run universe:sync` para persistir el universo sin perder snapshots analizados.
6. Ejecutar `npm run universe:refresh` para obtener precio y metadata de mercado.
7. Ejecutar `npm run fundamentals:ingest -- --limit 80` para extraer fundamentales Yahoo en lotes.
8. Si `.MX` no entrega fundamentales, el script intenta automaticamente el ticker base USA.
9. Recalcular ratios con el snapshot validado y clasificar con `classify()`.
10. Registrar primer analisis y empezar seguimiento semanal.

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
npm run universe:sync
npm run universe:refresh
npm run universe:refresh:requested
npm run fundamentals:ingest -- --limit 80
npm run weekly:screen
npm run weekly:pipeline -- --no-telegram
```

`weekly:pipeline` ejecuta el flujo local completo en orden: `universe:sync`, `universe:refresh`, `fundamentals:ingest` y `weekly:screen`. `universe:sync` escribe el catalogo a PostgreSQL/export publico en chunks. `universe:refresh` guarda snapshots en `data/cache/`, carpeta ignorada por Git. Esto evita subir datos temporales o cache de proveedores.

## Limites actuales

Yahoo Chart funciona sin credenciales para precios. Yahoo Quote Summary y `fundamentalsTimeSeries` funcionan localmente con `yahoo-finance2`, pero algunos simbolos BMV/SIC `.MX` no entregan fundamentales o estados anuales. Para esos casos el flujo intenta ticker base USA; si aun falla, se marca como pendiente y requiere captura manual o fuente alternativa.

Mientras no exista extraccion fundamental validada:

- No emitir alertas Graham para tickers pendientes.
- No inventar EPS, book value, deuda o cash flow.
- No convertir moneda sin documentar tipo de cambio.
- No mezclar precio en MXN con fundamentales en USD sin validacion.

## Pendientes actuales

- Commodities/futuros (`GOLD`, `SILVER`, `COPPER`) e indices (`INDEX100`, `SP500`) ya no se cuentan como pendientes Graham; sirven como referencias macro/mercado.
- `FITB` y `VTRS`: Yahoo no devolvio estados anuales suficientes en la corrida; requieren reintento posterior o captura manual.
- `CMA`, `HOLX`, `JNPR`: Yahoo no devolvio quote fundamental para `.MX` ni ticker base en la corrida; revisar simbolo/alias Yahoo o capturar manualmente.

## Siguiente fase

- Ejecutar ingesta en chunks programados por Task Scheduler.
- Agregar tabla de errores/fuentes por ticker para priorizar rescates manuales.
- Añadir alias alternativos Yahoo cuando `.MX` y ticker base fallen.
- Mantener alertas lunes/viernes basadas en cambios reales, no en ruido de datos incompletos.
