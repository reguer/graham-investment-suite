# PROMPT PARA CODEX — Ecosistema de Inversión Grahamiano

> Copia este prompt completo como instrucción inicial en Codex.
> Asegúrate de tener el archivo HANDOFF_GRAHAM_ECOSYSTEM.md y graham_analyzer.jsx en el repo.

---

## INSTRUCCIÓN

Eres el desarrollador principal del **Graham Investment Suite**, un ecosistema de análisis financiero basado en Benjamin Graham (Security Analysis + El Inversor Inteligente). El proyecto tiene un MVP funcional como artifact standalone de React (~761 líneas en `graham_analyzer.jsx`) que necesita ser modularizado en una app React completa con Vite.

Lee el archivo `HANDOFF_GRAHAM_ECOSYSTEM.md` que está en la raíz del repositorio. Ese documento es la fuente de verdad de toda la arquitectura, parámetros, decisiones de diseño, bugs y roadmap. No improvises nada que contradiga ese handoff.

## CONTEXTO DEL USUARIO

- Contador-financiero mexicano que opera en bolsa USA y ADRs
- Datos capturados manualmente desde Yahoo Finance
- Comunicación directa, sin rodeos, con base bibliográfica
- Ya tiene un artifact funcional en Claude.ai que es el MVP — tu trabajo es llevarlo a producción

## TAREAS EN ORDEN DE PRIORIDAD

### Tarea 1: Scaffold del repositorio

Crea la estructura modular descrita en la sección 8 del handoff:

```
graham-investment-suite/
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── HANDOFF_GRAHAM_ECOSYSTEM.md
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   ├── formatters.js        # p(), fmt(), fmtM(), pct(), fmtNum()
│   │   ├── storage.js           # wrapper async de window.storage con fallback localStorage
│   │   ├── anthropic.js         # cliente fetch a /v1/messages
│   │   └── colors.js            # AC, ABG, ABR paletas
│   ├── components/ui/
│   │   ├── NumericInput.jsx
│   │   ├── InputField.jsx
│   │   ├── MetricCard.jsx
│   │   ├── Dot.jsx
│   │   └── SectionTitle.jsx
│   ├── tools/graham-analyzer/
│   │   ├── GrahamAnalyzer.jsx   # componente principal con 3 vistas
│   │   ├── AnalysisForm.jsx
│   │   ├── AnalysisResults.jsx
│   │   ├── AnalysisHistory.jsx
│   │   ├── InterpretationPanel.jsx
│   │   ├── EntryPrices.jsx
│   │   ├── calcRatios.js        # lógica pura, sin React
│   │   ├── classify.js          # lógica pura, sin React
│   │   ├── getChecks.js         # checklist de reglas Graham
│   │   ├── constants.js         # EMPTY_FORM, umbrales, alertFor
│   │   ├── prompts.js           # template del prompt IA
│   │   └── prefills.js          # datos demo TSM
│   └── tools/macro-radar/
│       └── MacroRadar.jsx       # placeholder, se migra después
├── tests/
│   ├── calcRatios.test.js
│   ├── classify.test.js
│   └── formatters.test.js
└── artifacts/
    ├── graham_analyzer.jsx      # copia standalone para Claude.ai
    └── macro_radar.jsx          # copia standalone para Claude.ai
```

