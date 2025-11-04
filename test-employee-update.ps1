# Test Employee Update API

$baseUrl = "http://localhost:3001/api/v1"

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = "admin@golivefaster.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $token" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get all employees to find EMP_005
Write-Host "`nStep 2: Getting all employees..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $employeesResponse = Invoke-RestMethod -Uri "$baseUrl/employees" -Method GET -Headers $headers
    $emp005 = $employeesResponse.data | Where-Object { $_.employeeId -eq "EMP_005" }

    if ($emp005) {
        Write-Host "✓ Found EMP_005" -ForegroundColor Green
        Write-Host "Current Employment Type: $($emp005.employmentType)" -ForegroundColor Yellow
        Write-Host "Employee Data:" -ForegroundColor Gray
        $emp005 | ConvertTo-Json | Write-Host
    } else {
        Write-Host "✗ EMP_005 not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Failed to get employees: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Update EMP_005 employment type using employeeId (correct way)
Write-Host "`nStep 3: Updating EMP_005 employment type to FTDC..." -ForegroundColor Cyan
$updateBody = @{
    employmentType = "FTDC"
} | ConvertTo-Json

try {
    # Using employeeId in the URL path
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/employees/EMP_005" -Method PUT -Headers $headers -Body $updateBody -ContentType "application/json"
    Write-Host "✓ Update successful" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $updateResponse | ConvertTo-Json | Write-Host
} catch {
    Write-Host "✗ Update failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Verify the update
Write-Host "`nStep 4: Verifying update..." -ForegroundColor Cyan
try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/employees" -Method GET -Headers $headers
    $emp005After = $verifyResponse.data | Where-Object { $_.employeeId -eq "EMP_005" }

    if ($emp005After) {
        Write-Host "✓ Found EMP_005 after update" -ForegroundColor Green
        Write-Host "New Employment Type: $($emp005After.employmentType)" -ForegroundColor Yellow

        if ($emp005After.employmentType -eq "FTDC") {
            Write-Host "✓✓ VERIFICATION SUCCESSFUL - Employment type updated to FTDC" -ForegroundColor Green
        } else {
            Write-Host "✗✗ VERIFICATION FAILED - Employment type is still: $($emp005After.employmentType)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
}
