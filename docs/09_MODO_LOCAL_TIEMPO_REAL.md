# 09 — Modo Local en Tiempo Real

> Arquitectura para mantener el sistema activo mientras el ordenador está encendido, con actualización continua de datos, dashboard y alertas.

---

## 1. Estado actual

| Proceso | Estado |
|---------|--------|
| Actualización de precios | Solo manual al ejecutar `npm run weekly:screen` |
| Dashboard activo | Solo si el usuario corre `npm run dev` manualmente |
| Alertas automáticas | No existen |
| Scheduler local | No existe |
| Windows Task Scheduler | No configurado |
| Modo watch | No existe |

---

## 2. Los 4 procesos propuestos

```
┌──────────────────────────────────────────────────────────────┐
│ PROCESO 1: data-updater                                       │
│ Actualiza precios y fundamentales                             │
│ Puerto: N/A (proceso Node.js, no servidor HTTP)              │
│ Lock: .local_runtime/locks/data_update.lock                  │
│ PID: .local_runtime/data_update.pid                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PROCESO 2: dashboard-server                                   │
│ Vite dev server o preview del build                          │
│ Puerto: 5173 (default) o el primero disponible              │
│ Lock: .local_runtime/locks/dashboard.lock                    │
│ PID: .local_runtime/dashboard.pid                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PROCESO 3: report-generator                                   │
│ Crea MD y HTML al detectar cambio en datos                   │
│ Puerto: N/A                                                  │
│ Lock: .local_runtime/locks/report.lock                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PROCESO 4: alert-dispatcher                                   │
│ Evalúa condiciones y despacha alertas                        │
│ Puerto: N/A                                                  │
│ Lock: .local_runtime/locks/alerts.lock                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Los 7 modos de operación

| Modo | Descripción | Procesos activos |
|------|-------------|-----------------|
| `manual` | Solo cuando el usuario invoca un comando | El comando específico |
| `scheduled` | Corre según Task Scheduler (18:00 CDMX) | data-updater + report + alerts |
| `watch` | Poll continuo mientras el ordenador esté encendido | Los 4 procesos |
| `dashboard-only` | Solo sirve la UI sin actualizar datos | dashboard-server |
| `data-only` | Solo actualiza datos, sin dashboard | data-updater |
| `alerts-only` | Solo evalúa y despacha alertas | alert-dispatcher |
| `public-build-only` | Solo genera build para GitHub Pages | Ninguno (one-shot) |

---

## 4. Windows Task Scheduler — Configuración para 18:00 CDMX

### Conversión de horarios

| Zona horaria | Hora (cierre operativo) | Equivalente UTC |
|-------------|------------------------|----------------|
| CDMX (CST, UTC-6) | 18:00 | 00:00 del día siguiente |
| CDMX (CDT, UTC-5) | 18:00 | 23:00 del mismo día |

**Recomendación**: Configurar la tarea a las 18:00 hora local del sistema. Si el sistema operativo está en hora de CDMX, esto es correcto directamente.

### Crear la tarea con PowerShell

```powershell
# Configurar variables
$projectPath = "g:\Mi unidad\00. APPS\GrahamAnalizer"
$nodeExe = (Get-Command node).Source
$script = Join-Path $projectPath "scripts\weekly-screen.js"

# Crear la acción
$action = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument $script `
  -WorkingDirectory $projectPath

# Crear el trigger (18:00 todos los días)
$trigger = New-ScheduledTaskTrigger -Daily -At "18:00"

# Crear la tarea
Register-ScheduledTask `
  -TaskName "GrahamAnalyzer-DailyClose" `
  -Action $action `
  -Trigger $trigger `
  -Description "Graham Investment Suite - Screening al cierre diario 18:00 CDMX" `
  -RunLevel Limited `
  -Force

Write-Host "Tarea programada creada: GrahamAnalyzer-DailyClose"
```

### Crear tarea adicional para lunes y viernes (alertas formales)

