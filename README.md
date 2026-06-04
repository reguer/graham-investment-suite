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
| Stack | React 18.3 + Vite 5.4 + Vitest 2.0 + Node.js |
| Tests | 4 suites — `npm test` |
| Build | `npm run build` |
| Dashboard local | `npm run dev` → localhost:5173 |
| Base de datos | No implementada (localStorage) |
| Alertas automaticas | Solo reporte Markdown semanal |
| Scheduler local | No configurado |

---

## Instalacion

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

# Alertas Telegram (opcional)
ENABLE_TELEGRAM_ALERTS=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## Desarrollo — Dashboard local

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

Si el puerto 5173 esta ocupado por otro proyecto:

```bash
npm run dev -- --port 5174
```

Ver `docs/01_PROCESOS_LOCALES_DASHBOARD.md` para el manejo de puertos y procesos locales.

---

## Pruebas y build

```bash
npm test               # Correr las 4 suites de tests
npm run test:watch     # Modo watch de tests
npm run build          # Build para produccion / GitHub Pages
npm run build:artifact # Validar y regenerar artifacts standalone
npm run weekly:screen  # Screening semanal + reporte Markdown
npm run universe:refresh # Precios Yahoo para el universo masivo
```

---

## Datos

Los datos se capturan manualmente desde Yahoo Finance: Balance Sheet, Income Statement, Cash Flow, EPS TTM, Shares Outstanding, Net Tangible Assets o Goodwill + Intangibles y ADR ratio cuando aplique.

**Yahoo Finance es la fuente principal** de datos fundamentales. Stooq se usa automaticamente para precios spot en el screening semanal.

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

`npm run weekly:screen` actualiza precios desde Stooq cuando esta disponible, recalcula la watchlist y genera `reports/weekly/YYYY-MM-DD.md`.

El universo inicial incluye el lote solicitado por el usuario y 200 acciones BMV/SIC validadas por Yahoo Finance Search con simbolo `.MX`. Las empresas sin fundamentales quedan como `Pendiente de primer analisis`; no se calculan ratios Graham hasta tener captura manual o extraccion fundamental validada.

**Horario operativo requerido: cierre de vela diaria a las 18:00 hrs CDMX.**

Los lunes y viernes se generan alertas formales. El sistema puede actualizar datos en cualquier momento que el ordenador este encendido.

Para automatizar la ejecucion al cierre diario, ver `docs/09_MODO_LOCAL_TIEMPO_REAL.md`.

---

## GitHub Pages

La app publica esta disponible en https://reguer.github.io/graham-investment-suite/

El mecanismo de deploy local (sin GitHub Actions) esta documentado en `docs/03_DASHBOARD_LOCAL_GITHUB_PAGES.md` y `docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md`.

**El deploy nunca debe hacerse por workflows remotos** — siempre desde el equipo local autorizado.

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

El sistema de backtesting no esta implementado aun. El plan completo esta en `docs/12_BACKTESTING_ESTRATEGIAS.md`.

Las 8 estrategias propuestas incluyen: Graham defensivo puro, precio objetivo, margen de seguridad, tendencia fuerte, mixta, alertas lunes/viernes, entrada por watchlist y espera de condicion completa.

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

### Los tests fallan en TSM

El test critico TSM con `adrRatio=5` debe producir `P/E ≈7.03`. Si falla, no modificar nada y revisar si se cambio `calcRatios.js` sin actualizacion del fixture.

### El screening no actualiza precios

Stooq puede estar no disponible o con rate limit. El reporte se genera con datos de snapshot. Intentar de nuevo en unos minutos.

### No aparece el analisis IA

`VITE_ANTHROPIC_API_KEY` no esta configurado o la sesion de Claude.ai no esta activa. La app funciona completamente sin IA — solo la interpretacion narrativa no esta disponible.

### Los ratios parecen incorrectos (P/E = 70000)

Verifica que los datos de fundamentales esten en la magnitud correcta (miles vs millones). Ver `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md` seccion "Convencion de magnitudes".
