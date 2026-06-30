# 13 — Roadmap Epics & Stories (Notion-Ready)

> Tabla viva de epics y stories del proyecto. Formato Markdown copiable directamente a Notion.
> Prioridades: 🔴 Crítica | 🟠 Alta | 🟡 Media | 🟢 Baja

---

## Epics y Stories

| Epic | Story | Objetivo | Descripción | Prioridad | Estado | Dependencias | Archivos afectados | Criterios de aceptación | Riesgos | Tipo | Versión |
|------|-------|----------|-------------|-----------|--------|-------------|-------------------|------------------------|---------|------|---------|
| **E01 Preflight y Auditoría** | S01 Generar diagnóstico inicial | Entender el estado real del repo | Auditar rama, git state, stack, puertos, tests, build, scripts y documentación existente | 🔴 Crítica | ✅ Completado | — | `docs/00_PREFLIGHT_ESTADO_REAL.md` | Archivo generado con todos los puntos auditados | Información puede quedar desactualizada | Manual | v1.0 |
| **E01 Preflight y Auditoría** | S02 Actualizar .gitignore | Proteger archivos locales del versionado | Añadir `.local_runtime/`, `.env.local`, `*.pid`, `*.lock`, `data/*.db` | 🟠 Alta | ✅ Completado | S01 | `.gitignore` | `git status` no muestra archivos de runtime local | Olvidar un patrón puede exponer secretos | Manual | v1.0 |
| **E02 Aislamiento Local** | S03 Crear .local_runtime/ | Centralizar estado de procesos locales | Crear estructura de carpetas con PID, locks, logs, device.json | 🟠 Alta | ✅ Completado | S01 | `.local_runtime/`, `.gitignore`, `scripts/init-runtime.js` | Carpeta existe y está en .gitignore | Conflictos si dos usuarios comparten el repo | Manual | v1.1 |
| **E02 Aislamiento Local** | S04 Detectar puerto disponible | Evitar colisión con otros proyectos | Verificar 5173 antes de iniciar Vite, usar siguiente libre | 🟡 Media | ✅ Completado | S03 | `scripts/start-dashboard.js` (nuevo) | Dashboard inicia sin fallo por puerto | Complejidad añadida al arranque | Auto | v1.1 |
| **E02 Aislamiento Local** | S05 Guardar PID del dashboard | Identificar y detener solo el proceso propio | Escribir PID en `.local_runtime/dashboard.pid` al iniciar | 🟡 Media | ✅ Completado | S03, S04 | `scripts/start-dashboard.js`, `scripts/stop-dashboard.js` | Se puede detener dashboard sin matar procesos ajenos | PID puede desincronizarse si el proceso muere | Auto | v1.1 |
| **E03 Dashboard Local** | S06 Verificar dashboard actual | Confirmar que npm run dev funciona | Ejecutar y abrir en navegador, confirmar 3 tabs funcionales | 🔴 Crítica | ✅ Verificado | — | `src/`, `vite.config.js` | App carga en localhost:5173, 3 tabs visibles | — | Manual | v1.0 |
| **E03 Dashboard Local** | S07 Añadir panel de estado | Ver estado de datos y alertas en el dashboard | Panel con: última actualización, fuente, datos frescos/obsoletos | 🟡 Media | ✅ Completado | S03, BD | `src/tools/watchlist/Watchlist.jsx` | Panel visible con export, BD, Telegram, captura y pendientes | Complejidad de UI | Manual | v2.0 |
| **E04 GitHub Pages** | S08 Verificar mecanismo de deploy | Saber cómo se deployea Pages actualmente | Revisar GitHub.com Settings → Pages, documentar el método real | 🔴 Crítica | ✅ Completado | — | `docs/11_GITHUB_VERSIONADO_PAGES_SIN_WORKFLOWS.md` | Método documentado como verificado | Puede requerir acceso a GitHub web | Manual | v1.0 |
| **E04 GitHub Pages** | S09 Crear script deploy-pages.js | Deploy controlado desde equipo principal | Script que valida secretos, hace build y pushea a gh-pages | 🟠 Alta | ✅ Completado | S08, S03 | `scripts/deploy-pages.js` (nuevo) | Deploy funciona sin exponer secretos | Force push accidental si falla validación | Auto | v1.1 |
| **E05 Yahoo Finance** | S10 Documentar captura manual | Guía actualizada de captura desde Yahoo | Instrucciones paso a paso para cada campo del formulario Graham | 🟠 Alta | ✅ Existe en docs | — | `docs/data-sources.md`, `docs/02_FUENTE_DATOS_YAHOO_FINANCE.md` | Guía cubre todos los campos de EMPTY_FORM | Puede desactualizarse con cambios de UI de Yahoo | Manual | v1.0 |
| **E05 Yahoo Finance** | S11 Integrar yahoo-finance2 | Automatizar descarga de fundamentales | Instalar librería, crear módulo de ingesta, conectar con BD | 🟠 Alta | ✅ Completado | S17 (BD) | `scripts/data-ingestion.js`, `src/tools/watchlist/yahooFundamentals.js`, `package.json` | `fundamentalsTimeSeries` + quoteSummary generan snapshots Yahoo/FX | Rate limiting, cambios de API de Yahoo | Auto | v2.0 |
| **E05 Yahoo Finance** | S12 Validar USD en todos los datos | Garantizar que todo está en USD | Verificar campo currency en respuestas de Yahoo, rechazar si no es USD | 🔴 Crítica | ✅ Completado | S11 | `scripts/data-ingestion.js`, `src/tools/watchlist/yahooFundamentals.js` | CNY/KRW se convierten a USD con FX Yahoo antes de ratios | FX depende de disponibilidad Yahoo | Auto | v2.0 |
| **E06 Base de Datos PostgreSQL** | S13 Crear esquema de BD | Diseñar tablas PostgreSQL para el universo | Implementar schema persistente en `data/schema.sql` y aplicarlo con `npm run db:setup` | 🟠 Alta | ✅ Completado | `DATABASE_URL` | `data/schema.sql`, `scripts/db-setup.js`, `scripts/db-client.js` | Schema aplicado en PostgreSQL sin exponer credenciales | Migración futura a más tablas puede requerir migrations versionadas | Manual | v1.5 |
| **E06 Base de Datos PostgreSQL** | S14 Migrar candidates.js a BD | Mover los 10 candidatos de código a BD | Script que lee candidates.js y los inserta en PostgreSQL/export público sin perder snapshots calculados | 🟠 Alta | ✅ Completado | S13 | `scripts/migrate-candidates.js`, `scripts/db-client.js`, `data/public/companies.json`, `public/data/companies.json` | 10 candidatas migradas y export público conserva 231 empresas / 226 analizadas | Datos de snapshot pueden quedar obsoletos | Auto | v1.5 |
| **E07 Índices y ETFs** | S15 Agregar índices de referencia | Tener S&P 500, Nasdaq, IPC en el sistema | Crear registros para ^GSPC, ^IXIC, ^DJI, ^MXX, SPY, QQQ | 🟡 Media | ✅ Completado | S13 | `data/import/reference-instruments.json`, `data/public/companies.json`, `public/data/companies.json`, `src/tools/watchlist/` | 6 referencias visibles en tabla de screening como `index_reference`, sin análisis Graham | Indices/ETFs solo sirven como benchmark, no como candidatos Graham | Manual | v1.5 |
| **E08 Ingesta Manual** | S16 Crear add-company.js | Agregar empresas sin editar código | Script CLI para agregar ticker con validación | 🟠 Alta | ✅ Completado | S13 | `scripts/add-company.js`, `tests/addCompany.test.js` | `npm run db:add-company -- --ticker MSFT --name Microsoft --dry-run` valida ticker y metadata | Validación de ticker puede fallar con formatos especiales | Manual | v1.5 |
| **E08 Ingesta Manual** | S17 Importar desde CSV/JSON | Agregar lotes de empresas | Script que lee JSON/CSV y detecta duplicados de lote | 🟡 Media | ✅ Completado | S16 | `scripts/import-companies.js`, `data/import/reference-instruments.json`, `tests/importCompanies.test.js` | JSON/CSV importan, duplicados se omiten y se reportan | Duplicados historicos entre ticker visual/yahooSymbol requieren revision manual | Manual | v1.5 |
| **E09 Ingesta Automática** | S18 Actualizar precios del universo | Actualización automática de precios | Script que actualiza precios via Yahoo Chart con fallback Stooq, sin sobrescribir snapshot fundamental | 🟠 Alta | ✅ Completado | S13 | `scripts/refresh-universe.js`, `src/tools/watchlist/priceSources.js`, `data/public/companies.json`, `public/data/companies.json` | `lastPrice` se actualiza en export público y `price_snapshots` se persiste en PostgreSQL si hay `DATABASE_URL` | Yahoo/Stooq rate limit; precio vivo no reemplaza fundamentales | Auto | v1.5 |
| **E09 Ingesta Automática** | S19 Actualizar fundamentales auto | Actualizar datos desde Yahoo Finance | Módulo que descarga fundamentales trimestralmente | 🟡 Media | ✅ Completado v2 inicial | S11, S13 | `scripts/data-ingestion.js` | Universo 2026-06-08: 226 analizadas, 5 no analizables por INDEX/FUTURE | Falta programar frecuencia trimestral separada | Auto | v2.0 |
| **E10 Screening y Filtros** | S20 Expandir motor de screening | Screening desde datos persistidos/exportados | Extender screenWatchlist() para leer universo persistido desde `public/data/companies.json` generado desde PostgreSQL/export | 🟠 Alta | ✅ Completado | S13, S14 | `src/tools/watchlist/screen.js`, `src/tools/watchlist/watchlist.js`, `public/data/companies.json` | Screening corre con 237 instrumentos persistidos y mantiene compatibilidad con candidates.js | Browser no accede directo a PostgreSQL; usa export público | Auto | v2.0 |
| **E10 Screening y Filtros** | S21 Implementar 10 estados | Mapear classify() a estados del sistema | Crear statusMapper.js para convertir clasificación Graham a estados operativos | 🟠 Alta | ✅ Completado | — | `src/tools/watchlist/statusMapper.js`, `src/tools/watchlist/screen.js`, `tests/statusMapper.test.js` | Cada empresa tiene un estado del sistema válido y el dashboard muestra conteos por estado | Bordes de la clasificación Graham son ambiguos | Auto | v1.5 |
| **E10 Screening y Filtros** | S22 Tabla con filtros en dashboard | UI de tabla filtrable de empresas | Añadir vista de tabla con 30 columnas y filtros en el dashboard | 🟡 Media | ✅ Completado | S20, S21 | `src/tools/watchlist/Watchlist.jsx`, `src/tools/watchlist/tableColumns.js`, `public/data/companies.json` | Tabla desktop de 30 columnas, cards moviles <1000px, filtros por vista/estado/tag y bundle principal <150 kB | Tabla densa requiere scroll horizontal en desktop | Manual | v2.0 |
| **E11 Etiquetas y Estados** | S23 Sistema de etiquetas | Tags para clasificar empresas | Implementar `tags` en BD/export publico y en filtros UI | 🟡 Media | ✅ Completado | S13, S22 | `src/tools/watchlist/watchlist.js`, `src/tools/watchlist/Watchlist.jsx`, `tests/watchlist.test.js` | Empresa puede tener múltiples tags, dashboard filtra por etiqueta y muestra chips | Edicion de tags desde UI queda para etapa posterior | Manual | v2.0 |
| **E12 Alertas Lunes/Viernes** | S24 Sistema de alertas Markdown | Generar reporte con alertas | Extender weekly-screen.js para generar alertas accionables por tipo | 🟠 Alta | ✅ Completado | — | `scripts/weekly-screen.js`, `reports/weekly/`, `tests/weeklyScreen.test.js` | Reporte incluye `Alertas Accionables` con aprobadas, cercanas y pendientes relevantes | Duplicados historicos requieren tabla de alertas futura | Auto | v1.1 |
| **E12 Alertas Lunes/Viernes** | S25 Task Scheduler Windows | Automatizar ejecución al cierre | Crear tarea en Windows Task Scheduler para 18:00 CDMX | 🔴 Crítica | ✅ Script listo | — | `scripts/setup-weekly-alerts.ps1`, `package.json` | `npm run scheduler:install` crea tarea lunes/viernes sin sobrescribir | Puede requerir permisos de Windows | Auto | v1.1 |
| **E12 Alertas Lunes/Viernes** | S26 Alertas especiales lunes y viernes | Reporte formal los días clave | Detectar si es lunes/viernes y generar reporte con formato especial | 🟡 Media | ✅ Completado | S25 | `scripts/weekly-screen.js`, `src/lib/telegram.js`, `tests/weeklyScreen.test.js`, `tests/telegram.test.js` | Reporte lunes/viernes tiene resumen semanal y Telegram incluye tipo de alerta formal | El envio real depende de `.env.local` y Task Scheduler | Auto | v1.1 |
| **E13 Telegram** | S27 Configurar bot Telegram | Canal de alertas en tiempo real | Crear bot con BotFather, configurar token y chat_id | 🟡 Media | ✅ Completado | — | `.env.local`, `scripts/db-client.js`, `.local_runtime/device.json` | `loadEnvLocal()` busca `.env.local` en múltiples rutas (C: y G:); `device_role: "primary"` configurado | Token expuesto accidentalmente | Manual | v1.5 |
| **E13 Telegram** | S28 Enviar alertas por Telegram | Notificaciones automáticas | Crear src/lib/telegram.js para despachar mensajes formateados | 🟡 Media | ✅ Completado técnico | S27 | `src/lib/telegram.js`, `scripts/alert-dispatcher.js`, `tests/telegram.test.js`, `tests/alertDispatcher.test.js` | Mensajes Telegram se formatean y despachan con mock; envio real queda sujeto a S27 | Red no disponible, rate limit de Telegram | Auto | v1.5 |
| **E14 Modo Watch** | S29 Crear scripts/run-mode.js | Script maestro de modos de operación | Script que acepta --mode y activa los procesos correspondientes | 🟡 Media | ✅ Completado | S03 | `scripts/run-mode.js`, `tests/runMode.test.js`, `package.json` | `npm run run:mode -- --mode watch --dry-run` prepara heartbeat y comando | Complejidad de gestión de procesos persistentes | Auto | v1.5 |
| **E14 Modo Watch** | S30 Modo watch con poll | Actualización continua de precios | setInterval de 15 min para actualizar precios mientras el equipo está encendido | 🟡 Media | ✅ Completado | S18, S29 | `scripts/run-mode.js` | Modo watch ejecuta `weekly:screen` al iniciar y cada intervalo configurado | Consumo de CPU/red continuo | Auto | v1.5 |
| **E15 Multiordenador** | S31 Crear device.json | Identificar cada equipo | Crear `.local_runtime/device.json` con device_id único | 🟠 Alta | ✅ Completado | S03 | `scripts/init-runtime.js`, `.local_runtime/device.json`, `tests/runtimeDevice.test.js` | Cada equipo tiene device_id único y persistente sin versionarse | UUID generado localmente puede colisionar | Manual | v1.1 |
| **E15 Multiordenador** | S32 Incluir device_id en reportes | Trazabilidad de origen | Añadir pie de página a reportes semanales con device_id | 🟡 Media | ✅ Completado | S31 | `scripts/weekly-screen.js`, `tests/weeklyScreen.test.js` | Reporte incluye `Generado desde: ...` | Retrocompatibilidad de formato de reporte preservada | Auto | v1.1 |
| **E15 Multiordenador** | S33 Control anti-duplicados | Evitar alertas dobles desde dos equipos | Solo equipo principal envía Telegram, otros equipos registran localmente | 🟡 Media | ✅ Completado técnico | S31, S28 | `scripts/alert-dispatcher.js`, `tests/alertDispatcher.test.js` | Gate permite Telegram solo con `device_role` principal/primary | Sincronización compleja si hay BD compartida | Auto | v1.5 |
| **E16 Backtesting** | S34 Descargar histórico Stooq | Datos de precio histórico para backtest | Extender priceSources.js para descargar OHLCV histórico | 🟠 Alta | ✅ Completado | — | `src/tools/watchlist/priceSources.js`, `scripts/download-historical-prices.js`, `backtesting/data/historical/` | 10 CSV históricos 2020-01-01 a 2026-06-08 con 1,616 filas por ticker | Stooq puede bloquear CSV; Yahoo Chart queda como fallback sin API key | Auto | v2.0 |
| **E16 Backtesting** | S35 Motor de backtesting | Engine que ejecuta estrategias sobre histórico | Crear backtesting/engine.js que procesa trades simulados | 🟠 Alta | ✅ Completado básico | S34 | `backtesting/engine.js`, `backtesting/strategies/graham-defensive.js` | Backtest Graham defensivo básico procesa entradas, salidas y stop loss | Usa fundamentales snapshot como proxy histórico; sesgo documentado | Auto | v2.0 |
| **E16 Backtesting** | S36 Métricas de desempeño | Calcular Sharpe, drawdown, win rate | Módulo que calcula todas las métricas de performance | 🟡 Media | ✅ Completado | S35 | `backtesting/metrics.js` | Retorno, CAGR, drawdown, win rate, profit factor, Sharpe, Sortino, benchmark `^GSPC` y alfa vs benchmark calculados | Sharpe usa tasa libre de riesgo default 0 | Auto | v2.0 |
| **E16 Backtesting** | S37 Reporte de backtesting | Visualizar resultados del backtest | Generar reporte MD con equity curve, trades, métricas | 🟡 Media | ✅ Completado | S36 | `backtesting/report.js`, `scripts/run-backtest.js`, `backtesting/reports/`, `src/tools/backtesting/BacktestingResults.jsx` | Reporte Markdown, CSV de trades/equity, JSON público, escenarios y pestaña lazy en dashboard | Graficas quedan para v3.0 | Auto | v2.0 |
| **E17 Tests** | S38 Aumentar cobertura calcRatios | Tests para casos borde | Agregar tests: quickRatio sin inventario, EPS=0, CAGR 1 año | 🟠 Alta | ✅ Completado | — | `tests/calcRatios.test.js` | Casos borde cubiertos sin romper fixture TSM | No cambiar formulas sin docs/tests | Manual | v1.1 |
| **E17 Tests** | S39 Tests de backtesting | Validar motor con dataset pequeño | Crear mini_universe.json (3 empresas, 2 años) y tests | 🟡 Media | ✅ Completado | S35 | `backtesting/tests/`, `backtesting/tests/fixtures/mini_universe.json` | Motor produce resultados correctos con compra, salida por valuación y stop loss | Dataset pequeño no cubre portfolio multi-ciclo ni benchmark | Manual | v2.0 |
| **E18 Seguridad** | S40 Auditar .gitignore | Confirmar que ningún secreto puede subirse | Revisar que .env.local, .local_runtime/, BD y caches están excluidos | 🔴 Crítica | ✅ Completado | S02 | `.gitignore`, `scripts/security-audit.js`, `tests/securityAudit.test.js` | `npm run security:audit` valida patrones y archivos trackeados sensibles | Nuevos tipos de secreto deben agregarse al auditor | Manual | v1.0 |
| **E18 Seguridad** | S41 Validar pre-deploy | Script que detecta secretos antes de push | Escanear dist antes de publicar GitHub Pages | 🔴 Crítica | ✅ Completado | S09 | `scripts/deploy-pages.js`, `tests/deployPages.test.js` | Deploy aborta si se detectan tokens/API keys con forma de secreto en dist | Falsos positivos de patrones demasiado amplios | Auto | v1.1 |
| **E19 Documentación** | S42 Generar 15 docs de auditoría | Documentar el estado completo del sistema | Crear docs/00 a docs/14 con toda la información técnica y operativa | 🔴 Crítica | ✅ Completado | — | `docs/` | 15 archivos MD generados y revisados | Documentación puede quedar desactualizada | Manual | v1.0 |
| **E19 Documentación** | S43 Actualizar README.md | README operativo completo | Añadir secciones de configuración local, multiordenador, alertas | 🟠 Alta | ✅ Completado | S42 | `README.md`, `docs/weekly-alerts.md` | README cubre instalación, operación, CLI, multiordenador y troubleshooting | Preservar contenido existente | Manual | v1.0 |
| **E19 Documentación** | S44 Crear CHANGELOG.md | Historial formal de cambios | Crear con estado inicial v1.0.0 y primera auditoría | 🟠 Alta | ✅ Completado | — | `CHANGELOG.md` | Changelog sigue formato estándar y registra cambios recientes | — | Manual | v1.0 |
| **E20 UX/CLI** | S45 Mejorar CLI de screening | Más opciones en weekly-screen | Añadir --ticker, --format (md/csv/html), --verbose y --no-telegram | 🟡 Media | ✅ Completado | — | `scripts/weekly-screen.js`, `tests/weeklyScreen.test.js` | `npm run weekly:screen -- --ticker KBH --format csv --no-telegram` genera export filtrado sin enviar alerta | Backward compatibility mantenida para Markdown default | Manual | v1.5 |
| **E20 UX/CLI** | S46 Exportar a CSV | Exportar tabla de screening a CSV | Añadir opción de exportar resultados del screening a CSV | 🟡 Media | ✅ Completado | S45 | `scripts/weekly-screen.js`, `data/export/` | CSV generado con columnas operativas y escape de comillas/comas | `data/export/` no se versiona por ser salida generada | Auto | v1.5 |
| **E20 UX/CLI** | S47 Exportar a Notion | Sincronizar tabla con Notion | Script que usa Notion API para crear/actualizar tabla de empresas | 🟢 Baja | ✅ Script listo | S46 | `scripts/export-to-notion.js`, `tests/exportToNotion.test.js`, `data/export/` | Dry-run genera payload Notion local; envio real requiere `NOTION_TOKEN` y `NOTION_DATABASE_ID` | Tabla visible en Notion no verificada por falta de credenciales/base destino | Manual | v3.0 |
| **E22 UX Dashboard** | S65 Tabla candidatos responsive | Evitar overflow en pantallas chicas | Renderizar tabla desktop y cards móviles para candidatos Graham bajo 1000px | 🟠 Alta | ✅ Completado | — | `src/tools/graham-analyzer/CandidatePanel.jsx`, `tests/candidatePanel.test.jsx` | Candidatos se ven como cards en móvil y como tabla en desktop | Mantener duplicación visual sincronizada | Manual | v1.5 |
| **E23 Score Calidad V2** | S67 Inventario de métricas disponibles | Separar datos automáticos vs manuales | Auditar `data/public/companies.json`, snapshots Yahoo/SEC y export público para listar qué métricas existen hoy y cuáles faltan para calidad/moat | 🟠 Alta | 📋 Pendiente | S11, S20, S22 | `data/public/companies.json`, `public/data/companies.json`, `src/tools/watchlist/yahooFundamentals.js`, `src/tools/watchlist/secFundamentals.js`, `src/tools/watchlist/scoring.js`, `tests/watchlistScoring.test.js` | Documento o fixture enumera métricas automáticas: revenue, EPS, FCF, shares, margins, goodwill/intangibles, liquidity, leverage, ROE/ROA; y métricas manuales: moat, contratos, regulación, clientes clave | El export puede tener campos no uniformes por fuente; no asumir disponibilidad sin test | Auto | v2.1 |
| **E23 Score Calidad V2** | S68 Series anuales normalizadas | Calcular tendencias de 3-5 años | Crear normalizador para series anuales por ticker: revenue, EPS, FCF, shares outstanding, margen bruto/operativo/neto cuando exista | 🔴 Crítica | 📋 Pendiente | S67 | `src/tools/watchlist/qualityMetrics.js` (nuevo), `src/tools/watchlist/yahooFundamentals.js`, `src/tools/watchlist/secFundamentals.js`, `scripts/data-ingestion.js`, `tests/qualityMetrics.test.js` | Métricas de crecimiento usan años reales, toleran gaps, nunca convierten faltantes a cero y registran `source/asOf` | Yahoo/SEC reportan conceptos con nombres distintos; requiere mapper defensivo | Auto | v2.1 |
| **E23 Score Calidad V2** | S69 Recompras y dilución | Medir confianza directiva y presión por SBC | Calcular cambio anual de acciones en circulación; score positivo si acciones bajan sin deteriorar deuda, neutral si estable, penalización si diluye | 🔴 Crítica | 📋 Pendiente | S68 | `src/tools/watchlist/qualityMetrics.js`, `src/tools/watchlist/scoring.js`, `tests/watchlistScoring.test.js`, `tests/qualityMetrics.test.js` | Dashboard muestra `Buyback/dilución`; software con dilución alta baja score aunque tenga crecimiento | Reducción de acciones puede venir de splits/ajustes; validar contra split si la fuente lo expone | Auto | v2.1 |
| **E23 Score Calidad V2** | S70 Intangibles y tangible quality | Hacer explícito goodwill/marca/intangibles | Añadir métricas `intangiblesToAssets`, `goodwillToAssets`, `tangibleEquity`, `pbTangible` y alertas sectoriales; software/marcas no se penalizan igual si ROIC/FCF/márgenes compensan | 🟠 Alta | 📋 Pendiente | S68 | `src/tools/watchlist/qualityMetrics.js`, `src/tools/watchlist/scoring.js`, `src/tools/graham-analyzer/sectorProfiles.js`, `src/tools/watchlist/Watchlist.jsx` | Detalle de empresa muestra dependencia de intangibles y si el balance tangible es débil/negativo | Intangibles pueden ser moat o fragilidad; no usar regla única para todos los sectores | Auto | v2.1 |
| **E23 Score Calidad V2** | S71 Score software quality | Evaluar software con métricas adecuadas | Añadir subscore para software/IA: gross margin, operating margin, FCF margin, revenue growth, EPS/FCF consistency, rule of 40 cuando existan datos, SBC/dilución si disponible | 🟠 Alta | 📋 Pendiente | S68, S69 | `src/tools/graham-analyzer/sectorProfiles.js`, `src/tools/watchlist/scoring.js`, `src/tools/watchlist/qualityMetrics.js`, `tests/watchlistScoring.test.js` | Empresas de software pueden compararse por calidad sin relajar el freno Graham; score explica si falla por precio o por calidad real | SBC y net retention no siempre están estructurados; no inventar datos faltantes | Auto | v2.2 |
| **E23 Score Calidad V2** | S72 Score general ponderado V2 | Separar Graham, calidad y moat | Reemplazar score único por desglose ponderado: `grahamScore`, `qualityScore`, `moatScore`, `generalScore`; conservar compatibilidad visual con columna Score | 🟠 Alta | 📋 Pendiente | S69, S70, S71 | `src/tools/watchlist/scoring.js`, `src/tools/watchlist/screen.js`, `src/tools/watchlist/tableColumns.js`, `src/tools/watchlist/Watchlist.jsx`, `tests/watchlistScoring.test.js`, `tests/watchlistTable.test.js` | Orden `Mejor score` usa `generalScore`; detalle muestra pesos y razones; Graham sigue siendo freno de seguridad separado | Cambiar pesos puede alterar ranking; documentar defaults y evitar consejos de compra automáticos | Auto | v2.2 |
| **E24 Moat Manual y Evidencias** | S73 Modelo de captura manual de moat | Capturar lo que no debe inferirse automáticamente | Diseñar schema local/exportable para moat, contratos, regulación, clientes clave, calidad directiva, tesis personal, fuente URL y fecha | 🟠 Alta | 📋 Pendiente | S72 | `data/schema.sql`, `scripts/db-client.js`, `src/tools/watchlist/moatManual.js` (nuevo), `tests/dbClient.test.js`, `tests/moatManual.test.js` | Cada campo manual tiene `value`, `sourceUrl`, `asOf`, `confidence`, `notes`; no se mezcla con datos automáticos sin etiqueta | No tocar `.env.local`; si no hay DB, persistir en archivo público/versionado sólo si el usuario lo aprueba | Manual | v2.2 |
| **E24 Moat Manual y Evidencias** | S74 UI Calidad y Moat | Hacer editable y auditable el moat | Agregar en el detalle de empresa una pestaña/sección `Calidad y Moat` con campos manuales y evidencias; lectura en Pages, edición sólo local si API local está disponible | 🟡 Media | 📋 Pendiente | S73 | `src/tools/watchlist/Watchlist.jsx`, `src/tools/watchlist/watchlist.js`, `scripts/local-dashboard-api.js`, `tests/localDashboardApi.test.js` | Dashboard local permite guardar/editar evidencia; GitHub Pages muestra datos ya exportados sin botones rotos | Evitar UI decorativa; todo botón debe guardar, cancelar o abrir fuente real | Manual | v2.3 |
| **E24 Moat Manual y Evidencias** | S75 Import/export de moat manual | Sincronizar evidencia con el universo público | Crear script para exportar campos manuales a `public/data/company-quality.json` y mezclarlos en `buildWatchlist()` | 🟡 Media | 📋 Pendiente | S73, S74 | `scripts/export-company-quality.js` (nuevo), `public/data/company-quality.json`, `src/tools/watchlist/watchlist.js`, `tests/watchlist.test.js` | Pages muestra moat manual y fuentes sin depender de PostgreSQL/localStorage | Riesgo de publicar notas privadas; revisar contenido antes de commit | Manual | v2.3 |
| **E24 Moat Manual y Evidencias** | S76 Filtros V2 de calidad | Encontrar empresas por señales cualitativas | Agregar filtros: `buyback positivo`, `sin dilución`, `software quality`, `moat alto`, `contratos top`, `riesgo regulatorio positivo`, `intangibles altos` | 🟡 Media | 📋 Pendiente | S72, S75 | `src/tools/watchlist/Watchlist.jsx`, `src/tools/watchlist/tableColumns.js`, `src/tools/watchlist/watchlist.js`, `tests/watchlistTable.test.js` | Filtros combinables con sector/estado/favoritos/posiciones; no rompen móvil | Demasiados filtros pueden meter ruido; agrupar por secciones compactas | Manual | v2.3 |
| **E25 Buffett Auto Engine** | S78 Definir marco Buffett operativo | Separar claramente calidad Buffett de filtro Graham | Documentar definiciones formales: `ownerEarnings`, `maintenanceCapex`, `capitalAllocationScore`, `buffettQualityScore`, `buffettValuationScore`, `buffettCandidateLabel`; declarar qué sí es automático y qué sigue siendo manual | 🔴 Crítica | 📋 Pendiente | E23, E24 | `docs/13_ROADMAP_NOTION_READY.md`, `docs/14_PROMPTS_OPERATIVOS.md`, `AGENTS.md`, `CHANGELOG.md` | Existe glosario único con fórmulas, fuentes y límites; ningún componente vuelve a usar "Buffett" como alias de la capa de calidad actual | Riesgo de mezclar score de calidad con valuación DCF y confundir al usuario | Manual | v2.4 |
| **E25 Buffett Auto Engine** | S79 Inventario Buffett de datos automáticos | Saber qué datos existen hoy para owner earnings y DCF | Auditar `public/data/companies.json`, snapshots Yahoo/SEC y posibles exports de selected companies para mapear revenue, EBIT, CFO, capex, D&A, cash, debt, shares, margins y series 5-10Y | 🔴 Crítica | 📋 Pendiente | S78, S67 | `data/public/companies.json`, `public/data/companies.json`, `src/tools/watchlist/yahooFundamentals.js`, `src/tools/watchlist/secFundamentals.js`, `scripts/data-ingestion.js`, `tests/dataIngestion.test.js` | Se genera tabla de disponibilidad por campo/fuente/asOf; cada métrica queda marcada como `available`, `partial` o `missing` | Yahoo y SEC no siempre exponen el mismo concepto ni la misma granularidad anual/TTM | Auto | v2.4 |
| **E25 Buffett Auto Engine** | S80 Series históricas 5-10Y para Buffett | Construir una base temporal normalizada por empresa | Crear extractor normalizado para 5-10 años de `revenue`, `operatingIncome`, `netIncome`, `operatingCF`, `capex`, `depreciationAmortization`, `sharesOutstanding`, `cash`, `totalDebt`, `grossMargin`, `operatingMargin`, `netMargin` usando SEC Company Facts como fuente primaria y Yahoo como fallback | 🔴 Crítica | 📋 Pendiente | S79 | `src/tools/watchlist/buffettSeries.js` (nuevo), `src/tools/watchlist/secFundamentals.js`, `src/tools/watchlist/yahooFundamentals.js`, `scripts/data-ingestion.js`, `tests/buffettSeries.test.js` | Cada serie queda guardada con `fiscalYear`, `value`, `currency`, `source`, `sourceForm`, `asOf`; gaps no se rellenan con cero y splits/dilución quedan separados | Company Facts usa taxonomías alternativas (`RevenueFromContractWithCustomerExcludingAssessedTax` vs `SalesRevenueNet`); requiere mapper defensivo | Auto | v2.4 |
| **E25 Buffett Auto Engine** | S81 Owner earnings normalizado | Estimar flujo económico del dueño sin captura manual inicial | Calcular `ownerEarnings = operatingCF - maintenanceCapex`, con `maintenanceCapex` estimado por heurística conservadora cuando no exista dato directo; guardar también `reportedCapex`, `growthCapexProxy`, `ownerEarningsYield` y trazabilidad del método aplicado | 🔴 Crítica | 📋 Pendiente | S80 | `src/tools/watchlist/buffettValuation.js` (nuevo), `src/tools/watchlist/buffettSeries.js`, `scripts/data-ingestion.js`, `tests/buffettValuation.test.js`, `docs/formulas.md` | Cada ticker muestra owner earnings con `methodId`; si falta info crítica el cálculo devuelve `null` y razón legible | Maintenance capex no se reporta directo; la heurística debe ser conservadora y explicable para no inventar precisión falsa | Auto | v2.4 |
| **E25 Buffett Auto Engine** | S82 Heurística maintenance capex y capital intensity | Distinguir negocios ligeros de negocios pesados | Implementar reglas por sector para aproximar maintenance capex: base `min(capex, depreciationAmortization)` con ajustes por estabilidad de PPE/revenue, asset turns y crecimiento; exponer `capitalIntensityTag` y confianza del estimate | 🟠 Alta | 📋 Pendiente | S81 | `src/tools/graham-analyzer/sectorProfiles.js`, `src/tools/watchlist/buffettValuation.js`, `src/tools/watchlist/buffettSeries.js`, `tests/buffettValuation.test.js` | El método devuelve `maintenanceCapex`, `confidence`, `reason`, `sectorAdjustment`; utilities, industriales y semis usan reglas distintas a software/asset-light | Heurística demasiado agresiva puede inflar valor intrínseco; usar sesgo conservador por defecto | Auto | v2.4 |
| **E25 Buffett Auto Engine** | S83 Capital allocation score | Medir recompras, deuda y disciplina de management | Calcular `shareCountCagr`, recompras netas, dilución, deuda neta, `netDebtToEbit`, `interestCoverage`, reinversión vs FCF y uso de caja; resumir en subscore de asignación de capital | 🔴 Crítica | 📋 Pendiente | S80 | `src/tools/watchlist/qualityMetrics.js`, `src/tools/watchlist/buffettSeries.js`, `src/tools/watchlist/scoring.js`, `tests/watchlistScoring.test.js`, `tests/buffettSeries.test.js` | El detalle distingue recompra real, neutral o dilución; penaliza deuda creciente usada para sostener recompras artificiales | Shares outstanding puede requerir ajuste por splits o ADR; validar unidad antes de puntuar | Auto | v2.4 |
| **E25 Buffett Auto Engine** | S84 Buffett quality score automático | Detectar empresas excelentes antes de la valuación | Crear `buffettQualityScore` con ROE/ROA/ROIC proxy, márgenes, estabilidad de FCF, consistencia de owner earnings, asignación de capital, resiliencia y dependencia de intangibles; mantenerlo separado de Graham | 🔴 Crítica | 📋 Pendiente | S81, S82, S83 | `src/tools/watchlist/scoring.js`, `src/tools/watchlist/buffettSeries.js`, `src/tools/watchlist/buffettValuation.js`, `tests/watchlistScoring.test.js`, `tests/watchlistTable.test.js` | Score documenta peso por componente y produce razón legible; no aprueba por valuación barata si la calidad es mediocre | ROIC exacto puede faltar por ausencia de invested capital limpio; permitir proxy con flag de confianza | Auto | v2.5 |
| **E25 Buffett Auto Engine** | S85 DCF Buffett con escenarios | Valuar con owner earnings y margen de seguridad | Implementar DCF a 10 años con escenarios `bear/base/bull`, descuento configurable, crecimiento terminal conservador y `mosBuffett`; incluir sensibilidad y fecha de corte de precio/fundamentales | 🔴 Crítica | 📋 Pendiente | S81, S84 | `src/tools/watchlist/buffettValuation.js`, `src/tools/watchlist/Watchlist.jsx`, `src/tools/watchlist/tableColumns.js`, `tests/buffettValuation.test.js`, `docs/formulas.md` | Cada empresa expone `intrinsicValueBear/Base/Bull`, `requiredReturn`, `terminalGrowth`, `mosBuffett`; no renderiza valor si faltan series suficientes | DCF con crecimiento optimista genera falsas candidatas; el escenario base debe ser deliberadamente conservador | Auto | v2.5 |
| **E25 Buffett Auto Engine** | S86 Etiquetas Buffett y filtros UI | Hacer operable el motor Buffett en dashboard | Añadir etiquetas `Buffett candidata`, `Excelente empresa, cara`, `Calidad alta sin evidencia`, `Valuación insuficiente`, filtros y columnas de `owner earnings`, `mosBuffett`, `capital allocation`, `confidence` | 🟠 Alta | 📋 Pendiente | S84, S85 | `src/tools/watchlist/Watchlist.jsx`, `src/tools/watchlist/tableColumns.js`, `src/tools/watchlist/statusMapper.js`, `tests/watchlistTable.test.js`, `tests/watchlist-screen.test.js` | La UI separa nítidamente Graham vs Buffett; exportaciones muestran ambos bloques sin mezclar significado | Riesgo de saturar la tabla; quizá se necesite modo compacto Buffett o columnas opcionales | Manual | v2.5 |
| **E26 IA y Evidencia Buffett** | S87 Ingesta de filings y transcripts seleccionados | Obtener texto fuente para interpretación asistida | Descargar/almacenar 10-K, shareholder letters y transcripts de earnings calls para un subconjunto de empresas seleccionadas; indexar `ticker`, `sourceType`, `period`, `url`, `localPath`, `sha256` y fecha de ingestión | 🟠 Alta | 📋 Pendiente | S79 | `scripts/download-company-docs.js` (nuevo), `data/raw/company-docs/`, `public/data/company-doc-index.json`, `tests/downloadCompanyDocs.test.js` | El sistema puede bajar documentos por lote pequeño y guardar índice auditable; no toca credenciales ni publica PDFs privados por error | Licensing de transcripts y disponibilidad variable; usar sólo fuentes permitidas y guardar metadatos aunque falte el texto | Manual | v2.5 |
| **E26 IA y Evidencia Buffett** | S88 Prompts de extracción estructurada | Convertir texto largo en señales utilizables con trazabilidad | Diseñar prompts JSON para extraer `pricingPower`, `customerConcentration`, `capitalAllocationDiscipline`, `cyclicality`, `moatClues`, `managementRedFlags`, `guidanceTone`, con citas cortas y confidence score | 🟠 Alta | 📋 Pendiente | S87 | `docs/14_PROMPTS_OPERATIVOS.md`, `src/tools/watchlist/buffettPrompts.js` (nuevo), `tests/buffettPrompts.test.js` | Cada prompt exige salida JSON validable, citas breves, `unknown_if_not_explicit` y separación entre `fact`, `inference`, `risk` | La IA puede alucinar moat o management quality si el prompt no fuerza abstención explícita | Auto | v2.5 |
| **E26 IA y Evidencia Buffett** | S89 Pipeline de interpretación Claude/Codex | Resumir selected companies sin captura manual completa | Crear flujo batch/local que reciba métricas + filings + transcript + restricciones y genere `buffettNotesAuto`, `evidenceCards[]`, `contradictions[]`, `followUpQuestions[]`; guardar salida con `model`, `runAt`, `sourceRefs` | 🟡 Media | 📋 Pendiente | S88 | `scripts/run-buffett-ai-pass.js` (nuevo), `src/lib/anthropic.js`, `public/data/company-quality-auto.json`, `tests/runBuffettAiPass.test.js` | Cada salida incluye referencias a documento y fragmento; si no hay evidencia suficiente retorna `insufficient_evidence` en vez de inventar | Coste/token y drift de prompts; limitar a universo seleccionado y cachear resultados | Auto | v2.5 |
| **E26 IA y Evidencia Buffett** | S90 Verificador de contradicciones IA vs números | Evitar que una buena narrativa tape malos fundamentos | Implementar chequeo automático que compare la salida IA con métricas duras: si la nota dice "balance fuerte" pero `netDebtToEbit > 4` o `ownerEarnings < 0`, marcar contradicción y bajar confianza | 🟠 Alta | 📋 Pendiente | S84, S89 | `src/tools/watchlist/buffettValidator.js` (nuevo), `scripts/run-buffett-ai-pass.js`, `tests/buffettValidator.test.js` | Ninguna señal IA se muestra como definitiva si contradice métricas duras; dashboard enseña bandera `requiere revision` | Reglas demasiado estrictas pueden castigar negocios cíclicos; documentar excepciones por sector | Auto | v2.5 |
| **E26 IA y Evidencia Buffett** | S91 Rollout por lotes seleccionados | Escalar sin intentar todo el universo de golpe | Crear plan operativo por cohortes: `Top 10 actuales`, `Posiciones`, `Semiconductores`, `Software`, `Industriales`; cada lote ejecuta ingestión, series, DCF, IA y revisión humana antes de pasar al siguiente | 🔴 Crítica | 📋 Pendiente | S85, S89, S90 | `docs/13_ROADMAP_NOTION_READY.md`, `reports/buffett-batches/`, `scripts/run-buffett-batch.js` (nuevo) | Existe checklist por lote y un estado `ready_for_review`; no se expande a todo el universo sin métricas de calidad del pipeline | Querer cubrir 300+ empresas de una vez degradaría calidad y coste; el enfoque debe ser incremental | Manual | v2.6 |
| **E26 IA y Evidencia Buffett** | S92 Exportes y reportes Buffett | Volver operables las conclusiones para decisión | Añadir exportes `XLSX/PDF/Markdown` con bloque Buffett: owner earnings, DCF, escenarios, quality score, citas IA, contradicciones y siguientes pasos | 🟡 Media | 📋 Pendiente | S86, S89, S90 | `src/lib/watchlistExport.js`, `scripts/weekly-screen.js`, `reports/`, `tests/watchlistExport.test.js` | El usuario puede exportar un filtro Buffett o un lote revisado con trazabilidad completa | Exportar demasiadas citas puede volver ilegible el PDF; resumir con enlaces y referencias | Auto | v2.6 |

