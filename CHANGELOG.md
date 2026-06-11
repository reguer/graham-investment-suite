# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased] — 2026-06-11 Datos completos y equity negativo

### Fixed
- `src/tools/watchlist/yahooFundamentals.js` — detecta equity negativo antes de calcular snapshot; `debtRatio` se guarda como `null` (no como negativo sin sentido), y se añade `hasNegativeEquity: true` al snapshot
- `src/tools/watchlist/screen.js` — `hasFinancialSnapshot()` acepta empresas con `hasNegativeEquity` si tienen `pe + currentRatio`; `countAvailableCriticalRatios()` usa solo `pe/currentRatio/fcf` para estas empresas
- `src/tools/watchlist/screen.js` — `deriveSnapshot()` maneja `pb=null` y `bvps=null` cuando equity es negativo; `maxDefensivePrice` cae a `pricePe20` cuando no hay P/B
- `src/tools/watchlist/screen.js` — `near` y `closeToDefensive` siempre `false` para `hasNegativeEquity`; estas empresas aparecen en "watch" pero nunca como "cerca de aprobar"
- `src/tools/watchlist/universe.js` — sectores completados para todos los `requestedTickers` (AMD, BB, BIDU, INTC, META, MU, MRVL, NVDA, SNDK, SKHYNIX, TSLA) y para `bmvSicRows` con sector vacío (PLTR, ALL, PCAR, KDP, CSGP, BR)
- `scripts/sync-universe.js` — `mergeUniverseWithPublic()` ya no sobreescribe sectores válidos con "Solicitados" o "Sin sector"; solo usa el placeholder si el universo no tiene sector real
- `public/data/companies.json` + `data/public/companies.json` — 20 snapshots de empresas con equity negativo corregidos (`debtRatio: null`, `hasNegativeEquity: true`); `ESS` y `MAA` corregidos de `pe=0/pb=0` a `null`
- `src/tools/watchlist/screen.js` — `deriveSnapshot()` ahora propaga `roe`, `roa`, `tie` del candidato (fix anterior ya existía; mantenido en refactor)

### Changed
- Empresas con equity negativo (MCD, ABBV, HPQ, LOW, PM, SBUX, AZO, YUM, MO, TDG, OTIS, HCA, HLT, MAR, BKNG, ORLY, DVA, MCK, MSCI, CA) pasan de `analysis_unsupported` (invisibles) a `analyzed` con `alertLevel: "watch"` — ahora visibles y evaluables por P/E
- "En observación" sube de ~250 a **278 empresas**; "Analizadas" de 264 a **320**; "Fuente/captura requerida" baja de 40 a **11**

### Tests
- `tests/watchlist-screen.test.js` — nuevo caso: empresa con `hasNegativeEquity` aparece como `"watch"` con `ratios.pb === null` y `ratios.pe` válido

---

## [Unreleased] — 2026-06-08 Bloque Lógica de Negocio

### Fixed
- `src/tools/graham-analyzer/calcRatios.js` — `grahamFormula` ya no se anula cuando `pe === null` sin necesidad; `grahamPrice()` ya tiene sus propias guardas (eps ≤ 0, bvps ≤ 0)
- `src/tools/graham-analyzer/calcRatios.js` — CAGR de EPS ahora usa la diferencia real de años (`epsYearN` - `epsYear1`) como denominador cuando los años están disponibles; cae a `length - 1` si no lo están (comportamiento previo conservado para datos sin años)
- `src/tools/watchlist/screen.js` — `deriveSnapshot()` ahora pasa `roe`, `roa` y `tie` del candidato en lugar de forzarlos a `null`; esto permite que `isStrongCompany()` en `classify.js` funcione correctamente en el screening, habilitando la categoría "EXCELENTE, PERO CARA" en Watchlist
- `src/tools/watchlist/screen.js` — fórmula inline de `grahamFormula` ahora incluye guardia `null` (resultado NaN → null) consistente con `grahamPrice()` en calcRatios
- `src/tools/watchlist/secFundamentals.js` — `buildSecGrahamSnapshot()` ahora calcula `tie` (interest coverage ratio) usando `OperatingIncomeLoss` / `InterestExpense` de SEC EDGAR; casos sin gasto de intereses con EBIT positivo retornan `Infinity`

