# 🤖 가챠 무인 판매기 장치 등록 시스템

TypeScript 기반 무인 자판기 장치 등록 및 관리 시스템입니다. 3가지 다른 아키텍처 구현체와 완전한 UI/UX를 제공합니다.

## 📋 프로젝트 개요

전국 각지의 무인 자판기 장치들이 중앙 서버에 자동으로 등록되고, 관리자가 이를 승인하거나 거부할 수 있는 시스템입니다.

### 🎯 주요 기능
- 🔐 **장치 자동 등록**: 하드웨어 정보 기반 자동 등록
- 👨‍💼 **관리자 승인/거부**: JWT 기반 인증으로 보안 관리
- 📊 **실시간 대시보드**: 장치 상태 모니터링 및 통계
- 🔄 **상태 폴링**: 5분 간격 승인 상태 확인
- 📈 **시각화**: 등록 추이 및 상태별 분포 차트

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Backend**: TypeScript, NestJS/Express.js
- **Database**: AWS DynamoDB
- **Message Queue**: AWS SQS
- **Frontend**: HTML5, Tailwind CSS, Chart.js
- **Authentication**: JWT

### 구현체 비교

| 구현체 | 프레임워크 | 특징 | 점수 |
|--------|------------|------|------|
| **gachaClaudeV2** | Express.js | 엔터프라이즈급 아키텍처, 완벽한 검증 | ⭐⭐⭐⭐⭐ (45.29점) |
| **gachaGptV2** | NestJS | 모던 프레임워크, 데코레이터 패턴 | ⭐⭐⭐ (34.10점) |
| **gachaGeminiV2** | 단일파일 | 교육용, 뛰어난 문서화 | ⭐⭐⭐ (35.58점) |

## 📁 프로젝트 구조

```
📦 gacha-vending-machine-system
├── 🎨 UI/UX
│   ├── dashboard.html              # 관리자 대시보드
│   ├── device-registration.html    # 장치 등록 화면
│   ├── sample-data-ui.json        # UI용 샘플 데이터
│   └── README-UI.md               # UI 실행 가이드
├── 🏗️ Backend Implementations
│   ├── gachaClaudeV2/             # Express.js 구현체 (최우수)
│   ├── gachaGptV2/                # NestJS 구현체
│   └── gachaGeminiV2.ts           # 단일파일 구현체
├── 🧪 Testing
│   ├── test-gachaClaudeV2.ts      # Express 테스트
│   ├── test-gachaGptV2.ts         # NestJS 테스트
│   ├── test-gachaGeminiV2.js      # 단일파일 테스트
│   ├── run-all-tests.js           # 통합 테스트 실행기
│   └── sample-data.json           # API 테스트용 데이터
└── 📚 Documentation
    ├── README.md                  # 프로젝트 메인 문서
    └── README-UI.md               # UI 전용 가이드
```

## 🚀 빠른 시작

### 1. UI 데모 실행 (추천)
```bash
# 로컬 서버 실행
python -m http.server 8000
# 또는
npx http-server

# 브라우저에서 접속
http://localhost:8000/dashboard.html
http://localhost:8000/device-registration.html
```

### 2. 백엔드 테스트 실행
```bash
# Node.js 테스트
node test-gachaGeminiV2.js

# TypeScript 테스트 (ts-node 필요)
npx ts-node test-gachaGptV2.ts
npx ts-node test-gachaClaudeV2.ts

# 전체 테스트 정보
node run-all-tests.js
```

### 3. 실제 서버 실행 (gachaClaudeV2 - 최우수 구현체)
```bash
cd gachaClaudeV2
npm install
npm run dev
```

## 🎨 UI/UX 기능

### 📊 관리자 대시보드
- **실시간 통계**: 전체/대기/승인/거부 장치 수
- **승인 관리**: 우선순위별 장치 목록 및 상세 정보
- **시스템 모니터링**: API, DB, 큐 상태 확인
- **활동 로그**: 등록, 승인, 거부 이력
- **차트**: 등록 추이 및 상태별 분포

### 📝 장치 등록 화면
- **3단계 등록**: 기본정보 → 시스템정보 → 확인
- **실시간 검증**: IP 주소, UUID 형식 등
- **샘플 데이터**: 자동 입력 기능
- **진행 표시**: 단계별 진행 상황

## 🔧 API 엔드포인트

| 메소드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/api/devices/register` | 장치 등록 요청 | ❌ |
| `GET` | `/api/devices/status/:hardwareId` | 승인 상태 확인 | ❌ |
| `GET` | `/api/devices/pending` | 대기 중인 장치 목록 | ✅ |
| `PUT` | `/api/devices/:deviceId/approve` | 장치 승인 | ✅ |
| `PUT` | `/api/devices/:deviceId/reject` | 장치 거부 | ✅ |

## 📊 샘플 데이터

### 장치 등록 요청 예시
```json
{
  "hardwareId": "VM001SEOUL2024",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "ipAddress": "192.168.1.101",
  "systemInfo": {
    "os": "Ubuntu",
    "version": "22.04.3 LTS",
    "architecture": "x86_64",
    "memory": "8GB",
    "storage": "256GB SSD"
  }
}
```

### API 응답 형식
```json
{
  "status": "success",
  "message": "등록 요청 완료",
  "data": {
    "deviceId": "dev-550e8400-e29b-41d4-a716-446655440101",
    "sqsQueueUrl": "https://sqs.ap-northeast-2.amazonaws.com/..."
  }
}
```

## 🏆 아키텍처 평가 결과

### 평가 기준 (8개 항목, 가중치 적용)
1. **입력 검증** (1.5) - 필수값, 형식, 범위 검증
2. **에러 처리** (1.4) - 구체적 예외, HTTP 상태 코드
3. **보안 요소** (1.4) - 인증/인가, 접근 제한
4. **로직 디테일** (1.3) - 요구사항 구현, 가독성
5. **로직 분리** (1.2) - 계층 분리, 의존성 주입
6. **API 설계** (1.1) - RESTful, HTTP 메소드
7. **응답 구조** (1.0) - 일관성, 필드 명명
8. **확장성** (0.8) - 미래 대응, 설정 분리

### 최종 순위
1. 🥇 **gachaClaudeV2**: 45.29점 - 엔터프라이즈급 완성도
2. 🥈 **gachaGeminiV2**: 35.58점 - 교육용 최적화
3. 🥉 **gachaGptV2**: 34.10점 - 모던 프레임워크

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- TypeScript 4.5+
- Python 3.7+ (로컬 서버용)

### 선택적 도구
- AWS CLI (실제 DynamoDB/SQS 연동 시)
- Docker (컨테이너 실행 시)
- Postman (API 테스트용)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 제작자

- **시스템 아키텍처**: 3가지 구현체 비교 분석
- **UI/UX 디자인**: 반응형 웹 대시보드
- **테스트 시나리오**: 포괄적 테스트 케이스

## 🔗 관련 링크

- [UI 데모 가이드](README-UI.md)
- [API 문서](docs/api.md)
- [배포 가이드](docs/deployment.md)

---

⭐ **이 프로젝트가 도움이 되었다면 Star를 눌러주세요!** ⭐