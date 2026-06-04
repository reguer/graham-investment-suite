# 03 — Dashboard Local y GitHub Pages

> Este documento describe la arquitectura dual: dashboard local (React SPA) y dashboard público (GitHub Pages), y cómo mantenerlos sincronizados de forma segura sin depender de GitHub Actions.

---

## 1. Estado actual verificado

### Dashboard local

| Aspecto | Estado |
|---------|--------|
| Comando | `npm run dev` |
| Puerto | 5173 (Vite default) |
| URL | `http://localhost:5173` |
| Tecnología | React 18.3 + Vite 5.4 SPA |
| Datos | En tiempo real desde `localStorage` + cálculos en memoria |
| Actualización | Al guardar análisis o correr `weekly:screen` |

### GitHub Pages

| Aspecto | Estado |
|---------|--------|
| URL pública | `https://reguer.github.io/graham-investment-suite/` |
| Estado | Activa (responde) |
| Mecanismo de deploy | **NO VERIFICADO** |
| Rama gh-pages | No detectada localmente |
| Workflows activos | Ninguno (`.github/workflows/` vacío) |
| Base URL en Vite | Auto-detectada: `/graham-investment-suite/` si `GITHUB_ACTIONS=true` |

---

## 2. Cómo funciona el dashboard local

```
npm run dev
    ↓
Vite inicia en localhost:5173
    ↓
React SPA carga en el navegador
    ↓
3 tabs disponibles:
  1. Graham Analyzer — análisis manual de empresas
  2. Watchlist — screening semanal de 10 candidatos
  3. Macro Radar — indicadores macroeconómicos
    ↓
Datos se leen de localStorage al cargar
    ↓
Cambios se guardan automáticamente en localStorage
```

El dashboard local es **completamente funcional sin conexión a internet** excepto por:
- API de Anthropic (análisis IA — opcional)
- Stooq (actualización de precios en screening semanal — opcional)

---

## 3. Cómo funciona GitHub Pages (hipótesis)

Dado que no hay workflow activo, el deploy más probable es:

**Hipótesis A**: Deploy manual con gh-pages package

```bash
# Hipótesis — no verificado
npm run build              # genera dist/
npx gh-pages -d dist       # sube dist/ a rama gh-pages
```

**Hipótesis B**: GitHub Pages desde carpeta `docs/` de rama `main`

Configurado en Settings → Pages → Branch: main → Folder: /docs

**Hipótesis C**: Push manual de `dist/` a rama `gh-pages`

```bash
# Hipótesis — no verificado
git checkout -b gh-pages
cp -r dist/* .
git push origin gh-pages
```

**Para verificar el mecanismo real**: Ir a GitHub.com → Settings → Pages y revisar la configuración.

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

## 9. Cómo actualizar GitHub Pages automáticamente desde local

**Propuesta de script `scripts/deploy-pages.js`** (NO existe aún):

```javascript
// scripts/deploy-pages.js — PROPUESTO

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'

// 1. Verificar que es el equipo autorizado
const device = JSON.parse(readFileSync('.local_runtime/device.json', 'utf8'))
if (device.device_role !== 'principal' || !device.auto_push_enabled) {
  console.error('Este equipo no está autorizado para hacer deploy a Pages.')
  process.exit(1)
}

// 2. Verificar que el repo está limpio
const status = execSync('git status --porcelain').toString()
if (status.trim()) {
  console.error('El repositorio tiene cambios sin commitear. Abortando deploy.')
  process.exit(1)
}

// 3. Build
execSync('npm run build', { stdio: 'inherit' })

// 4. Validar que dist/ no contiene secretos
const sensitivePatterns = ['ANTHROPIC_API_KEY', 'TELEGRAM_BOT_TOKEN', 'DEVICE_KEY']
for (const pattern of sensitivePatterns) {
  const result = execSync(`grep -r "${pattern}" dist/ || true`).toString()
  if (result.trim()) {
    console.error(`¡ALERTA! Se encontró "${pattern}" en dist/. Abortando.`)
    process.exit(1)
  }
}

// 5. Deploy
execSync('npx gh-pages -d dist', { stdio: 'inherit' })

// 6. Registrar
console.log(`Deploy realizado desde ${device.device_name} a las ${new Date().toISOString()}`)
```

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
| Actualización | Inmediata | Requiere nuevo build + deploy |
| Privacidad | 100% privado | Público — cualquiera puede verlo |
| Datos sensibles | Permitidos | Prohibidos |
| Velocidad | Fast (HMR) | Fast (CDN) |

---

## 12. Roadmap relacionado con el dashboard

| Mejora | Prioridad | Estado |
|--------|-----------|--------|
| Documentar mecanismo real de deploy | Alta | Pendiente — verificar en GitHub.com |
| Crear `scripts/deploy-pages.js` | Media | Propuesto |
| Añadir validación de secretos pre-deploy | Alta | Propuesto |
| Configurar `AUTO_PUSH_DASHBOARD` por equipo | Media | Propuesto |
| Dashboard con datos de base local SQLite | Alta | Pendiente — requiere implementar BD |
| Build automático al cierre diario | Media | Propuesto (ver `docs/09`) |