```powershell
# Lunes
$triggerLunes = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "18:00"

# Viernes
$triggerViernes = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At "18:00"

Register-ScheduledTask `
  -TaskName "GrahamAnalyzer-FormalAlert-Monday" `
  -Action $action `
  -Trigger $triggerLunes `
  -Description "Graham - Alerta formal lunes"

Register-ScheduledTask `
  -TaskName "GrahamAnalyzer-FormalAlert-Friday" `
  -Action $action `
  -Trigger $triggerViernes `
  -Description "Graham - Alerta formal viernes"
```

### Verificar las tareas creadas

```powershell
Get-ScheduledTask | Where-Object { $_.TaskName -like "GrahamAnalyzer*" }
```

### Ejecutar manualmente una tarea programada

```powershell
Start-ScheduledTask -TaskName "GrahamAnalyzer-DailyClose"
```

### Eliminar una tarea

```powershell
Unregister-ScheduledTask -TaskName "GrahamAnalyzer-DailyClose" -Confirm:$false
```

---

## 5. Alternativas al Task Scheduler

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **Windows Task Scheduler** (recomendado) | Nativo en Windows, confiable, no requiere proceso persistente | Interfaz compleja, requiere PowerShell admin para configurar |
| **Script watch persistente** | Simple de implementar con `setInterval` | Muere si se cierra la terminal, consume RAM continua |
| **PowerShell Scheduled Job** | Similar al Task Scheduler pero desde PS | Menos integrado con el sistema operativo |
| **npm-run-all + watch** | Fácil de arrancar con un comando | No persiste tras reinicio |
| **PM2** (process manager) | Reinicio automático, logs integrados | Requiere instalar PM2 globalmente |

---

## 6. Modo watch con poll continuo

Para mantener actualización continua mientras el ordenador esté encendido:

```javascript
// scripts/watch-mode.js — PROPUESTO (no existe)

const PRICE_UPDATE_INTERVAL_MS = 15 * 60 * 1000  // 15 minutos
const METRICS_RECALC_INTERVAL_MS = 15 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 60 * 1000           // 1 minuto

async function watchLoop() {
  // Heartbeat
  setInterval(updateHeartbeat, HEARTBEAT_INTERVAL_MS)
  
  // Actualización de precios (solo durante horario de mercado)
  setInterval(async () => {
    if (isMarketHours()) {
      await updatePrices()
      await recalculateMetrics()
      await evaluateAlerts()
    }
  }, PRICE_UPDATE_INTERVAL_MS)
  
  // Post-cierre diario (siempre a las 18:00 CDMX)
  scheduleDailyClose('18:00', 'America/Mexico_City', async () => {
    await updatePrices()
    await recalculateMetrics()
    await generateReport()
    await evaluateAlerts({ formal: true })
    await buildDashboard()
    if (device.auto_push_enabled) await deployPages()
  })
}

function isMarketHours() {
  const now = new Date()
  const cdmxHour = now.toLocaleString('en-US', {
    timeZone: 'America/Mexico_City',
    hour: 'numeric', hour12: false
  })
  return cdmxHour >= 8 && cdmxHour < 18
}
```

---

## 7. Heartbeat y detección de fallos

### Archivo heartbeat

`.local_runtime/heartbeat.json`:

```json
{
  "timestamp": "2026-06-03T18:05:23-06:00",
  "device_id": "laptop-eduardo-01",
  "processes": {
    "data_updater": {
      "pid": 12345,
      "status": "running",
      "last_run": "2026-06-03T18:00:01-06:00",
      "last_success": "2026-06-03T18:00:03-06:00"
    },
    "dashboard": {
      "pid": 12346,
      "status": "running",
      "port": 5173,
      "url": "http://localhost:5173"
    },
    "alert_dispatcher": {
      "pid": 12347,
      "status": "idle",
      "last_run": "2026-06-03T18:00:05-06:00"
    }
  },
  "data_sources": {
    "stooq": "ok",
    "yahoo_finance": "not_configured"
  },
  "last_screening": "2026-06-03T18:00:03-06:00",
  "last_report_generated": "2026-06-03T18:00:05-06:00",
  "last_pages_push": "2026-06-03T17:00:00-06:00"
}
```

