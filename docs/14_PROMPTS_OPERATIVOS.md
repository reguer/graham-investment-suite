# 14 — Prompts Operativos para Claude Code

> Prompts reutilizables para retomar el trabajo con Claude Code u otro agente. Cada prompt incluye: objetivo, contexto mínimo, comandos permitidos, restricciones, resultado esperado, y qué archivos puede/no puede tocar.

---

## Cómo usar estos prompts

1. Copiar el prompt completo
2. Abrir Claude Code en la carpeta del proyecto
3. Pegar el prompt
4. Esperar verificación inicial antes de cualquier cambio

---

## Prompt 1: Agregar empresa manualmente

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Stack: React 18.3, Vite 5.4, Vitest 2.0, Node.js
- Las empresas candidatas están hardcodeadas en src/tools/graham-analyzer/candidates.js
- No existe aún script de add-company.js ni base de datos SQLite
- La estructura del candidato es: { ticker, companyName, sector, date, price, ...40+ campos de fundamentales }
- Ver docs/07_INGESTA_EMPRESAS_MANUAL_AUTOMATICA.md para el diseño completo

TAREA:
Agregar la empresa [TICKER] al archivo candidates.js siguiendo el patrón existente.
Los datos de la empresa son: [PEGAR DATOS AQUÍ]
La fuente es Yahoo Finance, fecha: [FECHA]

RESTRICCIONES:
- NO modificar calcRatios.js, classify.js ni constants.js
- NO cambiar el formato del array de candidatos
- NO borrar empresas existentes
- Ejecutar npm test después de agregar — debe pasar sin errores

RESULTADO ESPERADO:
- La empresa aparece en la Watchlist del dashboard
- Los ratios se calculan correctamente
- npm test pasa
```

---

## Prompt 2: Agregar lista CSV de empresas

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Ver docs/07_INGESTA_EMPRESAS_MANUAL_AUTOMATICA.md para el diseño
- El archivo de importación va en data/import/companies_to_add.csv
- El script scripts/import-companies.js no existe aún — deberás crearlo

TAREA:
Existe el archivo data/import/companies_to_add.csv con la siguiente estructura:
[PEGAR PRIMERAS 3 LÍNEAS DEL CSV]

Crear el script scripts/import-companies.js que:
1. Lea el CSV
2. Valide cada fila (ticker, tipo, fuente requeridos)
3. Agregue las empresas válidas a candidates.js (o a la BD si existe)
4. Reporte: cuántas se procesaron, cuántas fallaron, por qué

RESTRICCIONES:
- NO modificar archivos existentes de src/
- NO romper el formato de candidates.js
- Crear el script en scripts/ únicamente
- npm test debe pasar después del cambio
```

---

## Prompt 3: Agregar índices de referencia

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Ver docs/05_BASE_LOCAL_EMPRESAS_INDICES.md para el diseño de la BD
- Los índices propuestos: ^GSPC (S&P 500), ^IXIC (Nasdaq), ^DJI (Dow), ^MXX (IPC), SPY, QQQ
- Los índices NO tienen análisis Graham — son solo de referencia
- Estado en el sistema: index_reference

TAREA:
Crear un archivo data/indexes.json con los índices de referencia propuestos.
Incluir: ticker, name, type: 'indice', status: 'index_reference', tags: ['index_reference']
NO calcular ratios Graham para índices.

RESTRICCIONES:
- No modificar archivos de src/
- Solo crear el archivo data/indexes.json
- npm test debe seguir pasando
```

---

## Prompt 4: Revisar si una empresa está lista para compra

```
Actúa como analista del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- La clasificación Graham usa: pePb ≤ 22.5, pe ≤ 20, pb ≤ 2, debtRatio < 1, currentRatio ≥ 2, epsAllPositive
- Ver docs/06_SCREENING_TABLAS_FILTROS.md para los estados del sistema
- El fixture TSM (ADR ratio 5) debe seguir siendo válido: P/E ≈7.03, P/B ≈11.20