---

## Actualización operativa 2026-06-23 — Score Calidad V2

### Reglas de trabajo para E23/E24

- No cambiar fórmulas Graham sin actualizar tests y documentación.
- Mantener `Score Graham` separado de `Score Calidad` y `Score Moat`; el score general no debe ocultar por qué una empresa falla Graham.
- No inventar moat, contratos, regulación favorable, cercanía política, clientes clave ni calidad directiva. Esos datos requieren captura manual con evidencia, URL y fecha.
- No convertir datos faltantes a cero. Usar `null`, `N/D` y score parcial.
- Para software/IA, no relajar liquidez/solvencia: deuda, current ratio, quick ratio, FCF y dilución siguen siendo señales duras.
- Recompras/dilución tienen prioridad alta: usar series anuales de acciones en circulación y distinguir recompra real vs emisión/SBC cuando la fuente lo permita.
- Goodwill/intangibles deben mostrarse como dependencia del balance, no como penalización universal. Software y marcas pueden vivir con intangibles altos si márgenes, ROE/ROA y FCF lo justifican.
- GitHub Pages es estático: cualquier captura manual debe exportarse a archivos públicos versionados o BD local antes de publicarse.

### Archivos base a consultar antes de implementar

| Área | Archivos |
|------|----------|
| Scoring actual | `src/tools/watchlist/scoring.js`, `src/tools/watchlist/screen.js`, `src/tools/watchlist/tableColumns.js`, `tests/watchlistScoring.test.js`, `tests/watchlistTable.test.js` |
| Ingesta automática | `scripts/data-ingestion.js`, `src/tools/watchlist/yahooFundamentals.js`, `src/tools/watchlist/secFundamentals.js`, `src/tools/watchlist/watchlist.js` |
| Datos/export público | `data/public/companies.json`, `public/data/companies.json`, `public/data/`, `reports/weekly/` |
| Sectores/umbrales | `src/tools/graham-analyzer/sectorProfiles.js`, `src/tools/graham-analyzer/detectSector.js`, `src/tools/graham-analyzer/classify.js`, `src/tools/graham-analyzer/getChecks.js` |
| Dashboard | `src/tools/watchlist/Watchlist.jsx`, `src/components/ui/MetricCard.jsx`, `src/lib/colors.js`, `src/lib/formatters.js` |
| API local/BD | `scripts/local-dashboard-api.js`, `scripts/db-client.js`, `data/schema.sql`, `docs/03_DASHBOARD_LOCAL_GITHUB_PAGES.md`, `docs/17_CONFIGURACION_ENV_CAPTURA.md` |
| Validación | `tests/qualityMetrics.test.js` (nuevo), `tests/watchlistScoring.test.js`, `tests/watchlist-screen.test.js`, `tests/localDashboardApi.test.js`, `tests/securityAudit.test.js` |

