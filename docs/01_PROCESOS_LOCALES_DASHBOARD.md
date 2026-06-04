# 01 — Procesos Locales y Dashboard

> Este documento describe cómo levantar el dashboard local de forma aislada, sin invadir puertos ni procesos de otros proyectos.
> Toda propuesta de arquitectura aquí descrita es un diseño; los scripts indicados como "propuestos" NO existen todavía en el repo.

---

## 1. Cómo se levanta actualmente el dashboard local

```powershell
npm run dev
```

Internamente esto ejecuta:

```
node scripts/run-local-bin.js vite
```

Que a su vez invoca el binario `vite` desde `node_modules/` local. El servidor inicia en:

```
http://localhost:5173
```

No existe `server.host` ni `server.port` explícitos en `vite.config.js`. Vite usa sus defaults: host `localhost` (127.0.0.1), puerto `5173`.

## 2. Comando real para desarrollo local

Inicializar runtime local una vez por equipo:

```powershell
npm run runtime:init
```

El comando crea `.local_runtime/logs`, `.local_runtime/locks`, `.local_runtime/pids` y `.local_runtime/device.json`. Si `device.json` ya existe, se conserva.

```powershell
# Levantar con puerto default
npm run dev

# Levantar con deteccion automatica de puerto libre
npm run dev:safe

# Levantar con puerto específico si 5173 está ocupado
npm run dev -- --port 5174

# Levantar con host explícito (útil para acceder desde otra pantalla en la misma red local)
npm run dev -- --host 127.0.0.1 --port 5173
```

> **Nota**: El doble `--` es necesario para que npm pase los flags al proceso subyacente (Vite).

## 3. Comando real para build

```powershell
npm run build
```

Genera `dist/` con el build estático. El `dist/` está en `.gitignore`.

Para previsualizar el build localmente (no existe script en package.json, pero funciona):

```powershell
npx vite preview --port 4173
```

## 4. Puerto que intenta usar

| Proceso | Puerto default | Configurable |
|---------|---------------|-------------|
| `npm run dev` (Vite dev) | **5173** | Sí, con `--port N` |
| `npx vite preview` | 4173 | Sí, con `--port N` |

## 5. Qué hacer si el puerto está ocupado

**Verificar si el puerto 5173 está en uso en Windows:**

```powershell
netstat -ano | findstr :5173
```

Si devuelve líneas con `LISTENING`, el puerto está ocupado. Identificar el proceso:

```powershell
# Obtener el PID del proceso que usa el puerto
$pid = (netstat -ano | findstr :5173 | Select-String "LISTENING").ToString().Trim().Split()[-1]
Get-Process -Id $pid
```

**Acción correcta**: Cambiar el puerto del dashboard de este proyecto, **NO matar el proceso ajeno**.

Desde v1.1, usar:

```powershell
npm run dev:safe
```

El script revisa 5173 y, si esta ocupado, usa el siguiente puerto disponible.
Al iniciar, registra su PID en `.local_runtime/dashboard.pid`.

Para detener solo el dashboard registrado por este proyecto:

```powershell
npm run dev:stop
```

```powershell
# Usar puerto alternativo para este proyecto
npm run dev -- --port 5174
```

Puertos alternativos sugeridos para este proyecto: `5174`, `5175`, `5200`, `5201`.

## 6. Cómo detectar un puerto disponible sin cerrar procesos externos

Script PowerShell para encontrar el primer puerto libre a partir de 5173:

```powershell
function Get-FreePort {
    param([int]$StartPort = 5173)
    $usedPorts = (netstat -ano | Select-String "LISTENING" | ForEach-Object {
        ($_ -split '\s+')[2] -replace '.*:', ''
    }) -as [int[]]
    $port = $StartPort
    while ($port -in $usedPorts) { $port++ }
    return $port
}
$port = Get-FreePort
Write-Host "Puerto disponible: $port"
```

O más simple desde Bash:

```bash
python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()"
```

## 7. Cómo dejar constancia de la URL local activa

**Propuesta**: Crear archivo `.local_runtime/current_dashboard_url.txt` al iniciar el dashboard.

Esto NO existe aún en el proyecto. Es una propuesta para implementar en el script de inicio.

Contenido sugerido:

```
http://localhost:5174
started_at: 2026-06-03T18:00:00-06:00
pid: 12345
device_id: macbook-eduardo-01
```

## 8. Cómo evitar colisiones con otros proyectos

Reglas de aislamiento:

1. **Nunca usar puertos fijos sin verificar** — siempre comprobar disponibilidad antes de iniciar
2. **Nunca matar procesos ajenos** — si el puerto está ocupado, cambiar el puerto de este proyecto
3. **Guardar el PID del proceso iniciado** en `.local_runtime/dashboard.pid`
4. **Al detener**, solo matar el proceso cuyo PID coincida con el guardado en `.local_runtime/dashboard.pid`
5. **No usar puertos < 1024** — requieren permisos de administrador
6. **Rango reservado para este proyecto**: 5173–5179 (Vite), 4173–4179 (preview)

