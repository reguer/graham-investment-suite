# 05 — Base de Datos Local de Empresas e Índices

> Propuesta de arquitectura para una base de datos local que permita gestionar un universo amplio de empresas, índices, ETFs y candidatos de inversión.
> El estado actual del repositorio **NO tiene base de datos**. Todo lo documentado aquí es una propuesta de diseño.

---

## 1. Estado actual

| Aspecto | Estado actual |
|---------|--------------|
| Base de datos | **No existe** |
| Persistencia | `localStorage` del navegador (máx. 50 análisis) |
| Catálogo de empresas | 10 hardcodeadas en `src/tools/graham-analyzer/candidates.js` |
| Índices | No existen en el sistema |
| ETFs | No existen en el sistema |
| Historial de alertas | No existe |
| Historial de precios | No existe |

---

## 2. Tecnología propuesta: SQLite

**Razón**: El proyecto usa Node.js. SQLite es la opción más natural para un sistema local sin servidor.

**Librería candidata**: `better-sqlite3` (sincrónica, sin callback hell, alta performance)

```powershell
# Instalar cuando se decida implementar
npm install better-sqlite3
```

**Alternativa**: Si se decide una BD más robusta en el futuro: `PostgreSQL` local, pero requiere servidor separado.

**Ruta del archivo**: `data/graham_suite.db` (crear carpeta `data/` y añadir `data/*.db` a `.gitignore`)

---

## 3. Etiquetas de estado del sistema

Estas etiquetas son el corazón del sistema de clasificación de empresas:

| Etiqueta | Descripción |
|----------|-------------|
| `ready_to_buy` | Cumple todos los criterios Graham, precio en zona de compra |
| `watchlist` | Bajo seguimiento, no cumple 100% pero es candidato potencial |
| `strong_trend_candidate` | Tendencia técnica fuerte, aunque no cumpla 100% Graham |
| `does_not_meet_parameters_yet` | Empresa importante que no cumple parámetros actualmente |
| `index_reference` | Índice de referencia (S&P 500, Nasdaq 100, IPC) |
| `needs_manual_review` | Requiere revisión humana por datos incompletos o inconsistentes |
| `missing_data` | Faltan datos fundamentales para calcular |
| `data_stale` | Datos tienen más de N días sin actualizar |
| `alert_active` | Tiene una alerta activa no vista |
| `alert_suppressed` | Alerta fue suprimida manualmente |
| `manual_override` | Un parámetro fue sobreescrito manualmente por el usuario |
| `high_priority` | Marcada como prioridad por el usuario |
| `core_universe` | Forma parte del universo principal de análisis |

---

## 4. Esquema de tablas propuesto

### Tabla: `companies`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | ID único |
| `ticker` | TEXT UNIQUE | Símbolo bursátil (ej. AAPL) |
| `name` | TEXT | Nombre de la empresa |
| `type` | TEXT | 'empresa', 'indice', 'etf' |
| `exchange_id` | INTEGER FK | Mercado donde cotiza |
| `sector_id` | INTEGER FK | Sector |
| `industry_id` | INTEGER FK | Industria |
| `country` | TEXT | País de origen |
| `currency_id` | INTEGER FK | Moneda de estados financieros |
| `price_currency_id` | INTEGER FK | Moneda del precio de mercado |
| `is_adr` | BOOLEAN | ¿Es un ADR? |
| `adr_ratio` | REAL | Ratio ADR (ej. 5 para TSM) |
| `primary_source` | TEXT | Fuente preferida de datos |
| `status` | TEXT | Etiqueta principal (ver sección 3) |
| `tags` | TEXT | JSON array de etiquetas adicionales |
| `notes` | TEXT | Notas libres del usuario |
| `added_at` | DATETIME | Cuándo se agregó al sistema |
| `added_by_device` | TEXT | device_id que la agregó |
| `last_reviewed_at` | DATETIME | Última revisión manual |
| `is_active` | BOOLEAN DEFAULT 1 | Si está activa en el universo |

**PK**: `id`
**UK**: `ticker`
**FK**: `exchange_id`, `sector_id`, `industry_id`, `currency_id`, `price_currency_id`

