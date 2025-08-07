#!/bin/bash

echo "🚀 무인 자판기 장치 등록 시스템 설정 시작"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다. Node.js 18 이상을 설치해주세요."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 16 이상이 필요합니다. 현재 버전: $(node -v)"
    exit 1
fi

echo "✅ Node.js 버전 확인됨: $(node -v)"

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 백엔드 환경 변수 파일 생성 중..."
    cp .env.example .env
    echo "✅ .env 파일이 생성되었습니다. 필요한 값들을 설정해주세요."
fi

if [ ! -f frontend/.env ]; then
    echo "📝 프론트엔드 환경 변수 파일 생성 중..."
    cp frontend/.env.example frontend/.env
    echo "✅ frontend/.env 파일이 생성되었습니다."
fi

if [ ! -f client-simulator/.env ]; then
    echo "📝 클라이언트 시뮬레이터 환경 변수 파일 생성 중..."
    cp client-simulator/.env.example client-simulator/.env
    echo "✅ client-simulator/.env 파일이 생성되었습니다."
fi

if [ ! -f client-simulator/config.json ]; then
    echo "📝 클라이언트 설정 파일 생성 중..."
    cp client-simulator/config.example.json client-simulator/config.json
    echo "✅ client-simulator/config.json 파일이 생성되었습니다."
fi

# Install dependencies
echo "📦 백엔드 의존성 설치 중..."
npm install

echo "📦 프론트엔드 의존성 설치 중..."
cd frontend
npm install
cd ..

echo "📦 클라이언트 시뮬레이터 의존성 설치 중..."
cd client-simulator
npm install
cd ..

# Build TypeScript
echo "🔨 TypeScript 빌드 중..."
npm run build

echo "🔨 클라이언트 시뮬레이터 빌드 중..."
cd client-simulator
npm run build
cd ..

echo ""
echo "🎉 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. .env 파일에서 AWS 설정을 확인하세요"
echo "2. DynamoDB 테이블을 생성하세요: node scripts/create-dynamodb-table.js create"
echo "3. 서버를 시작하세요:"
echo "   - 백엔드: npm run dev"
echo "   - 프론트엔드: cd frontend && npm start"
echo "   - 클라이언트 시뮬레이터: cd client-simulator && npm run dev"
echo ""
echo "관리자 대시보드: http://localhost:3000"
echo "데모 로그인 정보:"
echo "  이메일: admin@example.com"
echo "  비밀번호: admin123"