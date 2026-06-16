param(
  [string]$PipelineTaskName = "GrahamInvestmentSuite-MondayFriday",
  [string]$StartupTaskName  = "GrahamInvestmentSuite-Startup",
  [string]$Time = "18:00",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) { $npmCommand = Get-Command npm -ErrorAction SilentlyContinue }
$npm = if ($npmCommand) { $npmCommand.Source } else { $null }
if (-not $npm) { throw "No se encontro npm en PATH." }

# Eliminar tarea anterior si existe (para actualizar WorkingDirectory al repo actual)
$existing = Get-ScheduledTask -TaskName $PipelineTaskName -ErrorAction SilentlyContinue
if ($existing) {
  if ($Force) {
    Unregister-ScheduledTask -TaskName $PipelineTaskName -Confirm:$false
    Write-Host "Tarea '$PipelineTaskName' eliminada para recrear con ruta actualizada."
  } else {
    # Verificar si el WorkingDirectory es el repo correcto
    $currentDir = $existing.Actions[0].WorkingDirectory
    if ($currentDir -ne $repo) {
      Write-Host "Actualizando WorkingDirectory de '$currentDir' a '$repo'..."
      Unregister-ScheduledTask -TaskName $PipelineTaskName -Confirm:$false
    } else {
      Write-Host "La tarea '$PipelineTaskName' ya apunta a '$repo'. Sin cambios."
    }
  }
}

$existing = Get-ScheduledTask -TaskName $PipelineTaskName -ErrorAction SilentlyContinue
if (-not $existing) {
  $action   = New-ScheduledTaskAction -Execute $npm -Argument "run weekly:pipeline" -WorkingDirectory $repo
  $trigger  = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Friday -At $Time
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
  Register-ScheduledTask -TaskName $PipelineTaskName -Action $action -Trigger $trigger -Settings $settings `
    -Description "Graham Investment Suite: pipeline semanal lunes y viernes a las $Time."
  Write-Host "Tarea creada: $PipelineTaskName ($Time lunes y viernes) -> $repo"
}

# Tarea de arranque: iniciar dashboard al encender el equipo
$existingStartup = Get-ScheduledTask -TaskName $StartupTaskName -ErrorAction SilentlyContinue
if ($existingStartup) {
  $currentDir = $existingStartup.Actions[0].WorkingDirectory
  if ($currentDir -ne $repo -or $Force) {
    Unregister-ScheduledTask -TaskName $StartupTaskName -Confirm:$false
    Write-Host "Tarea startup eliminada para recrear con ruta actualizada."
    $existingStartup = $null
  } else {
    Write-Host "La tarea '$StartupTaskName' ya existe y apunta a '$repo'. Sin cambios."
  }
}

if (-not $existingStartup) {
  $actionStartup  = New-ScheduledTaskAction -Execute $npm -Argument "run dev:safe" -WorkingDirectory $repo
  $triggerStartup = New-ScheduledTaskTrigger -AtLogOn
  # "Siempre vivo": si el dashboard se cae, reiniciarlo automáticamente (hasta
  # 999 veces, cada 1 min) y mantener el proceso corriendo indefinidamente.
  $settingsStartup = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)
  Register-ScheduledTask -TaskName $StartupTaskName -Action $actionStartup -Trigger $triggerStartup -Settings $settingsStartup `
    -Description "Graham Investment Suite: arranca dashboard local al iniciar sesion y lo reinicia si se cae."
  Write-Host "Tarea creada: $StartupTaskName (arranque al iniciar sesion + auto-reinicio) -> $repo"
}

Write-Host ""
Write-Host "Tareas registradas:"
Get-ScheduledTask -TaskName $PipelineTaskName,$StartupTaskName | Select-Object TaskName,State | Format-Table -AutoSize