Dependencias: `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `vitest`.

### Tarea 2: Extraer módulos del MVP

Toma `graham_analyzer.jsx` (el artifact standalone) y extrae:

1. **`src/lib/formatters.js`** — funciones `p()`, `fmt()`, `fmtM()`, `pct()`, `fmtNum()`
2. **`src/lib/colors.js`** — constantes `AC`, `ABG`, `ABR`
3. **`src/lib/storage.js`** — wrapper que intenta `window.storage` (Claude.ai) y cae a `localStorage` como fallback
4. **`src/lib/anthropic.js`** — función `generateAnalysis(prompt)` que llama a la API
5. **`src/tools/graham-analyzer/calcRatios.js`** — función pura, recibe form object, retorna ratios object
6. **`src/tools/graham-analyzer/classify.js`** — función pura, recibe ratios, retorna clasificación
7. **`src/tools/graham-analyzer/getChecks.js`** — función pura, recibe ratios, retorna checklist con pass/fail/label/ref
8. **`src/tools/graham-analyzer/constants.js`** — `EMPTY_FORM`, función `alertFor(id, val)`
9. **`src/tools/graham-analyzer/prompts.js`** — función `buildPrompt(company, ratios, classification)` que retorna el string del prompt
10. **`src/tools/graham-analyzer/prefills.js`** — `prefillTSM` object

### Tarea 3: Escribir tests

Implementa tests con Vitest para las funciones puras:

**`tests/calcRatios.test.js`:**
```javascript
// Caso 1: TSM completo
// - PE debe ser ~31.92 (371 / (10.55 * 5) = 371 / 52.75)
// - PB debe ser ~11.20 (371 / (171799401/25932525 * 5) = 371 / 33.12)
// - PExPB debe ser ~357.5
// - currentRatio debe ser ~2.51
// - TIE debe ser ~166
// - ROE debe ser ~0.3146
// - NCAV debe ser negativo (currentAssets < totalLiabilities... verificar)
// - mosGraham debe ser negativo (precio > fórmula Graham)

// Caso 2: ADR ratio
// - Con adrRatio=1: EPS adj = EPS × 1
// - Con adrRatio=5: EPS adj = EPS × 5, BVPS = equity/shares × 5

// Caso 3: Net Tangible Assets override
// - Si netTangibleAssets = 100000, tangibleEquity = 100000 (ignora intangiblesTotal)
// - Si netTangibleAssets = 0, tangibleEquity = equity - intangiblesTotal

// Caso 4: EPS negativo
// - PE = null
// - grahamFormula = null
// - pricePE15 = null

// Caso 5: Sin gastos por intereses
// - interestExpense = 0, EBIT > 0 → TIE = Infinity

// Caso 6: FCF
// - fcf = operatingCF + investingCF (investing es negativo)
```

**`tests/classify.test.js`:**
```javascript
// Caso 1: APROBADA — PE=12, PB=1.2, PExPB=14.4, debt=0.5, current=2.5, EPS positivo
// Caso 2: EXCELENTE PERO CARA — PE=35, ROE=0.25, ROA=0.10, TIE=20, EPS creciente
// Caso 3: SOBREVALORADA — PE=35, ROE=0.25 pero EPS no creciente
// Caso 4: RECHAZADA — EPS negativo, PE null
// Caso 5: Edge — PE exactamente 20 (aceptable, no ideal)
// Caso 6: Edge — PExPB exactamente 22.5 (pasa)
```

### Tarea 4: Corregir bugs pendientes

1. **P/E con EPS negativo**: En vez de mostrar "—", mostrar "N/A (EPS negativo)" en el MetricCard
2. **Verificar** que TODOS los NumericInput tengan `allowNegative={true}` (ya debería estar como default, confirmar)
3. **FCF**: Verificar que se calcule correctamente como `operatingCF + investingCF` (investing es negativo)

### Tarea 5: Sync de artifacts

Después de modularizar, genera la versión standalone (un solo .jsx) para `artifacts/graham_analyzer.jsx` que siga funcionando como artifact de Claude.ai. Esto puede ser un script que concatene los módulos o simplemente mantener la versión monolítica actualizada manualmente.

## REGLAS DE NEGOCIO CRÍTICAS — No las cambies

```
1. Si netTangibleAssets > 0 → usarlo directo como tangibleEquity
   Si no → tangibleEquity = equity - intangiblesTotal

2. ADR: epsAdj = eps × adrRatio, bvps = (equity/shares) × adrRatio

3. NCAV = (currentAssets - totalLiabilities) / shares × adrRatio

4. TIE = Infinity si interestExpense = 0 y EBIT > 0

5. P/E = null si EPS ≤ 0

