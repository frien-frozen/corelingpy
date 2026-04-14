$d = "$env:USERPROFILE\.coreling"
New-Item -ItemType Directory -Force -Path $d | Out-Null

Write-Host "⚡ Pulling Coreling Engine..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/coreling.exe" -OutFile "$d\coreling.exe"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notmatch [regex]::Escape($d)) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$d", "User")
    $env:Path = "$env:Path;$d"
}

Write-Host "⚡ Coreling installed perfectly. You can now type 'coreling' anywhere." -ForegroundColor Green