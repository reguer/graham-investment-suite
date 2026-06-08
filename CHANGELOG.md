# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

### Added
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
- `README.md` — Ampliado con configuración local, multiordenador, alertas, GitHub Pages y troubleshooting (preservando contenido existente)
- `docs/weekly-alerts.md` — Actualizado con CLI, exports, Telegram multiordenador y modo watch.
- `docs/13_ROADMAP_NOTION_READY.md` — Marcadas historias completadas y riesgos pendientes reales.

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
