# Wryda.ai ShipFast Setup & Startup Script
# Run this from website-frontend-shipfast directory

Write-Host "Wryda.ai Development Startup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Step 1: Check if dependencies are installed
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
}

# Step 2: Install additional dependencies
Write-Host "`nInstalling additional dependencies..." -ForegroundColor Yellow
npm install lucide-react axios

# Step 3: Check environment variables
Write-Host "`nChecking environment variables..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Write-Host ".env.local not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key"
    Write-Host "CLERK_SECRET_KEY=your_clerk_secret_key"
    Write-Host "NEXT_PUBLIC_API_URL=http://localhost:3000"
    Write-Host ""
    Write-Host "Get Clerk keys from: https://dashboard.clerk.com" -ForegroundColor Cyan
    exit 1
}

Write-Host "Environment configured!" -ForegroundColor Green

# Step 4: Kill any process on port 3001
Write-Host "`nChecking port 3001..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Write-Host "Killing process $process on port 3001..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Step 5: Check if backend is running
Write-Host "`nChecking backend (port 3000)..." -ForegroundColor Yellow
try {
    $backend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop
    Write-Host "Backend is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "Backend not detected on port 3000" -ForegroundColor Yellow
    Write-Host "Make sure to start your backend server!" -ForegroundColor Yellow
}

# Step 6: Start the dev server
Write-Host "`nStarting Wryda.ai frontend on port 3001..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "MAIN PAGES:" -ForegroundColor Magenta
Write-Host "  Dashboard:     http://localhost:3001/dashboard" -ForegroundColor White
Write-Host "  Sign In:       http://localhost:3001/sign-in" -ForegroundColor White
Write-Host ""
Write-Host "WORK PAGES (with AI Chat Drawer):" -ForegroundColor Cyan
Write-Host "  Editor:        http://localhost:3001/editor" -ForegroundColor White
Write-Host "  Production:    http://localhost:3001/production" -ForegroundColor White
Write-Host "  Composition:   http://localhost:3001/composition" -ForegroundColor White
Write-Host "  Timeline:      http://localhost:3001/timeline" -ForegroundColor White
Write-Host ""
Write-Host "AI CHAT FEATURES (7 Modes):" -ForegroundColor Yellow
Write-Host "  Image    - Generate character/location images" -ForegroundColor White
Write-Host "  Video    - Quick video generation" -ForegroundColor White
Write-Host "  Audio    - Music & sound effects" -ForegroundColor White
Write-Host "  Try-On   - Virtual clothing try-on" -ForegroundColor White
Write-Host "  Chat     - AI interviews & screenwriting" -ForegroundColor White
Write-Host "  Director - Shot planning & direction" -ForegroundColor White
Write-Host "  Workflows - 42 pre-built AI workflows" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

npx next dev -p 3001


