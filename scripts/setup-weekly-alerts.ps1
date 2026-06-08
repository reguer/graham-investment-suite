param(
  [string]$TaskName = "GrahamInvestmentSuite-MondayFriday",
  [string]$Time = "18:00"
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existing) {
  Write-Host "La tarea '$TaskName' ya existe. No se sobrescribio."
  exit 0
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
  $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
}
$npm = if ($npmCommand) { $npmCommand.Source } else { $null }
if (-not $npm) {
  throw "No se encontro npm en PATH."
}

$action = New-ScheduledTaskAction `
  -Execute $npm `
  -Argument "run weekly:screen" `
  -WorkingDirectory $repo

$trigger = New-ScheduledTaskTrigger `
  -Weekly `
  -DaysOfWeek Monday, Friday `
  -At $Time

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Graham Investment Suite: genera alertas Graham lunes y viernes."

Write-Host "Tarea creada: $TaskName ($Time lunes y viernes)."
