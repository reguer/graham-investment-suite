# PLAN.md

> Hoja de ruta de remediación y evolución de **Graham Investment Suite (Graham Analyzer)**.
> Basada en `ANALYSIS.md` (2026-06-11) + hallazgos de planificación previa, verificados contra el código vigente.
> Ruta canónica: `C:\00_Apps_Locales\GrahamAnalizer`. Rama: `main`.
> Español en prosa; código, archivos, variables y comentarios técnicos en inglés.

## Contexto

El núcleo Graham funciona (`calcRatios`/`classify`/`getChecks`, **159 tests verdes**) y la
UI está pulida, pero el analizador **no es confiable de punta a punta** por cinco razones:
(1) la UI confunde "sin dato" con "falla"/"ok" al renderizar `null` en rojo o verde;
(2) **no hay diferenciación por sector en el flujo principal** (vive solo en `screen.js`),
así que utilities/tech/healthcare se rechazan por estructura de balance, no por calidad;
(3) existe un **segundo motor de cálculo** (`deriveSnapshot` en `screen.js`) que puede
divergir de `calcRatios` (TTM vs anual) para la misma empresa; (4) la ingesta Yahoo/SEC
no tiene retry/timeout y la frescura/procedencia del dato no es visible; (5) higiene de
entorno: doble lockfile, config de Vitest duplicada, fallback de caché `graham-repair`,
modelo Anthropic obsoleto, duplicados `(1)`.

Decisiones de producto que rigen este plan:
- **Detección de sector:** lo más efectivo sin curado manual — parsear el campo `sector`
  que **Yahoo ya entrega**, con **fallback a SIC de SEC** (`secFundamentals.js`) y `default`
  como red final. Para tech/intangible-intensivas, decidir con ratios **tangibles**
  (`pbTangible`/`pePbTangible`, ya calculados en `calcRatios`).
- **Sprint 0 (bloqueante):** reparar todo lo que muestra datos falsos **y** sanear el
  entorno. No se construye sector ni valor sobre cimientos que mienten al usuario.

---

## 1. Priorización por impacto

### BLOCKER — impiden que el analizador sea confiable
| ID | Issue | Archivo(s) |
|----|-------|-----------|
| B1 | `epsGrowing`/`epsAllPositive` = `null` se pinta "NO" rojo (falso negativo: faltan datos, no que falle el criterio) | `AnalysisResults.jsx:81-82` |
| B2 | `intangibleWeight`/`mosGraham`/`ncav` = `null` → `null < x` evalúa `true`/`false` y pinta verde/rojo engañoso | `AnalysisResults.jsx:49`, `EntryPrices.jsx:8-13` |
| B3 | `checks` retornan `pass:false` sin distinguir "no cumple" de "sin dato"; checklist marca rojo criterios no evaluables | `getChecks.js`, `InterpretationPanel.jsx:46` |

### HIGH — degradan confiabilidad o UX de forma significativa
| ID | Issue | Archivo(s) |
|----|-------|-----------|
| H1 | Ajuste por sector no aplica al flujo manual (solo `isFinancialSector` en `screen.js`); utilities/tech/healthcare rechazados injustamente | `classify.js`, `getChecks.js`, `screen.js` |
| H2 | Motor de cálculo duplicado: `calcRatios` (manual) vs `deriveSnapshot` (watchlist) → P/E puede divergir (TTM vs anual) para la misma empresa | `calcRatios.js` vs `screen.js:18` |
| H3 | Sin validación de schema/tipos/rangos antes de calcular → entra basura silenciosa (string donde se espera número) | nuevo `validateFinancials.js` |
| H4 | Sin retry/timeout en llamadas Yahoo/SEC → una corrida queda a medias ante 429/503; datos desactualizados | `yahooFundamentals.js`, `secFundamentals.js` |
| H5 | Frescura del dato no visible en la UI del analizador individual; candidatas hardcodeadas congeladas | `AnalysisResults.jsx`, `candidates.js` |
| H6 | Sin casos de prueba de referencia (golden) por sector → un refactor de umbrales no se detecta | `tests/fixtures/` |

