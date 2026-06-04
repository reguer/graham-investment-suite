# 12 — Plan de Backtesting y Evaluación de Estrategias

> Propuesta completa para convertir el proyecto en un sistema de backtesting histórico. El sistema actual NO tiene motor de backtesting — solo tiene screening semanal.

---

## 1. Estado actual

| Aspecto | Estado |
|---------|--------|
| Motor de backtesting | **No existe** |
| Datos históricos | **No existen** en el repo |
| Estrategias definidas formalmente | No existen como código |
| Resultados históricos | Solo `reports/weekly/*.md` (desde 2026) |
| Benchmark | No existe en el sistema |
| Métricas de desempeño | No calculadas |

Lo que SÍ existe y puede usarse como base:
- `calcRatios()` — calcula todos los ratios en cualquier momento si se tienen los datos
- `classify()` — clasifica según criterios Graham
- `screenWatchlist()` — evalúa una lista de candidatos
- `priceSources.js` — puede obtener precios históricos de Stooq si se extiende

---

## 2. Estructura de carpetas propuesta

```
backtesting/
├── strategies/
│   ├── graham-defensive.js      ← Estrategia Graham puro
│   ├── price-target.js          ← Estrategia por precio objetivo
│   ├── margin-of-safety.js      ← Estrategia por MoS
│   ├── strong-trend.js          ← Estrategia por tendencia
│   ├── mixed-graham-trend.js    ← Graham + tendencia
│   └── monday-friday-alerts.js  ← Alertas lunes/viernes
│
├── data/
│   ├── historical/              ← Precios históricos (CSV por ticker)
│   │   ├── KBH_2020_2026.csv
│   │   ├── MTH_2020_2026.csv
│   │   └── ...
│   ├── fundamentals/            ← Fundamentales por período
│   │   ├── KBH_fundamentals.json
│   │   └── ...
│   └── universe.json            ← Lista de tickers del universo
│
├── results/
│   ├── 2026-06-03_graham-defensive/
│   │   ├── summary.json
│   │   ├── trades.csv
│   │   └── equity_curve.csv
│   └── ...
│
├── reports/
│   ├── graham-defensive_report.md
│   └── strategy-comparison.md
│
├── config/
│   ├── default-parameters.json  ← Parámetros default
│   └── strategy-versions.json   ← Versiones de estrategias
│
└── tests/
    ├── test-mini-dataset.js      ← Tests con dataset pequeño
    └── fixtures/
        └── mini_universe.json   ← 3-5 empresas, 2 años de datos
```

---

## 3. Fuentes de datos históricos

### Stooq (recomendado — ya integrado)

Stooq permite descargar series históricas de precios:

```
URL: https://stooq.com/q/d/l/?s=kbh.us&d1=20200101&d2=20261231&i=d
Formato: CSV con columnas Date, Open, High, Low, Close, Volume
```

El módulo `priceSources.js` ya usa Stooq para precios spot. Puede extenderse para histórico.

### Yahoo Finance (alternativo)

Con `yahoo-finance2` se pueden obtener series históricas:

```javascript
// No implementado aún
const history = await yahooFinance.historical('KBH', {
  period1: '2020-01-01',
  period2: '2026-12-31',
  interval: '1d'
})
```

### Macrotrends (manual)

Para backtesting con fundamentales históricos (EPS, BVPS por año), Macrotrends.net permite descargar CSV manualmente.

---

## 4. Las 8 estrategias a probar

### Estrategia 1: Graham Defensivo Puro

**Condición de entrada**:
```
pePb ≤ 22.5 AND pe ≤ 20 AND pb ≤ 2 AND debtRatio < 1 AND currentRatio ≥ 2 AND epsAllPositive
```

**Condición de salida**:
```
pePb > 28 (se sale cuando la valuación se deteriora significativamente)
O después de N años (hold máximo)
```

**Benchmark**: S&P 500 total return en el mismo período

### Estrategia 2: Por Precio Objetivo Graham

**Entrada**: Precio ≤ `grahamFormula` (√(22.5 × EPS × BVPS))
**Salida**: Precio ≥ 1.5 × `grahamFormula` (o stop loss -20%)

### Estrategia 3: Por Margen de Seguridad

**Variantes**:
- MoS ≥ 15% (agresiva)
- MoS ≥ 20% (moderada)
- MoS ≥ 30% (conservadora)

**Salida**: MoS ≤ 0% (precio supera la fórmula Graham) o stop loss -15%

### Estrategia 4: Tendencia Fuerte con Relajación Graham

**Entrada**: Empresa con tendencia técnica fuerte + al menos 4 de 6 criterios Graham
**Condición extra**: `epsGrowing = true` y `fcf > 0`

### Estrategia 5: Graham + Tendencia Mixta

Combinación de las estrategias 1 y 4 con ponderación ajustable.

### Estrategia 6: Alertas Lunes/Viernes

**Modelo de timing**: Entrar el primer lunes que la empresa entra en `READY_TO_BUY`, salir el primer viernes que sale de esa condición.

### Estrategia 7: Entrada por Watchlist

**Entrada**: La empresa entra al watchlist con MoS ≥ N% y todos los criterios se cumplen en el siguiente screening
**Salida**: La empresa sale del watchlist

### Estrategia 8: Espera Condición Completa

Más conservadora: esperar hasta que TODOS los criterios Graham se cumplan (no solo los principales), incluyendo EPS creciente en todos los años del historial.

---

## 5. Parámetros configurables por backtest

