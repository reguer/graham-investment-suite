# Classification Logic

`classify(ratios)` devuelve un objeto con `id`, `label`, `color` y `reason`.

## Arbol de decision

1. **APROBADA GRAHAMIANA**
   Requiere `pePb <= 22.5`, `debtRatio < 1`, `currentRatio >= 2`, `epsAllPositive = true`, `pe <= 20` y `pb <= 2`.

2. **EXCELENTE, PERO CARA**
   Requiere que la empresa pase la base defensiva de balance y liquidez, que la rentabilidad operativa actual sea fuerte y que la valuacion quede fuera del rango Graham. En la practica: deuda/corriente dentro del perfil sectorial, `pe > 0`, `roe > 0.10`, `roa > 0.05`, `tie > 5`, `quickRatio >= 1`, `fcf > 0`, y al menos uno de `pe`, `pb` o `pePb` por arriba del techo del sector.

3. **BUENA EMPRESA, SOBREVALORADA**
   Pasa la base defensiva de balance y liquidez, pero no alcanza la fortaleza operativa de la categoria anterior. Sigue siendo una empresa analizable, solo demasiado cara para Graham.

4. **RECHAZADA**
   Default cuando no cumple los criterios anteriores.

## Edge cases

- `pe = 20` puede pasar APROBADA si lo demas cumple.
- `pePb = 22.5` puede pasar APROBADA si lo demas cumple.
- `pe = 20.01` no pasa APROBADA.
- Si EPS es negativo o cero, `pe = null`; la UI muestra `N/A (EPS negativo)` y la clasificacion normalmente cae en RECHAZADA.
- `tie = Infinity` pasa la condicion `tie > 5`.