### MEDIUM — mejoras importantes no críticas
| ID | Issue | Archivo(s) |
|----|-------|-----------|
| M1 | Fórmula de crecimiento `V = EPS×(8.5+2g)` ausente (solo existe Graham Number) | `calcRatios.js` |
| M2 | Modelo Anthropic obsoleto hardcodeado (`claude-sonnet-4-20250514`) | `anthropic.js:19` |
| M3 | Logging de fuente/fecha por campo inexistente o disperso → imposible auditar de dónde salió un número | nuevo `dataProvenance.js` |
| M4 | Config de Vitest duplicada: alias del stub `yahoo-finance2` vive en `vite.config.js` (bloque `test`), pero existe también `vitest.config.js` sin alias → configuración confusa y frágil (hoy la suite pasa, pero el solapamiento es deuda) | `vite.config.js:62-66`, `vitest.config.js` |
| M5 | Fallback de caché `graham-repair` hardcodeado a `C:/npm-cache/graham-repair` → instalación no portable | `vite.config.js:6-7`, `run-local-bin.js:22,44` |

### LOW — nice-to-have / cosmético
| ID | Issue | Archivo(s) |
|----|-------|-----------|
| L1 | Dos lockfiles (`package-lock.json` + `yarn.lock`) → resoluciones divergentes | raíz |
| L2 | Duplicados `(1)` (`HANDOFF...(1).md`, `PROMPT_CODEX (1).md`) | raíz |
| L3 | Sync/limpieza de G: (copia atrasada en Drive, ancestro de C) | repo G: |
| L4 | Bar chart de EPS; comparación side-by-side; export PDF | UI |

---

## 2. Epics redefinidos con criterios de aceptación

> Estimaciones en horas (ROM). Stories ordenadas por dependencia.

### EPIC R — Reliability core (datos confiables)
- **Objetivo:** garantizar que el analizador nunca calcula ni muestra un resultado derivado de datos ausentes o inválidos.
- **DoD:**
  - Toda métrica con dato faltante muestra `N/D` (no `0`, no rojo, no verde).
  - `validateFinancials` marca tipos/rangos inválidos antes de `calcRatios`.
  - Los `checks` distinguen `pass` / `fail` / `unknown`.
  - Tests nuevos de `null`-handling verdes; suite global sigue verde (159+).
- **Stories:**
  1. `R1` — `src/lib/metricState.js`: `metricState(value)→"ok"|"na"`, `displayValue`, `colorForState`. *(2h)*
  2. `R2` — Fix B1/B2: render `N/D` y color gris en `AnalysisResults.jsx` y `EntryPrices.jsx`. *(3h)*
  3. `R3` — `getChecks` añade `status:'pass'|'fail'|'unknown'` (mantiene `pass` derivado); Dot gris para `unknown`. *(3h)*
  4. `R4` — `src/lib/validateFinancials.js`: schema de tipos/rangos (`shares>0`, `currentLiabilities>0`, `price>0`, `currentAssets≤totalAssets`), reusa `detectMagnitudeWarning`. + tests. *(5h)*
  5. `R5` — Integrar validación en `useAnalysis.js`/ingesta; warnings no bloqueantes + banner de campos faltantes. *(3h)*
- **ROM:** ~16h.

### EPIC S — Sector diversification (OBLIGATORIO)
- **Objetivo:** evaluar cada acción con umbrales Graham apropiados a su sector y mostrar qué se ajustó y por qué.
- **DoD:**
  - Sector detectado automáticamente para ≥95% del universo (343), sobrescribible manualmente.
  - `classify`/`getChecks` aceptan un `sectorProfile`; tech/intangible usan ratios tangibles.
  - La UI lista criterios que aplican / omitidos-por-sector / reajustados (base vs ajustado).
  - Golden verdes: **BAC** (financiero), **NEE** (utilities), **MSFT** (tech) caen en su perfil y no se rechazan por un criterio inaplicable. TSM (ADR) intacto.
