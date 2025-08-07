Write-Host "🚀 무인 자판기 장치 등록 시스템 설정 시작" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js 버전 확인됨: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js가 설치되어 있지 않습니다. Node.js 18 이상을 설치해주세요." -ForegroundColor Red
    exit 1
}

# Create environment files if they don't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 백엔드 환경 변수 파일 생성 중..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env 파일이 생성되었습니다. 필요한 값들을 설정해주세요." -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 프론트엔드 환경 변수 파일 생성 중..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✅ frontend\.env 파일이 생성되었습니다." -ForegroundColor Green
}

if (-not (Test-Path "client-simulator\.env")) {
    Write-Host "📝 클라이언트 시뮬레이터 환경 변수 파일 생성 중..." -ForegroundColor Yellow
    Copy-Item "client-simulator\.env.example" "client-simulator\.env"
    Write-Host "✅ client-simulator\.env 파일이 생성되었습니다." -ForegroundColor Green
}

if (-not (Test-Path "client-simulator\config.json")) {
    Write-Host "📝 클라이언트 설정 파일 생성 중..." -ForegroundColor Yellow
    Copy-Item "client-simulator\config.example.json" "client-simulator\config.json"
    Write-Host "✅ client-simulator\config.json 파일이 생성되었습니다." -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 백엔드 의존성 설치 중..." -ForegroundColor Yellow
npm install

Write-Host "📦 프론트엔드 의존성 설치 중..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "📦 클라이언트 시뮬레이터 의존성 설치 중..." -ForegroundColor Yellow
Set-Location client-simulator
npm install
Set-Location ..

# Build TypeScript
Write-Host "🔨 TypeScript 빌드 중..." -ForegroundColor Yellow
npm run build

Write-Host "🔨 클라이언트 시뮬레이터 빌드 중..." -ForegroundColor Yellow
Set-Location client-simulator
npm run build
Set-Location ..

Write-Host ""
Write-Host "🎉 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "1. .env 파일에서 AWS 설정을 확인하세요"
Write-Host "2. DynamoDB 테이블을 생성하세요: node scripts/create-dynamodb-table.js create"
Write-Host "3. 서버를 시작하세요:"
Write-Host "   - 백엔드: npm run dev"
Write-Host "   - 프론트엔드: cd frontend; npm start"
Write-Host "   - 클라이언트 시뮬레이터: cd client-simulator; npm run dev"
Write-Host ""
Write-Host "관리자 대시보드: http://localhost:3000" -ForegroundColor Yellow
Write-Host "데모 로그인 정보:" -ForegroundColor Yellow
Write-Host "  이메일: admin@example.com"
Write-Host "  비밀번호: admin123"