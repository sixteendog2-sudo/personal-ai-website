param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\backups")
)

$ErrorActionPreference = "Stop"
if (-not $DatabaseUrl) {
  $envFile = Join-Path $PSScriptRoot "..\.env.local"
  if (Test-Path -LiteralPath $envFile) {
    $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if ($line) { $DatabaseUrl = $line.Substring("DATABASE_URL=".Length) }
  }
}
if (-not $DatabaseUrl) { throw "DATABASE_URL is required." }

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$pgDump = Join-Path $pgBin "pg_dump.exe"
$pgRestore = Join-Path $pgBin "pg_restore.exe"
if (-not (Test-Path -LiteralPath $pgDump)) { throw "pg_dump.exe was not found at $pgDump" }

$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $resolvedOutput "personal-ai-$timestamp.dump"

& $pgDump --dbname=$DatabaseUrl --format=custom --compress=9 --no-owner --no-privileges --file=$backupFile
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
& $pgRestore --list $backupFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Backup verification failed with exit code $LASTEXITCODE" }

$file = Get-Item -LiteralPath $backupFile
Write-Output "BACKUP_FILE=$($file.FullName)"
Write-Output "BACKUP_BYTES=$($file.Length)"