- **Stories:**
  1. `S1` — `src/tools/graham-analyzer/sectorProfiles.js`: taxonomía (`financial`, `utilities`, `tech`, `industrial`, `consumer_staples`, `healthcare`, `reit`, `default`) + tabla de umbrales. *(4h)*
  2. `S2` — `src/tools/graham-analyzer/detectSector.js`: `detectSector({ sector, industry, sicCode })` parsea Yahoo → taxonomía; **fallback SIC** de SEC; `default` último. Añadir `sector` a `EMPTY_FORM`. *(5h)*
  3. `S3` — Refactor `screen.js`: reemplazar `FINANCIAL_SECTOR_PREFIXES`/`isFinancialSector` por `detectSector`+`sectorProfiles` (sin duplicar prefijos). *(3h)*
  4. `S4` — `classify(ratios, profile)` y `getChecks(ratios, profile)`: umbrales desde el perfil, no hardcoded; tech usa `pbTangible`/`pePbTangible`. `GRAHAM_LIMITS` pasa a ser el perfil `default`. *(6h)*
  5. `S5` — UI: panel "Criterios aplicados / ajustados" en `AnalysisResults` (badge de sector, base vs ajustado, tooltip de motivo). *(5h)*
  6. `S6` — Golden fixtures BAC/NEE/MSFT + test que falla si el perfil/clasificación cambia; regresión TSM. *(4h)*
- **ROM:** ~27h.

#### Tabla de umbrales propuesta (S1) — punto de partida, calibrar en S6
| sector | currentMin | debtMax (L/E) | pbMax | nota |
|--------|-----------|---------------|-------|------|
| `default` | 2.0 | 1.0 | 2.0 | Graham clásico |
| `financial` | n/a | n/a | 2.0 | omite current/debt; evalúa P/E, P/B, ROE |
| `utilities` | 1.0 | 2.5 | 2.0 | deuda regulada alta es normal |
| `reit` | n/a | n/a | n/a | usar P/FFO (futuro); hoy P/E + yield |
| `tech` | 1.5 | 1.0 | **P/B tangible** ≤ 2.5 | intangibles altos |
| `healthcare` | 1.5 | 1.2 | P/B tangible ≤ 2.5 | I+D capitalizado |
| `industrial` | 2.0 | 1.0 | 2.0 | Graham clásico |
| `consumer_staples` | 1.5 | 1.2 | 2.0 | inventario alto |

### EPIC U — Motor de datos unificado
- **Objetivo:** una sola ruta de cálculo de ratios; opcionalmente auto-fetch por ticker para reducir fricción.
- **DoD:** dado un snapshot fijo, la ruta manual (`calcRatios`) y la de watchlist (`deriveSnapshot`) producen idénticos `pe/pb/pePb` (test de paridad), o `deriveSnapshot` se reescribe sobre `calcRatios`.
- **Stories:**
  1. `U1` — Test de paridad `calcRatios` vs `deriveSnapshot` con un snapshot común; documentar divergencias TTM/anual. *(3h)*
  2. `U2` — Reconciliar: `deriveSnapshot` delega en `calcRatios` o comparte helpers. *(5h)*
  3. `U3` (opcional UX) — `fetchCompanyByTicker(ticker)` normaliza snapshot Yahoo/SEC → `EMPTY_FORM`; botón "Buscar por ticker" en `AnalysisForm`. *(6h)*
- **ROM:** ~14h (U3 opcional).

### EPIC I — Intrinsic value & growth
- **Objetivo:** añadir `V = EPS×(8.5+2g)` junto al Graham Number.
- **DoD:** `calcRatios` expone `grahamGrowthValue` con `g = epsCagr` (cap a rango razonable, p.ej. [0, 0.15]); mostrado en `EntryPrices`; tests numéricos.
- **Stories:** `I1` fórmula + cap de `g` *(3h)*; `I2` UI + tooltip *(2h)*; `I3` tests *(2h)*.
- **ROM:** ~7h.

### EPIC D — Data provenance & freshness
- **Objetivo:** que el usuario sepa de qué fuente y fecha es cada análisis.
- **DoD:** badge de frescura (`as-of` + fuente) en Results; logging estructurado de fuente/fecha por campo; candidatas congeladas se marcan añejas/obsoletas.
- **Stories:** `D1` `src/lib/dataProvenance.js` + structured log *(4h)*; `D2` `FreshnessBadge.jsx` en UI *(3h)*; `D3` warning si dato > N días (default 30) + sello en historial guardado *(2h)*.
- **ROM:** ~9h.

