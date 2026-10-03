$ErrorActionPreference = "Continue"

$loginBody = '{"username":"23BQ1A1268","password":"Student@123"}'
try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Student Login response:" ($loginRes | ConvertTo-Json -Compress)
    $token = $loginRes.data.accessToken
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "Extracted token length: $($token.Length)"

    $endpoints = @(
        "/api/users/me",
        "/api/timetable/my",
        "/api/exams",
        "/api/results/my",
        "/api/attendance/my",
        "/api/fees/my",
        "/api/leaves",
        "/api/warnings",
        "/api/grievances",
        "/api/library",
        "/api/placements/drives",
        "/api/campus-services",
        "/api/notifications",
        "/api/courses"
    )

    foreach ($ep in $endpoints) {
        try {
            $res = Invoke-RestMethod -Uri "http://localhost:8080$ep" -Method Get -Headers $headers -TimeoutSec 5
            Write-Host "[PASS] $ep" -ForegroundColor Green
        } catch {
            Write-Host "[FAIL] $ep -> $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
}
