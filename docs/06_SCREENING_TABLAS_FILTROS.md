# 06 — Screening, Tablas de Empresas y Filtros

> Diseño de la tabla principal de dashboard, estados del sistema, filtros y cómo se mapea el sistema actual (`screen.js`) a la arquitectura propuesta.

---

## 1. Estado actual del screening

El proyecto tiene un motor de screening funcional en `src/tools/watchlist/screen.js`:

```javascript
// Funciones verificadas en el código:
deriveSnapshot(candidate)      // Calcula ratios desde snapshot de fundamentales
evaluateCandidate(candidate, policy)  // Aplica política de alerta
screenWatchlist(watchlist, quotes, policy)  // Procesa toda la watchlist
summarizeScreen(results)       // Agrupa en approved/near/watch
```

**Limitaciones actuales**:
- Solo 10 empresas hardcodeadas en `candidates.js`
- No persiste resultados en base de datos
- Los snapshots de fundamentales están fijos en el código (no se actualizan automáticamente)
- No hay clasificación por estado más allá de approved/near/watch

---

## 2. Tabla principal del dashboard (diseño)

Columnas propuestas para la vista de screening:

| # | Columna | Descripción | Ejemplo |
|---|---------|-------------|---------|
| 1 | **Ticker** | Símbolo bursátil | KBH |
| 2 | **Nombre** | Nombre de la empresa | KB Home |
| 3 | **Tipo** | Empresa / Índice / ETF | Empresa |
| 4 | **País** | País de origen | USA |
| 5 | **Exchange** | Mercado | NYSE |
| 6 | **Sector** | Sector GICS | Residential Construction |
| 7 | **Industria** | Industria | Homebuilding |
| 8 | **Precio** | Último precio disponible | $51.45 |
| 9 | **Moneda** | Moneda del precio | USD |
| 10 | **USD Validado** | ¿Confirmado en USD? | ✓ |
| 11 | **Fuente** | Fuente del último precio | Stooq |
| 12 | **Última actualización** | Fecha/hora del dato | 2026-06-03 17:55 CDMX |
| 13 | **P/E** | Price to Earnings | 9.93 |
| 14 | **P/B** | Price to Book | 0.84 |
| 15 | **P/E×P/B** | Producto (≤22.5 ideal) | 8.30 |
| 16 | **Deuda/Equity** | Ratio de endeudamiento | 0.71 |
| 17 | **Current Ratio** | Liquidez corriente | 8.70 |
| 18 | **Margen de Seguridad** | MoS Graham | 64.2% |
| 19 | **EPS CAGR** | Crecimiento histórico EPS | 12.3% |
| 20 | **Score defensivo** | Score Graham 0-100 | 87 |
| 21 | **Score tendencia** | Score técnico 0-100 | N/A |
| 22 | **Score valuación** | Score de precio 0-100 | 92 |
| 23 | **Estado Graham** | Clasificación actual | APROBADA GRAHAMIANA |
| 24 | **Estado final** | Estado del sistema | READY_TO_BUY |
| 25 | **Etiquetas** | Tags del sistema | graham-approved, homebuilder |
| 26 | **Razón** | Por qué tiene ese estado | pePb=8.3 ≤ 22.5, debt=0.71 < 1 |
| 27 | **Condición faltante** | Qué falta para compra | — |
| 28 | **Próxima alerta** | Cuándo se espera la siguiente | Viernes 18:00 CDMX |
| 29 | **Última alerta** | Última alerta emitida | 2026-06-03 |
| 30 | **Acción** | Ver detalle, Analizar, Ignorar | [Ver] |

---

## 3. Estados del sistema (10 estados)

Estos estados son más granulares que la clasificación Graham actual (4 categorías):