---

### Tabla: `exchanges`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | ID único |
| `code` | TEXT UNIQUE | Código (NYSE, NASDAQ, BMV, etc.) |
| `name` | TEXT | Nombre completo |
| `country` | TEXT | País |
| `timezone` | TEXT | Zona horaria (America/New_York) |
| `close_time_local` | TEXT | Hora de cierre local (16:00) |
| `close_time_cdmx` | TEXT | Hora de cierre CDMX (15:00/16:00) |

**Catálogo inicial**: NYSE, NASDAQ, BMV (México), LSE, TSE

---

### Tabla: `sectors`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE | Sector GICS (Technology, Financials, etc.) |
| `description` | TEXT | |

---

### Tabla: `industries`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `sector_id` | INTEGER FK | Sector padre |
| `name` | TEXT | Industria (Residential Construction, etc.) |
| `description` | TEXT | |

---

### Tabla: `currencies`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `code` | TEXT UNIQUE | USD, MXN, TWD, EUR, etc. |
| `name` | TEXT | Nombre |
| `fx_rate_usd` | REAL | Tasa de cambio vs USD |
| `fx_updated_at` | DATETIME | Última actualización de la tasa |
| `fx_source` | TEXT | Fuente de la tasa de cambio |

---

### Tabla: `price_history`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `date` | DATE | Fecha de la vela |
| `open` | REAL | Precio apertura |
| `high` | REAL | Precio máximo |
| `low` | REAL | Precio mínimo |
| `close` | REAL | Precio cierre |
| `volume` | INTEGER | Volumen |
| `currency` | TEXT | Moneda del precio |
| `usd_validated` | BOOLEAN | ¿Verificado en USD? |
| `source` | TEXT | 'stooq', 'yahoo', 'manual' |
| `retrieved_at` | DATETIME | Cuándo se descargó |
| `device_id` | TEXT | Desde qué equipo |

**PK**: `id`
**UK**: `(company_id, date)`
**Índice**: `(company_id, date DESC)`

---

### Tabla: `fundamentals`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `period` | TEXT | 'Q4-2025', 'FY-2025', 'TTM' |
| `period_end_date` | DATE | Fecha de fin del período |
| `report_type` | TEXT | 'quarterly', 'annual', 'ttm' |
| `total_assets` | REAL | |
| `current_assets` | REAL | |
| `inventory` | REAL | |
| `total_liabilities` | REAL | |
| `current_liabilities` | REAL | |
| `equity` | REAL | |
| `intangibles_total` | REAL | Goodwill + Intangibles |
| `net_tangible_assets` | REAL | Override si disponible |
| `shares_outstanding` | REAL | |
| `treasury_shares` | REAL | |
| `revenue` | REAL | |
| `gross_profit` | REAL | |
| `operating_income` | REAL | |
| `ebit` | REAL | |
| `interest_expense` | REAL | |
| `net_income` | REAL | |
| `eps_ttm` | REAL | EPS Trailing Twelve Months |
| `operating_cf` | REAL | Flujo operativo |
| `investing_cf` | REAL | Flujo de inversión (negativo) |
| `financing_cf` | REAL | Flujo de financiamiento |
| `currency` | TEXT | Moneda de los datos |
| `magnitude` | TEXT | 'thousands', 'millions', 'exact' |
| `usd_validated` | BOOLEAN | |
| `source` | TEXT | Fuente del dato |
| `retrieved_at` | DATETIME | |
| `is_manual` | BOOLEAN | ¿Capturado manualmente? |
| `device_id` | TEXT | |

**PK**: `id`
**UK**: `(company_id, period, report_type)`

---

### Tabla: `eps_history`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `year` | INTEGER | Año fiscal (2025, 2024, ...) |
| `eps` | REAL | EPS reportado |
| `eps_adj` | REAL | EPS ajustado por ADR ratio |
| `currency` | TEXT | |
| `usd_validated` | BOOLEAN | |
| `source` | TEXT | |
| `retrieved_at` | DATETIME | |