### EPIC X — Resilience & hygiene
- **Objetivo:** robustecer red y limpiar deuda de entorno.
- **DoD:** Yahoo/SEC con retry+backoff+timeout (test con mock de fallo, sin romper `concurrency:2,interval:250`); un solo lockfile; config Vitest única; modelo Anthropic vigente; duplicados eliminados.
- **Stories:**
  1. `X1` — `src/lib/withRetry.js` (`retries:3, backoffMs, timeoutMs`); aplicar en `yahooFundamentals.js`/`secFundamentals.js`. *(4h)*
  2. `X2` — Unificar config de Vitest: mover el `test.alias` a `vitest.config.js` y dejar una sola fuente (o eliminar `vitest.config.js`). Verificar que las suites de datos cargan. *(1.5h)*
  3. `X3` — Actualizar modelo Anthropic (verificar doc API vigente). *(1h)*
  4. `X4` — Un solo lockfile; documentar/retirar fallback `graham-repair`; quitar `*.tmp` del índice. *(2h)*
  5. `X5` — Borrar duplicados `(1)`; sync/limpieza de G:. *(1h)*
- **ROM:** ~9.5h.

**Total ROM ≈ 92h** (≈ 5 semanas a 1 sprint/sem; U3 e I son los flexibles).

---

## 3. Plan de sprints (1 semana c/u)

### Sprint 0 — "Nada roto" (OBLIGATORIO primero)
- **Objetivo:** eliminar todo resultado incorrecto silencioso y sanear el entorno antes de construir.
- **Stories:** `R1, R2, R3, R4, R5`, `X2` (config Vitest), `X3` (modelo), `X4` (lockfile/`graham-repair`/`.tmp`), `X5` (duplicados+G:).
- **Entregable:** build donde ninguna métrica con dato faltante engaña al usuario; checklist Graham con `unknown` en gris; validador activo; `npm install && npm test` limpio con un solo lockfile y una sola config de test.
- **Riesgos/deps:** retirar el fallback `graham-repair` puede romper el arranque en Windows/Node 22 → hacer `X4` con rama de respaldo y verificar `npm run dev` antes de borrar el caché.

### Sprint 1 — Fundamento de sector + motor unificado
- **Objetivo:** detectar sector, centralizar umbrales y eliminar la divergencia de motores, sin cambiar veredictos aún.
- **Stories:** `S1, S2, S3`, `U1, U2`, `D1` (provenance base).
- **Entregable:** `detectSector` ≥95% del universo; `screen.js` consumiendo perfiles; paridad `calcRatios`/`deriveSnapshot` probada; logging de fuente/fecha por campo.
- **Riesgos/deps:** uniformidad del campo `sector` de Yahoo; disponibilidad de SIC en SEC para el fallback.

### Sprint 2 — Sector aplicado + visible
- **Objetivo:** que el flujo principal evalúe y explique por sector.
- **Stories:** `S4, S5, S6`.
- **Entregable:** BAC/NEE/MSFT clasifican coherentemente; UI muestra criterios aplicados/omitidos/ajustados; TSM sigue verde.
- **Riesgos/deps:** calibrar umbrales es decisión de método → `sectorProfiles.js` con supuestos citados y revisión del usuario antes de S6.

### Sprint 3 — Valor, frescura y resiliencia
- **Objetivo:** completar valuación y confiabilidad operativa.
- **Stories:** `I1, I2, I3`, `D2, D3`, `X1`, (`U3` si hay holgura).
- **Entregable:** valor por crecimiento visible; badge de frescura + warnings; ingesta con retry/timeout probada con mocks; (auto-fetch por ticker opcional).
- **Riesgos/deps:** `yahoo-finance2` es API no oficial (puede romperse/bloquear) → `X1` primero y degradar a captura manual.

---

## 4. Arquitectura propuesta (solo cambios necesarios)

> Principio: lo que funciona (núcleo, UI, persistencia, backtesting) **no se reescribe**; se **parametriza** y se **extiende**.

### 4.1 Manejo de `null` en UI (AS-IS → TO-BE)
- **AS-IS:** componentes evalúan `value > 0 ? green : red` y `value ? "SI":"NO"` con `value` potencialmente `null`.
- **TO-BE:** helper único decide estado y color.
- **Crear:** `src/lib/metricState.js`
  ```js
  // metricState.js
  export function metricState(value) {
    return value === null || value === undefined || Number.isNaN(value) ? "na" : "ok";
  }
  export function displayValue(value, formatter) {
    return metricState(value) === "na" ? "N/D" : formatter(value);
  }
  ```
- **Modificar:** `AnalysisResults.jsx`, `EntryPrices.jsx` (gris para `na`).

