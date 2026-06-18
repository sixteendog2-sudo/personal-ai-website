param(
  [string]$PgRoot = "C:\Program Files\PostgreSQL\17",
  [string]$DataDirectory = "C:\Program Files\PostgreSQL\17\data",
  [string]$ServiceName = "postgresql-x64-17",
  [string]$Database = "personal_ai"
)

$ErrorActionPreference = "Stop"
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this script from an elevated PowerShell window."
}

$psql = Join-Path $PgRoot "bin\psql.exe"
$hba = Join-Path $DataDirectory "pg_hba.conf"
if (-not (Test-Path -LiteralPath $psql)) { throw "psql.exe was not found under PgRoot." }
if (-not (Test-Path -LiteralPath $hba)) { throw "pg_hba.conf was not found under DataDirectory." }

$backup = "$hba.codex-bootstrap-backup"
$temporaryRules = @"
# Temporary local bootstrap access. Removed automatically by this script.
host    all             postgres        127.0.0.1/32            trust
host    all             postgres        ::1/128                 trust

"@

$passwordBytes = New-Object byte[] 36
$randomNumberGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $randomNumberGenerator.GetBytes($passwordBytes)
} finally {
  $randomNumberGenerator.Dispose()
}
$postgresPassword = [Convert]::ToBase64String($passwordBytes).Replace("+", "-").Replace("/", "_").TrimEnd("=")
$pgpassDirectory = Join-Path $env:APPDATA "postgresql"
$pgpass = Join-Path $pgpassDirectory "pgpass.conf"
$restored = $false

try {
  Copy-Item -LiteralPath $hba -Destination $backup -Force
  $original = [IO.File]::ReadAllText($hba)
  [IO.File]::WriteAllText($hba, $temporaryRules + $original, [Text.UTF8Encoding]::new($false))
  Restart-Service -Name $ServiceName -Force

  "ALTER ROLE postgres WITH LOGIN PASSWORD '$postgresPassword';" |
    & $psql -h 127.0.0.1 -U postgres -d postgres -w -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw "Could not reset the postgres role password." }

  "CREATE EXTENSION IF NOT EXISTS vector;" |
    & $psql -h 127.0.0.1 -U postgres -d $Database -w -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw "Could not enable pgvector in database '$Database'." }

  New-Item -ItemType Directory -Path $pgpassDirectory -Force | Out-Null
  $pgpassLines = @(
    "127.0.0.1:5432:*:postgres:$postgresPassword"
    "localhost:5432:*:postgres:$postgresPassword"
  )
  [IO.File]::WriteAllLines($pgpass, $pgpassLines, [Text.UTF8Encoding]::new($false))

  $acl = New-Object Security.AccessControl.FileSecurity
  $acl.SetAccessRuleProtection($true, $false)
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $rule = New-Object Security.AccessControl.FileSystemAccessRule(
    $identity,
    [Security.AccessControl.FileSystemRights]::FullControl,
    [Security.AccessControl.AccessControlType]::Allow
  )
  $acl.AddAccessRule($rule)
  Set-Acl -LiteralPath $pgpass -AclObject $acl

  Write-Host "PostgreSQL administrator access initialized and pgvector enabled in '$Database'."
  Write-Host "The generated password is stored in $pgpass with access restricted to the current user."
} finally {
  if (Test-Path -LiteralPath $backup) {
    Copy-Item -LiteralPath $backup -Destination $hba -Force
    Remove-Item -LiteralPath $backup -Force
    Restart-Service -Name $ServiceName -Force
    $restored = $true
  }
  if (-not $restored) {
    Write-Warning "Verify pg_hba.conf manually because automatic restoration did not complete."
  }
}
