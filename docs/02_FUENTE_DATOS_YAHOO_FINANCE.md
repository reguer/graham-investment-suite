# 02 — Fuente de Datos: Yahoo Finance como Fuente Principal

> Este documento describe la jerarquía de fuentes de datos propuesta, cómo usar Yahoo Finance como fuente principal, y cómo garantizar que todos los datos estén en USD.

---

## 1. Estado actual de las fuentes de datos

### Fuentes verificadas en el repositorio

| Fuente | Datos | Modo | Automatización |
|--------|-------|------|---------------|
| **Yahoo Finance** | Fundamentales, Balance Sheet, Income Statement, Cash Flow, EPS histórico, ADR ratio | **MANUAL** — el usuario los captura a mano | No existe |
| **Stooq CSV** | Precios spot (OHLCV) | **Automático** vía `scripts/weekly-screen.js` | Sí — `npm run weekly:screen` |
| **candidates.js** | Snapshots de 10 empresas con fundamentales | **Hardcodeado** en código fuente | N/A |
| **tests/fixtures/tsm.json** | Datos TSM para tests unitarios | Solo para tests | N/A |
| **localStorage** | Historial de análisis guardados por el usuario | Persistencia local del navegador | N/A |

### Limitación crítica actual

**Todos los datos fundamentales se capturan manualmente.** Esto implica:
- Dependencia total de la disponibilidad del usuario
- Riesgo de errores de captura (magnitudes, monedas, unidades)
- Sin historial de cuándo se capturó cada dato
- Sin validación automática de que el dato esté en USD

---

## 2. Jerarquía de fuentes propuesta

```
Prioridad 1 → Yahoo Finance (automático, cuando se implemente)
Prioridad 2 → Stooq (automático, ya implementado para precios spot)
Prioridad 3 → Override manual del usuario (siempre permitido)
Prioridad 4 → Fixtures (solo tests — NUNCA en producción)
Prioridad 5 → Datos hardcodeados en candidates.js (solo catálogo, NUNCA precios vivos)
```

### Regla de prioridad

Si existe dato de fuente 1, usarlo. Si no, intentar fuente 2. Si no, requerir entrada manual (fuente 3). Los fixtures (4) y hardcoded (5) son solo para desarrollo y referencia estática.

---

## 3. Qué puede dar Yahoo Finance

### Datos disponibles confiablemente