### Tests
- `tests/calcRatios.test.js` — nuevos casos edge: equity negativo (P/B negativo pero finito, grahamFormula null), CAGR con años reales vs. sin años, `epsGrowing` null cuando hay un solo año de historia

### Diagnóstico de mejoras (issues detectados fuera del roadmap previo)
Ver tabla completa en `docs/13_ROADMAP_NOTION_READY.md` (E21, E22). Resumen:
- **Lógica (8 issues):** divergencia Graham Analyzer vs. Watchlist en ROE/ROA/TIE; CAGR inflado con datos de años no consecutivos; grahamFormula con condición incorrecta; pePbTangible y hasIntangibleData huérfanos; equity negativo sin advertencia; edge cases sin tests
- **UX (10 issues):** toolbar no sticky; sin feedback al guardar; loading IA sin spinner; historial sin sorting; EPS sin años explícitos; tabla candidatos sin responsive; colores fuera de design tokens; fecha datos no visible en Watchlist
- **Consistencia técnica (3 issues):** grahamPrice() duplicado; epsGrowing con nullability inconsistente; candidatos sin fecha de captura

---

## [Unreleased]

### Added
- `npm run universe:sync` para sincronizar `src/tools/watchlist/universe.js` hacia PostgreSQL y exports publicos sin degradar snapshots ya analizados.
- Universo ampliado a 306 instrumentos, con sectores adicionales de utilities, infraestructura electrica, consumo defensivo, salud, financieras y tecnologia razonable.
- Fallback automatico de fundamentales Yahoo: primero intenta simbolo SIC `.MX` y despues ticker base USA cuando Yahoo no entrega fundamentales para el listado mexicano.
- Candidatas Graham complementadas: se conservan las candidatas previas de constructoras y se suman nuevas empresas diversificadas por sector.
- Dashboard Watchlist con tabla densa de 30 columnas, filtros por estado/tag y vista responsive real.
- `scripts/weekly-screen.js` con `--ticker`, `--format md/csv/html`, `--verbose` y `--no-telegram`.
- Export CSV/HTML de screening en `data/export/`.
- `scripts/alert-dispatcher.js` para evitar envios Telegram duplicados desde equipos secundarios.
- `scripts/run-mode.js` y `npm run run:mode` para modos `once`, `watch` y `dashboard`.
- Reportes semanales con bloque `Origen` basado en `.local_runtime/device.json`.
- Tests adicionales para casos borde de Graham: quick ratio sin inventario, EPS cero y EPS CAGR con un solo año.
- Backtesting v2.0 basico con `backtesting/engine.js`, estrategia Graham defensiva, metricas y reporte Markdown.
- Descarga historica OHLCV con Stooq/Yahoo fallback via `npm run historical:download`.
- Fixture `backtesting/tests/fixtures/mini_universe.json` y tests de compra, salida por valuacion y stop loss.
- Benchmark SP500 fixture, alfa por trade y exports CSV de trades/equity curve para backtesting.
- Pestaña lazy `Backtesting` en el dashboard que carga `public/data/backtesting-summary.json`.
- Benchmark real `^GSPC` descargable con alias `SP500`, backtest `public-10` y selector de escenarios en dashboard.
- `scripts/export-to-notion.js` con dry-run seguro y payload local para sincronización futura con Notion.
- `scripts/weekly-pipeline.js` y `npm run weekly:pipeline` para ejecutar en orden `universe:sync -> universe:refresh -> fundamentals:ingest -> weekly:screen`.
- Tabla `Fuentes pendientes` en Watchlist para ver ticker, alias Yahoo, severidad, fuente sugerida y accion de rescate.
- `docs/00_PREFLIGHT_ESTADO_REAL.md` — Diagnóstico técnico inicial del repositorio
- `docs/01_PROCESOS_LOCALES_DASHBOARD.md` — Aislamiento de procesos y puertos locales
- `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md` — Jerarquía de fuentes de datos y propuesta de automatización
- `docs/03_DASHBOARD_LOCAL_GITHUB_PAGES.md` — Arquitectura dual local + GitHub Pages
- `docs/04_PRUEBAS_VALIDACION_OPERATIVA.md` — Guía operativa de comandos verificados
- `docs/05_BASE_LOCAL_EMPRESAS_INDICES.md` — Propuesta de BD SQLite con 23 tablas
- `docs/06_SCREENING_TABLAS_FILTROS.md` — Diseño de tabla principal y 10 estados del sistema
- `docs/07_INGESTA_EMPRESAS_MANUAL_AUTOMATICA.md` — Flujos de ingesta manual y automática
- `docs/08_ALERTAS_LOCAL_TELEGRAM.md` — Sistema de alertas con 14 tipos y configuración Telegram
- `docs/09_MODO_LOCAL_TIEMPO_REAL.md` — Arquitectura de 4 procesos y 7 modos de operación
- `docs/10_INSTALACION_MULTIORDENADOR.md` — Instalación en múltiples equipos con device_id
- `docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md` — Reglas de versionado y deploy sin CI/CD
- `docs/12_BACKTESTING_ESTRATEGIAS.md` — Plan de backtesting con 8 estrategias
- `docs/13_ROADMAP_NOTION_READY.md` — Roadmap con 20 Epics y 47 Stories en formato Notion
- `docs/14_PROMPTS_OPERATIVOS.md` — 18 prompts reutilizables para Claude Code
- `CHANGELOG.md` — Este archivo

