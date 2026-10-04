# Dada Hip Hop Academy - Docker Diagnostics Script
# Run this in PowerShell on your Windows machine

Write-Host "========================================"
Write-Host "DADA HIP HOP ACADEMY - DOCKER DIAGNOSTICS"
Write-Host "========================================"
Write-Host ""

# Navigate to project
cd "C:\Users\ATK\Desktop\dada-hip-hop-academy"

Write-Host "1. Stopping previous containers..."
docker compose down -v
Write-Host "[OK] Done"
Write-Host ""

Write-Host "2. Building and starting fresh..."
docker compose up -d --build
Write-Host "[OK] Started"
Write-Host ""

Write-Host "3. Waiting 30 seconds for services to initialize..."
Start-Sleep -Seconds 30
Write-Host "[OK] Done waiting"
Write-Host ""

Write-Host "4. Checking container status..."
docker compose ps
Write-Host ""

Write-Host "5. Database logs (last 30 lines):"
Write-Host "========================================"
docker compose logs db --tail 30
Write-Host ""

Write-Host "6. App logs (last 50 lines):"
Write-Host "========================================"
docker compose logs app --tail 50
Write-Host ""

Write-Host "7. Testing connection..."
docker compose exec -T app wget -q -O - http://127.0.0.1:3000/api/auth/session
Write-Host ""

Write-Host "========================================"
Write-Host "DIAGNOSTICS COMPLETE"
Write-Host "========================================"
Write-Host ""
Write-Host "[INFO] Project should be at: http://localhost"
Write-Host "[INFO] Admin login: admin@dadahiphop.com"
Write-Host ""
