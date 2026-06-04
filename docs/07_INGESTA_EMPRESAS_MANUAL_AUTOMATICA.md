# 07 — Ingesta de Empresas: Manual y Automática

> Diseño de los flujos para agregar empresas al sistema — tanto manualmente como de forma automática — y para mantener actualizado el universo de análisis.

---

## 1. Estado actual

| Aspecto | Estado |
|---------|--------|
| Catálogo de empresas | 10 hardcodeadas en `src/tools/graham-analyzer/candidates.js` |
| Proceso de ingesta | No existe — solo edición manual del archivo |
| Script de adición | No existe |
| BD de empresas | No existe |
| Importación CSV | No existe |
| Actualización automática | No existe para fundamentales; parcial para precios (Stooq) |

Para agregar una empresa actualmente: editar `candidates.js` directamente (requiere conocer el código).

---

## 2. Flujo A: Ingesta manual de empresas

### Opción A.1 — Comando por terminal (propuesto)

Script propuesto `scripts/add-company.js`:

```powershell
# Agregar empresa simple
node scripts/add-company.js --ticker MSFT --exchange NASDAQ --type empresa --source yahoo

# Agregar con todas las opciones
node scripts/add-company.js `
  --ticker MSFT `
  --name "Microsoft Corporation" `
  --exchange NASDAQ `
  --country USA `
  --type empresa `
  --sector Technology `
  --industry "Software & Services" `
  --currency USD `
  --source yahoo `
  --tags "core_universe,watchlist,tech" `
  --watchlist default `
  --priority 1

# Agregar índice de referencia
node scripts/add-company.js --ticker "^GSPC" --name "S&P 500" --type indice --source yahoo --tags index_reference

# Agregar ETF
node scripts/add-company.js --ticker SPY --name "SPDR S&P 500 ETF" --type etf --source yahoo --tags index_reference
```

**Campos obligatorios**: `--ticker`, `--type`, `--source`
**Campos opcionales**: todos los demás

### Opción A.2 — Archivo JSON de importación

Crear un archivo en `data/import/companies_to_add.json`:

```json
[
  {
    "ticker": "MSFT",
    "name": "Microsoft Corporation",
    "exchange": "NASDAQ",
    "country": "USA",
    "type": "empresa",
    "sector": "Technology",
    "industry": "Software & Services",
    "currency": "USD",
    "source": "yahoo",
    "tags": ["core_universe", "watchlist"],
    "priority": 1
  },
  {
    "ticker": "^GSPC",
    "name": "S&P 500",
    "type": "indice",
    "source": "yahoo",
    "tags": ["index_reference"]
  }
]
```

Importar con:
```powershell
node scripts/import-companies.js --file data/import/companies_to_add.json
```

### Opción A.3 — Archivo CSV de importación

Formato del archivo `data/import/companies_to_add.csv`:

```csv
ticker,name,exchange,country,type,sector,currency,source,tags,priority
MSFT,Microsoft Corporation,NASDAQ,USA,empresa,Technology,USD,yahoo,"core_universe,watchlist",1
AAPL,Apple Inc.,NASDAQ,USA,empresa,Technology,USD,yahoo,"core_universe",2
^GSPC,S&P 500,,,indice,,USD,yahoo,"index_reference",
```

Importar con:
```powershell
node scripts/import-companies.js --file data/import/companies_to_add.csv
```

### Proceso de validación al agregar empresa manualmente

```
1. Verificar que el ticker no exista ya en la BD
2. Validar que el ticker tenga formato correcto
3. Si source=yahoo: intentar buscar precio actual en Stooq para validar que existe
4. Crear registro en companies con status='needs_manual_review' si faltan datos
5. Crear registro en data_quality indicando qué datos faltan
6. Si la empresa está en watchlist: crear registro en watchlist_companies
7. Registrar en classification_history el estado inicial
8. Registrar device_id de quién la agregó
```

