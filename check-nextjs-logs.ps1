# Check Next.js Logs for Screenplay GET Requests
# This script helps identify issues with Next.js API route requests
#
# Usage:
#   .\check-nextjs-logs.ps1 -ScreenplayId "screenplay_xxx" [-Hours 24] [-LocalPort 3000]

param(
    [Parameter(Mandatory=$true)]
    [string]$ScreenplayId,
    
    [Parameter(Mandatory=$false)]
    [int]$Hours = 24,
    
    [Parameter(Mandatory=$false)]
    [int]$LocalPort = 3000,
    
    [Parameter(Mandatory=$false)]
    [string]$VercelProject = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$LocalOnly
)

Write-Host "=== Next.js Logs Check ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Screenplay ID: $ScreenplayId" -ForegroundColor Yellow
Write-Host "Time Range: Last $Hours hours" -ForegroundColor Yellow
Write-Host ""

# Check if running locally
$isLocal = $false
if ($LocalOnly -or (Test-Path ".next")) {
    $isLocal = $true
    Write-Host "[OK] Detected local Next.js development environment" -ForegroundColor Green
    Write-Host "   Checking for local server logs..." -ForegroundColor Gray
    Write-Host ""
}

# Check if Vercel CLI is available
$vercelCliAvailable = $false
if (-not $LocalOnly) {
    try {
        $vercelVersion = vercel --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $vercelCliAvailable = $true
            Write-Host "[OK] Vercel CLI is available" -ForegroundColor Green
            Write-Host "   Version: $vercelVersion" -ForegroundColor Gray
        }
    } catch {
        Write-Host "[WARN] Vercel CLI is not available" -ForegroundColor Yellow
        Write-Host "   Install with: npm i -g vercel" -ForegroundColor Gray
    }
    Write-Host ""
}

# ============================================================================
# LOCAL LOGS CHECK
# ============================================================================
if ($isLocal) {
    Write-Host "=== Checking Local Next.js Logs ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Next.js dev server is running
    $devServerRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$LocalPort" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $devServerRunning = $true
            Write-Host "[OK] Next.js dev server is running on port $LocalPort" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARN] Next.js dev server is not running on port $LocalPort" -ForegroundColor Yellow
        Write-Host "   Start it with: npm run dev" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Check for log files (Next.js doesn't write to files by default, but check anyway)
    $logFiles = @(
        ".next/server.log",
        "logs/nextjs.log",
        "logs/server.log"
    )
    
    $foundLogFile = $false
    foreach ($logFile in $logFiles) {
        if (Test-Path $logFile) {
            $foundLogFile = $true
            Write-Host "Found log file: $logFile" -ForegroundColor Yellow
            Write-Host "Searching for screenplay-related logs..." -ForegroundColor Gray
            Write-Host ""
            
            $logContent = Get-Content $logFile -Tail 1000 -ErrorAction SilentlyContinue
            if ($logContent) {
                $escapedId = [regex]::Escape($ScreenplayId)
                $pattern = "Screenplay Get API|$escapedId|screenplay_b236a087"
                $relevantLogs = $logContent | Select-String -Pattern $pattern -CaseSensitive:$false
                
                if ($relevantLogs) {
                    Write-Host "[OK] Found relevant log entries:" -ForegroundColor Green
                    Write-Host ""
                    foreach ($log in $relevantLogs) {
                        $color = "Gray"
                        $logText = $log.ToString()
                        if ($logText -match "ERROR|FAILED|404|401") {
                            $color = "Red"
                        } elseif ($logText -match "WARN|warning") {
                            $color = "Yellow"
                        } elseif ($logText -match "SUCCESS|200") {
                            $color = "Green"
                        }
                        Write-Host "  $logText" -ForegroundColor $color
                    }
                    Write-Host ""
                } else {
                    Write-Host "[WARN] No relevant logs found in file" -ForegroundColor Yellow
                }
            }
        }
    }
    
    if (-not $foundLogFile) {
        Write-Host "[INFO] No log files found. Next.js logs are typically output to the console." -ForegroundColor Gray
        Write-Host "   To capture logs:" -ForegroundColor Yellow
        Write-Host "     1. Run: npm run dev > logs/nextjs.log 2>&1" -ForegroundColor Gray
        Write-Host "     2. Or check the terminal where 'npm run dev' is running" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "=== Local Log Check Instructions ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Since Next.js logs to the console, check the terminal where 'npm run dev' is running." -ForegroundColor Yellow
    Write-Host "Look for these log messages:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [Screenplay Get API] Request received" -ForegroundColor Gray
    Write-Host "  [Screenplay Get API] User authenticated: user_..." -ForegroundColor Gray
    Write-Host "  [Screenplay Get API] Fetching screenplay: $ScreenplayId" -ForegroundColor Gray
    Write-Host "  [Screenplay Get API] Proxying to backend: https://api.wryda.ai/api/screenplays/$ScreenplayId" -ForegroundColor Gray
    Write-Host "  [Screenplay Get API] Backend response status: ..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Error patterns to look for:" -ForegroundColor Yellow
    Write-Host "  [Screenplay Get API] [ERROR] Backend error for screenplay: $ScreenplayId" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] Status: 404" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] Error data: {...}" -ForegroundColor Red
    Write-Host ""
}