TAREA:
Verificar el estado actual de la empresa [TICKER].
1. Buscar en candidates.js o en la BD si existe
2. Correr calcRatios() con los datos actuales
3. Correr classify() con los ratios
4. Mostrar: qué criterios cumple, qué criterios falla, qué falta para READY_TO_BUY

RESTRICCIONES:
- Solo lectura — NO modificar ningún archivo
- npm test para verificar que calcRatios sigue siendo correcto
- Mostrar todos los ratios calculados, no solo el resultado final
```

---

## Prompt 5: Revisar watchlist completa

```
Actúa como analista del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- 10 empresas en src/tools/graham-analyzer/candidates.js
- Motor de screening en src/tools/watchlist/screen.js
- Último reporte: reports/weekly/ (ver la fecha más reciente)
- Ver docs/06_SCREENING_TABLAS_FILTROS.md para los estados

TAREA:
Generar un reporte del estado actual de toda la watchlist.
Ejecutar: npm run weekly:screen
Mostrar la tabla con el estado de cada empresa.

RESTRICCIONES:
- Solo lectura de código — el screening puede hacer fetch a Stooq
- NO modificar candidates.js ni screen.js
- Si Stooq falla, usar datos del último reporte
```

---

## Prompt 6: Forzar actualización de Yahoo Finance

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Actualmente los fundamentales se capturan manualmente
- Ver docs/02_FUENTE_DATOS_YAHOO_FINANCE.md para la propuesta de automatización
- Ver docs/07_INGESTA_EMPRESAS_MANUAL_AUTOMATICA.md para el diseño del script
- La librería yahoo-finance2 es la candidata (Node.js)

TAREA:
Para la empresa [TICKER], obtener los fundamentales más recientes de Yahoo Finance y actualizar el registro correspondiente en candidates.js.

Los datos a actualizar son: price, totalAssets, currentAssets, inventory, totalLiabilities, currentLiabilities, equity, intangiblesTotal, sharesOutstanding, revenue, grossProfit, operatingIncome, ebit, interestExpense, netIncome, epsTTM, operatingCF, investingCF, financingCF, eps1-eps5

RESTRICCIONES:
- Verificar que currency === 'USD' antes de guardar
- Documentar en el campo notes la fuente y fecha de captura
- npm test debe pasar después del cambio (TSM fixture es el crítico)
- NO cambiar calcRatios.js ni classify.js
```

---

## Prompt 7: Generar reporte de lunes

```
Actúa como analista del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Los lunes al cierre (18:00 CDMX) se genera el reporte formal semanal
- El script existente es: npm run weekly:screen
- Genera en: reports/weekly/YYYY-MM-DD.md
- Ver docs/08_ALERTAS_LOCAL_TELEGRAM.md para el formato de alertas

TAREA:
Es lunes [FECHA]. Generar el reporte semanal formal:
1. Ejecutar npm run weekly:screen
2. Mostrar el contenido del reporte generado
3. Identificar: empresas nuevas en READY_TO_BUY vs semana anterior
4. Identificar: empresas que salieron de READY_TO_BUY
5. Calcular: cuántas alertas nuevas hay

RESTRICCIONES:
- Solo ejecutar scripts existentes
- NO modificar weekly-screen.js
- Si hay alertas nuevas, mostrarlas en formato claro
```

---

## Prompt 8: Generar reporte de viernes

```
(Idéntico al Prompt 7 pero con contexto de cierre de semana)

Añadir a la tarea: generar resumen de la semana completa (diferencia vs lunes anterior).
```

---

## Prompt 9: Por qué no se emitió una alerta

