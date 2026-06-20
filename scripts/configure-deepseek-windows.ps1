param(
  [string]$EnvFile = ".env.local",
  [string]$BaseUrl = "https://api.deepseek.com",
  [string]$Model = "deepseek-chat"
)

$ErrorActionPreference = "Stop"
$envPath = Join-Path (Get-Location) $EnvFile
$secureKey = Read-Host "Enter DeepSeek API key (input is hidden)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
  $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ([string]::IsNullOrWhiteSpace($apiKey)) { throw "DeepSeek API key cannot be empty." }

  $lines = if (Test-Path -LiteralPath $envPath) {
    [Collections.Generic.List[string]](Get-Content -LiteralPath $envPath)
  } else {
    [Collections.Generic.List[string]]::new()
  }

  function Set-EnvValue([string]$Name, [string]$Value) {
    $prefix = "$Name="
    $index = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i].StartsWith($prefix, [StringComparison]::Ordinal)) {
        $index = $i
        break
      }
    }
    if ($index -ge 0) { $lines[$index] = "$Name=$Value" }
    else { $lines.Add("$Name=$Value") }
  }

  Set-EnvValue "DEEPSEEK_API_KEY" $apiKey
  Set-EnvValue "DEEPSEEK_BASE_URL" $BaseUrl
  Set-EnvValue "DEEPSEEK_CHAT_MODEL" $Model
  [IO.File]::WriteAllLines($envPath, $lines, [Text.UTF8Encoding]::new($false))
  Write-Host "DeepSeek configuration saved to $envPath. Restart the web service before testing."
} finally {
  if ($pointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
  $apiKey = $null
}
