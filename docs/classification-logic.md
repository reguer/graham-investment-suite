# Classification Logic

`classify(ratios)` devuelve un objeto con `id`, `label`, `color` y `reason`.

## Arbol de decision

1. **APROBADA GRAHAMIANA**
   Requiere `pePb <= 22.5`, `debtRatio < 1`, `currentRatio >= 2`, `epsAllPositive = true`, `pe <= 20` y `pb <= 2`.

2. **EXCELENTE, PERO CARA**
   Requiere empresa fuerte, EPS positivo, EPS creciente y valuacion fuera del rango Graham: `roe > 0.10`, `roa > 0.05`, `tie > 5`, `quickRatio >= 1`, `fcf > 0`, `epsAllPositive = true`, `epsGrowing = true`, `pePb > 22.5`.

3. **BUENA EMPRESA, SOBREVALORADA**
   Misma fortaleza financiera que la categoria anterior, con `epsAllPositive = true`, `pePb > 22.5` y `epsGrowing = false`.

4. **RECHAZADA**
   Default cuando no cumple los criterios anteriores.

## Edge cases

- `pe = 20` puede pasar APROBADA si lo demas cumple.
- `pePb = 22.5` puede pasar APROBADA si lo demas cumple.
- `pe = 20.01` no pasa APROBADA.
- Si EPS es negativo o cero, `pe = null`; la UI muestra `N/A (EPS negativo)` y la clasificacion normalmente cae en RECHAZADA.
- `tie = Infinity` pasa la condicion `tie > 5`.
