$ErrorActionPreference = "Continue"

$testAccounts = @(
    @{ Role = "ADMIN";   Username = "admin";       Password = "Admin@123" },
    @{ Role = "FACULTY"; Username = "faculty_raj"; Password = "Admin@123" },
    @{ Role = "STUDENT"; Username = "23BQ1A1268";  Password = "Student@123" },
    @{ Role = "STUDENT"; Username = "Ritesh@0512"; Password = "Student@123" },
    @{ Role = "STUDENT"; Username = "24CS001";     Password = "Student@123" }
)

Write-Host "================================================="
Write-Host "       MULTI-ROLE LOGIN & SESSION TEST          "
Write-Host "================================================="

foreach ($acc in $testAccounts) {
    $body = @{ username = $acc.Username; password = $acc.Password } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
        Write-Host " [PASS] $($acc.Role) login: $($acc.Username) -> Name: $($res.data.name), Role: $($res.data.role)" -ForegroundColor Green
    } catch {
        Write-Host " [FAIL] $($acc.Role) login: $($acc.Username) -> $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host "================================================="
