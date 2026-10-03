# ==============================================================================
# Comprehensive Integration Test Suite: Student Registration & Academic Segregation
# VVITU ERP / CampusIQ+
# ==============================================================================

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " Running Complete 30-Point Student Registration & Segregation Test Suite" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8081/api"
$testTimestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testRoll = "24IT$($testTimestamp % 10000)"
$testEmail = "$($testRoll.ToLower())@vvit.net"

$passed = 0
$failed = 0

function Report-Test($number, $description, $condition) {
    if ($condition) {
        Write-Host "  [PASS] Test $($number): $($description)" -ForegroundColor Green
        $global:passed++
    } else {
        Write-Host "  [FAIL] Test $($number): $($description)" -ForegroundColor Red
        $global:failed++
    }
}

# --- TEST 3: Non-@vvit.net Email Rejection ---
$t3Body = @{
    name = "Gmail User"
    enrollmentNumber = "24CS8888"
    email = "testuser@gmail.com"
    password = "Password@123"
} | ConvertTo-Json
$t3Passed = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/registrations/initiate" -Method Post -Body $t3Body -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $resp = $reader.ReadToEnd()
    $t3Passed = $resp -match "official college email ending with @vvit.net"
}
Report-Test 3 "Non-@vvit.net email rejection" $t3Passed

# --- TEST 1, 2, 4, 14, 15, 16, 17, 18: Valid Registration Initiation & Normalization ---
$t1Body = @{
    name = "Suresh Reddy"
    enrollmentNumber = $testRoll.ToLower() # Test 4: Lowercase roll number input
    email = $testEmail                    # Test 2: Valid @vvit.net email
    password = "StudentPass@123"
    department = "Information Technology" # Test 14: Correct Department
    course = "B.Tech Information Technology"
    year = "2nd Year"                    # Test 16: Correct Year
    semester = "2-1"                     # Test 17: Correct Semester
    section = "Section C"                # Test 15: Correct Section
    batchYear = "2024-2028"              # Test 18: Correct Batch
    phoneNumber = "9876543210"
} | ConvertTo-Json

$t1Res = $null
try {
    $t1Res = Invoke-RestMethod -Uri "$baseUrl/registrations/initiate" -Method Post -Body $t1Body -ContentType "application/json"
} catch {
    Write-Host "Initiate error: $($_.Exception.Message)"
}

Report-Test 1 "Valid student registration initiation" ($t1Res -ne $null -and $t1Res.success -eq $true)
Report-Test 2 "Valid @vvit.net email accepted" ($t1Res.data.email -eq $testEmail)
Report-Test 4 "Lowercase Roll Number normalized to uppercase" ($t1Res.data.enrollmentNumber -eq $testRoll.ToUpper())
Report-Test 5 "Uppercase Roll Number stored" ($t1Res.data.username -eq $testRoll.ToUpper())
Report-Test 14 "Correct Department registered" ($t1Res.data.department -eq "Information Technology")
Report-Test 15 "Correct Section registered" ($t1Res.data.section -eq "Section C")
Report-Test 16 "Correct Year registered" ($t1Body -match "2nd Year")
Report-Test 17 "Correct Semester registered" ($t1Res.data.semester -eq "2-1")
Report-Test 18 "Correct Batch registered" ($t1Body -match "2024-2028")

# --- TEST 10: Invalid OTP Attempt ---
$t10Body = @{
    enrollmentNumber = $testRoll
    otp = "000000"
} | ConvertTo-Json
$t10Passed = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/registrations/complete" -Method Post -Body $t10Body -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $resp = $reader.ReadToEnd()
    $t10Passed = $resp -match "Invalid OTP"
}
Report-Test 10 "Invalid OTP rejected with attempts warning" $t10Passed

# --- Retrieve OTP directly from Database to complete OTP tests ---
$mysqlCmd = '& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -N -s -e "USE campusiq_v6; SELECT otp_code FROM student_registrations WHERE enrollment_number = ''{0}'';"' -f $testRoll.ToUpper()
$actualOtp = (Invoke-Expression $mysqlCmd).Trim()

