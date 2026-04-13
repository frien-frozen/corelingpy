$d = "$env:USERPROFILE\.coreling"
New-Item -ItemType Directory -Force -Path $d | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/coreling.py" -OutFile "$d\coreling.py"
Set-Content -Path "$d\coreling.bat" -Value "@echo off`r`npython `"$d\coreling.py`" %*"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notmatch [regex]::Escape($d)) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$d", "User")
    $env:Path = "$env:Path;$d"
}

Write-Host "⚡ Coreling installed perfectly. You can now type 'coreling' anywhere." -ForegroundColor Cyan