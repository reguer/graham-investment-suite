param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$CheckSeconds = 60
)

$ErrorActionPreference = "Stop"

$launcher = Join-Path $RepoRoot "scripts\start-dashboard-hidden.vbs"
$stopFlag = Join-Path $RepoRoot ".local_runtime\dashboard-keepalive.stop"

function Test-DashboardAlive {
  try {
    $response = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:5173/" -TimeoutSec 5
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Start-DashboardHidden {
  Start-Process -FilePath (Join-Path $env:SystemRoot "System32\wscript.exe") `
    -ArgumentList @("//B", "//NoLogo", $launcher) `
    -WindowStyle Hidden
}

while ($true) {
  if (Test-Path $stopFlag) {
    Remove-Item -LiteralPath $stopFlag -Force -ErrorAction SilentlyContinue
    exit 0
  }

  if (-not (Test-DashboardAlive)) {
    Start-DashboardHidden
    Start-Sleep -Seconds 8
  }

  Start-Sleep -Seconds $CheckSeconds
}