### 4.2 Checks tri-estado
- **AS-IS:** `getChecks` retorna `{ pass: boolean }`.
- **TO-BE:** `{ status: 'pass'|'fail'|'unknown' }` (mantener `pass` derivado por compatibilidad con tests).
- **Modificar:** `getChecks.js`, `InterpretationPanel.jsx:44-52` (Dot gris para `unknown`).

### 4.3 Perfiles de sector (núcleo del EPIC S)
- **AS-IS:** umbrales hardcoded en `constants.js` (`GRAHAM_LIMITS`/`alertFor`), `getChecks.js`, `classify.js`; sector solo en `screen.js`; cero detección automática (no se consume `assetProfile`/`sicCode`).
- **TO-BE:** fuente única de umbrales por sector, consumida por el flujo manual y el screening; `sector` en `EMPTY_FORM`, detectado y editable.
- **Crear:** `src/tools/graham-analyzer/sectorProfiles.js`, `src/tools/graham-analyzer/detectSector.js`.
- **Modificar:** `classify.js` → `classify(ratios, profile = DEFAULT_PROFILE)`; `getChecks.js` → `getChecks(ratios, profile = DEFAULT_PROFILE)`; `useAnalysis.js` (resolver profile desde `form.sector`); `screen.js` (consumir `detectSector`); `constants.js` (`GRAHAM_LIMITS` = perfil `default`, `EMPTY_FORM`+`sector`).
- **Compatibilidad:** firmas con default ⇒ los 159 tests siguen llamando sin `profile` y obtienen el comportamiento `default` idéntico al actual.

### 4.4 Motor de datos unificado (EPIC U)
- **AS-IS:** `calcRatios` (manual, TTM) y `deriveSnapshot` (watchlist, derivado de snapshot) son rutas paralelas que pueden divergir.
- **TO-BE:** `deriveSnapshot` delega en `calcRatios`/helpers compartidos, o pasa un test de paridad estricto.
- **Modificar:** `screen.js`; tests nuevos de paridad. **(Opcional U3)** crear `src/tools/graham-analyzer/fetchCompany.js`.

### 4.5 Validación de datos
- **Crear:** `src/lib/validateFinancials.js` → `{ ok, missing[], warnings[] }`. Reusar `detectMagnitudeWarning` de `yahooFundamentals.js`.
- **Modificar:** `useAnalysis.js` e ingesta (`yahooFundamentals.js`, `secFundamentals.js`) para anexar `warnings` sin bloquear.

### 4.6 Resiliencia, provenance y entorno
- **Crear:** `src/lib/withRetry.js`, `src/lib/dataProvenance.js`, `src/components/ui/FreshnessBadge.jsx`.
- **Modificar:** `yahooFundamentals.js`/`secFundamentals.js` (envolver con `withRetry`); `AnalysisResults.jsx` (badge); `anthropic.js:19` (modelo); `vitest.config.js`/`vite.config.js` (config única); raíz (lockfile, duplicados).

### 4.7 Migración de datos
- `candidates.js` ya tiene `sector`. Para `data/public/companies.json`, añadir `sectorTag` derivado por `detectSector` en `scripts/sync-universe.js`/`data-ingestion.js` — **idempotente y retrocompatible** (si falta, se calcula al vuelo).
- El historial persistido (`localStorage`) sigue cargando; `ratioStatus`/`sector` son opcionales.
- **Sin** cambios en `data/schema.sql` para Sprint 0-2.

### A eliminar
- `vite.config.js.tmp.*` del índice git.
- Tras decidir gestor: `yarn.lock` **o** `package-lock.json` (uno).
- `HANDOFF_GRAHAM_ECOSYSTEM (1).md`, `PROMPT_CODEX (1).md` (confirmar).

---

## 5. Mejoras de UX priorizadas

Flujo objetivo: **usuario escribe ticker → obtiene análisis confiable → entiende si pasa Graham y por qué.**