### Changed
- `vite.config.js` migro de `createRequire()` a `import()` dinamico para eliminar el warning CJS de Vite, preservando fallback local reparado.
- Watchlist reemplaza botones locales bloqueados en GitHub Pages por mensajes informativos y oculta notas internas de proceso en la tabla/cards.
- Screening marca como `DATOS INSUFICIENTES` las empresas con menos de 3 de 5 ratios criticos disponibles.
- Ingesta y refresh PostgreSQL escriben en chunks para soportar universos grandes sin `ENAMETOOLONG`.
- `README.md` — Ampliado con configuración local, multiordenador, alertas, GitHub Pages y troubleshooting (preservando contenido existente)
- `docs/weekly-alerts.md` — Actualizado con CLI, exports, Telegram multiordenador y modo watch.
- `docs/13_ROADMAP_NOTION_READY.md` — Marcadas historias completadas y riesgos pendientes reales.
- Indices, ETFs y futuros se separan como referencias de mercado para no aparecer como pendientes Graham.
- Reporte semanal renombra pendientes a `Fuente/captura requerida` cuando falta alias, SEC EDGAR o captura manual.

### Estado de datos
- Corrida local 2026-06-09: 306 instrumentos en export publico; 290 analizados, 8 referencias de indice/ETF, 3 referencias macro y 5 pendientes por fuente/captura.
- Precios Yahoo resueltos para 287 de 306 instrumentos; 19 quedaron sin precio de listado en la corrida.
- Referencias macro: `GOLD`, `SILVER`, `COPPER`; referencias solicitadas: `INDEX100`, `SP500`.
- Pendientes actuales por fuente/captura: parciales Yahoo sin estados anuales (`FITB`, `VTRS`) y tickers sin quote fundamental Yahoo en la corrida (`CMA`, `HOLX`, `JNPR`).

---

## [1.0.0] — 2026-06-02

### Added
- Proyecto inicial creado como commit único: "feat: create Graham Investment Suite"

#### Aplicación React/Vite
- `src/` — Aplicación React 18.3 completa con 3 herramientas:
  - **Graham Analyzer** — herramienta principal de análisis Graham
  - **Watchlist** — screening semanal de 10 candidatos
  - **Macro Radar** — indicadores macroeconómicos (en desarrollo)
- `src/tools/graham-analyzer/calcRatios.js` — Motor de cálculo con 30+ métricas Graham
- `src/tools/graham-analyzer/classify.js` — Clasificación en 4 categorías Graham
- `src/tools/graham-analyzer/getChecks.js` — 10 criterios de verificación Graham
- `src/tools/graham-analyzer/constants.js` — Esquema EMPTY_FORM, GRAHAM_LIMITS, alertFor()
- `src/tools/graham-analyzer/candidates.js` — 10 candidatos preconfigurados
- `src/tools/graham-analyzer/prefills.js` — Datos demo (TSM, MU)
- `src/lib/formatters.js` — p(), fmt(), fmtM(), pct(), fmtNum()
- `src/lib/anthropic.js` — Integración con Claude Sonnet API
- `src/lib/storage.js` — Persistencia cloud + localStorage
- `src/lib/colors.js` — Sistema de colores semáforo

