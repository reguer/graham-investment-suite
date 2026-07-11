# Graham Investment Suite

Suite React/Vite para analisis financiero defensivo basado en Benjamin Graham. La herramienta principal es Graham Analyzer: captura manual de datos desde Yahoo Finance, calculo de ratios, semaforos, clasificacion, interpretacion por reglas e IA opcional.

No es asesoria financiera. Es una herramienta de analisis; verifica datos, moneda, magnitudes y ADR ratio antes de decidir.

---

## App publica

https://reguer.github.io/graham-investment-suite/

---

## Estado actual

| Aspecto | Estado |
|---------|--------|
| Version | 1.0.0 |
| Stack | React 18.3 + Vite 5.4 + Vitest 2.0 + Node.js >=22 |
| Tests | 35+ suites — `npm test` |
| Build | `npm run build` |
| Dashboard local | `npm run dev:safe` → localhost:5173 o siguiente puerto libre |
| Base de datos | PostgreSQL local si `DATABASE_URL` existe; export publico en `data/public/companies.json` |
| Universo actual | 306 instrumentos: 290 analizados, 8 referencias de indice/ETF, 3 referencias macro y 5 pendientes por fuente/captura al 2026-06-09 |
| Yahoo complementario | `npm run fundamentals:ingest -- --all-unsupported` |
| Scheduler lunes/viernes | `npm run scheduler:install` |
| Alertas automaticas | Markdown + Telegram opcional solo desde equipo principal |
| Scheduler local | Script Windows disponible con `npm run scheduler:install` |

---

## Instalacion

Ubicacion local recomendada para evitar bloqueos de Google Drive:

```text
C:\Users\EDUARDO\Documents\00_Apps_Locales\GrahamAnalizer
```

```bash
npm install
```

## Configuracion local

Crear `.env.local` en la raiz del proyecto (no se versiona):

```bash
# API de analisis IA (opcional — la app funciona sin ella)
VITE_ANTHROPIC_API_KEY=

# Identificacion del equipo (ver docs/10_INSTALACION_MULTIORDENADOR.md)
DEVICE_ID=mi-equipo-uuid
DEVICE_NAME=Laptop Eduardo
DEVICE_ROLE=principal

# Dashboard automatico a GitHub Pages (solo equipo principal)
AUTO_PUSH_DASHBOARD=false

# Base de datos PostgreSQL local (opcional, no versionar credenciales)
DATABASE_URL=

# Alertas Telegram (opcional)
ENABLE_TELEGRAM_ALERTS=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## Desarrollo — Dashboard local

```bash
npm run dev:safe
```

Abre `http://localhost:5173` en el navegador.

En Windows, `npm run dev:safe` arranca el dashboard en segundo plano por defecto, guarda PID/logs en `.local_runtime/` y ya no deberia depender de una ventana visible de PowerShell para seguir vivo.

Si quieres lanzarlo manualmente sin dejar una ventana visible de PowerShell, usa:

```powershell
wscript.exe //B //NoLogo scripts\start-dashboard-hidden.vbs
```

Para mantenerlo vivo en segundo plano durante toda la sesion de Windows, usa:

```powershell
wscript.exe //B //NoLogo scripts\dashboard-keepalive.vbs
```

Para detenerlo limpiamente y matar tambien el arbol `vite/node` asociado:

```bash
npm run dev:stop
```

Si el puerto 5173 esta ocupado por otro proyecto:

```bash
npm run dev:safe -- --port 5174
```

Ver `docs/01_PROCESOS_LOCALES_DASHBOARD.md` para el manejo de puertos y procesos locales.

---

## Pruebas y build