### Implementable por partes

1. **Parte A — Métricas automáticas puras:** S67-S68. No tocar UI salvo tests/helpers. Entregable: `qualityMetrics.js` con revenue/EPS/FCF/shares/margins normalizados.
2. **Parte B — Recompras/dilución:** S69. Entregable: subscore y razón legible; columna opcional o detalle.
3. **Parte C — Intangibles:** S70. Entregable: dependencia de intangibles visible y ponderada por sector.
4. **Parte D — Software quality:** S71. Entregable: rule-of-40/márgenes/dilución para software cuando haya datos.
5. **Parte E — Score V2:** S72. Entregable: `grahamScore`, `qualityScore`, `moatScore`, `generalScore`.
6. **Parte F — Manual moat/evidencias:** S73-S75. Entregable: schema, UI local editable, export público.
7. **Parte G — Filtros V2:** S76. Entregable: filtros nuevos en dashboard y Pages.

### Datos manuales obligatorios para V2

| Dato | Motivo | Campo sugerido |
|------|--------|----------------|
| Moat real | No se deduce confiablemente de ratios | `moatRating`, `moatNotes`, `sourceUrl`, `asOf` |
| Contratos top/hyperscalers/gobierno | Requiere evidencia puntual | `strategicContracts[]` |
| Legislación/regulación favorable | Contexto legal cambia y debe citarse | `regulatoryTailwind` |
| Cercanía política | Alto riesgo de subjetividad | `politicalAccessEvidence` |
| Clientes clave/dependencia | Puede venir en 10-K, pero no siempre estructurado | `customerConcentration` |
| Calidad directiva | Juicio cualitativo | `managementQuality` |
| Ventaja tecnológica/patentes | Requiere evidencia y fecha | `technologyMoatEvidence` |
| Tesis personal | Debe quedar separada del dato automático | `ownerThesis` |