| Dato | Yahoo Finance | Campo en EMPTY_FORM |
|------|--------------|---------------------|
| Precio actual | Sí | `price` |
| Acciones en circulación | Sí | `sharesOutstanding` |
| Acciones en tesorería | Sí | `treasuryShares` |
| Total Assets | Sí | `totalAssets` |
| Current Assets | Sí | `currentAssets` |
| Total Liabilities | Sí | `totalLiabilities` |
| Current Liabilities | Sí | `currentLiabilities` |
| Equity (stockholders' equity) | Sí | `equity` |
| Inventario | Sí | `inventory` |
| Goodwill + Intangibles | Sí | `intangiblesTotal` |
| Net Tangible Assets | A veces (calculado) | `netTangibleAssets` |
| Revenue | Sí | `revenue` |
| Gross Profit | Sí | `grossProfit` |
| Operating Income | Sí | `operatingIncome` |
| EBIT | Sí | `ebit` |
| Interest Expense | Sí | `interestExpense` |
| Net Income | Sí | `netIncome` |
| EPS TTM | Sí | `epsTTM` |
| EPS histórico (hasta 4-5 años) | Sí | `eps1`–`eps5` |
| Operating Cash Flow | Sí | `operatingCF` |
| Investing Cash Flow | Sí | `investingCF` |
| Financing Cash Flow | Sí | `financingCF` |
| ADR ratio | Sí (en notas del ticker) | `adrRatio` |
| Moneda de reporte | Sí (`currency`) | Metadato |

### Datos que Yahoo Finance NO da confiablemente

| Dato | Motivo |
|------|--------|
| Proyecciones de EPS a 3-5 años | Consenso de analistas — variable y no oficial |
| Datos intraday preciso | Delay de 15 min en versión free |
| Datos pre-mercado/aftermarket exactos | No disponibles en versión free |
| Datos fundamentales de empresas muy pequeñas | Cobertura incompleta |
| Historial de EPS ajustado por splits > 5 años | Datos pueden variar |
| Deuda neta exacta (Net Debt) | Requiere cálculo manual |
| FCF normalizado | Requiere cálculo manual |

---

## 4. Propuesta de automatización con `yahoo-finance2`

### Librería candidata

```
yahoo-finance2
```

Node.js package compatible con el stack actual (Node + ES Modules). Permite obtener todos los datos fundamentales de manera automática.

**IMPORTANTE**: Esta integración **NO existe** en el repositorio actualmente. Es una propuesta para implementación futura.

### Verificación de compatibilidad antes de instalar

```powershell
# Verificar si ya existe algún intento de integración
Get-ChildItem -Recurse -Filter "*.js" | Select-String "yahoo" | Select-Object -Unique

# Verificar versión de Node
node --version  # Debe ser >= 16

# Verificar que package.json sea de tipo module
# (ya verificado: "type": "module" ✓)
```

### Comando de instalación propuesto (solo cuando se decida implementar)

```powershell
npm install yahoo-finance2
```

### Datos que se podrían obtener automáticamente

```javascript
// Ejemplo conceptual de uso (NO implementado)
import yahooFinance from 'yahoo-finance2'

async function fetchFundamentals(ticker) {
  const quote = await yahooFinance.quoteSummary(ticker, {
    modules: ['financialData', 'defaultKeyStatistics', 'incomeStatementHistory',
              'balanceSheetHistory', 'cashflowStatementHistory', 'earnings']
  })
  return {
    price: quote.financialData.currentPrice,
    totalAssets: quote.balanceSheetHistory.balanceSheetStatements[0].totalAssets,
    // ...
    currency: quote.financialData.financialCurrency,
    retrieved_at: new Date().toISOString(),
    source: 'yahoo-finance2'
  }
}
```

### Riesgos y limitaciones de `yahoo-finance2`

| Riesgo | Descripción |
|--------|-------------|
| Rate limiting | Yahoo puede bloquear IPs si se hacen demasiadas llamadas |
| Cambios de API | Yahoo Finance cambia su API sin aviso — la librería puede quedar desactualizada |
| Datos en miles vs millones | Algunos datos vienen en miles, otros en millones — requiere normalización |
| Moneda no garantizada | `financialCurrency` puede ser diferente de USD para ADRs |
| Sin garantía de disponibilidad | Yahoo Finance no ofrece SLA para sus datos públicos |

---

## 5. Capa de datos propuesta

Cada dato almacenado debe incluir estos metadatos para garantizar trazabilidad y calidad:

```typescript
interface DataRecord {
  // Identificación
  ticker: string
  company_name: string
  data_type: 'price' | 'fundamentals' | 'eps_history' | 'cash_flow'

  // Fuente
  source_name: 'yahoo_finance' | 'stooq' | 'manual' | 'fixture' | 'hardcoded'
  source_priority: 1 | 2 | 3 | 4 | 5
  source_url?: string

  // Temporal
  retrieved_at: string          // ISO 8601
  market_timezone: string       // 'America/New_York'
  data_as_of?: string           // fecha del dato (ej. "Q4 2025")

  // Moneda
  currency: string              // 'USD', 'MXN', etc.
  price_currency: string        // moneda del precio de mercado
  financials_currency: string   // moneda de los estados financieros
  usd_validated: boolean        // ¿se verificó que está en USD?
  fx_rate?: number              // tasa de cambio si no es USD
  fx_source?: string            // fuente de la tasa de cambio
  fx_retrieved_at?: string      // cuándo se obtuvo la tasa

  // Calidad
  is_manual_override: boolean   // ¿el usuario sobreescribió este dato?
  is_adjusted: boolean          // ¿ajustado por splits/dividendos?
  staleness_status: 'fresh' | 'stale' | 'expired' | 'unknown'
  quality_status: 'verified' | 'unverified' | 'suspicious' | 'invalid'
  missing_fields?: string[]     // campos que faltan

  // Origen
  device_id?: string            // desde qué ordenador se capturó
}
```

---

## 6. Cómo validar que los datos están en USD

### Regla general

**Todo dato financiero del proyecto debe estar en USD** — esto incluye precios, fundamentales y métricas calculadas.

### Validación por tipo de dato

**Precios (Stooq)**:
- Stooq devuelve precios de mercado en USD para tickers `.us` (ej. `kbh.us`)
- Para ADRs: el precio de mercado ya está en USD por definición (cotizan en NYSE/Nasdaq)
- Validar: `currency === 'USD'` en la respuesta

**Fundamentales (Yahoo Finance)**:
- Yahoo devuelve `financialCurrency` en el objeto de datos
- Si `financialCurrency !== 'USD'`: aplicar tipo de cambio
- Para ADRs: Los estados financieros pueden estar en moneda local (ej. TWD para TSM)
  - **Solución implementada**: El campo `adrRatio` normaliza EPS, BVPS, TBVPS y NCAV
  - El `adrRatio` convierte unidades de participación, no monedas — el EPS ya debe estar en USD antes de aplicar el ratio

**Empresas mexicanas o de otros países**:
- Si reportan en MXN, CNY, EUR u otra moneda, se debe convertir antes de calcular ratios Graham
- Graham comparó siempre en moneda local del mercado — para mercado USA, USD es la referencia

### Proceso de validación sugerido

```
1. Obtener dato de fuente
2. Verificar campo currency/financialCurrency
3. Si currency === 'USD' → marcar usd_validated = true
4. Si currency !== 'USD' → obtener tasa FX → convertir → marcar usd_validated = true + guardar fx_rate
5. Si no se puede determinar → marcar usd_validated = false + quality_status = 'suspicious'
6. No calcular ratios si usd_validated = false
```

---

## 7. Cómo manejar empresas que reportan en otra moneda

### Caso ADR (ej. TSM — Taiwan Semiconductor)

- TSM cotiza en NYSE como ADR (1 ADR = 5 acciones ordinarias en Taiwan)
- El precio en Yahoo Finance está en **USD** ✓
- Los fundamentales pueden estar en **TWD** o en **USD** dependiendo de la fuente
- En el sistema actual: `adrRatio = 5` ajusta EPS, BVPS, TBVPS y NCAV por el ratio de participación
- **Esta es una normalización de unidades, no de moneda** — el EPS reportado debe estar en USD

### Caso empresa mexicana o latinoamericana

Si en el futuro se agregan empresas que reportan en MXN, BRL, etc.:

```
1. Obtener EPS en moneda local
2. Obtener tasa FX (USD/MXN) de fuente confiable
3. Convertir: eps_usd = eps_mxn * fx_rate
4. Guardar fx_rate y fx_retrieved_at en el registro
5. Marcar usd_validated = true
```

---

## 8. Convención de magnitudes (miles vs millones)

**Riesgo identificado**: Yahoo Finance puede devolver datos en miles (miles de dólares) o en millones dependiendo del endpoint y la empresa.

### Convención actual del proyecto

Los datos de `candidates.js` y `tests/fixtures/tsm.json` están en **diferentes unidades**:
- TSM fixture: datos en **miles** de USD (ej. `totalAssets: 252,557,864` = $252 billones)
- MU (Micron) en prefills: datos en **millones** de USD

**La UI no indica la magnitud** — el usuario debe saber si los datos son en miles o millones al ingresarlos.

### Propuesta de normalización

Al integrar Yahoo Finance automáticamente, normalizar todo a **miles de USD (thousands)** o **millones de USD (millions)** de forma consistente y documentada.

---

## 9. Cómo refrescar datos mientras el ordenador esté encendido

Actualmente el único proceso automático es:

```powershell
npm run weekly:screen
```

Que actualiza precios de Stooq y genera un reporte. No actualiza fundamentales.

### Propuesta de actualización periódica

```
Modo watch (propuesto):
- Cada 15 minutos → actualizar precios de Stooq
- Cada día al cierre (18:00 CDMX) → ejecutar screening completo
- Cada semana (lunes/viernes) → generar reporte formal
- Fundamentales → solo cuando el usuario lo solicite explícitamente o cuando Yahoo Finance lo permita
```

Ver `docs/09_MODO_LOCAL_TIEMPO_REAL.md` para la arquitectura completa.

---

## 10. Datos que deben capturarse manualmente (siempre)

Algunos datos no pueden obtenerse automáticamente con confianza y deben ser validados por el usuario:

| Dato | Motivo de captura manual |
|------|------------------------|
| ADR ratio | Puede cambiar — verificar en Yahoo Finance sección "Key Statistics" |
| Net Tangible Assets override | Solo usar si Yahoo lo reporta explícitamente; de lo contrario calcular |
| EPS breakdown por año | La calidad histórica varía — verificar contra informes anuales |
| Aclaraciones sobre restatements | No detectable automáticamente |
| Notas sobre eventos extraordinarios | Requiere criterio humano |

---

## 11. Datos que necesitan validación antes de usarse

| Validación | Qué verificar |
|-----------|--------------|
| Magnitud de fundamentales | ¿Están en miles, millones o dólares exactos? |
| Moneda de estados financieros | ¿USD o moneda local? |
| EPS TTM vs EPS anualizado | ¿El EPS es trailing twelve months o del último año fiscal? |
| Acciones diluidas vs básicas | ¿Qué tipo de `sharesOutstanding` se usó? |
| Goodwill vs Intangibles vs Net Tangible Assets | ¿Se usó el campo correcto? |
| Fecha del dato | ¿Es el reporte más reciente o uno antiguo? |

---

## 12. Fuentes de datos a integrar en el futuro

| Fuente | Datos | Tipo | Observaciones |
|--------|-------|------|--------------|
| `yahoo-finance2` (npm) | Fundamentales, precio | Automático | Propuesto; no implementado |
| Stooq CSV | Precio spot, OHLCV | Automático | Ya implementado |
| EDGAR (SEC) | Reportes 10-K, 10-Q | Manual/Automático | Para validación de fundamentales USA |
| Macrotrends.net | Histórico de ratios | Manual | Para backtesting histórico |
| FRED (Federal Reserve) | Tasas FX, indicadores macro | Automático | Para normalización de monedas |

> Ninguna de estas integraciones adicionales existe actualmente en el repositorio.