```
Actúa como analista del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Las alertas se generan cuando pePb ≤ 22.5 Y otros criterios Graham se cumplen
- Ver src/tools/graham-analyzer/classify.js para la lógica exacta
- Ver src/tools/graham-analyzer/constants.js para los umbrales GRAHAM_LIMITS

TAREA:
La empresa [TICKER] tenía los siguientes datos el [FECHA]:
[PEGAR DATOS AQUÍ]

¿Por qué NO fue clasificada como APROBADA GRAHAMIANA?
1. Calcular todos los ratios usando calcRatios() con esos datos
2. Aplicar classify() y getChecks()
3. Listar exactamente qué criterios fallaron y por cuánto
4. Calcular qué precio máximo permitiría aprobar Graham

RESTRICCIONES:
- Solo lectura y cálculos — NO modificar nada
- Mostrar todos los valores calculados, no solo el resultado
- Si algún dato falta, indicarlo como "NO DISPONIBLE"
```

---

## Prompt 10: Por qué empresa fue clasificada como tendencia fuerte

```
Actúa como analista del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- El estado STRONG_TREND_EXCEPTION aún no está implementado en código
- Ver docs/06_SCREENING_TABLAS_FILTROS.md para el diseño
- La clasificación actual es solo Graham (4 categorías)

TAREA:
Explicar el proceso de clasificación de [TICKER] que tiene:
- Estado Graham: [ESTADO]
- Datos: [PEGAR DATOS]

Mostrar:
1. Valores de cada métrica Graham
2. Qué criterios cumple / cuáles falla
3. Si fuera STRONG_TREND_EXCEPTION: qué criterios adicionales tendría que cumplir
4. Recomendación de qué monitorear

RESTRICCIONES:
- Solo análisis — NO modificar código
```

---

## Prompt 11: Revisar dashboard local

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Dashboard local: npm run dev → localhost:5173
- Ver docs/01_PROCESOS_LOCALES_DASHBOARD.md para el aislamiento de puertos
- Ver docs/00_PREFLIGHT_ESTADO_REAL.md para el estado del sistema

TAREA:
Verificar que el dashboard local funciona correctamente:
1. Verificar que el puerto 5173 está libre (si no, detectar siguiente disponible)
2. Ejecutar npm run dev
3. Confirmar que las 3 tabs cargan (Graham Analyzer, Watchlist, Macro Radar)
4. Verificar que no hay errores en consola del navegador
5. Confirmar que la última análisis guardada está disponible en el historial

RESTRICCIONES:
- NO cerrar procesos de otros proyectos
- Si 5173 está ocupado, usar --port 5174
- NO modificar vite.config.js
```

---

## Prompt 12: Revisar GitHub Pages

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- URL pública: https://reguer.github.io/graham-investment-suite/
- Mecanismo de deploy: NO VERIFICADO (ver docs/03_DASHBOARD_LOCAL_GITHUB_PAGES.md)
- Stack: React 18.3, Vite 5.4

TAREA:
1. Verificar que la URL pública responde
2. Identificar el mecanismo de deploy (verificar Settings → Pages en GitHub si es posible)
3. Comparar la versión en Pages vs la rama main local (git log)
4. Si existe diferencia, documentar qué versión está en Pages
5. Proponer cómo mantenerlo actualizado sin GitHub Actions

RESTRICCIONES:
- NO hacer push sin confirmación explícita
- NO crear workflows en .github/workflows/
- Solo diagnóstico y documentación
```

---

## Prompt 13: Instalar en otro ordenador

```
Actúa como asistente de instalación del proyecto Graham Investment Suite.

CONTEXTO:
- Ver docs/10_INSTALACION_MULTIORDENADOR.md para el proceso completo
- Repositorio: https://github.com/reguer/graham-investment-suite
- Stack: Node.js + React + Vite

TAREA:
Guiar la instalación en este nuevo ordenador:
1. Clonar el repositorio
2. npm install
3. npm test (verificar que todo funciona)
4. Crear .env.local con: DEVICE_ID, DEVICE_NAME, DEVICE_ROLE
5. Crear .local_runtime/device.json
6. Configurar Windows Task Scheduler para 18:00 si aplica
7. Ejecutar checklist de instalación

ROL DE ESTE EQUIPO: [principal/secundario/solo-dashboard/solo-datos]

RESTRICCIONES:
- NO hacer push a ninguna rama sin confirmación
- NO configurar auto-push si DEVICE_ROLE != 'principal'
- El DEVICE_ID debe ser un UUID único
```

