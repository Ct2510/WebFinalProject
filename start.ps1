# PowerShell script to start the Product Price System
Write-Host "Starting Product Price System..." -ForegroundColor Green
Write-Host "Navigate to: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start the Node.js server
node bin/www
