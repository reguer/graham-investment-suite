# 04 — Pruebas y Validación Operativa

> Guía completa de comandos verificados, flujo de operación diaria, y diagnóstico de errores comunes.
> Solo se documentan comandos que existen y funcionan. Los comandos propuestos se indican explícitamente.

---

## 1. Comandos existentes y verificados

Todos los comandos siguientes están definidos en `package.json` y fueron verificados contra el repositorio actual.

### Instalar dependencias

```powershell
npm install
```

- Instala React, Vite, Vitest y demás dependencias definidas en `package.json`
- El archivo `yarn.lock` también existe — si se usa yarn: `yarn install`
- La primera instalación puede tardar varios minutos

### Correr tests unitarios

```powershell
npm test
```

Ejecuta las 4 suites de tests en modo single-run:

```
tests/calcRatios.test.js      — 8 tests  (fixture TSM + ADR logic)
tests/classify.test.js        — clasificación de 4 categorías
tests/formatters.test.js      — parsing y formateo numérico
tests/watchlist-screen.test.js — motor de screening semanal
```

**Resultado esperado**: `✓ XX tests passed`

**Test crítico que NUNCA debe fallar**:
```
TSM con adrRatio=5 debe producir:
  P/E ≈ 7.03
  P/B ≈ 11.20
  P/E×P/B ≈ 78.77
  NCAV ≈ 7.86 (positivo)
```

### Modo watch de tests

```powershell
npm run test:watch
```

Mantiene Vitest corriendo y re-ejecuta tests al detectar cambios en archivos.

### Build para producción / GitHub Pages

```powershell
npm run build
```

Genera `dist/` con el bundle optimizado.

- Si `GITHUB_ACTIONS=true`: la base URL es `/graham-investment-suite/`
- Si no: la base URL es `/`
- `dist/` está en `.gitignore` — no se versiona en rama main

### Dashboard local de desarrollo

```powershell
npm run dev
```

Inicia Vite en `http://localhost:5173` con Hot Module Replacement.

Para usar puerto alternativo:
```powershell
npm run dev -- --port 5174
```

### Validar y regenerar artifacts standalone

```powershell
npm run build:artifact
```

- Verifica que `artifacts/graham_analyzer.jsx` contenga `export default`
- Verifica que `artifacts/macro_radar.jsx` contenga `export default`
- Si no existen, crea placeholders con componentes React mínimos
- Si existen pero no tienen `export default`, lanza un error

### Screening semanal

```powershell
npm run weekly:screen
```

Equivalente a `npm run weekly:report`. Ejecuta `scripts/weekly-screen.js`:

1. Obtiene precios de las 10 empresas del watchlist desde Stooq
2. Recalcula métricas Graham con precios actualizados
3. Genera reporte en `reports/weekly/YYYY-MM-DD.md`
4. Muestra resumen en consola

---

## 2. Comandos que NO existen (documentados para referencia)

| Comando | Estado | Nota |
|---------|--------|------|
| `npm run lint` | No existe | No hay ESLint configurado |
| `npm run typecheck` | No existe | El proyecto es JavaScript, no TypeScript |
| `npm run test:integration` | No existe | Solo tests unitarios con Vitest |
| `npm run deploy` | No existe | Deploy se hace manualmente o sin script definido |
| `npm run preview` | No existe en scripts | Funciona como `npx vite preview` |
| `npm run start` | No existe | Usar `npm run dev` |

---

## 3. Flujo de operación diaria recomendado

### Al inicio del día (equipo principal)

```powershell
# 1. Verificar estado del repo
git status

# 2. Verificar tests
npm test

# 3. Iniciar dashboard local
npm run dev

# 4. Abrir en navegador
Start-Process "http://localhost:5173"
```

### Al cierre de vela (18:00 CDMX — lunes y viernes especialmente)

```powershell
# 1. Actualizar precios y generar reporte
npm run weekly:screen

# 2. Revisar reporte generado
Get-Content "reports/weekly/$(Get-Date -Format 'yyyy-MM-dd').md"

# 3. (Opcional) Build y deploy a GitHub Pages
npm run build
# npx gh-pages -d dist  ← si el mecanismo de deploy está configurado
```

### Análisis manual de una empresa

```
1. Abrir http://localhost:5173
2. Ir a Graham Analyzer → "Nuevo análisis"
3. Capturar datos desde Yahoo Finance:
   - Finance → Balance Sheet (Quarterly/Annual)
   - Finance → Income Statement
   - Finance → Cash Flow Statement
   - Summary → Price, Shares Outstanding
   - Statistics → EPS TTM, Net Tangible Assets
4. Ingresar datos en el formulario
5. Si es ADR: activar toggle "Es ADR" e ingresar el ratio
6. Ver resultados automáticos
7. (Opcional) Generar análisis IA
8. Guardar análisis
```

---

## 4. Cómo correr screening manual

```powershell
npm run weekly:screen
```

El script usa los precios de Stooq en tiempo real. Si Stooq no está disponible:
- El script intenta con datos de snapshot del `candidates.js`
- Se genera igualmente el reporte, pero con precios de la última actualización conocida

Para verificar el resultado:

```powershell
# Ver el reporte más reciente
$report = Get-ChildItem "reports/weekly/" | Sort-Object LastWriteTime | Select-Object -Last 1
Get-Content $report.FullName
```

---

## 5. Cómo validar GitHub Pages

