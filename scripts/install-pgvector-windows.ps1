param(
  [string]$PgRoot = "C:\Program Files\PostgreSQL\17",
  [string]$Version = "v0.8.2"
)

$ErrorActionPreference = "Stop"
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this script from an elevated PowerShell window."
}

$vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path -LiteralPath $vswhere)) { throw "Visual Studio Build Tools were not found." }
$vsRoot = & $vswhere -latest -products "*" -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
$vcvars = Join-Path $vsRoot "VC\Auxiliary\Build\vcvars64.bat"
if (-not (Test-Path -LiteralPath $vcvars)) { throw "The x64 C++ build environment was not found." }
if (-not (Test-Path -LiteralPath (Join-Path $PgRoot "include\server\postgres.h"))) { throw "PostgreSQL server headers were not found under PgRoot." }

$buildRoot = Join-Path ([IO.Path]::GetTempPath()) ("pgvector-build-" + [guid]::NewGuid().ToString("N"))
try {
  git clone --branch $Version --depth 1 https://github.com/pgvector/pgvector.git $buildRoot
  if ($LASTEXITCODE -ne 0) { throw "Could not clone pgvector $Version." }
  $command = '"' + $vcvars + '" && set "PGROOT=' + $PgRoot + '" && cd /d "' + $buildRoot + '" && nmake /F Makefile.win && nmake /F Makefile.win install'
  cmd.exe /d /s /c $command
  if ($LASTEXITCODE -ne 0) { throw "pgvector build or install failed." }
  Write-Host "pgvector $Version installed. Run CREATE EXTENSION vector in each target database."
} finally {
  $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  $resolvedBuild = [IO.Path]::GetFullPath($buildRoot)
  if ($resolvedBuild.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolvedBuild)) {
    Remove-Item -LiteralPath $resolvedBuild -Recurse -Force
  }
}