6. EPS growing = cada EPS[i] ≤ EPS[i-1] (array ordenado más reciente primero)

7. Clasificación:
   APROBADA = PExPB ≤ 22.5 AND debt < 1 AND current ≥ 2 AND EPS positivo
              AND (PE ≤ 20) AND (PB ≤ 2)
   EXCELENTE PERO CARA = ROE>10% AND ROA>5% AND TIE>5 AND Quick≥1 AND FCF>0
                          AND EPS positivo AND creciente AND PExPB > 22.5
   SOBREVALORADA = financieramente fuerte pero sin crecimiento consistente
   RECHAZADA = default

8. Fórmula Graham = √(22.5 × epsAdj × bvps)
   Versión tangible = √(22.5 × epsAdj × tangibleBvps)

9. Margen seguridad = (grahamFormula - price) / price
```

## DATOS DE PRUEBA — TSM (Taiwan Semiconductor, ADR)

```json
{
  "ticker": "TSM",
  "companyName": "Taiwan Semiconductor Manufacturing",
  "date": "2026-04-17",
  "price": "371.00",
  "totalAssets": "252557864",
  "currentAssets": "121525973",
  "inventory": "9172541",
  "totalLiabilities": "80758462",
  "currentLiabilities": "48469086",
  "equity": "171799401",
  "intangiblesTotal": "7322865",
  "netTangibleAssets": "",
  "sharesOutstanding": "25932525",
  "treasuryShares": "0",
  "revenue": "121268841",
  "grossProfit": "72629545",
  "operatingIncome": "61639465",
  "ebit": "65393986",
  "interestExpense": "393836",
  "netIncome": "54046609",
  "epsTTM": "10.55",
  "eps1": "10.42", "epsYear1": "2025",
  "eps2": "7.11",  "epsYear2": "2024",
  "eps3": "5.15",  "epsYear3": "2023",
  "eps4": "6.24",  "epsYear4": "2022",
  "isADR": true,
  "adrRatio": "5",
  "operatingCF": "72428386",
  "investingCF": "-36434046",
  "financingCF": "-14019249"
}
```

**Resultados esperados de TSM:**
- PE: ~7.04 (371 / 52.75)
- PB: ~2.24 (371 / 165.62)
  - Wait — verificar: BVPS = (171,799,401 / 25,932,525) × 5 = 6.626 × 5 = 33.13... PB = 371 / 33.13 × ... 
  - BVPS = equity / shares × adr = 171799401 / 25932525 × 5 = 33.12 × 5... 
  - Nota: el cálculo real es bvps = (equity/shares) * adr = (171799401/25932525) * 5 = 6.626 * 5 = 33.13
  - Hmm, en la hoja del usuario BVPS = 33.12 y PB = 11.20
  - Esto significa que bvps = equity/shares = 6.626, no multiplicado por ADR
  - Y PE chart = 31.92, que sería 371 / 11.62 (EPS sin multiplicar)
  - VERIFICAR la lógica ADR en calcRatios — la hoja del usuario sugiere que NO multiplica por ADR ratio

**IMPORTANTE: Verificar con el handoff y el código fuente cuál es la lógica correcta de ADR. La hoja del usuario muestra EPS=11.66 sin ajuste ADR y PE=31.92, lo cual contradice la multiplicación. Revisar `calcRatios.js` para confirmar.**

## ESTILO DE CÓDIGO

- React funcional con hooks (useState, useEffect, useCallback, useRef)
- Funciones puras para lógica (calcRatios, classify, getChecks) — sin React
- Inline styles en componentes (mantener consistencia con MVP)
- Español en UI, inglés en código (variables, funciones, comments)
- Monospace (IBM Plex Mono) para datos, sans-serif (Instrument Sans) para UI

## AL TERMINAR

1. `npm test` debe pasar todos los tests
2. `npm run dev` debe levantar la app funcional
3. La versión standalone en `artifacts/graham_analyzer.jsx` debe seguir funcionando en Claude.ai
4. Haz commit con: `feat(scaffold): modularize MVP into production React app`
