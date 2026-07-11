# 03 — Dashboard Local y GitHub Pages

> Este documento describe la arquitectura dual: dashboard local (React SPA) y dashboard público (GitHub Pages), y cómo mantenerlos sincronizados de forma segura sin depender de GitHub Actions.

---

## 1. Estado actual verificado

### Dashboard local

| Aspecto | Estado |
|---------|--------|
| Comando | `npm run dev:safe` |
| Puerto | 5173 por defecto; usa el siguiente libre si esta ocupado |
| URL | `http://127.0.0.1:5173/` o siguiente puerto libre |
| Tecnología | React 18.3 + Vite 5.4 SPA |
| Datos | Export publico + estado local en runtime |
| Actualización | Al guardar análisis o correr refresh/screening locales |
| Modo Windows | Segundo plano por defecto, con PID/logs en `.local_runtime/` |

### GitHub Pages

| Aspecto | Estado |
|---------|--------|
| URL pública | `https://reguer.github.io/graham-investment-suite/` |
| Estado | Activa (responde), espejo automático del dashboard local |
| Mecanismo de deploy | **Verificado: build local + push a `gh-pages`, disparado automáticamente por `scripts/publish-pages.js` desde los botones Actualizar del dashboard** |
| Rama gh-pages | Remota activa |
| Workflows activos | Ninguno (`.github/workflows/` vacío) |
| Base URL en Vite | `/graham-investment-suite/` en build |

---

## 2. Cómo funciona el dashboard local

```
npm run dev:safe
    ↓
start-dashboard.js busca puerto libre
    ↓
Lanza Vite en segundo plano con logs en .local_runtime/
    ↓
React SPA carga en el navegador
    ↓
3 tabs disponibles:
  1. Graham Analyzer — análisis manual de empresas
  2. Watchlist — screening semanal de 10 candidatos
  3. Macro Radar — indicadores macroeconómicos
    ↓
Datos publicos se leen desde public/data/companies.json
    ↓
Cambios locales se guardan automaticamente en runtime/storage
```

El dashboard local es **completamente funcional sin conexión a internet** excepto por:
- API de Anthropic (análisis IA — opcional)
- Stooq (actualización de precios en screening semanal — opcional)

### Arranque oculto en Windows

```powershell
wscript.exe //B //NoLogo scripts\start-dashboard-hidden.vbs
```

### Keepalive local en Windows

```powershell
wscript.exe //B //NoLogo scripts\dashboard-keepalive.vbs
```

### Parada limpia del dashboard local

```bash
npm run dev:stop
```

`dev:stop` debe limpiar PID/metadata y matar el arbol completo `node/vite` del dashboard de este repo para no dejar `conhost.exe` huerfanos.

---

## 3. Cómo funciona GitHub Pages (verificado)

El deploy real no usa workflows remotos.

**Automático (por defecto):** cada vez que el dashboard local corre "Actualizar todo" o "Solo precios" (`/api/local/update-all`, `/api/local/update-prices`, `/api/local/yahoo-supplemental`, y la captura programada diaria), el servidor local ejecuta `node scripts/publish-pages.js` después de refrescar los datos:

1. Si `data/public/`, `public/data/` o `reports/weekly/` cambiaron, los comitea a `main` con un mensaje `chore(data): auto-sync dashboard update ...` y hace push.
2. Corre `npm run build`.
3. Corre el mismo flujo de `deploy-pages.js` (worktree temporal de `gh-pages`, copia de `dist/`, commit y push).

El resultado (éxito o error) se muestra en el mensaje de estado del dashboard sin bloquear el refresh de datos si la publicación falla (por ejemplo, sin red).

**Manual (fallback):** si prefieres controlar el momento exacto o el repo tiene cambios ajenos sin comitear:

```bash
npm run build
npm run deploy:pages
```

El script `deploy-pages.js`:
1. Verifica que el repo este limpio.
2. Hace `fetch` de `origin/gh-pages`.
3. Crea un worktree temporal.
4. Copia `dist/` al worktree.
5. Hace commit y push normal a `gh-pages`.

Para mantener sincronia bilateral manualmente:

```bash
git push origin main
npm run deploy:pages
```

---

## 4. Arquitectura dual propuesta (local + GitHub Pages)

```
┌─────────────────────────────────────────────────────────────────┐
│ FLUJO COMPLETO DE ACTUALIZACIÓN                                  │
│                                                                  │
│  [1] Datos frescos                                               │
│      Yahoo Finance (manual/auto) → fundamentales                │
│      Stooq (automático) → precios spot                          │
│                                                                  │
│  [2] Cálculo local                                              │
│      calcRatios() → ratios Graham                               │
│      classify() → clasificación                                 │
│      screenWatchlist() → estado de candidatos                   │
│                                                                  │
│  [3] Dashboard local                                            │
│      npm run dev → localhost:5173                               │
│      Actualización inmediata via React state                    │
│                                                                  │
│  [4] Build estático (opcional, para Pages)                      │
│      npm run build → dist/                                      │
│      Validar: sin secretos, sin datos privados                  │
│                                                                  │
│  [5] Deploy a GitHub Pages (opcional, equipo principal)         │
│      Verificar AUTO_PUSH_DASHBOARD=true                         │
│      Validar rama y permisos                                    │
│      Push controlado de dist/ o archivos permitidos            │
│      Registrar en .local_runtime/logs/ + device_id             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Variables de configuración local para Pages

Estas variables van en `.env.local` (NO se versionan en git):

```bash
# .env.local — NO subir a git