```json
{
  "backtest_id": "bt-001",
  "strategy": "graham-defensive",
  "strategy_version": "1.0",
  "code_version": "1.0.0",
  
  "universe": ["KBH", "MTH", "TOL", "TMHC", "LEN", "INGR", "CTSH", "MHO", "GRBK", "PHM"],
  "start_date": "2020-01-01",
  "end_date": "2025-12-31",
  
  "graham_params": {
    "pe_max": 20,
    "pb_max": 2,
    "pe_pb_max": 22.5,
    "debt_max": 1,
    "current_min": 2
  },
  
  "risk_params": {
    "stop_loss_pct": -0.20,
    "take_profit_pct": null,
    "max_hold_years": 5,
    "max_position_pct": 0.10,
    "commission_pct": 0.001,
    "slippage_pct": 0.001
  },
  
  "benchmark": "^GSPC",
  "initial_capital": 100000,
  
  "device_id": "laptop-eduardo-01",
  "created_at": "2026-06-03T18:00:00-06:00"
}
```

---

## 6. Métricas de desempeño a calcular

| Métrica | Descripción | Fórmula/Referencia |
|---------|-------------|-------------------|
| **Rendimiento total** | Retorno del portafolio vs inicio | (final - inicial) / inicial |
| **Rendimiento anualizado** | CAGR del portafolio | (1 + total)^(1/años) - 1 |
| **Drawdown máximo** | Caída máxima desde un pico | max((pico - valle) / pico) |
| **Win rate** | % de operaciones ganadoras | wins / total_trades |
| **Profit factor** | Ganancia bruta / Pérdida bruta | sum(ganancias) / sum(pérdidas) |
| **Sharpe ratio** | Retorno ajustado por riesgo | (retorno - rf) / std_dev |
| **Sortino ratio** | Sharpe usando solo volatilidad negativa | (retorno - rf) / std_dev_negativa |
| **Beta vs benchmark** | Sensibilidad al mercado | cov(portafolio, benchmark) / var(benchmark) |
| **Alpha** | Retorno en exceso del benchmark | retorno - (rf + beta × (benchmark - rf)) |
| **Nº operaciones** | Total de trades ejecutados | — |
| **Hold promedio (días)** | Días promedio en posición | mean(exit_date - entry_date) |
| **Rendimiento vs benchmark** | Comparación directa | portafolio_retorno - benchmark_retorno |

---

## 7. Estructura de una operación (trade)

```typescript
interface Trade {
  id: string
  ticker: string
  company_name: string
  
  entry_date: string
  entry_price: number
  entry_condition: string   // "pePb=8.3 ≤ 22.5, mos=64.2%"
  
  exit_date?: string
  exit_price?: number
  exit_condition?: string   // "pePb=24.1 > 22.5 (condición rota)"
  
  shares: number
  capital_invested: number
  
  gross_return_pct: number
  net_return_pct: number    // después de comisiones y slippage
  
  hold_days: number
  
  benchmark_return_in_period: number  // retorno del S&P en el mismo período
  alpha_vs_benchmark: number
  
  backtest_id: string
  strategy: string
}
```

---

## 8. Datos históricos que se necesitan por empresa

Para cada empresa y año del período de backtest:

```
Precio diario (OHLCV) — desde Stooq
EPS TTM al cierre de cada trimestre — manual o Yahoo Finance
BVPS al cierre de cada trimestre — manual o Yahoo Finance
Deuda total trimestral — manual o Yahoo Finance
Current ratio trimestral — manual o Yahoo Finance
```

**Limitación crítica**: Los datos de fundamentales históricos trimestral son difíciles de obtener automáticamente y de forma confiable sin una fuente pagada.

**Opción práctica para empezar**:
- Usar el snapshot de fundamentales más reciente (como proxy)
- Aplicar backtesting solo sobre el precio, usando los fundamentales actuales
- Documentar claramente esta simplificación como sesgo del backtest

---

## 9. Reproducibilidad

Para que un backtest sea reproducible:

```json
{
  "code_version": "1.0.0",
  "strategy_version": "1.0",
  "data_source_version": "stooq_2026-06-03",
  "parameters_hash": "sha256:abc123...",
  "device_id": "laptop-eduardo-01",
  "run_at": "2026-06-03T18:00:00-06:00",
  "random_seed": 42
}
```

Los resultados con el mismo `code_version` + `strategy_version` + `data_source_version` + `parameters_hash` deben ser idénticos.

---

## 10. Tests de backtesting con datasets pequeños

Para validar el motor sin correr backtest completo:

```javascript
// backtesting/tests/test-mini-dataset.js

// Dataset de 3 empresas, 2 años, datos simplificados
import miniUniverse from './fixtures/mini_universe.json'

// Test 1: Empresa que cumple Graham todo el período → debe comprar y mantener
// Test 2: Empresa que sale de criterios Graham → debe vender
// Test 3: Stop loss: empresa cae -20% → debe salir

// Resultado esperado documentado para validación
```

---

## 11. Roadmap del backtesting

| Paso | Descripción | Prioridad | Dependencias |
|------|-------------|-----------|-------------|
| 1 | Crear carpeta `backtesting/` con estructura | Alta | — |
| 2 | Descargar precios históricos de Stooq para las 10 empresas | Alta | — |
| 3 | Crear `backtesting/strategies/graham-defensive.js` | Alta | Paso 2 |
| 4 | Crear motor de ejecución de backtests | Alta | Pasos 2-3 |
| 5 | Calcular métricas básicas (retorno, drawdown, win rate) | Media | Paso 4 |
| 6 | Comparar vs benchmark S&P 500 | Media | Paso 5 |
| 7 | Crear reporte HTML de resultados | Media | Paso 6 |
| 8 | Agregar datos fundamentales históricos | Alta | Manual |
| 9 | Crear las 8 estrategias restantes | Media | Paso 8 |
| 10 | Crear tests de backtesting | Media | Paso 4 |
| 11 | Integrar resultados con BD SQLite | Media | Paso 4 + BD |
