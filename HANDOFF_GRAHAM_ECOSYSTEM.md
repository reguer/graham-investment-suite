# HANDOFF — Ecosistema de Inversión Grahamiano

> Documento de transferencia para retomar desarrollo en Claude Code / Codex.
> Versión: 1.3 · Fecha: 2 junio 2026

---

## 1. VISIÓN DEL PROYECTO

Un ecosistema completo de herramientas de análisis financiero basado estrictamente en los principios de Benjamin Graham, construido como aplicaciones React standalone que se comunican con la API de Anthropic (Claude Sonnet) para interpretaciones contextuales.

**Marco teórico:** "Security Analysis" (Graham & Dodd, 6ta Ed.) + "El Inversor Inteligente" (Cap. 14 y 20 principalmente).

**Usuario objetivo:** Contador-financiero mexicano que opera en bolsa USA y ADRs. Flujo de datos desde Yahoo Finance, captura manual. Necesita lectura directa sin rodeos y con base bibliográfica.

---

## 2. ESTADO ACTUAL — Componentes existentes

### 2.1 `graham_analyzer.jsx` — Asistente Grahamiano (v1.3, ~761 líneas)

Analizador individual de acciones con flujo: input datos Yahoo Finance → cálculo automático de ratios → semáforos → clasificación → interpretación por reglas + IA.

**Vistas:**
- **Input:** Formulario con campos de Balance, Estado de Resultados, EPS histórico, Cash Flow, ADR toggle, sección de ajuste tangible
- **Results:** Dashboard con 6 secciones numeradas (Valuación, Fortaleza, Rentabilidad, EPS, Precios Graham, Interpretación)
- **History:** Lista de análisis persistidos (max 50)

**Features implementados:**
- Formato numérico con comas (252,557,864) en todos los inputs — `NumericInput` component
- Todos los campos numéricos aceptan negativos (`allowNegative = true` por default)
- Ajuste de valor contable tangible con dos opciones: campo combinado "Goodwill + Intangibles" O override directo "Net Tangible Assets"
- Soporte ADR/ADS con ratio configurable (ajusta EPS y BV por acción)
- Persistencia via `window.storage` API (key: `graham-analyzer:companies`)
- Análisis con IA via Anthropic API (`claude-sonnet-4-20250514`)
- Demo prefill con datos reales de TSM (Taiwan Semiconductor)

### 2.2 `macro_radar.jsx` — Radar Macroeconómico (~508 líneas)

Dashboard de indicadores macroeconómicos México/USA con semáforos, tendencias, y análisis IA del contexto macro para decisiones de timing.

**Indicadores:** PMI manufactura (US/MX), curva de rendimiento, CPI/INPC, desempleo, confianza consumidor.

---

## 3. ARQUITECTURA TÉCNICA

### 3.1 Stack

```
Framework:     React (hooks: useState, useEffect, useCallback, useRef)
Styling:       Inline styles (no Tailwind, no CSS modules)
Fonts:         IBM Plex Mono (datos/monospace), Instrument Sans (UI) — via Google Fonts
Theme:         Dark (#060911 base), terminal-financial aesthetic
State:         React state local + window.storage para persistencia cross-session
API:           Anthropic /v1/messages (claude-sonnet-4-20250514, max_tokens: 1000)
Deployment:    Claude.ai artifacts (.jsx) — single-file React components con default export
```

### 3.2 Patrón de diseño

```
┌─────────────────────────────────────────────────────┐
│  EMPTY_FORM (schema)                                │
│  ↓                                                  │
│  Form State (useState) ←→ NumericInput components   │
│  ↓                                                  │
│  calcRatios(form) → ratios object                   │
│  ↓                                                  │
│  classify(ratios) → classification label/color      │
│  getChecks(ratios) → checklist pass/fail por regla  │
│  ↓                                                  │
│  Results View (MetricCard grid + semáforos)          │
│  ↓                                                  │
│  generateAI() → prompt con datos → API Anthropic    │
│  ↓                                                  │
│  Interpretación narrativa (IA)                      │
│  ↓                                                  │
│  Persistencia → window.storage.set()                │
└─────────────────────────────────────────────────────┘
```

