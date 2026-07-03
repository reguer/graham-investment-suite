# Formulas Graham Analyzer

Todas las formulas usan numeros capturados manualmente desde Yahoo Finance. `p()` acepta comas, negativos y devuelve `null` para datos vacios o invalidos.

## Valuacion

- `epsAdj = epsTTM x adrRatio` si es ADR; si no, `epsTTM`.
- `bvps = (equity / sharesOutstanding) x adrRatio` si es ADR.
- `tangibleBvps = (tangibleEquity / sharesOutstanding) x adrRatio` si es ADR.
- `pe = price / epsAdj`. Si `epsAdj <= 0`, `pe = null`.
- `pb = price / bvps`.
- `pePb = pe x pb`.

## Patrimonio tangible

- Si `netTangibleAssets > 0`, `tangibleEquity = netTangibleAssets`.
- Si `netTangibleAssets` esta vacio, nulo o es menor o igual a cero, `tangibleEquity = equity - intangiblesTotal`.

## Liquidez y deuda

- `currentRatio = currentAssets / currentLiabilities`.
- `quickRatio = (currentAssets - inventory) / currentLiabilities`.
- `debtRatio = totalLiabilities / equity`.
- `tie = ebit / interestExpense`.
- Si `interestExpense = 0` y `ebit > 0`, `tie = Infinity`.

## Rentabilidad y flujo

- `netMargin = netIncome / revenue`.
- `roe = netIncome / equity`.
- `roa = netIncome / totalAssets`.
- `fcf = operatingCF + investingCF`. Investing CF normalmente ya viene negativo.

## Precios Graham

- `pricePE15 = epsAdj x 15`. Si EPS no es positivo, `null`.
- `pricePB15 = bvps x 1.5`.
- `grahamFormula = sqrt(22.5 x epsAdj x bvps)`. Si EPS no es positivo, `null`.
- `grahamFormulaTangible = sqrt(22.5 x epsAdj x tangibleBvps)`. Si EPS no es positivo, `null`.
- `ncav = ((currentAssets - totalLiabilities) / sharesOutstanding) x adrRatio`.
- `mosGraham = (grahamFormula - price) / price`.
- `mosGrahamTangible = (grahamFormulaTangible - price) / price`.

## EPS historico

El array esta ordenado del ano mas reciente al mas antiguo. `epsGrowing = true` si cada EPS mas reciente es mayor o igual al siguiente ano mas antiguo. `epsAllPositive = true` solo si todos los EPS capturados son mayores a cero.

## Decision TSM / ADR

Se adopta la regla explicita del handoff actual: ADR ajusta EPS, BVPS, TBVPS y NCAV por `adrRatio`. Para TSM:

- `epsAdj = 10.55 x 5 = 52.75`.
- `bvps = (171,799,401 / 25,932,525) x 5 = 33.1243`.
- `pe = 371 / 52.75 = 7.0332`.
- `pb = 371 / 33.1243 = 11.2002`.
- `pePb = 78.7732` usando ratios sin redondeo intermedio.
- `ncav = ((121,525,973 - 80,758,462) / 25,932,525) x 5 = 7.8603`.

Por lo tanto no se aceptan tests que esperen `P/E ~31.92`, `P/B ~2.24` o NCAV negativo con este mismo fixture y `adrRatio = 5`.

## Ingesta automatica Yahoo / FX

La formula Graham pura no cambia. Para snapshots automaticos desde Yahoo Finance se normalizan los datos antes de calcular:

- La moneda objetivo del dashboard es USD, salvo que se indique otra con `--expected-currency`.
- Si Yahoo reporta precio o estados financieros en otra moneda, se consulta un par FX de Yahoo Finance, por ejemplo `CNYUSD=X`, `KRWUSD=X` o el inverso disponible.
- Los montos de balance, income statement y cash flow se convierten a la moneda objetivo antes de calcular ratios.
- Si el precio listado y el EPS anual reportado no estan en la misma escala de accion o ADR, se infiere `shareScale = (price / trailingPE) / epsAnnualConverted`.
- Esa escala se aplica a EPS historico, BVPS, TBVPS y NCAV para alinear el analisis con el instrumento comprable.
- Si los datos necesarios siguen ausentes o no son aplicables, la empresa se marca como `yahoo_model_rejected` cuando puede descartarse por modelo, o queda pendiente solo si el instrumento no es una accion analizable por Graham, como indices o futuros.

Esta decision permite analizar empresas no SEC con moneda local, como BIDU en CNY o SKHYNIX en KRW, sin mezclar monedas ni aceptar ratios de fuentes incompatibles.

## Motor Buffett — parametros aprobados 2026-07-03

Fuente de verdad de los defaults del motor Buffett (E25/E26). Cambiarlos exige actualizar tests y esta seccion.

### Owner earnings (S81)
- `ownerEarnings = operatingCF - maintenanceCapex`.
- Si falta operating CF o maintenance capex, se devuelve `null` con razon legible; nunca se rellena con cero.

### Maintenance capex (S82, factores aprobados)
Jerarquia conservadora:
1. Disclosure explicito de la empresa, si existe.
2. Asset-heavy (utilities, industrial, energy, basic materials, semis): `max(min(capex, D&A), 0.8 x D&A)`.
3. Asset-light (software/SaaS/cloud): `min(capex, 0.6 x D&A)`.
4. Balanceado: `min(capex, D&A)`.

Los factores `0.8` y `0.6` quedan aprobados con sesgo conservador (subestiman owner earnings antes que inflarlos).

### buffettQualityScore (S84, pesos aprobados)
Promedio ponderado sobre los componentes con dato disponible (los pesos se renormalizan si falta alguno):

| Componente | Peso |
|------------|------|
| ownerEarningsQuality | 0.20 |
| capitalAllocation | 0.20 |
| fcfConsistency | 0.20 |
| profitability | 0.15 |
| marginStability | 0.10 |
| returns (proxy ROE/ROA) | 0.10 |
| intangibleDependence | 0.05 |

Calibrado contra un perfil de alta calidad real (Apple 10-K FY2020-2024) vs un ciclico debil. No aprueba compra por si solo; Graham sigue siendo freno separado.

### DCF Buffett (S85, defaults aprobados)
- `requiredReturn = 10%` (retorno exigido estilo Buffett, ~ retorno historico de bolsa).
- `terminalGrowth = 2.5%` (<= crecimiento de largo plazo de la economia; siempre menor que requiredReturn).
- `forecastYears = 10`. Escenarios `bear/base/bull`; el crecimiento base nunca supera el CAGR historico ni el techo sectorial. Sin DCF si hay menos de 5 anos limpios.
