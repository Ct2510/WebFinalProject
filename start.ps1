# PowerShell script to start the Fish Data Web Application
Write-Host "Starting Fish Data Web Application..." -ForegroundColor Green
Write-Host "Navigate to: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start the Node.js server
node bin/www