---

### Tabla: `financial_metrics`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `calculated_at` | DATETIME | Cuándo se calculó |
| `price_used` | REAL | Precio usado para el cálculo |
| `pe` | REAL | P/E ratio |
| `pb` | REAL | P/B ratio |
| `pb_tangible` | REAL | P/B tangible |
| `pe_pb` | REAL | P/E × P/B (criterio Graham ≤ 22.5) |
| `debt_ratio` | REAL | Deuda / Equity |
| `current_ratio` | REAL | |
| `quick_ratio` | REAL | |
| `tie` | REAL | Times Interest Earned |
| `net_margin` | REAL | |
| `roe` | REAL | |
| `roa` | REAL | |
| `fcf` | REAL | Free Cash Flow |
| `bvps` | REAL | Book Value per Share |
| `tangible_bvps` | REAL | |
| `ncav` | REAL | Net Current Asset Value |
| `graham_formula` | REAL | √(22.5 × EPS × BVPS) |
| `graham_formula_tangible` | REAL | |
| `margin_of_safety` | REAL | (GF - Price) / Price |
| `eps_cagr` | REAL | CAGR del EPS histórico |
| `eps_growing` | BOOLEAN | ¿EPS creciente? |
| `eps_all_positive` | BOOLEAN | ¿Todo EPS positivo? |
| `classification` | TEXT | APROBADA/EXCELENTE/BUENA/RECHAZADA |
| `classification_reason` | TEXT | Razón de la clasificación |
| `device_id` | TEXT | |

---

### Tabla: `alert_rules`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre de la regla |
| `company_id` | INTEGER FK NULL | NULL = aplica a todas |
| `metric` | TEXT | pe, pb, pe_pb, debt_ratio, etc. |
| `operator` | TEXT | '<', '>', '<=', '>=', '==', 'changes_to' |
| `threshold` | REAL | Valor umbral |
| `new_status` | TEXT | Estado a asignar si se cumple la condición |
| `priority` | INTEGER | 1=alta, 2=media, 3=baja |
| `enabled` | BOOLEAN | |
| `day_filter` | TEXT | 'all', 'monday', 'friday', 'weekday' |
| `created_at` | DATETIME | |

---

### Tabla: `alerts_emitted`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `rule_id` | INTEGER FK | |
| `ticker` | TEXT | |
| `company_name` | TEXT | |
| `previous_status` | TEXT | Estado antes de la alerta |
| `new_status` | TEXT | Estado que activó la alerta |
| `condition_triggered` | TEXT | Descripción de qué se cumplió |
| `price` | REAL | Precio al momento de la alerta |
| `currency` | TEXT | |
| `source` | TEXT | Fuente del dato que activó la alerta |
| `datetime_cdmx` | DATETIME | Fecha/hora en CDMX |
| `device_id` | TEXT | Equipo que generó la alerta |
| `device_name` | TEXT | |
| `severity` | TEXT | 'high', 'medium', 'low' |
| `channels_sent` | TEXT | JSON array de canales |
| `send_result` | TEXT | 'success', 'failed', 'skipped' |
| `error` | TEXT | Error si falló el envío |
| `is_new` | BOOLEAN | ¿Alerta nueva (no vista)? |
| `is_repeated` | BOOLEAN | ¿Ya se emitió antes? |
| `is_dismissed` | BOOLEAN | ¿Descartada por el usuario? |

---

### Tabla: `watchlists`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre de la watchlist |
| `description` | TEXT | |
| `is_default` | BOOLEAN | ¿Es la watchlist principal? |
| `created_at` | DATETIME | |

### Tabla: `watchlist_companies`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `watchlist_id` | INTEGER FK | |
| `company_id` | INTEGER FK | |
| `added_at` | DATETIME | |
| `reason` | TEXT | Por qué se agregó |
| `priority` | INTEGER | |

**PK**: `(watchlist_id, company_id)`

---

### Tabla: `classification_history`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `previous_status` | TEXT | |
| `new_status` | TEXT | |
| `reason` | TEXT | |
| `changed_at` | DATETIME | |
| `changed_by` | TEXT | 'system', 'manual', device_id |

