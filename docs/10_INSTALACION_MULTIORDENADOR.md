# 10 — Instalación en Distintos Ordenadores con Clave por Equipo

> Guía para instalar y configurar Graham Investment Suite en múltiples ordenadores, con identificación única por equipo para saber el origen de cada señal, alerta y reporte.

---

## 1. Por qué se necesita identificación por equipo

El proyecto puede ejecutarse simultáneamente en varios ordenadores. Sin identificación:

- No se sabe desde qué máquina se generó una alerta
- Pueden surgir conflictos si dos equipos hacen push a GitHub Pages al mismo tiempo
- Es imposible auditar qué datos se capturaron desde qué equipo
- Los reportes semanales no indican su origen

Con `device_id` en cada señal, reporte y alerta, todo queda trazable.

---

## 2. Proceso de instalación en un nuevo ordenador

### Paso 1: Clonar el repositorio

```powershell
# Opción A: HTTPS
git clone https://github.com/reguer/graham-investment-suite.git
cd "graham-investment-suite"

# Opción B: SSH (si tiene clave SSH configurada en GitHub)
git clone git@github.com:reguer/graham-investment-suite.git
cd "graham-investment-suite"
```

### Paso 2: Instalar dependencias

```powershell
npm install
```

### Paso 3: Verificar que los tests pasan

```powershell
npm test
```

Si todos los tests pasan, la instalación base está correcta.

### Paso 4: Crear la configuración local del equipo

**Opción A**: Manualmente — crear `.env.local`:

```powershell
# Crear .env.local
New-Item -Path ".env.local" -ItemType File -Force

# Agregar variables
Add-Content ".env.local" "# Configuración local del equipo — NO subir a git"
Add-Content ".env.local" "DEVICE_ID=mi-equipo-$(New-Guid)"
Add-Content ".env.local" "DEVICE_NAME=Laptop Eduardo Principal"
Add-Content ".env.local" "DEVICE_ROLE=principal"
Add-Content ".env.local" ""
Add-Content ".env.local" "# API Keys (sin revelar valores)"
Add-Content ".env.local" "VITE_ANTHROPIC_API_KEY="
Add-Content ".env.local" ""
Add-Content ".env.local" "# Telegram (opcional)"
Add-Content ".env.local" "ENABLE_TELEGRAM_ALERTS=false"
Add-Content ".env.local" "TELEGRAM_BOT_TOKEN="
Add-Content ".env.local" "TELEGRAM_CHAT_ID="
Add-Content ".env.local" ""
Add-Content ".env.local" "# Dashboard"
Add-Content ".env.local" "AUTO_PUSH_DASHBOARD=false"
Add-Content ".env.local" "AUTO_PUSH_BRANCH=gh-pages"
Add-Content ".env.local" "PUBLIC_DASHBOARD_MODE=false"
```

**Opción B**: Script guiado (propuesto) — `scripts/register-device.js`:

```powershell
# Propuesto — no existe aún
node scripts/register-device.js
# Te pedirá: nombre del equipo, rol, si activar Telegram, si activar auto-push
```

### Paso 5: Crear el directorio de runtime local

```powershell
New-Item -ItemType Directory -Path ".local_runtime/locks" -Force
New-Item -ItemType Directory -Path ".local_runtime/logs" -Force
```

### Paso 6: Crear `.local_runtime/device.json`

```powershell
$deviceId = [System.Guid]::NewGuid().ToString()
$deviceConfig = @{
  device_id = $deviceId
  device_name = "Laptop Eduardo Principal"
  device_role = "principal"
  location = "Ciudad de México"
  registered_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
  auto_push_enabled = $false
  telegram_enabled = $false
  telegram_alert_min_severity = "medium"
}
$deviceConfig | ConvertTo-Json | Out-File -FilePath ".local_runtime/device.json" -Encoding UTF8
Write-Host "Equipo registrado con ID: $deviceId"
```

### Paso 7: Verificar la instalación completa

```powershell
# Tests
npm test

# Build
npm run build

# Screening manual
npm run weekly:screen

# Dashboard
npm run dev
```

---

## 3. Archivos locales por equipo (NO versionar en git)

| Archivo | Propósito | Gitignore |
|---------|-----------|-----------|
| `.env.local` | Variables de entorno del equipo | Debe estar en `.gitignore` |
| `.local_runtime/device.json` | Configuración e ID del equipo | `.gitignore` |
| `.local_runtime/dashboard.pid` | PID del proceso Vite | `.gitignore` |
| `.local_runtime/*.pid` | PIDs de todos los procesos | `.gitignore` |
| `.local_runtime/locks/` | Lockfiles de procesos | `.gitignore` |
| `.local_runtime/logs/` | Logs locales | `.gitignore` |
| `.local_runtime/heartbeat.json` | Estado de procesos | `.gitignore` |

### Actualizar `.gitignore`

Añadir estas líneas al `.gitignore` actual:

```gitignore
# Runtime local (por equipo — nunca versionar)
.local_runtime/
.env.local
*.pid
*.lock
data/*.db
data/*.db-shm
data/*.db-wal
data/cache/
data/export/
```

---

## 4. Estructura de device.json