## Actualización operativa 2026-06-09

| Area | Estado | Evidencia | Pendiente |
|------|--------|-----------|-----------|
| Vite E03/S06 | ✅ Completado | `vite.config.js` usa `import()` dinámico; `npm run build` limpio sin warning CJS | — |
| Watchlist UX E10/S22 | ✅ Completado | Botones locales bloqueados se reemplazan por mensaje informativo en GitHub Pages; razones internas se ocultan | — |
| Calidad datos E10/S20-S22 | ✅ Completado | `screen.js` marca `DATOS INSUFICIENTES` si faltan 3 de 5 ratios críticos | Completar fuentes alternativas para parciales |
| Universo masivo E05/E09/E10 | ✅ Completado ampliado | `universe.js` + `universe:sync`; export público en 306 instrumentos | Mantener expansión sectorial por lotes versionados |
| Ingesta Yahoo E05/S11-S12 | ✅ Completado ampliado | Fallback `.MX -> ticker base`; corrida local: 290 analizadas, 6 referencias, 10 pendientes | Resolver 3 tickers sin quote fundamental y 2 parciales sin estados anuales |
| PostgreSQL E06/S13-S14 | ✅ Completado robustecido | `universe:sync` y `universe:refresh` escriben en chunks para evitar `ENAMETOOLONG` | Migraciones versionadas futuras |
| Candidatas Graham | ✅ Complementado | Se conservaron candidatas previas y se sumaron sectores utilities/industrials/defensive/health/financial/tech | No usar candidatas como límite del universo |
| Referencias mercado E07/S15 | ✅ Robustecido | `INDEX100`, `SP500`, ETFs, índices y futuros se separan como `reference`/`market_reference` | No aplicar Graham a instrumentos sin fundamentales corporativos |
| Fuentes pendientes E10/S22 | ✅ Completado | Watchlist muestra tabla `Fuentes pendientes` con causa, fuente sugerida y acción por ticker | Resolver `CMA`, `FITB`, `HOLX`, `JNPR`, `VTRS` con alias/SEC/captura manual |
| Scheduler E12/S25 | ✅ Robustecido | `npm run scheduler:install` apunta al flujo completo `npm run weekly:pipeline` | Validar tarea real en Windows Task Scheduler |
| Pipeline semanal | ✅ Completado | `npm run weekly:pipeline -- --no-telegram` ejecuta sync, refresh, ingest y reporte semanal | Separar en el futuro frecuencia diaria de precios vs trimestral de fundamentales |

