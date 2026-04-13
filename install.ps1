$d = "$env:USERPROFILE\.coreling"
New-Item -ItemType Directory -Force -Path $d | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/coreling.py" -OutFile "$d\coreling.py"
Set-Content -Path "$d\coreling.bat" -Value "@echo off`r`npython `"$d\coreling.py`" %*"
Write-Host "Coreling installed. Add to PATH: $d"