---

## Prompt 14: Rotar clave de ordenador

```
Actúa como administrador del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Ver docs/10_INSTALACION_MULTIORDENADOR.md
- El device_id está en .local_runtime/device.json y .env.local

TAREA:
Rotar el device_id del equipo actual:
1. Generar un nuevo UUID
2. Actualizar .local_runtime/device.json
3. Actualizar DEVICE_ID en .env.local
4. Registrar el cambio en .local_runtime/logs/
5. Verificar que npm run weekly:screen funciona con el nuevo ID

RESTRICCIONES:
- NO subir .env.local ni .local_runtime/ a git
- NO reutilizar el ID anterior
```

---

## Prompt 15: Diagnosticar error de puerto

```
Actúa como debugger del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Ver docs/01_PROCESOS_LOCALES_DASHBOARD.md para el aislamiento de puertos
- Vite usa puerto 5173 por defecto

SÍNTOMA: Error "listen EADDRINUSE: address already in use :::5173"

TAREA:
1. Identificar qué proceso usa el puerto 5173
2. Verificar si es un proceso de ESTE proyecto (.local_runtime/dashboard.pid)
3. Si es de este proyecto: verificar si el proceso sigue vivo
4. Si es de otro proyecto: NO cerrar ese proceso, usar puerto alternativo
5. Proponer el comando correcto para iniciar el dashboard

RESTRICCIONES:
- NO cerrar procesos de otros proyectos
- NO modificar vite.config.js para cambiar el puerto permanentemente
```

---

## Prompt 16: Diagnosticar error de datos

```
Actúa como analista del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

SÍNTOMA: [DESCRIBIR EL SÍNTOMA — ej. "P/E aparece como 70000" o "NCAV negativo cuando debería ser positivo"]

CONTEXTO:
- Ver src/tools/graham-analyzer/calcRatios.js para los cálculos
- Ver docs/02_FUENTE_DATOS_YAHOO_FINANCE.md para la convención de magnitudes
- Invariante crítico: TSM con adrRatio=5 → P/E ≈7.03, P/B ≈11.20

TAREA:
1. Ejecutar npm test para verificar si el error afecta los tests
2. Si tests pasan: el problema es en los datos de entrada, no en el código
3. Identificar qué dato específico está en la magnitud incorrecta
4. Mostrar los valores correctos esperados
5. Proponer la corrección

RESTRICCIONES:
- Si los tests fallan: NO modificar nada, solo diagnosticar
- Si los tests pasan: el error está en los datos de entrada — corregir el dato, no el código
```

---

## Prompt 17: Diagnosticar error de Telegram

```

---

## Prompt 18: Implementar Score Calidad V2 por partes

```
Actúa como desarrollador del proyecto Graham Investment Suite.
Repositorio: c:\00_Apps_Locales\GrahamAnalizer

OBJETIVO:
Implementar una parte acotada del roadmap E23/E24 Score Calidad V2 sin romper el motor Graham ni publicar datos manuales privados.

PARTE A IMPLEMENTAR EN ESTA SESIÓN:
[Elegir UNA: S67 inventario / S68 series anuales / S69 recompras-dilución / S70 intangibles / S71 software quality / S72 score V2 / S73-S75 moat manual / S76 filtros V2]

CONTEXTO OBLIGATORIO:
- Leer `AGENTS.md` y obedecer: no tocar `.env`, `.env.local`, tokens ni credenciales.
- Fuente principal del proyecto: `HANDOFF_GRAHAM_ECOSYSTEM.md`.
- Roadmap de esta tarea: `docs/13_ROADMAP_NOTION_READY.md`, sección `E23 Score Calidad V2` y `E24 Moat Manual y Evidencias`.
- Scoring actual: `src/tools/watchlist/scoring.js`, `src/tools/watchlist/screen.js`, `src/tools/watchlist/tableColumns.js`.
- Ingesta: `scripts/data-ingestion.js`, `src/tools/watchlist/yahooFundamentals.js`, `src/tools/watchlist/secFundamentals.js`.
- Dashboard: `src/tools/watchlist/Watchlist.jsx`.
- Tests base: `tests/watchlistScoring.test.js`, `tests/watchlist-screen.test.js`, `tests/watchlistTable.test.js`.