| **E21 Corrección Lógica Graham** | S48 Fix divergencia ROE/ROA/TIE en Watchlist | Habilitar clasificación "EXCELENTE PERO CARA" en screening | `screen.js:deriveSnapshot()` forzaba roe/roa/tie a null; classify.js nunca podía activar isStrongCompany() desde watchlist | 🔴 Crítica | ✅ Completado | — | `src/tools/watchlist/screen.js` | Watchlist puede clasificar empresas como "EXCELENTE, PERO CARA" | Candidatos de companies.json pueden no tener roe/roa aún | Auto | v1.1 |
| **E21 Corrección Lógica Graham** | S49 Fix grahamFormula condición incorrecta | Calcular fórmula Graham aunque pe sea null | Se anulaba grahamFormula si pe===null aunque epsAdj y bvps fueran válidos | 🟠 Alta | ✅ Completado | — | `src/tools/graham-analyzer/calcRatios.js` | grahamFormula se calcula cuando eps>0 y bvps>0 independientemente de pe | Ninguno, grahamPrice() ya tiene sus guardas | Auto | v1.1 |
| **E21 Corrección Lógica Graham** | S50 Fix CAGR de EPS con años reales | CAGR preciso cuando hay gaps en años | Se usaba epsHistory.length-1 como denominador; con años no consecutivos el CAGR estaba inflado | 🟠 Alta | ✅ Completado | — | `src/tools/graham-analyzer/calcRatios.js` | CAGR usa (yearNewest - yearOldest) cuando disponible; fallback a length-1 | Tests deben confirmar que TSM no cambia (years 2025-2022, span=3=length-1) | Auto | v1.1 |
| **E21 Corrección Lógica Graham** | S51 Fix grahamFormula inline en screen.js | Evitar NaN cuando inputs son null | Math.sqrt(22.5 * null * null) produce NaN en vez de null | 🟡 Media | ✅ Completado | — | `src/tools/watchlist/screen.js` | grahamFormula devuelve null si epsAdj o bvps son null/0 | — | Auto | v1.1 |
| **E21 Corrección Lógica Graham** | S52 Calcular TIE en secFundamentals.js | TIE disponible en snapshots SEC | TIE siempre era null; SEC EDGAR expone OperatingIncomeLoss e InterestExpense | 🟠 Alta | ✅ Completado | S48 | `src/tools/watchlist/secFundamentals.js` | TIE calculado en futuros snapshots; Infinity si sin gasto de interés y EBIT>0 | Algunos CIK pueden no reportar InterestExpense | Auto | v1.1 |
| **E21 Corrección Lógica Graham** | S53 Tests edge cases calcRatios | Cobertura de casos borde críticos | Faltaban tests para equity negativo, CAGR con años reales, epsGrowing=null | 🟠 Alta | ✅ Completado | S50 | `tests/calcRatios.test.js` | Tests pasan para equity negativo, años no consecutivos, y historia de 1 EPS | — | Manual | v1.1 |
| **E21 Corrección Lógica Graham** | S54 Documentar pePbTangible y hasIntangibleData | Clarificar métricas calculadas sin uso | pePbTangible y hasIntangibleData se calculan pero no se muestran en UI ni prompts | 🟢 Baja | ✅ Completado | — | `src/tools/graham-analyzer/calcRatios.js`, `src/tools/graham-analyzer/AnalysisResults.jsx`, `src/tools/graham-analyzer/prompts.js` | pePbTangible se muestra condicionalmente en sección Valuación cuando no es null; se incluye en prompt via optLine | — | Manual | v1.5 |
| **E21 Corrección Lógica Graham** | S55 Advertir P/B negativo por equity negativo | UX claro cuando equity < 0 | pb negativo pasa isFiniteNumber() y se muestra sin contexto | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/getChecks.js`, `src/tools/graham-analyzer/AnalysisResults.jsx` | Banner rojo "Patrimonio neto negativo" visible en sección Valuación; MetricCard P/B muestra "N/A (equity neg.)"; checklist P/B tiene label específico | — | Manual | v1.5 |
| **E21 Corrección Lógica Graham** | S56 Prompts IA robustos con datos null | IA recibe contexto completo | Prompts incluyen roe/roa/mosGrahamTangible que son null desde watchlist | 🟡 Media | ✅ Completado | S48 | `src/tools/graham-analyzer/prompts.js` | optLine filtra null/undefined/"—"/"null"/"undefined"; textField() sanitiza campos de texto del company; 7 tests en tests/prompts.test.js | — | Auto | v1.5 |
| **E22 UX Dashboard** | S57 Toolbar sticky en formulario | Botones siempre visibles en form de 43 campos | Toolbar desaparece al hacer scroll; obliga a volver al final del form | 🟠 Alta | ✅ Completado | — | `src/tools/graham-analyzer/AnalysisForm.jsx` | Botones Calcular/Limpiar/Prefill visibles en todo momento del scroll | — | Manual | v1.5 |
| **E22 UX Dashboard** | S58 Feedback al guardar análisis | Toast o confirmación post-guardado | saveAnalysis() guarda y navega sin ningún feedback visual | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/GrahamAnalyzer.jsx` | Mensaje de confirmación visible por ~2s tras guardar | — | Manual | v1.5 |
| **E22 UX Dashboard** | S59 Spinner en loading de IA | Indicar progreso al generar análisis IA | Botón disabled con opacidad sin ningún spinner ni estimación de tiempo | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/InterpretationPanel.jsx` | Spinner o animación visible mientras loadingAI=true | — | Manual | v1.5 |
| **E22 UX Dashboard** | S60 Confirmación antes de limpiar formulario | Evitar borrado accidental | Reset borra 43 campos sin confirmación | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/AnalysisForm.jsx` | Diálogo de confirmación antes de limpiar | — | Manual | v1.5 |
| **E22 UX Dashboard** | S61 Historial sortable y filtrable | Historial usable con más de 10 análisis | Lista cronológica sin sorting/filtros; inutilizable con 50 análisis | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/AnalysisHistory.jsx` | Input filtro por ticker/empresa; columnas Empresa/Fecha/P/E×P/B clickeables para ordenar asc/desc; tabla con hover | — | Manual | v2.0 |
| **E22 UX Dashboard** | S62 Años explícitos en EPS histórico | Mostrar "2024" en vez de "Año 1" | Usuario debe inferir qué año es cada fila | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/AnalysisForm.jsx` | Labels de EPS muestran el año ingresado o placeholder "ej: 2024" | — | Manual | v1.5 |
| **E22 UX Dashboard** | S63 Errores IA con contexto accionable | Mensaje de error específico | Error genérico sin distinguir API key vs. red vs. rate limit | 🟡 Media | ✅ Completado | — | `src/tools/graham-analyzer/InterpretationPanel.jsx` | Mensaje diferente para API key ausente vs. fallo de red | — | Manual | v1.5 |
| **E22 UX Dashboard** | S64 Fecha de snapshot visible en Watchlist | Saber antigüedad de los datos | No se muestra cuándo se actualizaron los precios mostrados | 🟢 Baja | ✅ Completado | — | `src/tools/watchlist/Watchlist.jsx` | Header o footer del Watchlist muestra "Datos al YYYY-MM-DD" | — | Manual | v1.5 |
| **E22 UX Dashboard** | S65 Tabla candidatos responsive | Tabla usable en < 1000px | minWidth: 760 fuerza scroll horizontal | 🟢 Baja | ✅ Completado | — | `src/tools/graham-analyzer/CandidatePanel.jsx` | Wrapper con overflowX:"auto" y WebkitOverflowScrolling:"touch"; tabla hace scroll horizontal en móvil sin romper layout | — | Manual | v2.0 |
| **E22 UX Dashboard** | S66 Centralizar colores secundarios | Todos los hex en lib/colors.js | 6+ valores hex hardcodeados fuera del sistema de design tokens | 🟢 Baja | ✅ Completado | — | `src/lib/colors.js`, múltiples componentes | Ningún valor hex hardcodeado fuera de colors.js | — | Manual | v2.0 |
| **E22 UX Dashboard** | S77 Exportar filtro actual a XLSX/PDF | Sacar reportes accionables desde el dashboard | Agregar botones para exportar la vista filtrada actual a `XLSX` y a documento imprimible para `PDF`, respetando columnas legibles y el resumen de filtros activos | 🟡 Media | ✅ Completado | S22, S64 | `src/tools/watchlist/Watchlist.jsx`, `src/lib/watchlistExport.js`, `tests/watchlistExport.test.js`, `tests/watchReason.test.js` | El usuario puede exportar cualquier filtro activo; XLSX incluye hoja de resumen; PDF abre vista imprimible con texto envuelto por celda y columnas compactas | Muchas columnas pueden deformar el PDF si no se compactan; mantener subset específico para impresión | Auto | v2.3 |

