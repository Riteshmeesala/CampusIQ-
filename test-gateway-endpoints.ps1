# ===============================================================================
# CampusIQ+ API Gateway & Microservices Automated Test Suite
# Tests all microservice endpoints via API Gateway (http://localhost:8080)
# ===============================================================================

param(
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$AuthToken = "campusiq_jwt_token_admin"
)

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         CampusIQ+ Microservice Endpoints Test via API Gateway" -ForegroundColor Cyan
Write-Host "         Gateway Base: $GatewayUrl" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

$results = @()

function Test-Endpoint {
    param(
        [string]$ServiceName,
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int[]]$ExpectedStatuses = @(200, 201)
    )

    $url = "$GatewayUrl$Path"
    $headersToSend = @{
        "Content-Type" = "application/json"
    }
    foreach ($key in $Headers.Keys) {
        $headersToSend[$key] = $Headers[$key]
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $statusCode = 0
    $statusText = "FAIL"
    $errorMsg = ""

    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headersToSend
            TimeoutSec = 15
            UseBasicParsing = $true
        }
        if ($Body) {
            $params["Body"] = $Body
        }

        $response = Invoke-WebRequest @params
        $sw.Stop()
        $statusCode = [int]$response.StatusCode
        if ($ExpectedStatuses -contains $statusCode) {
            $statusText = "PASS"
        } else {
            $statusText = "WARN ($statusCode)"
        }
    } catch [System.Net.WebException] {
        $sw.Stop()
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($ExpectedStatuses -contains $statusCode) {
                $statusText = "PASS"
            } else {
                $statusText = "FAIL ($statusCode)"
            }
        } else {
            $statusText = "UNREACHABLE"
            $errorMsg = $_.Exception.Message
        }
    } catch {
        $sw.Stop()
        $statusText = "ERROR"
        $errorMsg = $_.Message
    }

    $color = if ($statusText -eq "PASS") { "Green" } elseif ($statusText -like "WARN*") { "Yellow" } else { "Red" }
    $elapsed = "$([math]::Round($sw.Elapsed.TotalMilliseconds, 1))ms"

    Write-Host ("[{0,-16}] {1,-6} {2,-38} -> {3,-10} ({4})" -f $ServiceName, $Method, $Path, $statusText, $elapsed) -ForegroundColor $color

    return [PSCustomObject]@{
        Service = $ServiceName
        Method = $Method
        Path = $Path
        Status = $statusText
        Code = $statusCode
        Latency = $elapsed
    }
}

$authHeaders = @{
    "Authorization" = "Bearer $AuthToken"
}

Write-Host "`n--- 1. API GATEWAY INFRASTRUCTURE ---" -ForegroundColor Yellow
$results += Test-Endpoint -ServiceName "Gateway" -Path "/actuator/health"
$results += Test-Endpoint -ServiceName "Gateway" -Path "/actuator/gateway/routes"

Write-Host "`n--- 2. AUTH SERVICE (Port 8081 via Gateway) ---" -ForegroundColor Yellow
$results += Test-Endpoint -ServiceName "Auth" -Method "POST" -Path "/api/auth/login" -Body '{"username":"admin@campusiq.edu.in","password":"password123"}' -ExpectedStatuses @(200, 400, 401)
$results += Test-Endpoint -ServiceName "Auth" -Path "/api/registrations/stats" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Auth" -Path "/api/users/stats" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Auth" -Path "/api/users/students" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Auth" -Path "/api/users/faculty" -Headers $authHeaders

Write-Host "`n--- 3. ACADEMIC SERVICE (Port 8082 via Gateway) ---" -ForegroundColor Yellow
$results += Test-Endpoint -ServiceName "Academic" -Path "/api/courses"
$results += Test-Endpoint -ServiceName "Academic" -Path "/api/attendance/my" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Academic" -Path "/api/timetable/my" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Academic" -Path "/api/faculty-assignments/all" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Academic" -Path "/api/student-services" -Headers $authHeaders -ExpectedStatuses @(200, 404)
$results += Test-Endpoint -ServiceName "Academic" -Path "/api/library" -Headers $authHeaders -ExpectedStatuses @(200, 404)

Write-Host "`n--- 4. ASSESSMENT & ANALYTICS SERVICE (Port 8083 via Gateway) ---" -ForegroundColor Yellow
$results += Test-Endpoint -ServiceName "Assessment" -Path "/api/exams"
$results += Test-Endpoint -ServiceName "Assessment" -Path "/api/exams/upcoming"
$results += Test-Endpoint -ServiceName "Assessment" -Path "/api/results/my" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Assessment" -Path "/api/cgpa/all" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Assessment" -Path "/api/academic-records/my" -Headers $authHeaders

Write-Host "`n--- 5. FINANCE & PAYMENTS SERVICE (Port 8084 via Gateway) ---" -ForegroundColor Yellow
$results += Test-Endpoint -ServiceName "Finance" -Path "/api/fees/my" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Finance" -Path "/api/fees/my/pending-amount" -Headers $authHeaders
$results += Test-Endpoint -ServiceName "Finance" -Path "/api/fees/all" -Headers $authHeaders

Write-Host "`n--- 6. CAMPUS AI & NOTIFICATIONS SERVICE (Port 8085 via Gateway) ---" -ForegroundColor Yellow
$results += Test-Endpoint -ServiceName "CampusAI" -Path "/api/ai/study-plan"
$results += Test-Endpoint -ServiceName "CampusAI" -Path "/api/ai/performance-insights"
$results += Test-Endpoint -ServiceName "CampusAI" -Method "POST" -Path "/api/chatbot/chat" -Headers $authHeaders -Body '{"message":"What is my current timetable?"}'
$results += Test-Endpoint -ServiceName "CampusAI" -Path "/api/notifications" -Headers $authHeaders

Write-Host "`n===============================================================================" -ForegroundColor Cyan
Write-Host "                             TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$total = $results.Count
$percentage = [math]::Round(($passed / $total) * 100, 1)

Write-Host "Passed: $passed / $total ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -gt 70) { "Yellow" } else { "Red" })
Write-Host "`nTo run individual endpoints via cURL:" -ForegroundColor Gray
Write-Host '  curl -i http://localhost:8080/api/courses' -ForegroundColor DarkGray
Write-Host '  curl -i -H "Authorization: Bearer campusiq_jwt_token_admin" http://localhost:8080/api/users/stats' -ForegroundColor DarkGray
Write-Host '  curl -i http://localhost:8080/api/ai/study-plan' -ForegroundColor DarkGray
Write-Host "===============================================================================" -ForegroundColor Cyan
