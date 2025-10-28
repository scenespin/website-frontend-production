# Remove old NextAuth files
# Run this from website-frontend-shipfast directory

Write-Host "Cleaning up old NextAuth files..." -ForegroundColor Cyan

# Remove NextAuth API routes
if (Test-Path "app\api\auth") {
    Remove-Item -Recurse -Force "app\api\auth"
    Write-Host "Removed app\api\auth" -ForegroundColor Green
}

# Remove old NextAuth lib file
if (Test-Path "libs\next-auth.js") {
    Remove-Item -Force "libs\next-auth.js"
    Write-Host "Removed libs\next-auth.js" -ForegroundColor Green
}

Write-Host "`nCleanup complete! Now restart the dev server:" -ForegroundColor Green
Write-Host "npx next dev -p 3001" -ForegroundColor White

