param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) { $npmCommand = Get-Command npm -ErrorAction SilentlyContinue }
$npm = if ($npmCommand) { $npmCommand.Source } else { $null }
if (-not $npm) { throw "No se encontro npm en PATH." }

Start-Process `
  -FilePath $npm `
  -ArgumentList @("run", "dev:safe") `
  -WorkingDirectory $RepoRoot `
  -WindowStyle Hidden
