# CampusIQ+ Microservices Launcher (PowerShell)
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "             Starting CampusIQ+ Microservices Suite" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

if (Test-Path "$root\.env") {
    Get-Content "$root\.env" | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
}

Write-Host "`n[1/8] Starting Eureka Discovery Server (Port 8761)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\eureka-server'; mvn spring-boot:run"
Start-Sleep -Seconds 8

Write-Host "[2/8] Starting Spring Cloud API Gateway (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\api-gateway'; mvn spring-boot:run"
Start-Sleep -Seconds 5

Write-Host "[3/8] Starting Auth Service (Port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\auth-service'; mvn spring-boot:run"

Write-Host "[4/8] Starting Academic Service (Port 8082)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\academic-service'; mvn spring-boot:run"

Write-Host "[5/8] Starting Assessment & Analytics Service (Port 8083)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\assessment-service'; mvn spring-boot:run"

Write-Host "[6/8] Starting Finance & Payments Service (Port 8084)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\finance-service'; mvn spring-boot:run"

Write-Host "[7/8] Starting AI & Notifications Service (Port 8085)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\campus-ai-service'; mvn spring-boot:run"

Write-Host "[8/8] Starting React Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm start"

Write-Host "`n===================================================================" -ForegroundColor Green
Write-Host "  All Microservices & Frontend are booting up:" -ForegroundColor Green
Write-Host "  - Frontend App:    http://localhost:3000" -ForegroundColor White
Write-Host "  - API Gateway:     http://localhost:8080/api" -ForegroundColor White
Write-Host "  - Eureka Registry: http://localhost:8761" -ForegroundColor White
Write-Host "===================================================================`n" -ForegroundColor Green