### 3.3 Data Schema — `EMPTY_FORM`

```javascript
{
  // Identificación
  ticker: "",              // "TSM", "BABA", "AAPL"
  companyName: "",         // Nombre completo
  date: "",                // YYYY-MM-DD fecha de análisis
  price: "",               // Precio de mercado (USD)

  // Balance Sheet (en miles o unidades según reporte)
  totalAssets: "",
  currentAssets: "",
  inventory: "",
  nonCurrentAssets: "",
  totalLiabilities: "",
  currentLiabilities: "",
  nonCurrentLiabilities: "",
  equity: "",              // Patrimonio Neto / Stockholders' Equity
  intangiblesTotal: "",    // Goodwill + Other Intangible Assets (combinado)
  netTangibleAssets: "",   // Override: Net Tangible Assets directo de Yahoo Finance
  sharesOutstanding: "",
  treasuryShares: "",

  // Income Statement
  revenue: "",
  grossProfit: "",
  operatingIncome: "",
  ebit: "",
  interestExpense: "",
  netIncome: "",
  epsTTM: "",              // Diluted EPS trailing twelve months

  // EPS History (más reciente primero)
  eps1: "", epsYear1: "2025",
  eps2: "", epsYear2: "2024",
  eps3: "", epsYear3: "2023",
  eps4: "", epsYear4: "2022",
  eps5: "", epsYear5: "2021",

  // Cash Flow
  operatingCF: "",
  investingCF: "",         // Típicamente negativo
  financingCF: "",         // Típicamente negativo

  // ADR
  isADR: false,
  adrRatio: "1",           // Acciones locales por ADR (TSM = 5)

  // Meta
  notes: "",
}
```

### 3.4 Ratios calculados — `calcRatios(form)` returns:

```javascript
{
  // Valuación
  pe,                  // Price / EPS(adj por ADR)
  pb,                  // Price / Book Value per share
  pbTangible,          // Price / Tangible BV per share
  pePb,                // PE × PB (regla 22.5)
  pePbTangible,        // PE × PB tangible
  bvps,                // Book value per share
  tangibleBvps,        // Tangible book value per share
  tangibleEquity,      // Patrimonio - intangibles (o NTA directo)

  // Fortaleza
  debtRatio,           // Total Liabilities / Equity
  currentRatio,        // Current Assets / Current Liabilities
  quickRatio,          // (Current Assets - Inventory) / Current Liabilities
  tie,                 // EBIT / Interest Expense (Infinity si no hay intereses)

  // Rentabilidad
  netMargin,           // Net Income / Revenue
  roe,                 // Net Income / Equity
  roa,                 // Net Income / Total Assets

  // Cash Flow
  fcf,                 // Operating CF + Investing CF

  // Graham Entry Prices
  pricePE15,           // EPS × 15
  pricePB15,           // BVPS × 1.5
  pricePB15Tangible,   // Tangible BVPS × 1.5
  grahamFormula,       // √(22.5 × EPS × BVPS)
  grahamFormulaTangible, // √(22.5 × EPS × tangibleBVPS)
  ncav,                // (Current Assets - Total Liabilities) / shares × ADR

  // Margin of Safety
  mosGraham,           // (Graham Formula - Price) / Price
  mosGrahamTangible,   // (Graham Formula Tangible - Price) / Price
  intangibleWeight,    // (Equity - Tangible Equity) / Equity

  // EPS Analysis
  epsHistory,          // Array filtrado de EPS no-zero
  epsGrowing,          // Boolean: tendencia creciente
  epsAllPositive,      // Boolean: todos positivos
  epsCagr,             // CAGR del EPS

  // Helpers
  shares, epsAdj, price, hasIntangibleData
}
```

---

## 4. PARÁMETROS GRAHAM — Tabla de referencia