# ============================================================================
# VERCEL LOGS CHECK
# ============================================================================
if ($vercelCliAvailable -and -not $LocalOnly) {
    Write-Host "=== Checking Vercel Logs ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if logged in to Vercel
    try {
        $whoami = vercel whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Logged in to Vercel as: $whoami" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Not logged in to Vercel" -ForegroundColor Yellow
            Write-Host "   Run: vercel login" -ForegroundColor Gray
            $vercelCliAvailable = $false
        }
    } catch {
        Write-Host "[WARN] Could not check Vercel login status" -ForegroundColor Yellow
        $vercelCliAvailable = $false
    }
    Write-Host ""
    
    if ($vercelCliAvailable) {
        Write-Host "Fetching Vercel logs..." -ForegroundColor Yellow
        Write-Host ""
        
        try {
            # Calculate time range
            $startTime = (Get-Date).AddHours(-$Hours)
            $startTimeISO = $startTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
            
            # Build vercel logs command
            $logCommand = "vercel logs"
            if ($VercelProject) {
                $logCommand += " --project $VercelProject"
            }
            $logCommand += " --since `"$startTimeISO`""
            $logCommand += " --output json"
            
            Write-Host "Running: $logCommand" -ForegroundColor DarkGray
            Write-Host ""
            
            # Get logs (Vercel CLI doesn't support direct filtering, so we'll filter in PowerShell)
            $logs = Invoke-Expression $logCommand 2>&1
            
            if ($logs) {
                # Try to parse as JSON if possible, otherwise treat as text
                $relevantLogs = $null
                try {
                    $logsJson = $logs | ConvertFrom-Json
                    if ($logsJson) {
                        $relevantLogs = $logsJson | Where-Object {
                            $_.message -like "*Screenplay Get API*" -or
                            $_.message -like "*$ScreenplayId*" -or
                            $_.message -like "*screenplay_b236a087*"
                        }
                    }
                } catch {
                    # Not JSON, treat as text
                    $escapedId = [regex]::Escape($ScreenplayId)
                    $pattern = "Screenplay Get API|$escapedId|screenplay_b236a087"
                    $relevantLogs = $logs | Select-String -Pattern $pattern -CaseSensitive:$false
                }
                
                if ($relevantLogs) {
                    Write-Host "[OK] Found relevant log entries:" -ForegroundColor Green
                    Write-Host ""
                    foreach ($log in $relevantLogs) {
                        $color = "Gray"
                        $logText = if ($log -is [PSCustomObject]) { $log.message } else { $log.ToString() }
                        if ($logText -match "(ERROR|FAILED|404|401)") {
                            $color = "Red"
                        } elseif ($logText -match "(WARN|warning)") {
                            $color = "Yellow"
                        } elseif ($logText -match "(SUCCESS|200)") {
                            $color = "Green"
                        }
                        Write-Host "  $logText" -ForegroundColor $color
                    }
                    Write-Host ""
                } else {
                    Write-Host "[WARN] No relevant logs found in the last $Hours hours" -ForegroundColor Yellow
                    Write-Host "   This could mean:" -ForegroundColor Gray
                    Write-Host "     - No requests were made for this screenplay" -ForegroundColor Gray
                    Write-Host "     - Logs are older than $Hours hours" -ForegroundColor Gray
                    Write-Host "     - Logs are in a different format" -ForegroundColor Gray
                }
            } else {
                Write-Host "[WARN] No logs returned from Vercel" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ERROR] Error fetching Vercel logs: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Alternative: Check Vercel Dashboard" -ForegroundColor Yellow
            Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor Gray
            Write-Host "  2. Select your project" -ForegroundColor Gray
            Write-Host "  3. Go to 'Deployments' tab" -ForegroundColor Gray
            Write-Host "  4. Click on latest deployment" -ForegroundColor Gray
            Write-Host "  5. Go to 'Functions' tab" -ForegroundColor Gray
            Write-Host "  6. Find: app/api/screenplays/[id]/route.ts" -ForegroundColor Gray
            Write-Host "  7. Click 'View Logs'" -ForegroundColor Gray
            Write-Host "  8. Search for: Screenplay Get API" -ForegroundColor Gray
            Write-Host "  9. Search for: $ScreenplayId" -ForegroundColor Gray
        }
    }
} elseif (-not $LocalOnly) {
    Write-Host "=== Vercel Logs Check (Manual) ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Since Vercel CLI is not available, use the Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Vercel Dashboard (Recommended)" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "  2. Select your project (website-frontend-production)" -ForegroundColor Gray
    Write-Host "  3. Go to 'Deployments' tab" -ForegroundColor Gray
    Write-Host "  4. Click on the latest deployment" -ForegroundColor Gray
    Write-Host "  5. Go to 'Functions' tab" -ForegroundColor Gray
    Write-Host "  6. Find: app/api/screenplays/[id]/route.ts" -ForegroundColor Gray
    Write-Host "  7. Click 'View Logs' or 'View Function Logs'" -ForegroundColor Gray
    Write-Host "  8. Search for: [Screenplay Get API]" -ForegroundColor Gray
    Write-Host "  9. Search for: $ScreenplayId" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Install Vercel CLI" -ForegroundColor Cyan
    Write-Host "  1. Install: npm i -g vercel" -ForegroundColor Gray
    Write-Host "  2. Login: vercel login" -ForegroundColor Gray
    Write-Host "  3. Re-run this script" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# EXPECTED LOG PATTERNS
# ============================================================================
Write-Host "=== Expected Log Patterns ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Successful Request:" -ForegroundColor Yellow
Write-Host "  [Screenplay Get API] Request received" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] User authenticated: user_3545Ycy3iNFJ50UmZhHSYw3K8cU" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Fetching screenplay: $ScreenplayId" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Proxying to backend: https://api.wryda.ai/api/screenplays/$ScreenplayId" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Backend response status: 200 for screenplay: $ScreenplayId" -ForegroundColor Green
    Write-Host "  [Screenplay Get API] [OK] Backend success response: 200 Data preview: {...}" -ForegroundColor Green
Write-Host ""
Write-Host "Failed Request (404):" -ForegroundColor Yellow
Write-Host "  [Screenplay Get API] Request received" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] User authenticated: user_3545Ycy3iNFJ50UmZhHSYw3K8cU" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Fetching screenplay: $ScreenplayId" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Proxying to backend: https://api.wryda.ai/api/screenplays/$ScreenplayId" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Backend response status: 404 for screenplay: $ScreenplayId" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] Backend error for screenplay: $ScreenplayId" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] Status: 404" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] Error data: {...}" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] Backend URL called: https://api.wryda.ai/api/screenplays/$ScreenplayId" -ForegroundColor Red
    Write-Host "  [Screenplay Get API] [ERROR] User ID: user_3545Ycy3iNFJ50UmZhHSYw3K8cU" -ForegroundColor Red
Write-Host ""
Write-Host "Authentication Error (401):" -ForegroundColor Yellow
Write-Host "  [Screenplay Get API] Request received" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] No userId found" -ForegroundColor Red
Write-Host "  OR" -ForegroundColor Gray
Write-Host "  [Screenplay Get API] Could not generate token" -ForegroundColor Red
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check the logs using the methods above" -ForegroundColor Gray
Write-Host "  2. Look for the log patterns shown above" -ForegroundColor Gray
Write-Host "  3. If you see 404 errors, check:" -ForegroundColor Gray
Write-Host "     - Backend logs (use check-backend-logs.ps1)" -ForegroundColor Gray
Write-Host "     - Backend permission service logs" -ForegroundColor Gray
Write-Host "     - Screenplay status in DynamoDB" -ForegroundColor Gray
Write-Host "  4. If you see 401 errors, check:" -ForegroundColor Gray
Write-Host "     - Clerk authentication is working" -ForegroundColor Gray
Write-Host "     - User session is valid" -ForegroundColor Gray
Write-Host "     - Token generation is working" -ForegroundColor Gray
Write-Host ""

