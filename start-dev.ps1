# Kill any process using port 3001 and restart
Write-Host "Killing any process on port 3001..." -ForegroundColor Cyan

# Find and kill process on port 3001
$process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Killed process on port 3001" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "No process found on port 3001" -ForegroundColor Yellow
}

Write-Host "`nStarting dev server on port 3001..." -ForegroundColor Cyan
npx next dev -p 3001