REGLAS:
- No cambiar fórmulas Graham sin actualizar tests y documentación.
- Mantener `Score Graham`, `Score Calidad` y `Score Moat` separados cuando aplique.
- No inventar moat, contratos, política, regulación favorable, clientes clave ni calidad directiva. Todo eso requiere captura manual con fuente URL y fecha.
- No convertir datos faltantes a cero; usar `null`/`N/D` y score parcial.
- Para software/IA, deuda, liquidez, FCF y dilución siguen siendo criterios duros.
- Si se agrega captura manual, debe funcionar en dashboard local y verse como lectura en GitHub Pages; no dejar botones decorativos.
- No tocar `.env.local` ni credenciales.

TAREA:
1. Revisar el estado actual con `git status --short`.
2. Leer los archivos obligatorios de la parte elegida.
3. Proponer brevemente el alcance exacto de esta sesión.
4. Implementar sólo esa parte.
5. Agregar/actualizar tests enfocados.
6. Ejecutar:
   - `npm test`
   - `npm run build`
   - `npm run build:artifact`
7. Si se modifica UI o export público, ejecutar `npm run deploy:pages` sólo si el usuario pide publicar.
8. Entregar resumen con archivos modificados, pruebas y cualquier dato que siga requiriendo captura manual.

CRITERIOS DE ACEPTACIÓN:
- La app compila.
- Los tests pasan.
- El dashboard sigue en español.
- El código usa nombres en inglés.
- El score explica sus componentes y no oculta por qué una empresa falla Graham.
- Las métricas nuevas muestran fuente/fecha cuando exista.
```
Actúa como developer del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Ver docs/08_ALERTAS_LOCAL_TELEGRAM.md para la configuración
- El token de Telegram está en .env.local (no en el repo)
- El módulo telegram.js no existe aún — es una propuesta

SÍNTOMA: [DESCRIBIR — ej. "No llegan alertas por Telegram" o "Error 401"]

TAREA:
1. Verificar que .env.local tiene TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID
2. Verificar que ENABLE_TELEGRAM_ALERTS=true
3. Probar la conexión: curl https://api.telegram.org/bot{TOKEN}/getMe
4. Verificar que el bot puede enviar al chat_id configurado
5. Si el módulo telegram.js no existe: eso es normal (aún no implementado)

RESTRICCIONES:
- NO revelar el valor del token en ningún archivo versionado
- NO modificar .env.local directamente — instruir al usuario
```

---

## Prompt 18: Diagnosticar error de auto-push

```
Actúa como developer del proyecto Graham Investment Suite.
Repositorio: g:\Mi unidad\00. APPS\GrahamAnalizer

CONTEXTO:
- Ver docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md
- El auto-push solo debe hacerlo el equipo con DEVICE_ROLE=principal
- El script deploy-pages.js no existe aún (propuesto)
- Mecanismo actual de deploy: NO VERIFICADO

SÍNTOMA: [DESCRIBIR — ej. "GitHub Pages no se actualizó" o "Error de permisos en push"]

TAREA:
1. Verificar DEVICE_ROLE en .local_runtime/device.json
2. Verificar AUTO_PUSH_DASHBOARD en .env.local
3. Verificar que git remote está configurado correctamente
4. Verificar que el branch de Pages existe (git branch -a)
5. Intentar build manual: npm run build
6. Si el build falla: diagnosticar el error de build antes del push

RESTRICCIONES:
- NO hacer push sin confirmar que el build es limpio
- NO hacer force push
- NO crear workflows en .github/workflows/
- Verificar que dist/ no contiene secretos antes de cualquier push
```