# Control de auto-push a GitHub Pages
AUTO_PUSH_DASHBOARD=false          # true solo en equipo principal
AUTO_PUSH_BRANCH=gh-pages          # rama destino para Pages
PUBLIC_DASHBOARD_MODE=false         # si true, el build incluye datos públicos

# Identificación del equipo (ver docs/10_INSTALACION_MULTIORDENADOR.md)
DEVICE_ID=mi-equipo-01
DEVICE_NAME=Laptop Eduardo
DEVICE_ROLE=principal
```

---

## 6. Flujo seguro de deploy a GitHub Pages

```
Paso 1: Verificar estado del repo
  git status → debe estar limpio

Paso 2: Actualizar datos locales
  npm run weekly:screen

Paso 3: Build
  npm run build → genera dist/

Paso 4: Validar que dist/ NO contiene secretos
  grep -r "VITE_ANTHROPIC_API_KEY" dist/  → debe estar vacío
  grep -r "TELEGRAM_BOT_TOKEN" dist/      → debe estar vacío
  grep -r "DEVICE_KEY" dist/              → debe estar vacío

Paso 5: Verificar configuración de Pages
  AUTO_PUSH_DASHBOARD=true
  DEVICE_ROLE=principal

Paso 6: Deploy controlado
  Opción A: npx gh-pages -d dist
  Opción B: Script local scripts/deploy-pages.js (propuesto)

Paso 7: Verificar publicación
  Abrir https://reguer.github.io/graham-investment-suite/

Paso 8: Registrar en logs
  .local_runtime/logs/YYYY-MM-DD-deploy.log
  Incluir: device_id, timestamp, build_hash, archivos subidos
```

---

## 7. Qué NO debe publicarse en GitHub Pages

| Tipo | Motivo |
|------|--------|
| `.env`, `.env.local` | Contienen secretos y claves |
| `VITE_ANTHROPIC_API_KEY` | Clave privada de la API de Anthropic |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram |
| `DEVICE_KEY` | Clave única por ordenador |
| `.local_runtime/` | PID, logs privados, device info |
| Base de datos SQLite | Contiene historial privado de análisis |
| Logs de análisis | Pueden contener datos de cartera |
| `node_modules/` | Dependencias — ya excluido en `.gitignore` |
| `dist/` (en rama main) | Build output — ya en `.gitignore` |

---

## 8. Qué SÍ puede publicarse en GitHub Pages

| Archivo/Carpeta | Descripción |
|----------------|-------------|
| `dist/` (en rama gh-pages) | Build estático de la aplicación |
| `reports/weekly/*.md` | Reportes de screening (si no contienen datos privados) |
| `docs/*.md` | Documentación técnica |
| `artifacts/*.jsx` | Componentes standalone para Claude.ai |
| `README.md` | Documentación pública |

---

## 9. Cómo actualizar GitHub Pages desde local

**Automático:** usar los botones "Actualizar todo" / "Solo precios" del dashboard (`npm run dev:safe`) — publican solos vía `scripts/publish-pages.js`.

**Manual:**

```bash
npm run build
npm run deploy:pages
```

El script `scripts/deploy-pages.js` ya existe y hace validacion de secretos sobre `dist/` antes de publicar. `scripts/publish-pages.js` lo reutiliza: primero comitea/pushea los datos pendientes a `main`, luego llama a `deployPages()`.

---

## 10. Cómo consultar el dashboard local

```powershell
# Iniciar
npm run dev

# Abrir en el navegador
Start-Process "http://localhost:5173"

# Verificar que está corriendo
Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing | Select-Object StatusCode
```

---

## 11. Diferencias entre dashboard local y GitHub Pages

| Aspecto | Local (localhost:5173) | GitHub Pages |
|---------|----------------------|-------------|
| Datos | Tiempo real (localStorage) | Snapshot en el momento del build |
| Análisis guardados | Sí — persistidos en localStorage | No — solo la UI estática |
| AI Analysis | Sí — si VITE_ANTHROPIC_API_KEY configurado | No — sin clave en prod |
| Actualización | Inmediata | Automática al usar Actualizar en el dashboard (build + deploy corren solos); build+deploy manual sigue disponible como fallback |
| Privacidad | 100% privado | Público — cualquiera puede verlo |
| Datos sensibles | Permitidos | Prohibidos |
| Velocidad | Fast (HMR) | Fast (CDN) |

---

## 12. Roadmap relacionado con el dashboard

| Mejora | Prioridad | Estado |
|--------|-----------|--------|
| Documentar mecanismo real de deploy | Alta | ✅ Completado |
| Crear `scripts/deploy-pages.js` | Media | ✅ Completado |
| Añadir validación de secretos pre-deploy | Alta | ✅ Completado |
| Configurar `AUTO_PUSH_DASHBOARD` por equipo | Media | Propuesto |
| Auto-publicar a `gh-pages` desde los botones Actualizar del dashboard | Alta | ✅ Completado (`scripts/publish-pages.js`, 2026-07-10) |
| Dashboard con datos de base local SQLite | Alta | Pendiente — requiere implementar BD |
| Build automático al cierre diario | Media | Propuesto (ver `docs/09`) |
| Arranque oculto estable en Windows | Alta | ✅ Completado |
