# ANALYSIS.md

> Diagnóstico de arquitectura y deuda técnica — Graham Investment Suite (Graham Analyzer).
> Sesión de **solo diagnóstico**. No se genera código de solución.
> Fecha: 2026-06-11. Estado consolidado de los dos directorios.

---

## Directorios encontrados y estado de acceso

| Directorio | Ruta | Acceso | Git | Rol |
|---|---|---|---|---|
| **CANÓNICO** | `C:\00_Apps_Locales\GrahamAnalizer` | ✅ Accesible | Repo git, remoto GitHub | Fuente de verdad |
| **SECUNDARIO** | `G:\Mi unidad\00. APPS\GrahamAnalizer` | ✅ Accesible | Repo git, **mismo remoto** | Copia de respaldo en Google Drive |

**Hallazgo central de la Fase 0:** los dos directorios son **el mismo repositorio git** apuntando al mismo remoto. No hay divergencia real.

- **C:** está en `HEAD = 2cb21ae`, `On branch main`, **up to date with `origin/main`**.
- **G:** está en `HEAD = fb5cecb`, que es un **ancestro lineal directo** de C (`git merge-base --is-ancestor fb5cecb HEAD` → verdadero). G está **13 commits atrás**, no divergente.

G solo tiene en su working tree: un `ANALYSIS.md` sin trackear (salida de una corrida previa de este mismo análisis) y un archivo temporal borrado (`vite.config.js.tmp...`). **No hay ningún cambio valioso sin consolidar en G.**

---

## Diferencias entre C:\ y G:\ (tabla por archivo)

Todas las diferencias de contenido se explican por una sola causa: **G está en un commit más viejo**, por lo que cada archivo compartido tiene la versión histórica anterior. No hay un solo archivo donde G tenga trabajo que C no tenga.