| Métrica | Ideal | Aceptable | Alerta | Fuente |
|---------|-------|-----------|--------|--------|
| P/E | ≤ 15 | 15–20 | > 20 | Security Analysis Cap. 39 |
| P/B | ≤ 1.5 | 1.5–2 | > 2 | El Inversor Inteligente Cap. 14 |
| P/E × P/B | ≤ 22.5 | 22.5–35 | > 35 | El Inversor Inteligente Cap. 14 |
| Endeudamiento | < 1 | 1–1.5 | > 1.5 | Security Analysis Cap. 42 |
| Ratio Corriente | ≥ 2 | 1.5–2 | < 1.5 | El Inversor Inteligente Cap. 14 |
| Quick Ratio | ≥ 1 | 0.7–1 | < 0.7 | Security Analysis Cap. 43 |
| TIE | > 5 | 3–5 | < 3 | Security Analysis Cap. 8 |
| ROE | > 15% (verde) | 10–15% | < 10% | Security Analysis Cap. 37 |
| ROA | > 5% | 3–5% | < 3% | Security Analysis Cap. 37 |
| Margen Neto | > 15% | 5–15% | < 5% | Contextual por industria |
| FCF | Positivo | — | Negativo | Flujo real de caja |
| Peso intangibles | < 10% | 10–30% | > 30% | Security Analysis Cap. 42 |
| Margen seguridad | > 30% | 0–30% | < 0% | El Inversor Inteligente Cap. 20 |

### Clasificación (4 categorías):

```
APROBADA GRAHAMIANA (verde)
  Requiere: P/E×P/B ≤ 22.5 AND Deuda < 1 AND Corriente ≥ 2 AND EPS positivo
  + P/E ≤ 20 AND P/B ≤ 2

EXCELENTE, PERO CARA (amarillo)
  Requiere: ROE > 10% AND ROA > 5% AND TIE > 5 AND Quick ≥ 1 AND FCF > 0
  + EPS positivo AND creciente
  + P/E×P/B > 22.5

BUENA EMPRESA, SOBREVALORADA (naranja)
  Requiere: Financieramente fuerte pero P/E×P/B > 22.5
  (sin crecimiento consistente de EPS)

RECHAZADA (rojo)
  Default: no cumple criterios mínimos
```

---

## 5. COMPONENTES UI

### NumericInput
Input que almacena valor limpio (sin comas) pero muestra formato con separadores de miles. `allowNegative = true` por default. Usa `fmtNum()` para display y `p()` para parsing.

### MetricCard
Tarjeta de ratio individual con: label, valor grande, semáforo (Dot), sublabel, referencia Graham. Background y border con opacity según alert level.

### Dot
Circulito de 8px con color y glow (`box-shadow`) según alert.

### InputField
Input de texto plano para campos no numéricos (ticker, fecha, años).

### Paleta de colores

```javascript
const AC = {
  green:  "#22c55e",  // Cumple Graham
  yellow: "#eab308",  // Zona aceptable
  red:    "#ef4444",  // Falla
  gray:   "#64748b",  // Sin datos
};
// Backgrounds: opacity 0.07 sobre color base
// Borders: opacity 0.2 sobre color base
```

---

## 6. INTEGRACIÓN API — Prompt de IA

La IA recibe un prompt estructurado con TODOS los datos calculados y genera análisis en 6 secciones:

1. VEREDICTO RÁPIDO (2-3 oraciones)
2. QUÉ DICE GRAHAM (análisis estricto con parámetros)
3. FORTALEZAS
4. RIESGOS Y BANDERAS ROJAS
5. PRECIO DE ENTRADA (rangos Graham normal y tangible)
6. ACCIÓN RECOMENDADA

**System context en el prompt:** "Eres un analista financiero senior especializado en inversión en valor estilo Benjamin Graham. Tu audiencia es un contador-financiero mexicano experimentado."

**Modelo:** `claude-sonnet-4-20250514` / `max_tokens: 1000`

---

## 7. BUGS CONOCIDOS Y PENDIENTES

### Bugs por corregir