| Estado | Color | Descripción | Mapeado desde classify.js |
|--------|-------|-------------|--------------------------|
| `READY_TO_BUY` | 🟢 Verde | Cumple Graham + precio en zona | APROBADA GRAHAMIANA con MoS > 0 |
| `WATCHLIST` | 🔵 Azul | Bajo seguimiento activo | Cualquier empresa en la watchlist |
| `STRONG_TREND_EXCEPTION` | 🟡 Amarillo | Tendencia fuerte aunque no cumpla 100% | Futuro: análisis técnico |
| `WAIT_FOR_PRICE` | 🟡 Amarillo | Buenos fundamentales, precio muy alto | EXCELENTE PERO CARA |
| `WAIT_FOR_FUNDAMENTALS` | 🟠 Naranja | Empresa importante, fundamentales pendientes | RECHAZADA por una sola condición |
| `DATA_INCOMPLETE` | ⚪ Gris | Faltan datos para calcular | Sin datos suficientes |
| `DATA_STALE` | ⚪ Gris oscuro | Datos tienen >30 días | Datos vencidos |
| `INDEX_REFERENCE` | 🔵 Azul marino | Índice o ETF de referencia | No aplica Graham |
| `MANUAL_REVIEW` | 🟠 Naranja | Requiere revisión humana | Datos inconsistentes |
| `REJECTED_BY_RULES` | 🔴 Rojo | Rechazada explícitamente por criterios | RECHAZADA |

---

## 4. Mapeo de clasificación Graham → Estados del sistema

```
classify.js devuelve:
  APROBADA GRAHAMIANA   → READY_TO_BUY
  EXCELENTE PERO CARA   → WAIT_FOR_PRICE
  BUENA EMPRESA SOBREVALORADA → WAIT_FOR_PRICE (con lower priority)
  RECHAZADA             → REJECTED_BY_RULES o WAIT_FOR_FUNDAMENTALS
                          (dependiendo de cuántos criterios fallan)
```

---

## 5. Regla de la condición faltante

El sistema debe explicar **qué falta** para que una empresa pase a `READY_TO_BUY`. Esto se genera desde los criterios de Graham:

| Criterio | Condición | Ejemplo si falla |
|---------|-----------|-----------------|
| P/E×P/B | ≤ 22.5 | "P/E×P/B = 28.3 > 22.5 (falta bajar $12)" |
| P/E | ≤ 20 | "P/E = 25.1 (precio debe bajar a $X)" |
| P/B | ≤ 2 | "P/B = 2.4 (precio objetivo: $X)" |
| Deuda/Equity | < 1 | "Deuda = 1.3 (empresa muy endeudada)" |
| Current Ratio | ≥ 2 | "Current Ratio = 1.7 (mejora trimestral)" |
| EPS | > 0 | "EPS negativo en los últimos 2 años" |
| EPS creciente | Sí | "EPS decreció en 2024" |

---

## 6. Filtros disponibles en la tabla

### Filtros por estado
- Solo `READY_TO_BUY`
- Solo `WATCHLIST`
- Solo `WAIT_FOR_PRICE`
- Excluir `REJECTED_BY_RULES`
- Solo alertas activas

### Filtros por datos
- Solo datos frescos (<7 días)
- Excluir `DATA_STALE`
- Solo USD validado
- Solo con fundamentales completos

### Filtros por características
- Por sector
- Por exchange (NYSE, NASDAQ, BMV)
- Por país
- Por etiquetas (homebuilder, cyclical, tech, etc.)
- Por tipo (empresa, índice, ETF)

### Filtros por métricas (rangos numéricos)
- P/E entre X e Y
- P/B entre X e Y
- P/E×P/B ≤ N
- Deuda < N
- Current Ratio > N
- Margen de Seguridad > N%
- EPS CAGR > N%

### Filtros temporales
- Última alerta en los últimos N días
- Análisis guardado en los últimos N días
- Agregada al sistema en los últimos N días

---

## 7. Ordenamiento sugerido