---

## 3. Flujo B: Ingesta automática local

**IMPORTANTE**: Este flujo es una propuesta. No existe ningún script de ingesta automática en el repositorio actual.

### Arquitectura del proceso automático

```
data-ingestion.js (propuesto)
    ↓
1. Leer lista de empresas desde BD (o candidates.js si no hay BD)
    ↓
2. Para cada empresa:
    a. Obtener precio actual → Stooq (ya implementado en priceSources.js)
    b. Obtener fundamentales → Yahoo Finance (propuesto con yahoo-finance2)
    c. Obtener EPS histórico → Yahoo Finance (propuesto)
    ↓
3. Validar moneda (usd_validated)
    ↓
4. Guardar en BD con metadata completa
    ↓
5. Calcular métricas → calcRatios()
    ↓
6. Actualizar classify → classify()
    ↓
7. Actualizar estado → mapClassificationToStatus()
    ↓
8. Detectar cambios de estado → registrar en classification_history
    ↓
9. Evaluar reglas de alerta → alertas si aplica
    ↓
10. Actualizar data_quality
    ↓
11. Registrar en .local_runtime/logs/
```

### Script propuesto: `scripts/data-ingestion.js`

```javascript
// scripts/data-ingestion.js — PROPUESTO (no existe)

// Argumentos
// --mode price-only | fundamentals | full
// --tickers TICKER1,TICKER2 | --all
// --force-refresh   (actualizar aunque datos sean frescos)
// --dry-run         (calcular pero no guardar)

// Ejemplo de uso:
// node scripts/data-ingestion.js --mode price-only --all
// node scripts/data-ingestion.js --mode full --tickers KBH,MTH
// node scripts/data-ingestion.js --mode fundamentals --tickers MSFT
```

---

## 4. Catálogo base inicial recomendado

### Empresas ya en el sistema (10)

Estas ya están en `candidates.js` y deben migrarse a la BD al implementarla:

| Ticker | Nombre | Sector | Estado actual |
|--------|--------|--------|--------------|
| PHM | PulteGroup | Residential Construction | READY_TO_BUY |
| LEN | Lennar | Residential Construction | READY_TO_BUY |
| TOL | Toll Brothers | Residential Construction | READY_TO_BUY |
| TMHC | Taylor Morrison | Residential Construction | READY_TO_BUY |
| MTH | Meritage Homes | Residential Construction | READY_TO_BUY |
| CTSH | Cognizant | IT Services | READY_TO_BUY |
| INGR | Ingredion | Food Products | READY_TO_BUY |
| MHO | M/I Homes | Residential Construction | READY_TO_BUY |
| KBH | KB Home | Residential Construction | READY_TO_BUY |
| GRBK | Green Brick Partners | Residential Construction | READY_TO_BUY |

### Empresas sugeridas para `does_not_meet_parameters_yet`

Empresas importantes que probablemente no cumplan Graham hoy, pero que vale tener en el universo para monitorear:

| Ticker | Nombre | Razón de monitoreo |
|--------|--------|-------------------|
| AAPL | Apple | Valuación premium, company quality alta |
| MSFT | Microsoft | Alto P/B pero fundamentales excelentes |
| BRK.B | Berkshire Hathaway | Referencia para valor intrínseco |
| JNJ | Johnson & Johnson | Defensiva, dividendo |
| PG | Procter & Gamble | Defensiva, dividendo |

### Índices de referencia

| Ticker | Nombre | Para qué |
|--------|--------|---------|
| ^GSPC | S&P 500 | Benchmark principal |
| ^IXIC | Nasdaq Composite | Benchmark tech |
| ^DJI | Dow Jones | Referencia industrial |
| ^MXX | IPC México | Benchmark mercado mexicano |

---

## 5. Frecuencia de actualización por tipo de dato