### Detectar procesos muertos

```powershell
# Verificar si data-updater sigue vivo
$pidFile = ".local_runtime/data_update.pid"
if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile
    if (-not (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Write-Warning "data-updater murió (PID $pid). Limpiando lock..."
        Remove-Item ".local_runtime/locks/data_update.lock" -ErrorAction SilentlyContinue
        Remove-Item $pidFile
    }
}
```

---

## 8. Logs por proceso

```
.local_runtime/logs/
├── 2026-06-03-dashboard.log        ← Líneas del servidor Vite
├── 2026-06-03-data_update.log      ← Actualizaciones de precios y fundamentales
├── 2026-06-03-report.log           ← Generación de reportes
├── 2026-06-03-alerts.log           ← Alertas evaluadas y despachadas
└── 2026-06-03-errors.log           ← Errores de cualquier proceso
```

Formato de cada línea de log:

```
[2026-06-03T18:00:01-06:00] [device:laptop-eduardo-01] [INFO] data_update: Stooq KBH → $51.45 USD
[2026-06-03T18:00:02-06:00] [device:laptop-eduardo-01] [INFO] metrics: KBH pePb=8.30 ≤ 22.5 ✓
[2026-06-03T18:00:03-06:00] [device:laptop-eduardo-01] [ALERT] alert: KBH → READY_TO_BUY (nueva)
[2026-06-03T18:00:05-06:00] [device:laptop-eduardo-01] [INFO] report: reports/weekly/2026-06-03.md generado
```

---

## 9. Evitar ejecuciones duplicadas

### Lockfile pattern

```javascript
// Antes de ejecutar un proceso:
const lockPath = '.local_runtime/locks/weekly_screen.lock'

if (existsSync(lockPath)) {
  const lockData = JSON.parse(readFileSync(lockPath))
  const pid = lockData.pid
  // Verificar si el proceso sigue vivo
  try {
    process.kill(pid, 0)  // signal 0 = verificar si existe
    console.error(`Ya hay una ejecución activa (PID ${pid}). Abortando.`)
    process.exit(1)
  } catch {
    // El proceso murió sin limpiar el lock
    console.warn('Lock huérfano encontrado. Limpiando...')
  }
}

// Crear lock
writeFileSync(lockPath, JSON.stringify({
  pid: process.pid,
  started_at: new Date().toISOString(),
  device_id: process.env.DEVICE_ID
}))

// Al terminar, siempre limpiar
process.on('exit', () => unlinkSync(lockPath))
process.on('SIGINT', () => { unlinkSync(lockPath); process.exit(0) })
process.on('SIGTERM', () => { unlinkSync(lockPath); process.exit(0) })
```

---

## 10. Validar que la vela diaria ya cerró

```javascript
function isDailyCloseComplete() {
  const now = new Date()
  const cdmxTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    hour: 'numeric', minute: 'numeric', hour12: false
  }).format(now)
  
  const [hour, minute] = cdmxTime.split(':').map(Number)
  return hour >= 18  // 18:00 CDMX = después del cierre de mercado USA
}
```

---

## 11. Script maestro propuesto

```javascript
// scripts/run-mode.js — PROPUESTO (no existe)

// Uso:
// node scripts/run-mode.js --mode scheduled
// node scripts/run-mode.js --mode watch
// node scripts/run-mode.js --mode dashboard-only
// node scripts/run-mode.js --mode manual --action screen
// node scripts/run-mode.js --mode public-build-only

// Lee .local_runtime/device.json para configurar comportamiento
// Aplica lockfiles por proceso
// Registra logs en .local_runtime/logs/
// Actualiza heartbeat cada 60s
```
