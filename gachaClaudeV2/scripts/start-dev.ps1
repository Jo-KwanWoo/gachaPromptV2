Write-Host "🚀 개발 환경 시작" -ForegroundColor Green

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check required ports
if (Test-Port 3000) {
    Write-Host "⚠️  포트 3000이 이미 사용 중입니다." -ForegroundColor Yellow
    exit 1
}

if (Test-Port 3001) {
    Write-Host "⚠️  포트 3001이 이미 사용 중입니다." -ForegroundColor Yellow
    exit 1
}

# Start backend server
Write-Host "📡 백엔드 서버 시작 중..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "🎨 프론트엔드 서버 시작 중..." -ForegroundColor Yellow
Set-Location frontend
$env:BROWSER = "none"
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -WindowStyle Hidden
Set-Location ..

# Wait a bit for frontend to start
Start-Sleep -Seconds 3

# Start client simulator
Write-Host "🤖 클라이언트 시뮬레이터 시작 중..." -ForegroundColor Yellow
Set-Location client-simulator
$clientProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
Set-Location ..

Write-Host ""
Write-Host "✅ 모든 서비스가 시작되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 서비스 URL:" -ForegroundColor Cyan
Write-Host "   - 관리자 대시보드: http://localhost:3001"
Write-Host "   - 백엔드 API: http://localhost:3000/api"
Write-Host "   - 헬스체크: http://localhost:3000/health"
Write-Host ""
Write-Host "🔑 로그인 정보:" -ForegroundColor Cyan
Write-Host "   - 이메일: admin@example.com"
Write-Host "   - 비밀번호: admin123"
Write-Host ""
Write-Host "종료하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow

# Function to cleanup processes
function Stop-Services {
    Write-Host ""
    Write-Host "🛑 서비스 종료 중..." -ForegroundColor Yellow
    
    if ($backendProcess -and !$backendProcess.HasExited) {
        $backendProcess.Kill()
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        $frontendProcess.Kill()
    }
    if ($clientProcess -and !$clientProcess.HasExited) {
        $clientProcess.Kill()
    }
    
    Write-Host "✅ 모든 서비스가 종료되었습니다." -ForegroundColor Green
}

# Set trap to cleanup on script exit
try {
    # Wait for user to stop
    while ($true) {
        Start-Sleep -Seconds 1
        if ($backendProcess.HasExited -or $frontendProcess.HasExited -or $clientProcess.HasExited) {
            Write-Host "⚠️  일부 서비스가 예상치 못하게 종료되었습니다." -ForegroundColor Yellow
            break
        }
    }
} finally {
    Stop-Services
}