| Dato | Frecuencia recomendada | Fuente |
|------|----------------------|--------|
| Precios spot | Diario al cierre | Stooq (ya implementado) |
| Precios históricos | Semanal | Stooq histórico (propuesto) |
| Fundamentales | Trimestral (en temporada de resultados) | Yahoo Finance (propuesto) |
| EPS histórico | Anual o en resultados | Yahoo Finance (propuesto) |
| Metadatos empresa | On-demand | Manual |
| Ratios calculados | Diario (con precio nuevo) | Cálculo local |
| Datos de calidad | Diario | Automático |

---

## 6. Validaciones al ingresar datos

| Validación | Qué verificar | Acción si falla |
|-----------|--------------|----------------|
| Ticker único | No duplicado en BD | Rechazar, mostrar empresa existente |
| Formato de ticker | Solo letras, números, `.` y `^` | Rechazar con mensaje |
| Moneda | Si no es USD, solicitar confirmación | Mostrar advertencia |
| Magnitud datos | Verificar orden de magnitud vs precio | Advertencia si EPS parece en millones |
| Stooq existe | Intentar fetch de precio | Advertencia si no se encuentra |
| Datos completos | Todos los campos obligatorios | Listar campos faltantes |
| Fecha reciente | Data < 90 días | Advertencia si es vieja |

---

## 7. Estructura de carpetas para datos de ingesta

```
data/
├── graham_suite.db           ← BD SQLite principal (no versionar)
├── import/
│   ├── companies_to_add.json ← Cola de empresas a agregar
│   ├── companies_to_add.csv  ← Alternativa en CSV
│   └── (archivos procesados se mueven a import/processed/)
├── export/
│   ├── screening_YYYY-MM-DD.csv
│   └── companies_YYYY-MM-DD.json
└── cache/
    ├── stooq_YYYY-MM-DD.json  ← Cache de precios Stooq del día
    └── yahoo_TICKER.json      ← Cache de fundamentales Yahoo Finance
```

Añadir a `.gitignore`:
```
data/*.db
data/*.db-shm
data/*.db-wal
data/cache/
data/export/
```

Versionar en git (si no contienen datos sensibles):
```
data/import/companies_to_add.json  (plantilla, sin datos reales)
data/import/companies_to_add.csv   (plantilla, sin datos reales)
```

---

## 8. Roadmap de scripts de ingesta

| Script | Propósito | Prioridad | Estado |
|--------|-----------|-----------|--------|
| `scripts/add-company.js` | Agregar empresa individual | Alta | Propuesto |
| `scripts/import-companies.js` | Importar lista JSON/CSV | Alta | Propuesto |
| `scripts/data-ingestion.js` | Actualización automática | Alta | Propuesto |
| `scripts/migrate-candidates.js` | Migrar candidates.js → BD | Media | Propuesto |
| `scripts/add-index.js` | Agregar índice/ETF | Media | Propuesto |
| `scripts/update-fundamentals.js` | Actualizar solo fundamentales | Media | Propuesto |

---

## 9. Preguntas frecuentes

### ¿Cómo agrego una empresa hoy (antes de implementar la BD)?

1. Abrir `src/tools/graham-analyzer/candidates.js`
2. Copiar un objeto existente como template
3. Llenar los campos con datos de Yahoo Finance
4. Guardar el archivo
5. Verificar con `npm test` que no se rompió nada

### ¿Qué pasa si Yahoo Finance no tiene datos de la empresa?

- Marcar `status: 'missing_data'` en la BD
- El sistema no calculará métricas
- No se emitirán alertas
- El usuario recibirá aviso de datos insuficientes

### ¿Puedo agregar empresas mexicanas?

Sí, pero con pasos adicionales:
1. Verificar que el ticker en Stooq esté disponible (formato: `ticker.mx`)
2. Los fundamentales pueden estar en MXN — verificar y convertir a USD
3. Documentar en `notes` el tipo de cambio utilizado