```bash
npm test               # Correr las suites de tests
npm run test:watch     # Modo watch de tests
npm run build          # Build para produccion / GitHub Pages
npm run build:artifact # Validar y regenerar artifacts standalone
npm run watchlist:analyze -- --all # Analisis completo del universo con SEC/Yahoo + PostgreSQL/export publico
npm run fundamentals:ingest -- --all-unsupported # Rescata no soportadas con Yahoo Finance parcial en USD
npm run weekly:screen  # Screening semanal + reporte Markdown
npm run weekly:screen -- --ticker KBH --format csv --no-telegram # Export filtrado sin enviar Telegram
npm run run:mode -- --mode watch --interval-minutes 15 # Poll local de precios/reportes mientras el equipo esta encendido
npm run runtime:init # Crea .local_runtime/device.json sin tocar .env.local
npm run historical:download # Descarga OHLCV historico para 10 tickers base
npm run backtest:mini # Ejecuta fixture minimo, genera MD/JSON/CSV y export publico
npm run backtest:mini -- --universe public-10 --benchmark-ticker SP500 # Backtest 10 tickers con benchmark real ^GSPC
npm run notion:export -- --dry-run --limit 25 # Payload local para Notion sin enviar secretos
npm run universe:sync # Sincroniza universe.js a PostgreSQL/export publico sin perder snapshots
npm run universe:refresh # Precios Yahoo para el universo masivo
npm run weekly:pipeline -- --no-telegram # Flujo completo local: sync -> refresh -> ingest -> weekly screen
npm run db:migrate-candidates # Exporta candidatas a data/public y PostgreSQL si DATABASE_URL existe
npm run scheduler:install # Crea tarea Windows lunes/viernes 18:00 sin sobrescribir si ya existe
```

## Datos local + GitHub

PostgreSQL local se usa para datos operativos cuando `DATABASE_URL` esta configurado en `.env.local`. GitHub guarda solo datos publicos no sensibles como `data/public/companies.json` y reportes. Ver `docs/16_DATOS_POSTGRES_GITHUB.md`.

---

## Datos

Los datos se capturan manualmente desde Yahoo Finance: Balance Sheet, Income Statement, Cash Flow, EPS TTM, Shares Outstanding, Net Tangible Assets o Goodwill + Intangibles y ADR ratio cuando aplique.

**Yahoo Finance es la fuente principal** de datos fundamentales. Stooq se usa automaticamente para precios spot en el screening semanal.

La ingesta automatica complementaria usa `yahoo-finance2` con Node 22 para intentar rescatar empresas que SEC no pudo analizar. Primero intenta `fundamentalsTimeSeries` + FX controlado; si Yahoo entrega estados anuales, EPS historico, precio, P/E, P/B, deuda y liquidez, guarda un snapshot `yahoo_full_fx`. Si la empresa queda descartada por P/E nulo, P/B nulo, liquidez no aplicable o ratios faltantes, se marca como `yahoo_model_rejected` en vez de dejarla pendiente.

`scripts/data-ingestion.js` prueba **todos** los simbolos candidatos de una empresa (el listado `.MX` de BMV/SIC primero, el ticker base USA despues) antes de marcarla incompleta — no se detiene en el primer candidato que devuelva un snapshot inservible. El modo por defecto (`incomplete`, usado por el boton "Solo precios" del dashboard ademas de "Actualizar todo") tambien reintenta cualquier registro ya `analyzed` cuyo `validationStatus` siga en `yahoo_partial_incomplete`, `yahoo_model_rejected`, `yahoo_fetch_failed` o `currency_rejected`, para que una empresa no quede incompleta para siempre solo porque una corrida anterior fallo.

En la corrida local del 2026-06-09 el universo quedo asi: 306 instrumentos, 290 analizados, 8 referencias de indice/ETF, 3 referencias macro y 5 pendientes por fuente/captura. `npm run universe:refresh` resolvio precios para 287 de 306 instrumentos. Los pendientes no se eliminan: quedan marcados como `DATOS INSUFICIENTES`, `yahoo_partial_incomplete`, `yahoo_fetch_failed` o `source_required` hasta tener una fuente alternativa confiable o captura manual. Indices, ETFs y futuros quedan como referencias y no se muestran como pendientes Graham.

Flujo local recomendado para alimentar datos sin depender de sesiones Codex:

```bash
npm run universe:sync
npm run universe:refresh
npm run fundamentals:ingest -- --limit 80
npm run weekly:screen -- --no-telegram
```

