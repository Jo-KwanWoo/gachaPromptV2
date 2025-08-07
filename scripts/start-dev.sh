#!/bin/bash

echo "🚀 개발 환경 시작"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  포트 $1이 이미 사용 중입니다."
        return 1
    fi
    return 0
}

# Check required ports
if ! check_port 3000; then
    echo "백엔드 서버 포트(3000)가 사용 중입니다."
    exit 1
fi

if ! check_port 3001; then
    echo "프론트엔드 서버 포트(3001)가 사용 중입니다."
    exit 1
fi

# Start backend server
echo "📡 백엔드 서버 시작 중..."
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo "🎨 프론트엔드 서버 시작 중..."
cd frontend
BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend to start
sleep 3

# Start client simulator
echo "🤖 클라이언트 시뮬레이터 시작 중..."
cd client-simulator
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ 모든 서비스가 시작되었습니다!"
echo ""
echo "🌐 서비스 URL:"
echo "   - 관리자 대시보드: http://localhost:3001"
echo "   - 백엔드 API: http://localhost:3000/api"
echo "   - 헬스체크: http://localhost:3000/health"
echo ""
echo "🔑 로그인 정보:"
echo "   - 이메일: admin@example.com"
echo "   - 비밀번호: admin123"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 서비스 종료 중..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo "✅ 모든 서비스가 종료되었습니다."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait