# Gestión del universo de empresas

Guía de comandos para **actualizar datos** y **añadir lotes de empresas nuevas**
diversificadas por sector. Todo desde la terminal (el dashboard es estático y
no puede escribir datos).

## Modelo de datos (importante)

- **`data/public/companies.json`** y **`public/data/companies.json`** = el catálogo
  (la fuente de verdad). El dashboard los lee; las pestañas Candidatas/Watchlist
  los muestran.
- **PostgreSQL es OPCIONAL.** Si no tienes `DATABASE_URL` configurado (o psql
  falla), los comandos siguen escribiendo el JSON igualmente.
- El dashboard NO escribe datos: "Guardar análisis" guarda en el localStorage del
  navegador, no en el catálogo.

---

## 1. Actualizar datos de las empresas existentes

| Quiero... | Comando |
|---|---|
| Refrescar **solo precios** (rápido, lo que más cambia) | `npm run universe:refresh` |
| Refrescar **fundamentales de las incompletas** | `npm run fundamentals:ingest` |
| Refrescar **fundamentales de TODAS** (tras reportes trimestrales) | `npm run fundamentals:ingest:all` |
| Correr el **pipeline completo** (igual que el scheduler) | `npm run weekly:pipeline` |

### Scheduler automático (lunes y viernes)
El task de Windows `GrahamInvestmentSuite-MondayFriday` corre `weekly:pipeline`,
que hace: `universe:sync` → `universe:refresh` (precios) →
`fundamentals:ingest --limit N` (solo incompletas) → `weekly:screen` (reportes).

⚠️ El scheduler **NO** refresca fundamentales de empresas ya analizadas. Para eso,
corre manualmente `npm run fundamentals:ingest:all` (p. ej. cada trimestre).

---

## 2. Añadir lotes de empresas NUEVAS

### Flujo completo (4 pasos)

```bash
# 1. (opcional) previsualizar sin escribir
npm run db:import -- --file data/import/MI-LOTE.json --dry-run

# 2. importar el lote al catálogo
npm run db:import -- --file data/import/MI-LOTE.json

# 3. extraer fundamentales de las nuevas (Yahoo + SEC)
npm run fundamentals:ingest

# 4. publicar (si usas GitHub Pages)
npm run deploy:pages
```

Los duplicados (tickers que ya tienes) se omiten automáticamente.

### Formato del archivo de import (JSON)

Array de objetos. Campos mínimos: `ticker`, `companyName`, `quoteType`, `sector`.
**Usa símbolos US directos** (NYSE/NASDAQ) — son los que Yahoo y SEC cubren bien.
NO uses sufijo `.MX` (la BMV SIC no entrega estados financieros y el análisis falla).

```json
[
  {
    "ticker": "JNJ",
    "yahooSymbol": "JNJ",
    "companyName": "Johnson & Johnson",
    "market": "US",
    "quoteType": "EQUITY",
    "country": "United States",
    "currency": "USD",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers General",
    "source": "seed-import-diversified",
    "tags": ["us-listed", "healthcare"],
    "notes": "Pendiente de extraer fundamentales."
  }
]
```

El `sector` lo usa `detectSector` para asignar el perfil Graham (tech/healthcare
usan P/B tangible; financial/reit omiten deuda/liquidez; etc.). Cuanto más exacto
el `sector`/`industry`, mejor la clasificación.

### CSV también vale
`db:import` acepta `.csv` con cabecera: `ticker,companyName,quoteType,sector,industry`.

### De dónde sacar tickers por sector
- Listas del S&P 500 por sector GICS (Wikipedia "List of S&P 500 companies").
- Screeners (finviz, Yahoo Screener) filtrando por sector + P/E bajo para candidatas value.
- El archivo `data/import/nuevas-por-sector.json` (creado en esta sesión) sirve de plantilla.

---

## 3. Eliminar empresas que no se pueden analizar

Si una empresa queda permanentemente en `pending_fundamentals` (típico de símbolos
`.MX` sin fundamentales en Yahoo), edita el JSON y quítala, o filtra por script.
No dejes registros muertos: ensucian Candidatas/Watchlist.

---

## Notas

- `fundamentals:ingest` (sin `:all`) procesa solo las que NO están `analyzed` —
  ideal tras un import para procesar únicamente las nuevas.
- Cada corrida de ingesta escribe el JSON **al final** (no incremental); verás el
  archivo cambiar de golpe al terminar.
- Tras cualquier cambio de datos: `npm run deploy:pages` para reflejarlo en el sitio público.