```powershell
# Verificar que la URL pública responde
Invoke-WebRequest -Uri "https://reguer.github.io/graham-investment-suite/" -UseBasicParsing | Select-Object StatusCode

# Verificar el build local antes de deployar
npm run build
# Abrir dist/index.html en el navegador
Start-Process "dist/index.html"
```

---

## 6. Diagnóstico de fallos comunes

### Error: Puerto 5173 ocupado

```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solución**:
```powershell
# Verificar qué proceso usa el puerto
netstat -ano | findstr :5173

# Usar otro puerto para este proyecto
npm run dev -- --port 5174
```

### Error: VITE_ANTHROPIC_API_KEY no configurado

**Síntoma**: El botón "Generar análisis IA" falla con error de red o no responde.

**Diagnóstico**: La app funciona sin la clave — solo el análisis IA no está disponible.

**Solución**:
```powershell
# Crear .env.local con la clave
New-Item -Path ".env.local" -ItemType File
Add-Content ".env.local" "VITE_ANTHROPIC_API_KEY=sk-ant-..."
# Reiniciar npm run dev
```

### Error: Stooq no responde en weekly:screen

**Síntoma**: `npm run weekly:screen` genera el reporte pero con precios sin actualizar o con advertencia de fuente.

**Diagnóstico**: Revisar la consola durante la ejecución. Si aparece un error de red, Stooq puede estar rate-limiting o el formato del CSV cambió.

**Solución a corto plazo**: Los datos del último screening siguen siendo válidos para el análisis Graham (los fundamentales no cambian con la frecuencia de los precios).

### Error: Tests fallan en TSM fixture

```
Expected P/E to be ~7.03, got X.XX
```

**Causa probable**: Se modificó la lógica de `calcRatios.js` sin actualizar el fixture o los tests.

**Regla crítica**: El test de TSM es el guardián del invariante ADR. Si falla, algo rompió la lógica core.

**Diagnóstico**:
```powershell
# Ver el test específico
Get-Content "tests/calcRatios.test.js"

# Correr solo ese test
npx vitest run tests/calcRatios.test.js
```

### Error: Datos en miles vs millones causan ratios incorrectos

**Síntoma**: P/E aparece como 0.00007 o 70,000 en lugar de ~7.

**Causa**: Los datos se ingresaron en la unidad incorrecta.

**Convención del proyecto**:
- TSM fixture usa datos en **miles** (el campo totalAssets = 252,557,864 son miles de USD = ~$252 billones)
- Algunos datos de prefills usan **millones**
- La UI no indica la magnitud — el usuario debe saberlo

**Solución**: Verificar con Yahoo Finance que magnitud reporta para ese ticker y usar la misma.

### Error: `npm run build:artifact` falla

```
Error: artifacts/graham_analyzer.jsx debe contener export default.
```

**Causa**: El archivo existe pero fue editado accidentalmente y se eliminó el `export default`.

**Solución**: Verificar el archivo y añadir `export default` al componente principal.

---

## 7. Cómo revisar logs

```powershell
# Logs del dev server (si existen)
Get-Content "dev-server.log"

# Logs de error del dev server
Get-Content "dev-server.err.log"

# Reportes semanales (outputs del screening)
Get-ChildItem "reports/weekly/" | Sort-Object LastWriteTime
Get-Content "reports/weekly/2026-06-03.md"
```

---

## 8. Cómo confirmar que Yahoo Finance fue la fuente usada

Actualmente no hay metadatos automáticos de fuente en los análisis guardados. Para confirmar manualmente:

1. Revisar la fecha del análisis guardado en el historial
2. Comparar con los datos en Yahoo Finance para esa fecha
3. Verificar el campo `date` en el formulario de análisis

**En el futuro** (con la capa de datos propuesta en `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md`): cada registro incluirá `source_name`, `retrieved_at` y `usd_validated`.

---

## 9. Cómo confirmar que los precios están en USD

Para el screening semanal (Stooq):
- Los precios de Stooq para tickers `.us` están en USD
- Verificar que el reporte muestre `$` como prefijo o que el ticker tenga sufijo `.us`

Para el análisis manual:
- Los precios en Yahoo Finance para NYSE/Nasdaq están en USD
- Para ADRs: el precio del ADR en Yahoo Finance ya está en USD

---

## 10. Cómo confirmar que no hubo colisión de puertos

```powershell
# Verificar qué proceso usa el puerto 5173
netstat -ano | findstr :5173

# Si existe .local_runtime/dashboard.pid
$pid = Get-Content ".local_runtime/dashboard.pid" -ErrorAction SilentlyContinue
if ($pid) { Get-Process -Id $pid -ErrorAction SilentlyContinue }
```

---

## 11. Cómo confirmar qué ordenador generó una señal

Actualmente: NO hay identificación de ordenador en las señales o reportes.

Los reportes semanales (`reports/weekly/*.md`) no incluyen `device_id`.

**En el futuro** (con la implementación de `docs/10_INSTALACION_MULTIORDENADOR.md`): cada alerta y reporte incluirá `device_id`, `device_name` y `generated_at`.

---

## 12. Secuencia de validación completa antes de hacer commit

```powershell
# 1. Verificar que los tests pasan
npm test

# 2. Verificar que el build funciona
npm run build

# 3. Verificar que los artifacts son válidos
npm run build:artifact

# 4. Verificar estado de git
git status
git diff --stat

# 5. Solo si todo está verde, hacer commit
git add docs/
git commit -m "docs: auditoría técnica completa"
```