#### Scripts de automatización local
- `scripts/weekly-screen.js` — Screening semanal con Stooq + reporte Markdown
- `scripts/bundle-artifact.js` — Validación de artifacts standalone
- `scripts/run-local-bin.js` — Wrapper para binarios locales

#### Tests
- `tests/calcRatios.test.js` — 8 tests (fixture TSM con ADR ratio 5)
- `tests/classify.test.js` — Tests de clasificación
- `tests/formatters.test.js` — Tests de formateo
- `tests/watchlist-screen.test.js` — Tests de screening
- `tests/fixtures/tsm.json` — Fixture crítico TSM

#### Configuración
- `vite.config.js` — Vite con soporte GitHub Actions
- `vitest.config.js` — Configuración de tests
- `package.json` — Dependencies + 7 scripts
- `.gitignore` — Exclusiones básicas

#### Documentación inicial
- `README.md` — Descripción y comandos básicos
- `CLAUDE.md` — Reglas para Claude Code
- `AGENTS.md` — Reglas para agentes IA
- `HANDOFF_GRAHAM_ECOSYSTEM.md` — Fuente de verdad técnica v1.3
- `docs/classification-logic.md` — Árbol de decisión de clasificación
- `docs/formulas.md` — Fórmulas con ejemplos
- `docs/data-sources.md` — Guía de captura desde Yahoo Finance
- `docs/weekly-alerts.md` — Configuración de alertas

#### Outputs
- `artifacts/graham_analyzer.jsx` — Componente standalone para Claude.ai
- `artifacts/macro_radar.jsx` — Componente standalone para Claude.ai
- `reports/weekly/2026-06-03.md` — Primer reporte semanal (10 empresas aprobadas)

---

## Riesgos detectados en auditoría (2026-06-03)

| # | Riesgo | Severidad |
|---|--------|-----------|
| 1 | Mecanismo de deploy a GitHub Pages no documentado ni verificado | Media |
| 2 | Sin base de datos local — datos hardcodeados en candidates.js | Alta |
| 3 | Sin Windows Task Scheduler configurado para cierre diario 18:00 CDMX | Alta |
| 4 | Sin identificación de ordenador (device_id) en señales y reportes | Media |
| 5 | VITE_ANTHROPIC_API_KEY no configurado — análisis IA no disponible | Baja |
| 6 | Duplicados en raíz: HANDOFF_GRAHAM_ECOSYSTEM (1).md | Baja |
| 7 | PROMPT_CODEX (1).md sin referencias en código | Baja |
| 8 | Puerto Vite 5173 sin configuración explícita — puede colisionar | Baja |

---

## Known Issues

- El mecanismo real de deploy a `https://reguer.github.io/graham-investment-suite/` no fue verificado en esta sesión (ver `docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md`)
- `MacroRadar.jsx` está en estado incompleto — solo UI de placeholder (mencionado en HANDOFF como "companion pendiente de migración")
- `weekly:screen` y `weekly:report` son el mismo script — el nombre `weekly:report` es redundante
- Los datos de fundamentales en `candidates.js` no tienen fecha de captura — no se sabe si están actualizados
- No existe validación automática de que los datos de fundamentales estén en USD

---

## Pendientes para v1.1

- [ ] Configurar Windows Task Scheduler para 18:00 CDMX
- [ ] Actualizar `.gitignore` con `.local_runtime/`, `.env.local`, `*.pid`, `*.lock`
- [ ] Crear `.local_runtime/device.json` por equipo
- [ ] Añadir `device_id` al pie de los reportes semanales
- [ ] Verificar mecanismo de deploy de GitHub Pages

## Pendientes para v1.5

- [ ] Implementar base de datos SQLite
- [ ] Migrar candidates.js a BD
- [ ] Crear scripts/add-company.js
- [ ] Implementar sistema de alertas con historial
- [ ] Configurar Telegram (opcional)

## Pendientes para v2.0

- [ ] Integrar yahoo-finance2 para automatizar fundamentales
- [ ] Implementar motor de backtesting
- [ ] Tabla de screening ampliada en dashboard
- [ ] 10 estados del sistema en lugar de 4 categorías Graham
