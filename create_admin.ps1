# PowerShell script to create admin credentials
$body = @{
    username = "ccbadmin09"
    password = "ccbadmin123"
    setupKey = "ccb-setup-2024"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/setup/" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Admin created successfully:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error creating admin:" -ForegroundColor Red
    $_.Exception.Message
}