---

### Tabla: `backtests`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre del backtest |
| `strategy` | TEXT | Estrategia probada |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `universe` | TEXT | JSON array de tickers |
| `parameters` | TEXT | JSON con parámetros |
| `created_at` | DATETIME | |
| `device_id` | TEXT | |

### Tabla: `backtest_results`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `backtest_id` | INTEGER FK | |
| `ticker` | TEXT | |
| `entry_date` | DATE | |
| `exit_date` | DATE | |
| `entry_price` | REAL | |
| `exit_price` | REAL | |
| `return_pct` | REAL | |
| `hold_days` | INTEGER | |
| `exit_reason` | TEXT | |
| `benchmark_return` | REAL | Retorno del benchmark en el mismo período |

---

### Tabla: `data_quality`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `company_id` | INTEGER FK | |
| `data_type` | TEXT | 'price', 'fundamentals', 'eps' |
| `last_updated_at` | DATETIME | |
| `staleness_days` | INTEGER | Días desde la última actualización |
| `staleness_status` | TEXT | 'fresh' (<7d), 'stale' (7-30d), 'expired' (>30d) |
| `missing_fields` | TEXT | JSON array de campos faltantes |
| `quality_score` | REAL | 0-1 |
| `source_used` | TEXT | |

---

### Tabla: `devices`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT PK | UUID único por ordenador |
| `name` | TEXT | Nombre descriptivo |
| `role` | TEXT | principal, secundario, solo-dashboard, solo-datos, solo-pruebas |
| `registered_at` | DATETIME | |
| `last_seen_at` | DATETIME | |
| `auto_push_enabled` | BOOLEAN | |
| `telegram_enabled` | BOOLEAN | |

---

## 5. Catálogo inicial propuesto

### Empresas del watchlist actual (10)

| Ticker | Nombre | Tipo | Estado inicial |
|--------|--------|------|----------------|
| PHM | PulteGroup | empresa | ready_to_buy |
| LEN | Lennar | empresa | ready_to_buy |
| TOL | Toll Brothers | empresa | ready_to_buy |
| TMHC | Taylor Morrison | empresa | ready_to_buy |
| MTH | Meritage Homes | empresa | ready_to_buy |
| CTSH | Cognizant Technology | empresa | ready_to_buy |
| INGR | Ingredion | empresa | ready_to_buy |
| MHO | M/I Homes | empresa | ready_to_buy |
| KBH | KB Home | empresa | ready_to_buy |
| GRBK | Green Brick Partners | empresa | ready_to_buy |

### Índices de referencia propuestos

| Ticker | Nombre | Tipo | Estado |
|--------|--------|------|--------|
| ^GSPC | S&P 500 | indice | index_reference |
| ^IXIC | Nasdaq Composite | indice | index_reference |
| ^DJI | Dow Jones | indice | index_reference |
| ^MXX | IPC México | indice | index_reference |
| QQQ | Invesco QQQ ETF | etf | index_reference |
| SPY | SPDR S&P 500 ETF | etf | index_reference |

---

## 6. Ruta del archivo de base de datos

```
data/
└── graham_suite.db    ← Base SQLite principal
```

Añadir a `.gitignore`:
```
data/*.db
data/*.db-shm
data/*.db-wal
```

La base de datos NO se versiona en git — es local por diseño.

---

## 7. Frecuencia de actualización por tabla

| Tabla | Frecuencia | Origen |
|-------|-----------|--------|
| `price_history` | Diaria al cierre | Automático (Stooq) |
| `fundamentals` | Trimestral | Manual + Yahoo Finance |
| `eps_history` | Anual | Manual + Yahoo Finance |
| `financial_metrics` | Diaria (con precio nuevo) | Automático (cálculo) |
| `alerts_emitted` | Tiempo real | Automático |
| `classification_history` | On-change | Automático |
| `data_quality` | Diaria | Automático |
| `companies` | On-demand | Manual |
| `watchlists` | On-demand | Manual |
| `backtests` | On-demand | Manual/Automático |