---

## Actualización operativa 2026-06-11

| Area | Estado | Evidencia | Pendiente |
|------|--------|-----------|-----------|
| Sectores universo | ✅ Completado | Todos los tickers en `requestedTickers` y `bmvSicRows` tienen sector real; no más "Solicitados"/"Sin sector" para empresas reales | Solo índices/futuros conservan "Solicitados" correctamente |
| Equity negativo E21 | ✅ Completado | 20 empresas (MCD, ABBV, HPQ, LOW, PM...) marcadas `hasNegativeEquity: true`; visibles en watchlist como "watch" evaluables por P/E | Próximo pipeline de ingesta respetará el flag permanentemente |
| Datos watchlist | ✅ Completado | 320 analizadas (+56), 278 en observación (+28), 11 fuente pendiente (-29) | Ejecutar `npm run fundamentals:ingest` para capturar las 11 pendientes reales |
| sync-universe sector fix | ✅ Completado | `mergeUniverseWithPublic()` ya no sobreescribe sectores válidos con placeholders | — |
| S27 Telegram | ✅ Completado | `.env.local` encontrado en G:; `device_role: "primary"` activo; scheduler instalado | Solo envía lunes y viernes (comportamiento correcto) |
| Tests | ✅ Verde | 39 suites, 159 tests, 0 fallos | — |