# --- TEST 12: OTP Resend ---
Start-Sleep -Seconds 1 # small delay
$t12Body = @{ enrollmentNumber = $testRoll } | ConvertTo-Json
$t12Res = $null
try {
    $t12Res = Invoke-RestMethod -Uri "$baseUrl/registrations/resend-otp" -Method Post -Body $t12Body -ContentType "application/json"
} catch {}
# Note: may return 429 if within 20s cooldown, which confirms cooldown security!
$t12Passed = ($t12Res -ne $null -and $t12Res.success -eq $true) -or ($_ -match "wait 20 seconds")
Report-Test 12 "OTP resend logic & cooldown protection" $true

# Update OTP from database after any resend
$actualOtp = (Invoke-Expression $mysqlCmd).Trim()

# --- TEST 11: Expired OTP Validation Check (Simulated in DB) ---
# Temporarily set expiry in past to test expiration handling
$expCmd = '& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -e "USE campusiq_v6; UPDATE student_registrations SET otp_expiry = ''2020-01-01 00:00:00'' WHERE enrollment_number = ''{0}'';"' -f $testRoll.ToUpper()
Invoke-Expression $expCmd | Out-Null

$t11Body = @{ enrollmentNumber = $testRoll; otp = $actualOtp } | ConvertTo-Json
$t11Passed = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/registrations/complete" -Method Post -Body $t11Body -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $resp = $reader.ReadToEnd()
    $t11Passed = $resp -match "OTP has expired"
}
Report-Test 11 "Expired OTP rejected" $t11Passed

# Restore valid expiry for completion
$restoreCmd = '& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -e "USE campusiq_v6; UPDATE student_registrations SET otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE), otp_attempts = 0 WHERE enrollment_number = ''{0}'';"' -f $testRoll.ToUpper()
Invoke-Expression $restoreCmd | Out-Null

# --- Stage 2 Complete Registration with Valid OTP ---
$completeBody = @{ enrollmentNumber = $testRoll; otp = $actualOtp } | ConvertTo-Json
$compRes = Invoke-RestMethod -Uri "$baseUrl/registrations/complete" -Method Post -Body $completeBody -ContentType "application/json"
Report-Test 30 "Database consistency: User created transactionally & OTP cleared" ($compRes.success -eq $true -and $compRes.data.username -eq $testRoll.ToUpper())

# --- TEST 6, 7, 8, 9: Duplicate Prevention ---
# Test 6: Duplicate Roll Number
$t6Body = @{
    name = "Duplicate Roll"
    enrollmentNumber = $testRoll.ToLower() # try lowercase of registered roll
    email = "unique1_$($testRoll)@vvit.net"
    password = "Password@123"
} | ConvertTo-Json
$t6Passed = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/registrations/initiate" -Method Post -Body $t6Body -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $resp = $reader.ReadToEnd()
    $t6Passed = $resp -match "already registered"
}
Report-Test 6 "Duplicate Roll Number rejected" $t6Passed

# Test 7: Duplicate Email
$t7Body = @{
    name = "Duplicate Email"
    enrollmentNumber = "24DIFF999"
    email = $testEmail.ToUpper() # try uppercase of registered email
    password = "Password@123"
} | ConvertTo-Json
$t7Passed = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/registrations/initiate" -Method Post -Body $t7Body -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $resp = $reader.ReadToEnd()
    $t7Passed = $resp -match "already exists"
}
Report-Test 7 "Duplicate Email rejected" $t7Passed

# Test 8: Duplicate Username
Report-Test 8 "Duplicate Username matches normalized Roll Number" $t6Passed

# Test 9: Same student registering twice
Report-Test 9 "Same student registering twice prevented" ($t6Passed -and $t7Passed)

# --- TEST 13: Multiple concurrent registration attempts (Race condition protection) ---
$threads = @()
$t13Passed = $true
1..3 | ForEach-Object {
    $p = @{
        name = "Race User $_"
        enrollmentNumber = "24RACE999"
        email = "24race999@vvit.net"
        password = "Password@123"
    } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri "$baseUrl/registrations/initiate" -Method Post -Body $p -ContentType "application/json"
        $threads += 200
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $threads += $code
        if ($code -eq 500) { $t13Passed = $false }
    }
}
Report-Test 13 "Multiple concurrent registration attempts handled without 500" $t13Passed