Para correrlo como una sola tarea local:

```bash
npm run weekly:pipeline -- --no-telegram
```

`universe:sync` agrega nuevos tickers desde `src/tools/watchlist/universe.js` a PostgreSQL/export publico y preserva snapshots analizados. `universe:refresh` actualiza precios. `fundamentals:ingest` usa Yahoo Finance localmente; si un simbolo `.MX` no entrega fundamentales, intenta automaticamente el ticker base USA y conserva la trazabilidad en notas.

Fuentes para completar pendientes:
- Yahoo Finance `fundamentalsTimeSeries` y `quoteSummary` como fuente automatica primaria.
- Yahoo Finance ticker base USA cuando el listado `.MX` solo sirve para precio/tradabilidad.
- SEC EDGAR `companyfacts` para emisoras USA con CIK cuando el pipeline SEC aplique.
- Captura manual desde Yahoo Finance para casos parciales donde Yahoo no entregue estados anuales.
- Futuros/indices no se fuerzan a Graham; se mantienen como referencias o activos macro.

BIDU se convirtio desde CNY a USD; SKHYNIX desde KRW a USD. El proyecto instala/usa Node 22.22.3 via scripts locales cuando existe, sin tocar `.env.local`.

El export grande se sirve desde `public/data/companies.json` en GitHub Pages y dashboard local. La app carga ese archivo en runtime y divide las pestañas con `React.lazy`, por lo que el bundle principal queda debajo de 150 kB.

Ver `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md` para la guia completa de captura y validacion de datos en USD.

**Convención de magnitudes**: Verificar si los datos en Yahoo Finance estan en miles o en millones para la empresa que estas analizando. Usar la misma magnitud en todos los campos del formulario.

---

## Decision ADR / TSM

La regla final documentada y probada es: si `isADR = true`, `epsAdj`, `bvps`, `tangibleBvps` y `ncav` se multiplican por `adrRatio`. Con el fixture TSM y `adrRatio = 5`, el resultado esperado es `P/E ~7.03`, `P/B ~11.20`, `P/E x P/B ~78.77` y `NCAV positivo ~7.86`. Se descartan expectativas previas incompatibles como `P/E ~31.92` o NCAV negativo para esos mismos datos.

---

## Artifact standalone

`npm run build:artifact` valida que existan `artifacts/graham_analyzer.jsx` y `artifacts/macro_radar.jsx` con `export default`. En esta fase el artifact se mantiene como copia monolitica funcional; no depende de imports internos del repo.

---

## Alertas semanales y horario operativo

`npm run weekly:screen` actualiza precios desde Yahoo Chart + Stooq fallback cuando esta disponible, recalcula la watchlist y genera `reports/weekly/YYYY-MM-DD.md`.

Opciones del CLI:

```bash
npm run weekly:screen -- --ticker KBH
npm run weekly:screen -- --ticker KBH --format csv --no-telegram
npm run weekly:screen -- --ticker KBH --format html --no-telegram
npm run weekly:screen -- --verbose
```

Los reportes Markdown y HTML incluyen el origen del equipo desde `.local_runtime/device.json`. Ese archivo es local, no se versiona y se crea con `npm run runtime:init` o al arrancar scripts que usan runtime local.

El universo inicial incluye el lote solicitado por el usuario y acciones BMV/SIC validadas por Yahoo Finance Search con simbolo `.MX`. Las empresas sin fundamentales quedan como `Fuente/captura requerida`; no se calculan ratios Graham hasta tener captura manual o extraccion fundamental validada.

**Horario operativo requerido: cierre de vela diaria a las 18:00 hrs CDMX.**

