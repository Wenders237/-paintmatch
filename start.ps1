# PaintMatch — Démarrage automatique
# Exécuter depuis le dossier racine : .\start.ps1

$root     = "D:\mes projets\mises en relation clients peintre"
$backend  = "$root\backend"
$frontend = "$root\frontend"

Write-Host "Arret des anciens processus..." -ForegroundColor Yellow

# Tuer tous les processus Node.js (Vite) en cours
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Attendre que les ports se libèrent
Start-Sleep -Seconds 2

Write-Host "Demarrage de PaintMatch..." -ForegroundColor Cyan
Write-Host ""

# Terminal 1 — Backend Django
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backend'; .\venv\Scripts\activate; py manage.py runserver"
)

# Attendre que Django démarre
Start-Sleep -Seconds 3

# Terminal 2 — Frontend React
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontend'; npm run dev"
)

Write-Host "Serveurs en cours de demarrage..." -ForegroundColor Green
Write-Host ""
Write-Host "  Attends 10 secondes puis ouvre :" -ForegroundColor White
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Backend  : http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  Admin    : http://127.0.0.1:8000/admin/" -ForegroundColor Yellow
Write-Host ""