| # | Bug | Estado | Prioridad |
|---|-----|--------|-----------|
| 1 | ~~EBIT no permite negativos~~ | Corregido en v1.3 (allowNegative default true) | ✅ |
| 2 | ~~EPS histórico no permite negativos~~ | Corregido en v1.3 | ✅ |
| 3 | ~~Interpretación por reglas sin IA~~ | Fusionada con IA en v1.3 | ✅ |
| 4 | Flujo operativo no permite negativos | Verificar — debería estar corregido con default | 🔍 |
| 5 | P/E muestra null si EPS es negativo (correcto por Graham, pero debería mostrar "N/A — EPS negativo" en vez de "—") | Mejora UX | 🟡 |

### Mejoras pendientes (roadmap)

| # | Feature | Complejidad | Descripción |
|---|---------|-------------|-------------|
| 1 | **Yahoo Finance API / scraper** | Alta | Obtener datos automáticamente en vez de captura manual. Requiere proxy o backend. |
| 2 | **Comparador side-by-side** | Media | Comparar 2-3 empresas con sus ratios en tabla paralela |
| 3 | **Export PDF** | Media | Generar reporte PDF del análisis completo con el análisis IA |
| 4 | **Sector benchmarks** | Media | Contextualizar margen neto y ROE vs mediana del sector |
| 5 | **Watchlist con alertas** | Alta | Monitorear precios de entrada Graham y notificar cuando se acerquen |
| 6 | **Integración macro_radar ↔ graham_analyzer** | Media | Contexto macro visible al analizar una empresa |
| 7 | **EPS chart visual** | Baja | Gráfica de barras del EPS histórico en la sección 4 |
| 8 | **Multi-currency** | Baja | Soporte empresas que reportan en EUR, GBP, JPY, TWD |
| 9 | **Scoring numérico** | Baja | Score 0-100 ponderado además de la clasificación categórica |
| 10 | **Valor contable tangible desglosado** | Baja | Si Yahoo cambia el formato, separar Goodwill / Otros Intangibles / Amortización acumulada |

---

## 8. ESTRUCTURA DE REPOSITORIO PROPUESTA

```
graham-investment-suite/
├── README.md                          # Visión, instalación, uso
├── HANDOFF.md                         # Este documento
├── LICENSE
├── package.json                       # React + deps
│
├── docs/
│   ├── graham-parameters.md           # Tabla completa de parámetros con citas
│   ├── formulas.md                    # Todas las fórmulas con ejemplos
│   ├── classification-logic.md        # Árbol de decisión detallado
│   └── data-sources.md               # Cómo extraer datos de Yahoo Finance paso a paso
│
├── src/
│   ├── App.jsx                        # Router/shell principal con nav entre tools
│   ├── index.css                      # CSS global (variables, fonts, reset)
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── NumericInput.jsx       # Input con formato de comas
│   │   │   ├── InputField.jsx         # Input de texto plano
│   │   │   ├── MetricCard.jsx         # Tarjeta de ratio con semáforo
│   │   │   ├── Dot.jsx                # Indicador circular de semáforo
│   │   │   └── SectionTitle.jsx       # Header de sección
│   │   └── layout/
│   │       ├── Header.jsx             # Nav bar con tabs
│   │       └── Footer.jsx             # Disclaimers y versión
│   │
│   ├── tools/
│   │   ├── graham-analyzer/
│   │   │   ├── GrahamAnalyzer.jsx     # Componente principal
│   │   │   ├── AnalysisForm.jsx       # Vista de input
│   │   │   ├── AnalysisResults.jsx    # Vista de resultados
│   │   │   ├── AnalysisHistory.jsx    # Vista de historial
│   │   │   ├── InterpretationPanel.jsx # Checklist + IA
│   │   │   ├── EntryPrices.jsx        # Precios Graham de entrada
│   │   │   ├── calcRatios.js          # Lógica de cálculo pura
│   │   │   ├── classify.js            # Lógica de clasificación
│   │   │   ├── getChecks.js           # Checklist de reglas Graham
│   │   │   ├── constants.js           # EMPTY_FORM, umbrales, alertFor
│   │   │   ├── prompts.js             # Template del prompt IA
│   │   │   └── prefills.js            # Datos demo (TSM, etc.)
│   │   │
│   │   └── macro-radar/
│   │       ├── MacroRadar.jsx         # Componente principal
│   │       ├── indicators.js          # Template de indicadores
│   │       ├── alertRules.js          # Reglas por indicador
│   │       └── prompts.js             # Prompt IA macro
│   │
│   ├── lib/
│   │   ├── formatters.js             # p(), fmt(), fmtM(), pct(), fmtNum()
│   │   ├── storage.js                # Wrapper window.storage con error handling
│   │   ├── anthropic.js              # Cliente API Anthropic
│   │   └── colors.js                 # AC, ABG, ABR, IC paletas
│   │
│   └── hooks/
│       ├── usePersistedState.js       # useState + window.storage
│       └── useAnalysis.js             # Hook para calcRatios + classify
│
├── tests/
│   ├── calcRatios.test.js             # Unit tests de cálculos
│   ├── classify.test.js               # Tests de clasificación
│   ├── formatters.test.js             # Tests de formateo
│   └── fixtures/
│       ├── tsm.json                   # Datos TSM para tests
│       ├── baba.json                  # Datos BABA
│       └── rejected-company.json      # Empresa rechazada
│
└── artifacts/
    ├── graham_analyzer.jsx            # Versión standalone (Claude.ai artifact)
    └── macro_radar.jsx                # Versión standalone (Claude.ai artifact)
```