Los lunes y viernes se generan alertas formales. Si `ENABLE_TELEGRAM_ALERTS=true`, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` existen en `.env.local`, solo el equipo con `device_role = principal` o `primary` envia Telegram. Los equipos secundarios registran/reportan localmente para evitar alertas duplicadas.

Para automatizar la ejecucion al cierre diario, ver `docs/09_MODO_LOCAL_TIEMPO_REAL.md`. Para polling local controlado:

```bash
npm run run:mode -- --mode watch --interval-minutes 15
```

---

## GitHub Pages

La app publica esta disponible en https://reguer.github.io/graham-investment-suite/ y funciona como espejo del dashboard local.

El mecanismo de deploy local (sin GitHub Actions) esta documentado en `docs/03_DASHBOARD_LOCAL_GITHUB_PAGES.md` y `docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md`.

**El deploy nunca debe hacerse por workflows remotos** — siempre desde el equipo local autorizado.

**Publicacion automatica:** los botones "Actualizar todo" y "Solo precios" del dashboard local corren `scripts/publish-pages.js` despues de refrescar datos — comitea `data/public/`, `public/data/` y `reports/weekly/` a `main`, hace push, y despliega el build a `gh-pages`. El mensaje de estado en el dashboard indica si la publicacion fue exitosa o fallo (sin bloquear el refresh local).

Publicacion manual (si el repo tiene otros cambios sin comitear o quieres controlar el momento exacto):

```bash
git add .
git commit -m "..."
git push origin main
npm run deploy:pages
```

`main` conserva codigo, docs y datos versionados; `gh-pages` publica el build estatico generado desde ese mismo estado.

---

## Multiordenador

El proyecto puede instalarse en varios ordenadores. Cada equipo se identifica con un `device_id` unico.

Ver `docs/10_INSTALACION_MULTIORDENADOR.md` para:
- Instalacion paso a paso en un nuevo equipo
- Asignacion de roles (principal, secundario, solo-dashboard, solo-datos)
- Control de quien puede hacer push a GitHub Pages
- Trazabilidad de origen de reportes y alertas

---

## Estructura del repositorio

```
src/
├── App.jsx, main.jsx, index.css
├── components/layout/       — Header, Footer
├── components/ui/           — NumericInput, MetricCard, Dot, etc.
├── hooks/                   — useAnalysis, usePersistedState
├── lib/                     — formatters, colors, storage, anthropic
└── tools/
    ├── graham-analyzer/     — Herramienta principal (17 archivos)
    ├── macro-radar/         — Indicadores macro (4 archivos)
    └── watchlist/           — Screening semanal (4 archivos)
