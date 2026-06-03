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
