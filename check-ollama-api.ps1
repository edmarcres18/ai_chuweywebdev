# Check-Ollama-API.ps1
# Script to verify the availability of Ollama API endpoints

Write-Host "Checking Ollama API Endpoints..." -ForegroundColor Cyan

$endpoints = @(
    "http://192.168.1.50:11434/api/generate", 
    "https://ollama.mhrpci.site/api/generate"
)

$testPayload = @{
    model = "phi:latest"
    prompt = "test connection"
    stream = $false
    options = @{
        temperature = 0.7
    }
} | ConvertTo-Json

foreach ($endpoint in $endpoints) {
    Write-Host "`nTesting endpoint: $endpoint" -ForegroundColor Yellow
    
    try {
        # Set timeout to 5 seconds
        $timeoutMs = 5000
        
        $ProgressPreference = 'SilentlyContinue'  # Hide progress bar for faster execution
        
        $response = Invoke-WebRequest -Uri $endpoint -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ SUCCESS: Endpoint is available and responding correctly" -ForegroundColor Green
            
            try {
                $content = $response.Content | ConvertFrom-Json
                Write-Host "  Response received: $($content.response.Substring(0, [Math]::Min(50, $content.response.Length)))..." -ForegroundColor Gray
            }
            catch {
                Write-Host "  Response received but couldn't parse content" -ForegroundColor Gray
            }
            
            # Test successful, break out of the loop
            Write-Host "`n✓ Found working API endpoint: $endpoint" -ForegroundColor Green
            break
        }
        else {
            Write-Host "✗ ERROR: Endpoint returned status code $($response.StatusCode)" -ForegroundColor Red
        }
    }
    catch [System.Net.WebException] {
        if ($_.Exception.Status -eq [System.Net.WebExceptionStatus]::Timeout) {
            Write-Host "✗ ERROR: Connection timed out after ${timeoutMs}ms" -ForegroundColor Red
        }
        elseif ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "✗ ERROR: Endpoint returned status code $statusCode" -ForegroundColor Red
            Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
        }
        else {
            Write-Host "✗ ERROR: Could not connect to endpoint" -ForegroundColor Red
            Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ ERROR: An unexpected error occurred" -ForegroundColor Red
        Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== HTML Integration Check ===" -ForegroundColor Cyan

$htmlFile = "site/index.html"
if (Test-Path $htmlFile) {
    Write-Host "Analyzing HTML file for API integration..." -ForegroundColor Yellow
    
    $htmlContent = Get-Content $htmlFile -Raw
    
    if ($htmlContent -match "getApiEndpoint\s*=\s*\(\)\s*=>\s*\{") {
        Write-Host "✓ Found API endpoint selection function" -ForegroundColor Green
        
        if ($htmlContent -match "FALLBACK_ENDPOINTS\s*=\s*\[") {
            Write-Host "✓ Found fallback endpoints configuration" -ForegroundColor Green
        }
        else {
            Write-Host "✗ Could not find fallback endpoints configuration" -ForegroundColor Red
        }
        
        if ($htmlContent -match "tryNextEndpoint\s*\(\)\s*\{") {
            Write-Host "✓ Found fallback mechanism implementation" -ForegroundColor Green
        }
        else {
            Write-Host "✗ Could not find fallback mechanism implementation" -ForegroundColor Red
        }
        
        if ($htmlContent -match "checkAPIStatus\s*\(\)\s*\{") {
            Write-Host "✓ Found API status checking function" -ForegroundColor Green
        }
        else {
            Write-Host "✗ Could not find API status checking function" -ForegroundColor Red
        }
    }
    else {
        Write-Host "✗ Could not find API endpoint selection function" -ForegroundColor Red
    }
}
else {
    Write-Host "✗ Could not find HTML file at $htmlFile" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Run this script regularly to ensure your API endpoints are accessible." -ForegroundColor White
Write-Host "For production deployment, consider implementing the following:" -ForegroundColor White
Write-Host " - Automated health checks for your endpoints" -ForegroundColor White
Write-Host " - Server-side proxy to avoid CORS issues" -ForegroundColor White
Write-Host " - Rate limiting protection for your API keys" -ForegroundColor White
Write-Host " - Enhanced error handling and user notifications" -ForegroundColor White 