| Categoría | Archivos | Clasificación |
|---|---|---|
| Código fuente (`src/**`, `scripts/**`, `backtesting/**`) que difiere | ~40 archivos `.js/.jsx` | **C_GANA** (G = versión vieja del mismo archivo) |
| Docs (`docs/**`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`, `HANDOFF*`) | ~20 archivos | **C_GANA** |
| Datos (`data/public/companies.json`, `public/data/*`, reportes semanales) | varios | **C_GANA** (universo 343 vs versión previa) |
| Solo en **C:** `reports/weekly/2026-06-11.md`, caches `*-2026-06-11.json`, CSVs históricos nuevos (AIG, ALLY, GM, KHC, PRU, SYF, VICI, ZION…), `PLAN.md`, `data/export/`, `.local_runtime/weekly-pipeline-last.json` | nuevos en C | **C_GANA** (no existen en G) |
| Solo en **G:** `ANALYSIS.md` (corrida previa), `.github/` (carpeta **vacía**, sin archivos), `dev-server.log`, `dev-server.err.log`, `dist-temp/`, `node_modules.partial-*`, `.local_node_modules.partial-*`, caches viejos (`*-2026-06-04/05/06/08.json`) | basura / artefactos | **IGNORAR** (sin valor) |

**Resultado de la clasificación: C_GANA en el 100% de los archivos. Ningún DIVERGENTE. Ningún G_GANA.**

> Nota: `git status` del entorno mostró al inicio `?? env.local`. El archivo real en disco es `.env.local` (con punto), correctamente **ignorado** por git (`.gitignore: .env.*`). No hay fuga de secretos.

---

## Plan de consolidación (qué copiar, fusionar o ignorar)

Como G es un ancestro estricto de C, **no se requiere fusión manual ni copia archivo por archivo**. El plan es trivial y de bajo riesgo:

1. **Copiar de G → C:** nada. G no aporta ningún cambio.
2. **Fusionar manualmente (DIVERGENTE):** nada. No hay divergencia.
3. **Acción recomendada sobre G** (a confirmar con el usuario, **no ejecutada**):
   - Opción A (recomendada): poner G al día con `git fetch && git reset --hard origin/main` (o `git pull`) para que ambos coincidan. Antes, borrar/relocalizar el `ANALYSIS.md` previo de G si se desea conservar.
   - Opción B: tratar G como respaldo desechable y dejar de usarlo como working tree.
4. **Limpieza sugerida en G** (artefactos sin valor): `node_modules.partial-*`, `.local_node_modules.partial-*`, `dist-temp/`, `dev-server.log`, `dev-server.err.log`, caches `*-2026-06-04..08.json`.
5. **Limpieza sugerida en C** (duplicados con sufijo de copia): `HANDOFF_GRAHAM_ECOSYSTEM (1).md` y `PROMPT_CODEX (1).md` parecen copias accidentales de sus homónimos sin `(1)`.

> ⚠️ El working tree de C tiene 3 archivos modificados sin commitear (`data/public/companies.json`, `public/data/companies.json`, `reports/weekly/2026-06-11.md`) y 2 sin trackear (`PLAN.md`, y `.env.local`). Conviene commitearlos o revisarlos antes de tocar G.

---

## Remoto GitHub y estado del repositorio

- **Remoto:** `origin → https://github.com/reguer/graham-investment-suite.git` (fetch y push).
- **Rama activa:** `main`. **Sin commits pendientes de push** (up to date con `origin/main`).
- **Últimos commits relevantes:** `2cb21ae` backtest 2022+, `7bf1f24` watchlist clickable + scheduler, `d359a60` equity negativo/sectores/pipeline Windows, `1998639` universo 343 + fallback SEC EDGAR.
- Historia muestra integración previa de trabajo de **Codex** y **Claude** (`a21ab63 merge: integrar trabajo Codex (919e437) con fixes Claude`).
- **Cambios locales sin commitear en C:** 3 modificados + 2 sin trackear (ver arriba).

---

## Stack y arquitectura

**Stack (idéntico en package.json de ambos; C es la versión vigente):**

- **Runtime:** Node `>=22` (ESM, `"type": "module"`).
- **Frontend:** React `^18.3.0` + React-DOM, bundler **Vite `^5.4.0`** (`@vitejs/plugin-react`).
- **Datos de mercado:** `yahoo-finance2 ^3.15.2`.
- **Tests:** **Vitest `^2.0.0`** (159 tests, 39 archivos — todos en verde).
- **Wrapper de ejecución:** todo pasa por `scripts/run-node22.js` → `scripts/run-local-bin.js` (gateo de versión de Node y resolución de binarios locales en Windows).
- **IA:** integración Anthropic directa vía `fetch` (`src/lib/anthropic.js`).
- **Persistencia opcional:** Postgres vía `scripts/db-client.js` / `db-setup.js` (no requerido por la UI).

**Arquitectura y flujo de datos (de punta a punta):**

1. **Captura.** Dos vías: (a) formulario manual `AnalysisForm.jsx` (datos copiados de Yahoo), (b) ingesta automatizada por scripts (`data-ingestion.js`, `refresh-universe.js`, `sync-universe.js`, `update-fundamentals.js`).
2. **Fuente automatizada.** `yahooFundamentals.js` (quoteSummary + fundamentalsTimeSeries con conversión FX) y `secFundamentals.js` (fallback SEC EDGAR) producen *snapshots* normalizados que se persisten en `data/public/companies.json` → publicado a `public/data/companies.json` / `dist/`.
3. **Cálculo (núcleo Graham).** `calcRatios.js` transforma el formulario en ratios; `classify.js` clasifica; `getChecks.js` arma los 10 criterios. Orquestado por el hook `useAnalysis.js` (memoizado).
4. **Screening masivo.** `watchlist/screen.js` aplica el mismo `classify` a los 343 candidatos del universo (`buildWatchlist` → `evaluateCandidate` → `summarizeScreen`).
5. **UI.** `App.jsx` enruta entre **GrahamAnalyzer**, **Watchlist**, **BacktestingResults** y **MacroRadar** (companion). `GrahamAnalyzer.jsx` tiene vistas Input / Results / Candidatas / History.
6. **Estado de UI.** `usePersistedState.js` (historial en `localStorage`, máx. 50). Sin backend para la UI: corre standalone sobre JSON estáticos.

**Configuración:** `.env.example` (plantilla), `.env.local` (real, gitignored), `vite.config.js`, `vitest.config.js`. Esquema DB en `data/schema.sql`. Artifact standalone en `artifacts/graham_analyzer.jsx` (requisito de CLAUDE.md: mantener `export default` funcional).

---

## Fuentes de datos y campos extraídos

**Fuentes:**

1. **Yahoo Finance** (principal) — `yahooFundamentals.js`:
   - `quoteSummary` módulos `price, summaryDetail, defaultKeyStatistics, financialData` (snapshot suplementario).
   - `fundamentalsTimeSeries` anual (snapshot profundo, hasta 6 años) con **conversión FX** validada (`fetchYahooFxRate`, par directo + inverso).
   - Validación de moneda (`validateFundamentalCurrency`, exige USD) y de magnitud (`detectMagnitudeWarning`).
2. **SEC EDGAR** (fallback) — `secFundamentals.js`.
3. **Captura manual** — formulario `AnalysisForm.jsx`.
4. **Precios históricos** — `download-historical-prices.js` → CSVs en `backtesting/data/historical/`.

**Campos extraídos / calculados:** `price`, `trailingPE`, `priceToBook`, `currentRatio`, `quickRatio`, `debtToEquity` (→ `debtRatio = d/e ÷ 100`), `freeCashflow`, `trailingEps`, `bookValue`, `returnOnEquity`, `returnOnAssets`, balance completo (`totalAssets`, `currentAssets`, `inventory`, `totalLiabilities`, `currentLiabilities`, `stockholdersEquity`, `netTangibleAssets`), `EBIT`, `interestExpense`, `netIncome`, `operatingCashFlow`, `investingCashFlow`, `dilutedEPS/basicEPS` (historial 5 años), `dilutedAverageShares`.

**Validación y robustez:**
- ✅ TTM vs anual **se distingue**: `trailingPE/trailingEps` (TTM) para valuación; `fundamentalsTimeSeries` anual para historial EPS y balance.
- ✅ Manejo de **ADR**: ajuste por `adrRatio` en EPS, BVPS, TBVPS y NCAV (requisito crítico de CLAUDE.md, presente en `calcRatios.js`).
- ✅ Manejo de **equity negativo**: P/B se anula, se evalúa por P/E + currentRatio.
- ✅ Validación de moneda y FX antes de calcular.
- ✅ `div()` evita división por cero y propaga `null` controlado.
- ✅ Rate limiting: cliente Yahoo con `queue: { concurrency: 2, interval: 250 }`.
- 🔶 **Reintentos/timeouts**: el cliente Yahoo limita concurrencia pero **no hay retry/backoff explícito** ni `timeout` configurado; un fallo de red lanza excepción directa.
- 🔶 Snapshot suplementario marca explícitamente que **Yahoo no entrega historial EPS completo**, por lo que nunca aprueba Graham defensivo sin validación manual (diseño correcto, pero limita la automatización).

---

## Criterios Graham implementados

**`getChecks.js` — 10 criterios defensivos** (con referencias a Security Analysis / El Inversor Inteligente):

| # | Criterio | Umbral | Canónico Graham |
|---|---|---|---|
| 1 | P/E ≤ 20 | 20 | ✅ (ideal ≤15) |
| 2 | P/B ≤ 2 | 2 | ✅ (ideal ≤1.5) |
| 3 | P/E × P/B ≤ 22.5 | 22.5 | ✅ (regla 15×1.5) |
| 4 | Pasivos/patrimonio < 1 | 1 | ✅ |
| 5 | Current ratio ≥ 2 | 2 | ✅ |
| 6 | Quick ratio ≥ 1 | 1 | ✅ |
| 7 | Cobertura de intereses (TIE) > 5 | 5 | ✅ |
| 8 | FCF positivo | >0 | ✅ (Operating CF + Investing CF) |
| 9 | EPS histórico positivo | todos >0 | ✅ |
| 10 | EPS creciente (reciente→antiguo) | monótono | ✅ |

**Scoring / clasificación (`classify.js`):** no es un puntaje numérico sino una clasificación categórica:
- `graham_approved` (APROBADA): P/E×P/B ≤22.5 **y** debtRatio<1 **y** currentRatio≥2 **y** epsAllPositive **y** P/E≤20 **y** P/B≤2.
- `excellent_expensive` (EXCELENTE PERO CARA): empresa fuerte (`isStrongCompany`: ROE>0.1, ROA>0.05, TIE>5, quick≥1, FCF>0) fuera de rango + EPS creciente.
- `good_overvalued` (BUENA, SOBREVALORADA): fuerte pero EPS no creciente.
- `rejected` (RECHAZADA).

**Valor intrínseco:**
- ✅ **Graham Number** implementado: `grahamPrice = √(22.5 × EPS × BVPS)` (también versión tangible). Margen de seguridad `mosGraham = (grahamFormula − price)/price`.
- ✅ Precios de entrada: `pricePE15 = EPS×15`, `pricePB15 = BVPS×1.5`, `maxDefensivePrice = min(grahamFormula, P/E20, P/B2)` (en screen).
- ✅ **NCAV** calculado (`(currentAssets − totalLiabilities)/shares × adrRatio`).
- ❌ **La fórmula de crecimiento `V = EPS × (8.5 + 2g)` NO está implementada** en el código (búsqueda de `8.5`/`intrinsic`/`2g` sin resultados en `src/`). Solo existe en la referencia del prompt/CLAUDE.md. Esta es la brecha principal del EPIC 3.

> El test de regresión canónico (TSM con ADR ratio 5) está cubierto por `tests/fixtures/tsm.json` y `calcRatios.test.js` (en verde), validando el ajuste ADR exigido por CLAUDE.md.

---

## Estado de la UI y botones rotos

**Componentes del dashboard:** App (router de herramientas), Header/Footer, GrahamAnalyzer (Input/Results/Candidatas/History), AnalysisForm, AnalysisResults, AnalysisHistory, CandidatePanel, CandidateAnalysis, EntryPrices, InterpretationPanel, Watchlist, BacktestingResults, MacroRadar, y UI base (MetricCard, NumericInput, InputField, Dot, SectionTitle).

**Botones / acciones — todos cableados, ninguno roto:**

| Acción | Handler | Estado |
|---|---|---|
| Cambio de vista (Input/Results/Candidatas/History) | `setView` | ✅ |
| Analizar | `onAnalyze → setView("results")` | ✅ |
| Prefill / Reset | `onPrefill` / `onReset` | ✅ |
| Guardar análisis | `onSave → saveAnalysis` (localStorage, máx 50) | ✅ |
| Solicitar análisis IA | `onRequestAI → requestAI` (Anthropic) | ✅ con loading/error |
| Cargar / limpiar historial | `onLoad` / `onClear` | ✅ |
| Watchlist clickable → captura manual | `manualDraft` → `useEffect` precarga form | ✅ |

**Estados de carga/error/vacío:** ✅ bien implementados:
- Vista Results sin datos → tarjeta "Sin datos para mostrar resultados".
- IA → `aiLoading` / `aiError`.
- Toast de guardado con auto-dismiss (2.2s).
- Equity negativo → banner explicativo, P/B = "N/A".
- P/E con EPS≤0 → "N/A (EPS negativo)".
- Captura de ticker inexistente: el formulario es tolerante (campos numéricos robustos vía `NumericInput`); el screening automático degrada a "DATOS INSUFICIENTES / PENDIENTE DE ANÁLISIS" sin romper.

---

## Bugs confirmados

1. **`null` de EPS se renderiza como "NO"** — [AnalysisResults.jsx:81-82](src/tools/graham-analyzer/AnalysisResults.jsx#L81-L82). `epsGrowing`/`epsAllPositive` pueden ser `null` (datos insuficientes, contrato explícito de `calcRatios.js`), pero `ratios.epsGrowing ? "SI" : "NO"` pinta **"NO" en rojo** ante ausencia de datos → falso negativo visual. Debería distinguir `null` → "—/Sin datos".
2. **`intangibleWeight` null pinta verde engañoso** — [AnalysisResults.jsx:49](src/tools/graham-analyzer/AnalysisResults.jsx#L49). `ratios.intangibleWeight < 0.1` con `intangibleWeight === null` evalúa `null < 0.1 === true` → tarjeta verde aunque no haya dato.
3. **Modelo Anthropic obsoleto** — [anthropic.js:19](src/lib/anthropic.js#L19). Usa `model: "claude-sonnet-4-20250514"`. Los modelos vigentes son `claude-sonnet-4-6` / `claude-opus-4-8`; el ID fijado es antiguo y conviene actualizarlo (verificar contra la doc de la API).
4. **Sin retry/timeout en llamadas Yahoo** — `yahooFundamentals.js`. Un fallo transitorio de red lanza excepción sin reintento ni timeout configurable (riesgo de confiabilidad en ingesta masiva).

> No se detectaron botones desconectados, handlers fantasma ni división por cero sin proteger en el núcleo de cálculo.

---

## Tareas fantasma (código incompleto o abandonado)

El código del canónico está **notablemente limpio**:

- ✅ **0 marcadores** `TODO / FIXME / HACK / XXX / @deprecated / WIP` en `src/**` y `scripts/**`.
- ✅ **Sin archivos `_old / _backup / _v2 / copy_of`** en C. (En G sí hay artefactos: `node_modules.partial-*`, `dist-temp/`, `*.tmp...`).
- 🔶 **Archivos duplicados con sufijo `(1)`** en C: `HANDOFF_GRAHAM_ECOSYSTEM (1).md` y `PROMPT_CODEX (1).md` — copias accidentales (probable arrastre de Google Drive). Candidatos a borrar.
- 🔶 **`MacroRadar`** queda como *companion* preparado pero no es prioridad (CLAUDE.md lo declara así explícitamente: "Macro Radar queda preparado como companion hasta migrar el artifact original").
- ✅ **Tests:** 159/159 en verde, ningún test vacío ni skipped detectado. Existe stub de `yahoo-finance2` (`src/__stubs__/`) para entorno local de tests.

---

## Epics y stories con estado

| Epic | Estado | Notas (archivo:línea para 🔶/🐛/❌) |
|---|---|---|
| **0 — Consolidación de directorios** | ✅ Completo (diagnóstico) | C es fuente de verdad; G es ancestro sin cambios. Solo falta ejecutar la limpieza/sync de G (acción del usuario). |
| **1 — Extracción de datos financieros** | 🔶 Parcial | Yahoo + SEC + FX + validación funcionan. Falta retry/timeout (`yahooFundamentals.js`). Snapshot Yahoo no trae historial EPS completo. |
| **2 — Criterios Graham** | ✅ Completo | 10 criterios en `getChecks.js`, umbrales canónicos correctos. |
| **3 — Valor intrínseco** | 🔶 Parcial | Graham Number + NCAV + precios de entrada ✅. Falta fórmula de crecimiento `V = EPS×(8.5+2g)` ❌ (no existe en `src/`). |
| **4 — Diversificación por sector** | 🔶 Parcial | Financieras/seguros/REIT y equity negativo manejados (`screen.js:7-12,62-72`). Sin tratamiento específico para **utilities, tech (intangibles), healthcare** → se evalúan con umbrales industriales (current≥2, debt<1) que fallan estructuralmente. |
| **5 — Dashboard y visualización** | ✅ Completo | UI completa con estados; bugs menores de render `null` (ver Bugs 1-2). |
| **6 — Captura y validación de input** | ✅ Completo | `NumericInput` robusto, prefills, captura manual desde Watchlist. |
| **7 — Manejo de errores y estados UI** | ✅ Completo | Loading/error/vacío + banners equity negativo/EPS≤0. |
| **8 — Persistencia / historial** | ✅ Completo | `usePersistedState` (localStorage, máx 50) + opción Postgres (`db-client.js`). |
| **9 — Comparación de múltiples acciones** | 🔶 Parcial | Screening de 343 candidatos + `CandidatePanel`/`CandidateAnalysis` (vista Candidatas). No hay comparación lado-a-lado configurable por el usuario. |
| **10 — Exportación de resultados** | 🔶 Parcial | `export-to-notion.js`, `deploy-pages.js`, reportes semanales md, `data/export/`. No hay exportación directa a CSV/PDF desde la UI del analizador. |

---

## Problemas de confiabilidad del analizador

1. **Resultados incorrectos silenciosos:** mayormente controlado — `div()` protege división por cero y propaga `null`; los checks exigen `!== null`. **Pero** el render de UI confunde `null` con "NO"/verde (Bugs 1-2), comunicando incorrectamente "falla/ok" cuando en realidad **faltan datos**.
2. **Umbrales calibrados al mercado actual:** los umbrales son los **canónicos de Graham** (P/E≤15-20, current≥2, etc.). Para el mercado de 2026 son conservadores y excluyen estructuralmente tech/growth — es una decisión de método, pero implica que pocos nombres modernos aprobarán (esperado en value investing defensivo).
3. **Distinción entre mercados:** ✅ valida moneda (exige USD) y convierte FX; ✅ maneja ADR. No hay umbrales diferenciados NYSE/NASDAQ vs emergentes más allá de la conversión.
4. **Tests de regresión contra tickers de referencia:** ✅ existe fixture **TSM** (`tests/fixtures/tsm.json`) y suites de `calcRatios`, `classify`, `watchlist-screen`. Cobertura amplia (159 tests).
5. **Frescura del dato (último fetch):** ✅ parcial — los snapshots llevan `sourceDate` (fecha del fetch) y los caches están fechados (`*-2026-06-11.json`), pero la UI del analizador manual no muestra prominentemente la antigüedad del dato al usuario.

---

## Brechas críticas de sector

| Sector | Estado | Brecha |
|---|---|---|
| **Bancos / Financial Services** | ✅ Manejado | `isFinancialSector` relaja a pe+pb+precio (2 ratios), no exige current/debt industriales. |
| **Seguros (Insurance)** | ✅ Manejado | Incluido en `FINANCIAL_SECTOR_PREFIXES`. |
| **Real Estate / REITs** | ✅ Manejado | Incluido en prefijos financieros. |
| **Utilities** | ❌ Brecha | Sin tratamiento especial. Su deuda alta estructural reprueba "debtRatio<1" y "current≥2" injustamente. |
| **Tech / software** | ❌ Brecha | Alto peso de intangibles y P/B elevado → reprueba P/B≤2 estructuralmente. `intangibleWeight` se calcula pero **no se usa** para relajar P/B ni para favorecer P/B tangible. |
| **Healthcare / Pharma** | ❌ Brecha | I+D capitalizado e intangibles distorsionan P/B; sin manejo dedicado. |
| **Industrial / Consumer** | ✅ Adecuado | Los umbrales Graham clásicos aplican razonablemente. |
| **Equity negativo (cualquier sector)** | ✅ Manejado | P/B se anula, evalúa por P/E + currentRatio (`screen.js:62-72`, `calcRatios.js:135`). |

**Patrón de la brecha:** la lógica de sector solo bifurca **financiero vs no-financiero**. Sectores intensivos en capital (utilities) o en intangibles (tech, healthcare) heredan umbrales industriales que no les corresponden, produciendo **rechazos sistemáticos** no atribuibles a baja calidad sino a estructura de balance.

---

## Dependencias y versiones problemáticas

| Dependencia | Versión | Observación |
|---|---|---|
| `node` | `>=22` | Exige Node 22+; todo se ejecuta vía wrapper `run-node22.js`. Riesgo de fricción en entornos con Node anterior. |
| `react` / `react-dom` | `^18.3.0` | Vigente, sin problema. |
| `vite` | `^5.4.0` | Vigente. |
| `vitest` | `^2.0.0` | Vigente. |
| `yahoo-finance2` | `^3.15.2` | Fuente no oficial/no contractual (scraping de endpoints Yahoo): puede romperse sin aviso si Yahoo cambia su API. Sin retry/timeout propio (ver Bug 4). |
| Modelo Anthropic | `claude-sonnet-4-20250514` (hardcoded en `anthropic.js`) | **ID de modelo antiguo**; actualizar a un modelo vigente (`claude-sonnet-4-6` / `claude-opus-4-8`) verificando contra la doc de la API. |
| `package-lock.json` + `yarn.lock` | ambos presentes | **Dos lockfiles coexisten** (npm y yarn) → riesgo de resoluciones divergentes según el gestor usado. Conviene elegir uno. |

**Seguridad de credenciales:** ✅ `.env`, `.env.*` gitignored; `.env.example` es plantilla sin secretos; API key de Anthropic leída de `import.meta.env.VITE_ANTHROPIC_API_KEY` (no hardcodeada). Existe `scripts/security-audit.js` con su test. **Sin claves expuestas detectadas.**

---

### Resumen ejecutivo

- **Fase 0 resuelta:** no había conflicto real de directorios — G es simplemente una copia atrasada (ancestro git) de C. **C gana todo.** Plan de consolidación = sincronizar/limpiar G; **nada que rescatar**.
- **Madurez del proyecto:** alta. Código limpio (0 TODO/FIXME), 159 tests en verde, arquitectura clara, manejo correcto de ADR/equity negativo/FX.
- **Brechas principales:** (1) fórmula de valor intrínseco con crecimiento ausente (EPIC 3); (2) diversificación de sector incompleta para utilities/tech/healthcare (EPIC 4); (3) bugs menores de render `null`→"NO"/verde; (4) resiliencia de red en ingesta Yahoo; (5) modelo Anthropic e higiene de lockfiles.

*Fin del diagnóstico. No se generó código de solución en esta sesión.*