---

## 9. PROMPT MAESTRO — Para regenerar el ecosistema completo

> Copiar este prompt en Claude Code o Codex para reconstruir desde cero.

```markdown
# Prompt: Ecosistema de Inversión Grahamiano

Construye un ecosistema de análisis financiero basado en Benjamin Graham
(Security Analysis 6ta Ed. + El Inversor Inteligente).

## Contexto del usuario
- Contador-financiero mexicano, opera en bolsa USA y ADRs
- Datos capturados manualmente desde Yahoo Finance
- Necesita lectura directa, sin rodeos, con base bibliográfica
- Ya tiene un artifact React en Claude.ai que funciona como MVP (ver HANDOFF.md)

## Componentes a construir

### 1. Graham Stock Analyzer (principal)
React app con 3 vistas: Input, Results, History.

**Input:** Formulario que replica datos de Yahoo Finance:
- Balance Sheet: Activos, Pasivos, Patrimonio, Inventarios, Goodwill+Intangibles
  (combinado), Net Tangible Assets (override opcional), Acciones
- Income Statement: Revenue, Gross Profit, Operating Income, EBIT, Interest
  Expense, Net Income, EPS TTM
- EPS History: 5 años (permiten negativos)
- Cash Flow: Operativo, Inversión, Financiamiento
- ADR toggle con ratio configurable
- TODOS los campos numéricos: formato con comas (NumericInput), permiten negativos

**Cálculos automáticos (calcRatios):**
- P/E, P/B, P/B tangible, P/E×P/B, P/E×P/B tangible
- Debt ratio, Current ratio, Quick ratio, TIE
- Net margin, ROE, ROA, FCF
- NCAV/share, Graham formula (√22.5×EPS×BV), versiones tangibles
- Margin of safety, intangible weight, EPS CAGR

**Clasificación (classify):**
- APROBADA GRAHAMIANA: P/E×P/B ≤ 22.5 + Deuda < 1 + Corriente ≥ 2 + EPS positivo
  + P/E ≤ 20 + P/B ≤ 2
- EXCELENTE PERO CARA: financieramente fuerte + EPS creciente + P/E×P/B > 22.5
- BUENA EMPRESA SOBREVALORADA: fuerte pero sin crecimiento consistente
- RECHAZADA: default

**Results:** Dashboard con 6 secciones:
1. Valuación (P/E, P/B, regla 22.5, MoS) + subsección tangible si aplica
2. Fortaleza Financiera (debt, current, quick, TIE)
3. Rentabilidad (margin, ROE, ROA, FCF)
4. Consistencia EPS (histórico visual + tendencia + CAGR)
5. Precios de Entrada Graham (P/E 15, P/B 1.5, fórmula, NCAV, tangibles)
6. Interpretación (checklist pass/fail + análisis IA con Claude Sonnet)

**IA:** Prompt estructurado con todos los datos → análisis en 6 puntos
(veredicto, Graham dice, fortalezas, riesgos, precio entrada, acción).
Modelo: claude-sonnet-4-20250514, max_tokens: 1000.

**Persistencia:** window.storage API, key "graham-analyzer:companies", max 50.

### 2. Macro Radar (companion)
Dashboard de indicadores macro México/USA:
PMI, curva rendimiento, inflación, desempleo, confianza consumidor.
Semáforos + tendencias + análisis IA del contexto macro.

### Design System
- Theme: Dark terminal-financial (#060911 base)
- Fonts: IBM Plex Mono (datos), Instrument Sans (UI)
- Semáforos: verde (#22c55e), amarillo (#eab308), rojo (#ef4444), gris (#64748b)
- MetricCard con background opacity por alert level
- Animaciones: fadeIn, pulse para loading

## Parámetros Graham completos
[Ver tabla de parámetros en sección 4 de HANDOFF.md]

## Reglas de negocio
- Si Net Tangible Assets está lleno, usarlo directo como patrimonio tangible
- Si no, calcular como Patrimonio - Intangibles Total
- ADR: multiplicar EPS y BV per share por adrRatio
- NCAV = (Current Assets - Total Liabilities) / shares × ADR ratio
- TIE = Infinity si interest expense = 0 y EBIT > 0
- P/E = null si EPS ≤ 0 (no tiene sentido con pérdidas)
- EPS growing = cada año ≤ anterior (array ordenado más reciente primero)

## Datos de prueba (TSM)
Ticker: TSM, Taiwan Semiconductor, 2026-04-17, $371.00
ADR ratio: 5
Balance: Assets 252,557,864 / Current 121,525,973 / Inventory 9,172,541
         Liabilities 80,758,462 / Current Liab 48,469,086
         Equity 171,799,401 / Intangibles 7,322,865
         Shares 25,932,525
Income:  Revenue 121,268,841 / EBIT 65,393,986 / Interest 393,836
         Net Income 54,046,609 / EPS TTM 10.55
EPS:     2025: 10.42 / 2024: 7.11 / 2023: 5.15 / 2022: 6.24
Cash:    Operating 72,428,386 / Investing -36,434,046 / Financing -14,019,249
```