### Stories pendientes prioritarias

| Story | Descripción | Prioridad |
|-------|-------------|-----------|
| **Backtesting re-run** | Re-ejecutar con universo diversificado actual (320 analizadas); actualizar `public/data/backtesting-summary.json` | 🟠 Alta |
| **Captura automática local** | `npm run weekly:pipeline` falla con `EINVAL` en Windows por `spawnSync shell:false`; necesita fix para que el scheduler ejecute el pipeline completo sin intervención manual | 🔴 Crítica |
| **Pipeline semanal robusto** | `weekly-pipeline.js` invoca `npm.cmd` con `spawnSync shell:false`; falla en Windows. Fix: usar `shell: true` o reemplazar con llamada directa a scripts | 🔴 Crítica |
| **Ingest 11 pendientes** | AA, CMA, DFS, FITB, FNF, HOLX, JNPR, K, MRO, VTRS, X — ejecutar `npm run fundamentals:ingest` manualmente o vía API local | 🟠 Alta |

---

## Actualización operativa 2026-06-29

| Area | Estado | Evidencia | Pendiente |
|------|--------|-----------|-----------|
| Corte trimestral/TTM | ✅ Completado | `yahooFundamentals.js` y `data-ingestion.js` guardan `sourcePeriod`; el detalle ahora distingue `Trimestral / TTM` vs `Anual` | Mantener la disciplina en futuras fuentes no-Yahoo |
| Refresh total desde dashboard | ✅ Completado | `local-dashboard-api.js` corre refresh completo del universo, precios, posiciones y reporte desde `Actualizar todo` | Seguir vigilando tiempos de corrida en universos más grandes |
| Etiqueta `Excelente, cara` | ✅ Completado | `classify.js`, scoring y watchlist separan empresa excelente pero cara de rechazo puro; tarjeta/filtro dedicado visible en dashboard | Afinar más adelante la explicación Buffett en score V2 |
| Capa adicional de calidad | ✅ Conservada | Tabla, cards y modal mantienen `qualityLayer` visible sin mezclarla con el freno Graham | Evolucionar a Score V2 sin ocultar fallas de valuación |
| Exportar filtro actual | ✅ Completado | `Watchlist.jsx` exporta `filteredResults` a `XLSX` y `PDF`; `watchlistExport.js` ajusta anchos y wrap por celda para texto largo | Si el usuario quiere branding o portada, quedaría para una iteración aparte |
| Legibilidad de exportación | ✅ Completado | Columnas largas (`Nombre`, `Etiquetas`, `Razon`) quedan envueltas en su propia celda; PDF usa subset compacto y XLSX fija anchos/altos | Validar en uso real con filtros de >100 filas |
| Validación | ✅ Verde | Nuevos tests `watchlistExport` y `watchReason`; pendiente correr suite completa + builds antes de cerrar | — |

### Resumen del día

- Se corrigió la lectura del periodo fundamental para no confundir corte anual con corte trimestral/TTM.
- El dashboard local ya puede lanzar una actualización integral del universo y de tus posiciones sin salir de la UI.
- La clasificación `Excelente, cara` quedó operativa como filtro visible, sin perder la capa extra de calidad.
- Se añadió exportación desde cualquier filtro activo a `XLSX` y a vista imprimible para `PDF`, cuidando que el texto largo no se monte sobre otras columnas.

---

## Actualización operativa 2026-06-30

| Area | Estado | Evidencia | Pendiente |
|------|--------|-----------|-----------|
| Dashboard oculto Windows | ✅ Completado | `start-dashboard.js` ya resuelve `vite` directo en background; `start-dashboard-hidden.py/.vbs` y `dashboard-keepalive.vbs` permiten arranque oculto sin heredar consola visible | Vigilar en siguientes cambios que ningun wrapper vuelva a usar `stdio: inherit` en background |
| Stop del dashboard | ✅ Completado | `stop-dashboard.js` usa `taskkill /T /F` en Windows para matar todo el arbol del dashboard | Mantener el comportamiento repo-scoped si se agregan mas procesos auxiliares |
| Sincronia main + gh-pages | ✅ Operativo | `docs/03` y `docs/11` documentan el flujo `git push origin main` + `npm run deploy:pages` | Repetirlo tras cambios de UI o datos publicos |
| Validacion | ✅ Verde | `npm test`, `npm run build`, `npm run build:artifact` en verde tras el fix de runtime | — |

### Stories pendientes prioritarias

| Story | Descripción | Prioridad |
|-------|-------------|-----------|
| **S93 Endurecer keepalive Windows** | Reducir reintentos innecesarios y asegurar una sola instancia del watchdog por equipo | 🟡 Media |
| **S94 Telemetria minima de runtime** | Registrar ultimo arranque, ultimo stop y puerto activo en `.local_runtime/dashboard.json` para diagnostico rapido | 🟡 Media |

---

## Plan futuro 2026-06-29 — Motor Buffett automático con evidencia

### Objetivo del bloque E25/E26

Construir un motor Buffett futuro que no dependa de captura manual para el 80% del trabajo operativo:

1. Extraer series financieras 5-10Y y filings de un universo seleccionado.
2. Calcular calidad Buffett y valuación por `owner earnings + DCF`.
3. Generar notas automáticas interpretadas por IA con citas, contradicciones y nivel de confianza.
4. Dejar sólo el moat profundo y el juicio final como revisión humana.

### Principios obligatorios

- Graham y Buffett deben vivir como motores separados.
- `qualityLayer` actual no equivale a una valuación Buffett formal.
- Ningún prompt debe inventar moat, calidad directiva o ventaja competitiva si el texto fuente no lo dice.
- Toda salida IA debe declarar `fact`, `inference`, `risk`, `confidence` y `sourceRefs`.
- Si falta un dato duro, el sistema devuelve `null` o `insufficient_evidence`, nunca cero inventado.
- El rollout debe hacerse por lotes pequeños y auditables, no por todo el universo de golpe.

### Matriz de datos automáticos propuestos

| Métrica / bloque | Fuente primaria | Fallback | Extracción exacta | Procesamiento | Persistencia sugerida | Manual si falta |
|------------------|-----------------|----------|-------------------|---------------|-----------------------|-----------------|
| Revenue anual | SEC Company Facts | Yahoo `fundamentalsTimeSeries` / `incomeStatementHistory` | `RevenueFromContractWithCustomerExcludingAssessedTax`, `SalesRevenueNet` | Elegir taxonomía disponible, convertir a USD si aplica, guardar `fiscalYear`, `source`, `asOf` | `buffettSeries.revenue[]` | No |
| Operating income / EBIT | SEC Company Facts | Yahoo annual statements | `OperatingIncomeLoss` | Normalizar signo y año fiscal; usar para margen operativo y cobertura | `buffettSeries.operatingIncome[]` | No |
| Net income | SEC Company Facts | Yahoo annual statements | `NetIncomeLoss` o `NetIncomeAvailableToCommonStockholdersBasic` | Base para calidad, owner earnings cross-check y ROE/ROA | `buffettSeries.netIncome[]` | No |
| Operating cash flow | SEC Company Facts | Yahoo cash flow history | `NetCashProvidedByUsedInOperatingActivities` | Serie anual limpia; validar con moneda y `asOf` | `buffettSeries.operatingCF[]` | No |
| Capex reportado | SEC Company Facts | Yahoo cash flow history | `PaymentsToAcquirePropertyPlantAndEquipment`, `CapitalExpenditures` | Tomar magnitud absoluta, normalizar signo y guardar método | `buffettSeries.reportedCapex[]` | No |
| D&A | SEC Company Facts | Yahoo cash flow history | `DepreciationDepletionAndAmortization`, `DepreciationAmortizationAndAccretionNet` | Insumo para heuristic maintenance capex | `buffettSeries.depreciationAmortization[]` | No |
| Shares outstanding | SEC Company Facts / cover page | Yahoo quote / fundamentalsTimeSeries | `CommonStockSharesOutstanding`, `EntityCommonStockSharesOutstanding` | Ajustar splits/ADR cuando corresponda y calcular CAGR | `buffettSeries.sharesOutstanding[]` | No |
| Cash y deuda | SEC balance facts | Yahoo balance sheet | `CashAndCashEquivalentsAtCarryingValue`, `LongTermDebtAndCapitalLeaseObligations`, `CurrentPortionOfLongTermDebt` | Construir `netDebt` y `netDebtToEbit` | `buffettSeries.cash[]`, `buffettSeries.totalDebt[]` | No |
| Márgenes | Derivado de revenue + earnings series | Yahoo ratios snapshot | Revenue, gross profit, operating income, net income | Calcular gross/op margin/net margin y su desviación 5-10Y | `buffettMetrics.marginStats` | No |
| ROE / ROA / ROIC proxy | Derivado de income + balance series | Snapshot actual | Net income / equity, net income / assets, NOPAT / invested capital proxy | Generar `confidence` alto/medio/bajo según disponibilidad | `buffettMetrics.returns` | No |
| Filings 10-K / annual report | SEC EDGAR | Investor relations | `10-K`, `10-K/A`, annual letter URL | Descargar, indexar y trocear por secciones | `company-doc-index.json`, carpeta raw | Sí si no hay texto disponible |
| Earnings call transcript | Fuente permitida / investor site | Manual URL | transcript o prepared remarks | Trocear por speaker, quarter y citas | `company-doc-index.json` | Sí |
| Shareholder letter | Investor relations | Manual URL | PDF/HTML de annual letter | Indexar y resumir con IA | `company-doc-index.json` | Sí |

### Proceso detallado propuesto

#### Fase 1 — Selección del lote

1. Elegir un lote pequeño:
   - `Mis posiciones`
   - `Excelente, cara`
   - `Top 10 por score`
   - sector específico
2. Congelar lista en `data/import/buffett-selected-<fecha>.json`.
3. Guardar metadatos del lote:
   - `ticker`
   - `yahooSymbol`
   - `cik`
   - `market`
   - `sector`
   - `priority`

#### Fase 2 — Ingesta financiera 5-10Y