| Orden | Criterio | Dirección |
|-------|---------|-----------|
| 1 (default) | Estado (READY_TO_BUY primero) | Ascendente |
| 2 | Margen de Seguridad | Descendente |
| 3 | P/E×P/B | Ascendente |
| 4 | Última actualización | Descendente |

---

## 8. Relación con el código actual

### Código que ya existe y debe aprovecharse

| Función existente | Archivo | Uso en screening |
|-------------------|---------|-----------------|
| `calcRatios(form)` | `src/tools/graham-analyzer/calcRatios.js` | Calcular todas las métricas |
| `classify(ratios)` | `src/tools/graham-analyzer/classify.js` | Obtener clasificación Graham |
| `getChecks(ratios)` | `src/tools/graham-analyzer/getChecks.js` | Verificar 10 criterios |
| `screenWatchlist(watchlist, quotes, policy)` | `src/tools/watchlist/screen.js` | Screening masivo |
| `evaluateCandidate(candidate, policy)` | `src/tools/watchlist/screen.js` | Evaluar una empresa |
| `fetchStooqQuotes(tickers)` | `src/tools/watchlist/priceSources.js` | Obtener precios actuales |
| `GRAHAM_LIMITS` | `src/tools/graham-analyzer/constants.js` | Umbrales de referencia |
| `alertFor(metric, value)` | `src/tools/graham-analyzer/constants.js` | Color semáforo por métrica |

### Código que necesita crearse (propuesto)

| Función propuesta | Archivo sugerido | Propósito |
|-------------------|-----------------|-----------|
| `mapClassificationToStatus(classification, ratios)` | `src/tools/watchlist/statusMapper.js` | Convertir classify → estados sistema |
| `getMissingConditions(ratios)` | `src/tools/watchlist/conditionChecker.js` | Qué falta para READY_TO_BUY |
| `screenDatabase(db, policy)` | `scripts/screen-database.js` | Screening desde BD SQLite |
| `generateScreeningTable(results)` | `scripts/generate-table.js` | Generar tabla HTML/MD |

---

## 9. Formato de la tabla en reportes Markdown

Ejemplo de la tabla actual en `reports/weekly/2026-06-03.md`:

```markdown
| Ticker | Empresa | Precio | Máx Defensivo | P/E | P/B | P/E×P/B | Deuda | Current | MoS | Estado |
|--------|---------|--------|--------------|-----|-----|---------|-------|---------|-----|--------|
| KBH | KB Home | $51.45 | $143.72 | 9.9 | 0.84 | 8.3 | 0.71 | 8.70 | 64.2% | ✅ APROBADA |
| MTH | Meritage | $68.12 | $97.11 | 12.5 | 0.89 | 11.1 | 0.80 | 8.80 | 42.2% | ✅ APROBADA |
```

**Propuesta de tabla ampliada** (para el nuevo sistema):

```markdown
| Ticker | Nombre | Estado | P/E | P/B | P/E×P/B | MoS | Fuente | Actualizado | Etiquetas |
|--------|--------|--------|-----|-----|---------|-----|--------|-------------|-----------|
| KBH | KB Home | 🟢 READY | 9.9 | 0.84 | 8.3 | 64.2% | Stooq | 2026-06-03 | graham-approved |
```

---

## 10. Scores propuestos (0-100)

### Score defensivo Graham

```
Criterio             Peso    Puntuación
P/E×P/B ≤ 22.5      30%     100 si ≤22.5, proporcional si ≤28
Deuda < 1            25%     100 si <0.5, proporcional hasta 1
Current Ratio ≥ 2    20%     100 si ≥3, proporcional hasta 2
EPS positivo          15%     100/0 (binario)
EPS creciente        10%     100/50/0 (creciendo/estable/decreciendo)
─────────────────────────────────────────
Score defensivo = suma ponderada × 100
```

### Score de valuación

```
Margen de Seguridad    50%     100 si MoS ≥ 30%, proporcional
P/E vs histórico       30%     Relativo al sector
P/B tangible           20%     Favorece P/B tangible < 1.5
```