---

## 10. FLUJO DE TRABAJO

### Desarrollo en Claude Code

```bash
# 1. Clonar repo
git clone https://github.com/[user]/graham-investment-suite.git
cd graham-investment-suite

# 2. Instalar dependencias
npm install

# 3. Desarrollo local
npm run dev    # Vite dev server

# 4. Para artifact standalone (Claude.ai):
#    Compilar todo en un solo .jsx y copiar a artifacts/
npm run build:artifact -- --tool=graham-analyzer
```

### Branching

```
main              ← producción (artifacts funcionales)
├── dev           ← desarrollo activo
├── feat/comparador    ← feature: side-by-side
├── feat/yahoo-api     ← feature: scraper automático
├── feat/pdf-export    ← feature: exportar reporte
└── fix/eps-display    ← bugfix
```

### Convención de commits

```
feat(graham): add sector benchmark comparison
fix(input): allow negative EBIT in NumericInput
refactor(calc): extract calcRatios to standalone module
docs(handoff): update architecture after v1.3
```

---

## 11. CONFIGURACIÓN GITHUB

### `.github/workflows/deploy.yml` (ejemplo)

```yaml
name: Build Artifacts
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run build:artifact
      - uses: actions/upload-artifact@v4
        with:
          name: graham-artifacts
          path: artifacts/
```

### `package.json` (base)