1. Resolver `ticker -> cik -> taxonomy map`.
2. Descargar facts anuales SEC.
3. Descargar fallback Yahoo anual/TTM.
4. Convertir moneda a USD si el filing reporta moneda distinta.
5. Normalizar series a estructura:

```json
{
  "metric": "operatingCF",
  "fiscalYear": 2025,
  "value": 123456789,
  "currency": "USD",
  "source": "sec_companyfacts",
  "sourceField": "NetCashProvidedByUsedInOperatingActivities",
  "sourceForm": "10-K",
  "asOf": "2026-02-14"
}
```

6. Detectar gaps, duplicados, cambios de taxonomía y años faltantes.
7. No interpolar; marcar `missingYears[]`.

#### Fase 3 — Cálculo owner earnings

1. Tomar `operatingCF`.
2. Tomar `reportedCapex`.
3. Estimar `maintenanceCapex`.
4. Calcular:
   - `ownerEarnings = operatingCF - maintenanceCapex`
   - `ownerEarningsMargin = ownerEarnings / revenue`
   - `ownerEarningsYield = ownerEarningsPerShare / price`
5. Guardar también:
   - `maintenanceCapexMethodId`
   - `maintenanceCapexConfidence`
   - `reportedCapex`
   - `growthCapexProxy`

#### Fase 4 — Calidad Buffett automática

1. Calcular estabilidad 5-10Y:
   - revenue CAGR
   - operating income CAGR
   - owner earnings CAGR
   - años con owner earnings negativos
2. Calcular retornos:
   - `roeMedian5Y`
   - `roaMedian5Y`
   - `roicProxyMedian5Y`
3. Calcular resiliencia:
   - `netDebtToEbit`
   - `interestCoverage`
   - `fcfConsistency`
4. Calcular asignación de capital:
   - `shareCountCagr`
   - recompras netas
   - dilución
   - deuda usada para recompras
5. Emitir:
   - `buffettQualityScore`
   - `capitalAllocationScore`
   - `qualityConfidence`

#### Fase 5 — DCF con escenarios

1. Definir parámetros por defecto:
   - `requiredReturn = 10%`
   - `terminalGrowth = 2.5%`
   - `forecastYears = 10`
2. Generar escenarios:
   - `bear`
   - `base`
   - `bull`
3. Reglas conservadoras:
   - crecimiento nunca superior al histórico sin justificación
   - el escenario `base` usa menor entre CAGR histórica y techo sectorial
   - el `terminalGrowth` siempre menor que `requiredReturn`
4. Calcular:
   - `intrinsicValueBear`
   - `intrinsicValueBase`
   - `intrinsicValueBull`
   - `mosBuffett`
5. Si faltan 5 años mínimos de series limpias:
   - no emitir DCF
   - `valuationStatus = insufficient_history`

#### Fase 6 — Ingesta documental

1. Descargar 10-K más reciente y 2 anteriores si están disponibles.
2. Descargar annual letters / shareholder letters.
3. Descargar transcripts o prepared remarks de 2-4 trimestres.
4. Guardar índice:

```json
{
  "ticker": "MSFT",
  "sourceType": "10-K",
  "period": "FY2025",
  "url": "https://...",
  "localPath": "data/raw/company-docs/MSFT/2025-10k.html",
  "sha256": "..."
}
```

5. Trocear por secciones:
   - `Business`
   - `Risk Factors`
   - `MD&A`
   - `Capital Resources`
   - `Prepared Remarks`
   - `Q&A`

#### Fase 7 — Extracción IA estructurada

1. Alimentar a Claude/Codex con:
   - métricas duras
   - extractos de filings
   - transcript chunks
   - reglas de abstención
2. Obligar salida JSON.
3. Guardar:
   - `facts[]`
   - `inferences[]`
   - `risks[]`
   - `sourceRefs[]`
   - `followUpQuestions[]`

#### Fase 8 — Verificador de contradicciones

1. Comparar la narrativa IA con métricas duras.
2. Reglas ejemplo:
   - si dice `pricing power fuerte` pero gross margin cae 5Y, marcar contradicción media
   - si dice `balance conservador` pero `netDebtToEbit > 4`, contradicción alta
   - si dice `recompras disciplinadas` pero `shareCountCagr > 2%`, contradicción alta
3. Bajar `confidence` si hay contradicción.
4. No publicar etiqueta Buffett final si la contradicción es alta.

#### Fase 9 — Revisión humana mínima

1. Revisar empresas con:
   - `buffettQualityScore alto`
   - `mosBuffett >= 20%`
   - `contradictions = 0 o bajas`
2. Validar moat sólo si hay evidencia real.
3. Cambiar estado a:
   - `ready_for_review`
   - `reviewed`
   - `watch_only`

### Heurística propuesta para `maintenanceCapex`

Mientras no exista un dato directo confiable, usar esta jerarquía:

1. Si hay disclosure explícito de maintenance capex:
   - usar ese dato.
2. Si no:
   - `maintenanceCapex = min(reportedCapex, depreciationAmortization)`
3. Para sectores pesados:
   - usar el mayor entre `0.8 * depreciationAmortization` y `min(reportedCapex, depreciationAmortization)`
4. Para software / asset-light:
   - usar el menor entre `reportedCapex` y `0.6 * depreciationAmortization`, con `confidence = low`
5. Si `reportedCapex` falta:
   - no calcular owner earnings.

La regla debe quedar etiquetada por `methodId` y nunca ocultarse detrás de un número único.

### Prompts operativos sugeridos

#### Prompt A — Extraer señales Buffett de 10-K

```text
Actúa como analista de calidad empresarial estilo Buffett.

Objetivo:
Extraer únicamente señales explícitas o inferencias conservadoras desde el 10-K adjunto.

Entrada:
- JSON de métricas duras: revenue 5Y, owner earnings 5Y, margins 5Y, netDebtToEbit, shareCountCagr.
- Fragmentos del 10-K: Business, Risk Factors, MD&A, Capital Resources.

Reglas:
- No inventes moat.
- Si un punto no es explícito, responde `unknown`.
- Separa siempre `fact`, `inference`, `risk`.
- Cada inferencia debe referenciar al menos una cita breve.
- Si una inferencia contradice las métricas, decláralo.

Salida JSON:
{
  "pricingPower": { "value": "strong|mixed|weak|unknown", "confidence": 0-1, "facts": [], "inferences": [], "sourceRefs": [] },
  "cyclicality": { "value": "high|medium|low|unknown", "confidence": 0-1, "facts": [], "inferences": [], "sourceRefs": [] },
  "customerConcentration": { "value": "high|medium|low|unknown", "confidence": 0-1, "facts": [], "sourceRefs": [] },
  "capitalAllocationDiscipline": { "value": "strong|mixed|weak|unknown", "confidence": 0-1, "facts": [], "sourceRefs": [] },
  "managementRedFlags": [],
  "followUpQuestions": []
}
```

#### Prompt B — Interpretar transcript sin alucinar

```text
Actúa como analista financiero disciplinado.

Objetivo:
Resumir el earnings call para detectar tono de guidance, presión competitiva, pricing, demanda y disciplina de gasto.

Entrada:
- Métricas duras del trimestre y del histórico 5Y.
- Prepared remarks.
- Q&A.

Reglas:
- No infieras moat durable sólo por tono positivo.
- Marca como `management_claim` todo lo que provenga de declaraciones de directivos.
- Si no hay evidencia cuantitativa de soporte, la conclusión final debe decir `claim_not_verified`.
- Devuelve citas cortas, no párrafos largos.

Salida JSON:
{
  "guidanceTone": "",
  "demandSignal": "",
  "pricingSignal": "",
  "costDiscipline": "",
  "managementClaims": [],
  "claimsNotVerified": [],
  "sourceRefs": []
}
```

#### Prompt C — Verificador IA vs métricas

```text
Actúa como validador de consistencia.

Objetivo:
Comparar la narrativa automática con métricas duras y devolver contradicciones.

Entrada:
- JSON de métricas duras
- JSON de narrativa IA

Reglas:
- Si la narrativa afirma algo no soportado por números, márcalo.
- No reescribas la tesis; sólo valida consistencia.

Salida JSON:
{
  "contradictions": [
    {
      "severity": "high|medium|low",
      "statement": "",
      "metricEvidence": "",
      "reason": ""
    }
  ],
  "overallConfidenceAdjustment": -0.25
}
```

### Forma de trabajo recomendada

1. Empezar con `S78-S80` sólo para 10-20 empresas.
2. Validar series y owner earnings con tests antes de cualquier UI.
3. Implementar `S81-S85` sin prompts, sólo números.
4. Añadir prompts `S87-S90` cuando ya existan métricas duras confiables.
5. Hacer rollout por cohortes `S91`.
6. Publicar filtros/exportes `S92` sólo después de tener contradicción checker y revisión humana mínima.

### Entregables esperados por fase

| Fase | Stories | Entregable |
|------|---------|------------|
| Fase 1 | S78-S80 | Series financieras 5-10Y auditables |
| Fase 2 | S81-S85 | Owner earnings + quality score + DCF |
| Fase 3 | S86 | Etiquetas y filtros Buffett en dashboard |
| Fase 4 | S87-S90 | Ingesta documental + extracción IA + verificador |
| Fase 5 | S91-S92 | Rollout por lotes + exportes/reportes Buffett |

---

## Leyenda de estados

| Emoji | Estado |
|-------|--------|
| ✅ | Completado |
| ⚠️ | No verificado / En duda |
| 📋 | Pendiente (no iniciado) |
| 🚧 | En progreso |
| ❌ | Descartado |

## Versiones sugeridas

| Versión | Alcance |
|---------|---------|
| **v1.0** | Auditoría y documentación base (esta sesión) |
| **v1.1** | Task Scheduler, device_id en reportes, .gitignore mejorado |
| **v1.5** | BD SQLite, ingesta manual, add-company, Telegram, estados del sistema |
| **v2.0** | Yahoo Finance auto, backtesting básico, dashboard mejorado |
| **v3.0** | Backtesting completo, exportación Notion/Sheets, modo watch avanzado |