```json
{
  "device_id": "a3b4c5d6-e7f8-9012-abcd-ef1234567890",
  "device_name": "Laptop Eduardo Principal",
  "device_role": "principal",
  "location": "Ciudad de México — Oficina",
  "registered_at": "2026-06-03T18:00:00-06:00",
  "last_seen_at": "2026-06-03T18:05:23-06:00",
  "auto_push_enabled": false,
  "telegram_enabled": false,
  "telegram_alert_min_severity": "medium",
  "notes": "Equipo principal de análisis"
}
```

---

## 5. Roles de equipo y permisos

| Rol | Auto-push Pages | Generar datos | Servir dashboard | Tests | Screening |
|-----|----------------|--------------|-----------------|-------|-----------|
| `principal` | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ | ✅ |
| `secundario` | ❌ No | ✅ Permitido | ✅ Permitido | ✅ | ✅ |
| `solo-dashboard` | ❌ No | ❌ No | ✅ Permitido | ❌ | ❌ |
| `solo-datos` | ❌ No | ✅ Permitido | ❌ No | ❌ | ✅ |
| `solo-pruebas` | ❌ No | ❌ No | ✅ Permitido | ✅ | ❌ |

---

## 6. Cómo identificar el origen de cada señal

Cada alerta, reporte y log debe incluir el `device_id` y `device_name`.

### En reportes Markdown

El reporte generado por `weekly-screen.js` debe incluir al pie:

```markdown
---
*Reporte generado el 2026-06-03 a las 18:02 CDMX*
*Equipo: Laptop Eduardo Principal (a3b4c5d6)*
*Fuente de precios: Stooq*
```

### En alertas Telegram

Cada mensaje de Telegram incluye:

```
💻 Laptop Eduardo Principal (principal)
```

### En logs

Cada línea de log incluye `[device:device-id]`.

---

## 7. Control de señales duplicadas entre equipos

Si dos equipos corren el screening simultáneamente, puede haber alertas duplicadas.

**Solución simple (sin coordinación de red)**:

Cada equipo guarda sus propias alertas localmente. Al comparar historial:
- Si la misma alerta (mismo ticker + tipo + estado) fue generada en el mismo día → es duplicada
- El sistema filtra por `(ticker, alert_type, new_status, market_close_date)` para detectar duplicados

**Regla práctica**:
- Solo el equipo con `device_role = 'principal'` hace push a GitHub Pages
- Todos los equipos pueden generar alertas locales
- Solo el equipo principal envía alertas por Telegram

---

## 8. Rotar la clave de un equipo

Si se compromete un equipo o se quiere reasignar el rol:

```powershell
# Generar nuevo device_id
$newId = [System.Guid]::NewGuid().ToString()

# Actualizar device.json
$device = Get-Content ".local_runtime/device.json" | ConvertFrom-Json
$device.device_id = $newId
$device | ConvertTo-Json | Out-File ".local_runtime/device.json" -Encoding UTF8

# Actualizar .env.local
(Get-Content ".env.local") -replace "DEVICE_ID=.*", "DEVICE_ID=$newId" | Set-Content ".env.local"

Write-Host "Nuevo device_id: $newId"
```

---

## 9. Escenarios de instalación

### Escenario A: Solo un equipo (más común)

```
Equipo principal (DEVICE_ROLE=principal):
- Corre dashboard local
- Corre screening semanal
- Hace push a GitHub Pages
- Envía alertas Telegram
```

### Escenario B: Dos equipos — casa y trabajo

```
Equipo casa (DEVICE_ROLE=principal):
- Auto-push a Pages: habilitado
- Telegram: habilitado

Equipo trabajo (DEVICE_ROLE=secundario):
- Auto-push: deshabilitado
- Solo consulta dashboard y genera reportes locales
- NO envía alertas Telegram (para evitar duplicados)
```

### Escenario C: Equipo dedicado a datos solamente

```
Equipo servidor local (DEVICE_ROLE=solo-datos):
- Corre solo data-ingestion.js y screening
- No sirve dashboard
- No hace push a Pages
- Solo actualiza la BD local SQLite
```

---

## 10. Checklist de instalación verificada

```powershell
# Ejecutar este checklist después de instalar en un nuevo equipo:

Write-Host "=== CHECKLIST DE INSTALACIÓN ==="
Write-Host ""

# 1. Tests
Write-Host "[1] Corriendo tests..."
npm test
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Tests OK" } else { Write-Host "✗ Tests FALLARON" }

# 2. Build
Write-Host "[2] Corriendo build..."
npm run build
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Build OK" } else { Write-Host "✗ Build FALLÓ" }

# 3. device.json
Write-Host "[3] Verificando device.json..."
if (Test-Path ".local_runtime/device.json") {
    $device = Get-Content ".local_runtime/device.json" | ConvertFrom-Json
    Write-Host "✓ device_id: $($device.device_id)"
    Write-Host "✓ device_name: $($device.device_name)"
    Write-Host "✓ device_role: $($device.device_role)"
} else {
    Write-Host "✗ .local_runtime/device.json NO existe — ejecutar paso de configuración"
}

# 4. .env.local
Write-Host "[4] Verificando .env.local..."
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local existe"
} else {
    Write-Host "✗ .env.local NO existe — crear con las variables requeridas"
}

# 5. Screening
Write-Host "[5] Corriendo screening..."
npm run weekly:screen
if ($LASTEXITCODE -eq 0) { Write-Host "✓ Screening OK" } else { Write-Host "✗ Screening FALLÓ" }

Write-Host ""
Write-Host "=== FIN DEL CHECKLIST ==="
```