scripts/
├── weekly-screen.js         — Screening automatico
├── run-mode.js              — Modo once/watch/dashboard
├── alert-dispatcher.js      — Gate anti-duplicados para Telegram por device_role
├── bundle-artifact.js       — Validacion de artifacts
└── run-local-bin.js         — Wrapper de binarios
tests/
├── calcRatios.test.js       — Tests criticos (TSM fixture)
├── classify.test.js
├── formatters.test.js
├── watchlist-screen.test.js
└── fixtures/tsm.json
artifacts/
├── graham_analyzer.jsx      — Standalone para Claude.ai
└── macro_radar.jsx
docs/                        — Documentacion tecnica (15+ archivos)
reports/weekly/              — Reportes de screening historicos
```

---

## Lo que no debe subirse a GitHub

```
.env
.env.local
.env.*
.local_runtime/
node_modules/
dist/
dist-temp/
dev-server.log
dev-server.err.log
data/*.db
data/cache/
*.pid
*.lock
```

---

## Backtesting

El backtesting v2.0 basico ya existe para estrategia Graham defensiva:

```bash
npm run historical:download -- --start 2020-01-01 --end 2026-06-08
npm run backtest:mini
```

La descarga historica usa Stooq si entrega CSV y Yahoo Chart como fallback sin API key. El motor inicial usa fundamentales snapshot como proxy historico, por lo que sirve para validar flujo, reglas y sensibilidad a precio, no como resultado historico definitivo. El plan completo sigue en `docs/12_BACKTESTING_ESTRATEGIAS.md`.

`npm run backtest:mini` tambien genera:

- `backtesting/reports/graham-defensive-mini-report.md`
- `backtesting/reports/graham-defensive-mini-summary.json`
- `backtesting/reports/graham-defensive-mini-trades.csv`
- `backtesting/reports/graham-defensive-mini-equity.csv`
- `public/data/backtesting-summary.json`

La pestaña **Backtesting** del dashboard carga ese ultimo JSON en runtime, separada con `React.lazy` para no inflar el bundle inicial. Actualmente permite seleccionar escenarios Base, Conservador y Paciente generados por el CLI.

Para correr el lote real inicial:

```bash
npm run historical:download -- --tickers SP500 --start 2020-01-01 --end 2026-06-08
npm run backtest:mini -- --universe public-10 --benchmark-ticker SP500
```

`SP500` se normaliza internamente a `^GSPC` para evitar problemas de escape de `^` en PowerShell.

## Export Notion

```bash
npm run notion:export -- --dry-run --limit 25
```

Genera `data/export/notion-watchlist-payload.json`. El envio real requiere `NOTION_TOKEN` y `NOTION_DATABASE_ID` en entorno local; no se versionan ni se imprimen.

---

## Documentacion generada

| Archivo | Descripcion |
|---------|-------------|
| `docs/00_PREFLIGHT_ESTADO_REAL.md` | Estado real verificado del repo |
| `docs/01_PROCESOS_LOCALES_DASHBOARD.md` | Aislamiento de puertos y procesos |
| `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md` | Jerarquia de fuentes de datos |
| `docs/03_DASHBOARD_LOCAL_GITHUB_PAGES.md` | Dashboard local y GitHub Pages |
| `docs/04_PRUEBAS_VALIDACION_OPERATIVA.md` | Guia operativa de comandos |
| `docs/05_BASE_LOCAL_EMPRESAS_INDICES.md` | Propuesta de BD SQLite |
| `docs/06_SCREENING_TABLAS_FILTROS.md` | Tabla principal y filtros |
| `docs/07_INGESTA_EMPRESAS_MANUAL_AUTOMATICA.md` | Flujos de ingesta |
| `docs/08_ALERTAS_LOCAL_TELEGRAM.md` | Sistema de alertas |
| `docs/09_MODO_LOCAL_TIEMPO_REAL.md` | Modo watch y Task Scheduler |
| `docs/10_INSTALACION_MULTIORDENADOR.md` | Multiordenador con device_id |
| `docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md` | GitHub sin CI/CD |
| `docs/12_BACKTESTING_ESTRATEGIAS.md` | Plan de backtesting |
| `docs/13_ROADMAP_NOTION_READY.md` | Roadmap 20 Epics / 47 Stories |
| `docs/14_PROMPTS_OPERATIVOS.md` | 18 prompts para Claude Code |
| `docs/15_ESTRATEGIA_UNIVERSO_MASIVO_YAHOO.md` | Estrategia de ingesta masiva Yahoo/BMV |
| `CHANGELOG.md` | Historial de cambios |

---

## Troubleshooting

### El dashboard no abre

```bash
# Verificar si el puerto 5173 esta ocupado
netstat -ano | findstr :5173

# Usar puerto alternativo
npm run dev -- --port 5174
```

Si el dashboard estaba marcado como activo pero ya no responde, limpia el PID obsoleto con:

```bash
npm run dev:stop
```

### Los tests fallan en TSM

El test critico TSM con `adrRatio=5` debe producir `P/E ≈7.03`. Si falla, no modificar nada y revisar si se cambio `calcRatios.js` sin actualizacion del fixture.

### El screening no actualiza precios

Stooq puede estar no disponible o con rate limit. El reporte se genera con datos de snapshot. Intentar de nuevo en unos minutos.

### No aparece el analisis IA

`VITE_ANTHROPIC_API_KEY` no esta configurado o la sesion de Claude.ai no esta activa. La app funciona completamente sin IA — solo la interpretacion narrativa no esta disponible.

### Los ratios parecen incorrectos (P/E = 70000)

Verifica que los datos de fundamentales esten en la magnitud correcta (miles vs millones). Ver `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md` seccion "Convencion de magnitudes".