## 9. Propuesta de estructura `.local_runtime/`

```
.local_runtime/
├── device.json               ← Identificación del ordenador (ver docs/10_INSTALACION_MULTIORDENADOR.md)
├── dashboard.pid             ← PID del proceso Vite activo
├── data_update.pid           ← PID del proceso de actualización de datos
├── current_dashboard_url.txt ← URL activa del dashboard local
├── heartbeat.json            ← Última vez que los procesos reportaron vida
├── locks/
│   ├── dashboard.lock        ← Lockfile del dashboard (previene doble instancia)
│   ├── data_update.lock      ← Lockfile de la actualización de datos
│   └── weekly_screen.lock    ← Lockfile del screening semanal
└── logs/
    ├── 2026-06-03-dashboard.log
    ├── 2026-06-03-data_update.log
    └── 2026-06-03-weekly_screen.log
```

**IMPORTANTE**: Esta carpeta debe estar en `.gitignore`.

Añadir a `.gitignore`:
```
.local_runtime/
*.pid
*.lock
```

## 10. Cómo identificar y detener solo procesos de ESTE proyecto

**Inicio correcto** (leer/guardar PID):

```powershell
# Iniciar el dashboard y guardar el PID
$process = Start-Process -FilePath "npm" -ArgumentList "run dev -- --port 5174" -PassThru -NoNewWindow
$process.Id | Out-File ".local_runtime/dashboard.pid"
```

O desde Node.js (script propuesto `scripts/start-dashboard.js`):

```javascript
// scripts/start-dashboard.js (PROPUESTO — no existe aún)
import { spawn } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'

mkdirSync('.local_runtime/locks', { recursive: true })
const vite = spawn('npm', ['run', 'dev', '--', '--port', '5174'], { stdio: 'inherit' })
writeFileSync('.local_runtime/dashboard.pid', String(vite.pid))
writeFileSync('.local_runtime/current_dashboard_url.txt', 'http://localhost:5174\n')
```

**Detener correctamente** (solo el proceso propio):

```powershell
$pid = Get-Content ".local_runtime/dashboard.pid"
Stop-Process -Id $pid -ErrorAction SilentlyContinue
Remove-Item ".local_runtime/dashboard.pid"
Remove-Item ".local_runtime/locks/dashboard.lock" -ErrorAction SilentlyContinue
```

**Verificar si el proceso sigue vivo**:

```powershell
$pid = Get-Content ".local_runtime/dashboard.pid" -ErrorAction SilentlyContinue
if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
    Write-Host "Dashboard activo en PID $pid"
} else {
    Write-Host "Dashboard no está corriendo"
}
```

## 11. Prevenir doble instancia

Antes de iniciar el dashboard, verificar si ya existe un lockfile:

```powershell
if (Test-Path ".local_runtime/locks/dashboard.lock") {
    $existingPid = Get-Content ".local_runtime/locks/dashboard.lock"
    if (Get-Process -Id $existingPid -ErrorAction SilentlyContinue) {
        Write-Host "ERROR: El dashboard ya está corriendo en PID $existingPid"
        exit 1
    } else {
        # El proceso murió sin limpiar — remover lock huérfano
        Remove-Item ".local_runtime/locks/dashboard.lock"
    }
}
```

## 12. Roadmap de scripts propuestos

Estos scripts NO existen actualmente. Se proponen para implementación futura:

| Script | Propósito | Prioridad |
|--------|-----------|-----------|
| `scripts/start-dashboard.js` | Inicia Vite con detección de puerto, guarda PID y lock | Alta |
| `scripts/stop-dashboard.js` | Detiene solo el proceso de este proyecto | Alta |
| `scripts/register-device.js` | Crea `.local_runtime/device.json` con device_id | Media |
| `scripts/health-check.js` | Verifica que todos los procesos del proyecto estén vivos | Media |

---

## Resumen de reglas de aislamiento

| Regla | Descripción |
|-------|-------------|
| No matar procesos ajenos | Si el puerto está ocupado, cambiar el puerto de este proyecto |
| Guardar PID | Siempre guardar `.local_runtime/dashboard.pid` al iniciar |
| Usar lockfiles | Crear `.local_runtime/locks/dashboard.lock` para prevenir doble instancia |
| Verificar antes de iniciar | Siempre `netstat -ano \| findstr :PUERTO` antes de iniciar |
| Limpiar al terminar | Borrar `.pid` y `.lock` al terminar correctamente |
| No versionar `.local_runtime/` | Añadir a `.gitignore` |