```json
{
  "name": "graham-investment-suite",
  "version": "1.3.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "build:artifact": "node scripts/bundle-artifact.js"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

---

## 12. TESTS MÍNIMOS

### `tests/calcRatios.test.js`

```javascript
// Tests críticos que DEBEN pasar:
// 1. TSM con datos demo → PE ~31.92, PB ~11.20, PExPB ~357
// 2. ADR ratio 5 → epsAdj = EPS × 5, bvps = equity/shares × 5
// 3. Net Tangible Assets override → tangibleEquity = NTA (no calcula)
// 4. Intangibles = 0 → hasIntangibleData = false, pbTangible = null
// 5. EPS negativo → PE = null, grahamFormula = null
// 6. Interest = 0, EBIT > 0 → TIE = Infinity
// 7. NCAV formula: (currentAssets - totalLiabilities) / shares × adr
// 8. FCF = operatingCF + investingCF (investingCF es negativo)
```

### `tests/classify.test.js`

```javascript
// 1. Empresa barata + sólida → APROBADA GRAHAMIANA
// 2. Empresa cara + sólida + EPS creciente → EXCELENTE PERO CARA
// 3. Empresa cara + sólida + EPS irregular → BUENA EMPRESA SOBREVALORADA
// 4. Empresa con pérdidas → RECHAZADA
// 5. Edge: PE exactamente 15, PB exactamente 1.5 → APROBADA
// 6. Edge: PE 20.01 → no pasa ni como aceptable
```

---

## 13. DECISIONES DE DISEÑO — Por qué se hizo así

| Decisión | Razón | Referencia |
|----------|-------|------------|
| P/E null si EPS ≤ 0 | Graham: "no tiene sentido pagar un múltiplo sobre pérdidas" | Security Analysis Cap. 39 |
| Intangibles en un solo campo | Yahoo Finance muestra "Goodwill And Other Intangible Assets" combinado; separar es inventar | Feedback usuario |
| NTA como override | Si Yahoo da Net Tangible Assets directo, es más preciso que restar | Feedback usuario |
| ADR ratio multiplica EPS y BV | El ADR representa N acciones locales; el precio refleja el paquete | Security Analysis, ajuste práctico |
| allowNegative = true en todo | Cualquier línea del estado financiero puede ser negativa | Feedback usuario |
| Interpretación fusionada con IA | "Al final siempre lo voy a correr por aquí" — el usuario prefiere un solo análisis IA completo vs reglas estáticas | Feedback usuario |
| Formato comas en inputs | Verificación visual de magnitudes (millones vs miles de millones) sin contar ceros | Feedback usuario |
| Persistencia con window.storage | No requiere backend; funciona en Claude.ai artifacts cross-session | Constraint técnico |
| Prompt en español | Audiencia es contador mexicano; la IA responde en español naturalmente | Contexto usuario |

---

## 14. REFERENCIAS BIBLIOGRÁFICAS

Los parámetros del asistente están respaldados por estas fuentes específicas:

1. **Graham, B. & Dodd, D.** — *Security Analysis* (6ta Ed.)
   - Cap. 8: Cobertura de intereses (TIE)
   - Cap. 37: Análisis de la cuenta de resultados, earning power, ROE/ROA
   - Cap. 39: Relación precio-beneficio (P/E), multiplicadores
   - Cap. 42: Importancia del valor contable, activos tangibles vs intangibles
   - Cap. 43: Análisis del capital circulante, liquidez (current/quick ratio)

2. **Graham, B.** — *El Inversor Inteligente*
   - Cap. 14: Selección de acciones para el inversor defensivo (regla P/E×P/B ≤ 22.5, current ratio ≥ 2, EPS estable)
   - Cap. 20: Margen de seguridad como concepto central

3. **Fórmula Graham** — √(22.5 × EPS × Book Value per share)
   - Derivada de P/E ≤ 15 × P/B ≤ 1.5 = 22.5 como producto máximo

---

## 15. CONTACTO Y CONTEXTO

- **Proyecto Claude.ai:** Contiene `graham_analyzer.jsx` y `macro_radar.jsx` como project files
- **Memory configurada:** Claude recuerda los parámetros Graham del usuario en cualquier conversación
- **Estilo de comunicación:** Directo, sin maquillar, con humor ocasional, base bibliográfica
- **Ecosistema relacionado:** El usuario también tiene una plantilla Excel para Yahoo Finance que es la fuente de datos

---

*Generado desde sesión de trabajo en Claude.ai · Junio 2026*
*Asistente Grahamiano v1.3 · "El precio es lo que pagas, el valor es lo que obtienes."*