| Pri | Problema UX (AS-IS) | Solución concreta (TO-BE) |
|-----|---------------------|---------------------------|
| 1 | Resultados muestran rojo/verde con datos faltantes | `N/D` en gris + tooltip "dato no disponible" (helper §4.1, R2). |
| 2 | El veredicto no explica qué criterios aplican a ESTA empresa (un banco se "rechaza" por current ratio inaplicable) | Checklist por sector: cada criterio marcado aplica / omitido-por-sector / reajustado, con motivo (S5). |
| 3 | No se sabe si pasa Graham y **por qué** de un vistazo | Resumen superior "Pasa 7/10 — falla: current ratio (1.4<2), EPS no creciente"; lista accionable, no solo dots. |
| 4 | Capturar ~25 campos a mano es fricción alta y propenso a error | Botón "Buscar por ticker" que auto-rellena desde `fetchYahooDeepFundamentals` y queda editable (U3). |
| 5 | No se ve la antigüedad del dato | `FreshnessBadge` (verde/amarillo/rojo) en Results y candidatas (D2). |
| 6 | Ticker inexistente no da feedback claro; `hasInputData` deja entrar a Results casi vacío | Validar símbolo antes de fetch; gate por `validateFinancials`; estado "Ticker no encontrado". |
| 7 | Sección EPS solo numérica; cuesta ver la tendencia | Bar chart de EPS (L4). |

Prioridad 1-3 atacan el camino crítico y van en Sprint 0-2.

---

## 6. Estrategia de confiabilidad

1. **Validación previa al cálculo** (`validateFinancials.js`, R4): tipos numéricos (reusar `p()`), rangos (`price>0`, `shares>0`, `currentLiabilities>0`, `currentAssets≤totalAssets`), coherencia de magnitud (`detectMagnitudeWarning`). Salida `{ ok, missing[], warnings[] }`.
2. **Datos faltantes explícitos** (R1-R3): contrato único `metricState`→`N/D`; nunca `0` ni color de veredicto sobre `null`; checks tri-estado (`unknown`).
3. **Casos de prueba de referencia** (golden, S6 + I3): TSM (ADR, ya existe — no romper); **BAC** financiero, **NEE** utilities, **MSFT** tech; una APROBADA defensiva clásica, una RECHAZADA, una EXCELENTE-PERO-CARA; y un caso con campos faltantes → debe rendir `N/D`, no fallar. Cualquier cambio de umbral que altere un golden **falla el build**.
4. **Logging de fuente/fecha** (`dataProvenance.js`, D1): por campo `{ value, source, asOf }` (Yahoo/SEC/manual); log estructurado en ingesta para auditar de dónde vino cada número; panel "Procedencia de datos".
5. **Indicador de frescura visible** (`FreshnessBadge`, D2-D3): a partir de `sourceDate`/`lastPriceUpdatedAt`, clasifica fresco (≤30 días) / añejo / obsoleto en Results y candidatas; las candidatas hardcodeadas (`candidates.js`, congeladas) se marcan automáticamente como añejas.

---

## Verificación (cómo se prueba de punta a punta)

- **Entorno:** en `C:\00_Apps_Locales\GrahamAnalizer`, `npm install` limpio (un solo lockfile, una sola config de test) y `npm test` → **159+ tests verdes**, suites de datos (Yahoo/SEC) cargando.
- **Regresión crítica:** `calcRatios.test.js` con `tests/fixtures/tsm.json` debe seguir dando `P/E ~7.03`, `P/B ~11.20`, `P/E×P/B ~78.77`, NCAV positivo (requisito de CLAUDE.md).
- **Reliability:** test con campos faltantes ⇒ UI rinde `N/D` (no rojo/verde); con cash flow vacío ⇒ `fcf` N/D (no 0); con `equity<0` ⇒ no aprueba por `debtRatio` accidental.
- **Motor unificado:** test de paridad ⇒ `calcRatios` y `deriveSnapshot` dan idénticos `pe/pb/pePb` para el mismo snapshot.
- **Sector:** golden BAC/NEE/MSFT ⇒ cada uno en su perfil; ninguno rechazado por un criterio inaplicable; UI muestra criterios omitidos/ajustados.
- **Resiliencia:** `withRetry` simulando 2 fallos + éxito; verificar que no rompe el rate-limit (`concurrency:2, interval:250`).
- **Manual (UI):** `npm run dev` → analizar NEE y confirmar que utilities no se rechaza por deuda; ver badge de frescura y panel de criterios ajustados.

---

## Estimación total y orden

`Sprint 0 (~22h) → Sprint 1 (~25h) → Sprint 2 (~15h) → Sprint 3 (~22h)`.
ROM global ≈ **92h** (U3 e I son flexibles). **Sprint 0 es bloqueante:** no se construye
sector ni valor sobre cimientos que muestran datos falsos.
