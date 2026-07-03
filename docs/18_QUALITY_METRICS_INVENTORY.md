# 18 - Inventario Base de Metricas de Calidad

> S67. Foto del estado actual de `data/public/companies.json` y de las capas Yahoo/SEC antes de construir Score Calidad V2.

## Objetivo

Separar que metrica ya existe hoy de forma automatica, cual llega solo parcialmente y cual sigue fuera del alcance automatico.

## Tabla base

| Metrica | Tipo | `companies.json` | Yahoo snapshot | SEC snapshot | Nota |
|---|---|---|---|---|---|
| Revenue | Automatica | `missing` | `available` | `missing` | No se persiste hoy en el export publico; Yahoo anual si lo trae. |
| EPS historico | Automatica | `available` | `available` | `available` | `epsHistory` ya existe y tolera gaps reales. |
| FCF | Automatica | `available` | `available` | `partial` | En SEC actual solo quedan insumos del ultimo ano dentro de `secSnapshot`. |
| Shares outstanding | Automatica | `partial` | `available` | `partial` | El export lo conserva solo cuando existe `secSnapshot`. |
| Gross margin | Automatica | `missing` | `partial` | `missing` | No se persiste; depende de `grossProfit` en el raw anual. |
| Operating margin | Automatica | `missing` | `available` | `missing` | Se puede derivar de EBIT u operating income sobre revenue. |
| Net margin | Automatica | `missing` | `available` | `missing` | Requiere revenue e income por ano; hoy no se guarda en export. |
| Goodwill / intangibles | Automatica | `partial` | `partial` | `partial` | Solo quedan proxies tangibles (`pbTangible`, `tangibleBvps`), no la serie bruta. |
| Liquidity | Automatica | `available` | `available` | `available` | `currentRatio` y `quickRatio` ya se exportan. |
| Leverage | Automatica | `available` | `available` | `available` | `debtRatio` ya se exporta; puede quedar N/D en financieras. |
| ROE / ROA | Automatica | `available` | `available` | `available` | Sirve como calidad automatica, no como moat. |
| Moat | Manual | `missing` | `missing` | `missing` | Requiere captura manual con fuente y fecha. |
| Contratos / concentracion clientes | Manual | `missing` | `missing` | `missing` | No debe inferirse automatico. |
| Regulacion favorable / riesgo regulatorio | Manual | `missing` | `missing` | `missing` | Requiere evidencia manual. |
| Calidad directiva | Manual | `missing` | `missing` | `missing` | Requiere revision humana; no usar proxies automaticos. |

## Lectura operativa

- El export publico ya sirve para reusar `epsHistory`, `fcf`, liquidez, leverage, `roe` y `roa`.
- La capa nueva de series debera reconstruir `revenue`, `shares` y margenes desde Yahoo/SEC sin inventar anos faltantes.
- `moat`, contratos, regulacion, clientes clave y calidad directiva siguen fuera del alcance automatico y no deben mezclarse con scoring cuantitativo.
