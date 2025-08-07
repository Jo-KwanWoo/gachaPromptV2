# 무인 자판기 장치 등록 시스템

TypeScript 기반의 무인 자판기 장치 등록 및 관리 시스템입니다. SRP(단일 책임 원칙)를 적용한 계층 구조로 설계되었으며, AWS 클라우드 인프라를 활용합니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   자판기 장치    │    │   백엔드 서버    │    │  관리자 대시보드  │
│  (Node.js)      │◄──►│  (Express.js)   │◄──►│   (React.js)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   AWS Services  │
                    │  - DynamoDB     │
                    │  - SQS          │
                    └─────────────────┘
```

## 📋 주요 기능

### 🤖 자판기 장치
- 네트워크 연결 시 자동 등록 요청
- 하드웨어 정보 수집 및 전송
- 승인 상태 주기적 확인 (5분 간격)
- 네트워크 오류 시 자동 재시도
- 24시간 후 자동 재등록

### 🖥️ 백엔드 서버
- RESTful API 제공
- JWT 기반 인증
- 장치 등록 요청 처리
- 관리자 승인/거부 기능
- DynamoDB 데이터 저장
- SQS 큐 생성 및 관리

### 📊 관리자 대시보드
- 실시간 장치 현황 모니터링
- 등록 요청 승인/거부
- 장치 검색 및 필터링
- 반응형 웹 인터페이스

## 🛠️ 기술 스택

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Database**: AWS DynamoDB
- **Message Queue**: AWS SQS
- **Authentication**: JWT
- **Validation**: Joi
- **HTTP Client**: Axios

## 📁 프로젝트 구조

```
├── src/                          # 백엔드 소스코드
│   ├── domain/                   # 도메인 모델 및 비즈니스 규칙
│   │   ├── Device.ts
│   │   └── validators/
│   ├── service/                  # 비즈니스 로직
│   │   └── DeviceRegistrationService.ts
│   ├── interface/                # 외부 시스템 인터페이스
│   │   ├── repositories/
│   │   ├── messaging/
│   │   └── auth/
│   ├── controllers/              # API 컨트롤러
│   ├── routes/                   # 라우팅
│   ├── middleware/               # 미들웨어
│   └── server.ts                 # 서버 진입점
├── frontend/                     # 프론트엔드 소스코드
│   ├── src/
│   │   ├── components/           # React 컴포넌트
│   │   ├── pages/                # 페이지 컴포넌트
│   │   ├── services/             # API 서비스
│   │   └── types/                # TypeScript 타입 정의
├── client-simulator/             # 자판기 클라이언트 시뮬레이터
└── scripts/                      # 유틸리티 스크립트
```

## 🚀 설치 및 실행

### 1. 환경 설정

```bash
# 백엔드 환경 변수 설정
cp .env.example .env

# 프론트엔드 환경 변수 설정
cp frontend/.env.example frontend/.env

# 클라이언트 시뮬레이터 환경 변수 설정
cp client-simulator/.env.example client-simulator/.env
```

### 2. 의존성 설치

```bash
# 백엔드
npm install

# 프론트엔드
cd frontend
npm install

# 클라이언트 시뮬레이터
cd ../client-simulator
npm install
```

### 3. AWS 설정

```bash
# DynamoDB 테이블 생성
node scripts/create-dynamodb-table.js create
```

### 4. 서버 실행

```bash
# 백엔드 개발 서버
npm run dev

# 프론트엔드 개발 서버
cd frontend
npm start

# 자판기 클라이언트 시뮬레이터
cd client-simulator
npm run dev
```

## 📡 API 엔드포인트

### 장치 관련 API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/devices/register` | 장치 등록 요청 | ❌ |
| GET | `/api/devices/status/:hardwareId` | 장치 상태 확인 | ❌ |
| GET | `/api/devices/pending` | 대기 중인 장치 목록 | ✅ |
| PUT | `/api/devices/:deviceId/approve` | 장치 승인 | ✅ |
| PUT | `/api/devices/:deviceId/reject` | 장치 거부 | ✅ |

### 요청/응답 예시

#### 장치 등록 요청
```json
POST /api/devices/register
{
  "hardwareId": "VM-ABC12345",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "ipAddress": "192.168.1.100",
  "systemInfo": {
    "os": "Linux 5.4.0",
    "version": "v16.14.0",
    "architecture": "x64",
    "memory": "8GB (6GB 사용 가능)",
    "storage": "500GB SSD"
  }
}
```

#### 성공 응답
```json
{
  "status": "success",
  "message": "Device registration request submitted successfully"
}
```

#### 장치 상태 확인 (승인됨)
```json
GET /api/devices/status/VM-ABC12345

{
  "status": "success",
  "message": "Device has been approved and is ready for operation",
  "data": {
    "status": "approved",
    "deviceId": "550e8400-e29b-41d4-a716-446655440001",
    "sqsQueueUrl": "https://sqs.us-east-1.amazonaws.com/123456789/device-550e8400-e29b-41d4-a716-446655440001"
  }
}
```

## 🔐 보안 고려사항

- JWT 토큰 기반 인증
- 입력값 유효성 검사 (Joi)
- CORS 설정
- Helmet.js 보안 헤더
- 환경 변수를 통한 민감 정보 관리

## 🧪 테스트

```bash
# 백엔드 테스트
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 📝 개발 가이드

### 새로운 기능 추가 시

1. **도메인 모델** 정의 (`src/domain/`)
2. **서비스 로직** 구현 (`src/service/`)
3. **인터페이스 계층** 구현 (`src/interface/`)
4. **컨트롤러** 구현 (`src/controllers/`)
5. **라우팅** 설정 (`src/routes/`)
6. **프론트엔드 컴포넌트** 구현 (`frontend/src/`)

### 코드 스타일

- TypeScript strict 모드 사용
- ESLint 규칙 준수
- SRP(단일 책임 원칙) 적용
- 의존성 주입 패턴 사용

## 🚀 배포

### Docker를 사용한 배포

```bash
# 백엔드 Docker 이미지 빌드
docker build -t vending-machine-backend .

# 프론트엔드 Docker 이미지 빌드
cd frontend
docker build -t vending-machine-frontend .
```

### AWS 배포

1. **EC2** 또는 **ECS**에 백엔드 배포
2. **S3** + **CloudFront**에 프론트엔드 배포
3. **DynamoDB** 테이블 생성
4. **SQS** 큐 설정
5. **IAM** 역할 및 정책 설정

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해 주세요.

## 📄 라이선스

MIT License