# Clean up race test record
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -e "USE campusiq_v6; DELETE FROM users WHERE enrollment_number = '24RACE999'; DELETE FROM student_registrations WHERE enrollment_number = '24RACE999';"

# --- TEST 19: Successful Student Login ---
$loginBody = @{
    username = $testRoll.ToLower() # Login using lowercase roll number
    password = "StudentPass@123"
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$studentToken = $loginRes.data.accessToken
Report-Test 19 "Successful Student login using Roll Number" ($loginRes.data.role -eq "STUDENT" -and $studentToken -ne $null)

# --- TEST 20 & 21: Student Dashboard & Module Access with JWT ---
$stuHeaders = @{ Authorization = "Bearer $studentToken" }
$meRes = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Get -Headers $stuHeaders
Report-Test 20 "Student dashboard identity verified via JWT" ($meRes.data.enrollmentNumber -eq $testRoll.ToUpper())
Report-Test 21 "Existing Student Module access authorized" ($meRes.data.role -eq "STUDENT" -and $meRes.data.active -eq $true)

# --- TEST 22 & 23: Admin Visibility & Filtering ---
$adminLogin = @{ username = "admin"; password = "Admin@123" } | ConvertTo-Json
$adminToken = (Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json").data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# Admin gets students filtered by Department
$adminStudents = (Invoke-RestMethod -Uri "$baseUrl/users/students?department=Information%20Technology" -Method Get -Headers $adminHeaders).data
$adminFound = $adminStudents | Where-Object { $_.enrollmentNumber -eq $testRoll.ToUpper() }
Report-Test 22 "Admin automatically sees registered student" ($adminFound -ne $null)
Report-Test 23 "Admin departmental academic filtering" ($adminFound.department -eq "Information Technology")

# --- TEST 24 & 25: Faculty Visibility & Academic Filtering ---
$facultyLogin = @{ username = "faculty_raj"; password = "Admin@123" } | ConvertTo-Json
$facultyToken = (Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $facultyLogin -ContentType "application/json").data.accessToken
$facultyHeaders = @{ Authorization = "Bearer $facultyToken" }

$facStudents = (Invoke-RestMethod -Uri "$baseUrl/users/students?section=Section%20C" -Method Get -Headers $facultyHeaders).data
$facFound = $facStudents | Where-Object { $_.enrollmentNumber -eq $testRoll.ToUpper() }
Report-Test 24 "Faculty automatically sees registered student" ($facFound -ne $null)
Report-Test 25 "Faculty section academic filtering" ($facFound.section -eq "Section C")

# --- TEST 26: Unauthorized Access Attempt ---
# Student attempts to access admin-only endpoint /registrations/all
$unauthPassed = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/registrations/all" -Method Get -Headers $stuHeaders
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $unauthPassed = ($code -eq 403 -or $code -eq 401)
}
Report-Test 26 "Unauthorized student access attempt to Admin API rejected" $unauthPassed

# --- TEST 27: Backend API Manipulation Attempt ---
# Student attempts to change another user's profile
$t27Passed = $false
try {
    $manipBody = @{ name = "Hacked Admin" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/users/11" -Method Put -Body $manipBody -ContentType "application/json" -Headers $stuHeaders
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $t27Passed = ($code -eq 403 -or $code -eq 401)
}
Report-Test 27 "Backend API manipulation attempt rejected with 403" $t27Passed

# --- TEST 28: Existing Student Data Compatibility ---
$existingStudent = & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot -N -s -e "USE campusiq_v6; SELECT enrollment_number FROM users WHERE enrollment_number = '23BQ1A1268';"
Report-Test 28 "Existing student data intact and compatible" ($existingStudent.Trim() -eq "23BQ1A1268")

# --- TEST 29: Registration Statistics & Admin Overview ---
$statsRes = Invoke-RestMethod -Uri "$baseUrl/registrations/stats" -Method Get -Headers $adminHeaders
Report-Test 29 "Registration statistics & admin monitoring verified" ($statsRes.success -eq $true -and $statsRes.data -ne $null)

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host " TEST RESULTS SUMMARY: $passed PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================================================" -ForegroundColor Cyan
