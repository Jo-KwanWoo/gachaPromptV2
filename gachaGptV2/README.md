# 🤖 GachaGptV2 - NestJS 구현체

NestJS 프레임워크 기반 가챠 무인 판매기 장치 등록 시스템입니다.

## 🏗️ 아키텍처 특징

- **프레임워크**: NestJS (Express 기반)
- **패턴**: 데코레이터 패턴, 의존성 주입
- **구조**: 모듈화된 계층 아키텍처
- **검증**: Joi 스키마 기반 입력 검증
- **인증**: JWT 가드 기반 인증/인가

## 📁 프로젝트 구조

```
src/
├── controller/          # API 컨트롤러
│   └── device.controller.ts
├── service/            # 비즈니스 로직
│   └── device.service.ts
├── domain/             # 도메인 모델
│   ├── device.entity.ts
│   ├── device-status.enum.ts
│   └── device.validator.ts
├── interface/          # 외부 인터페이스
│   ├── auth.guard.ts
│   ├── dynamo.repository.ts
│   └── sqs.service.ts
├── app.module.ts       # 메인 모듈
└── main.ts            # 애플리케이션 진입점
```

## 🚀 실행 방법

### 1. 의존성 설치
```bash
cd gachaGptV2
npm install
```

### 2. 개발 서버 실행
```bash
npm run start:dev
```

### 3. 프로덕션 빌드
```bash
npm run build
npm run start:prod
```

## 🧪 테스트 실행

### 단위 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### 테스트 커버리지
```bash
npm run test:cov
```

## 📊 API 엔드포인트

| 메소드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/api/devices/register` | 장치 등록 | ❌ |
| `GET` | `/api/devices/status/:hardwareId` | 상태 조회 | ❌ |
| `GET` | `/api/devices/pending` | 대기 목록 | ✅ |
| `PUT` | `/api/devices/:deviceId/approve` | 장치 승인 | ✅ |
| `PUT` | `/api/devices/:deviceId/reject` | 장치 거부 | ✅ |

## 🔧 환경 설정

`.env` 파일에서 다음 설정을 관리합니다:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=gacha-secret-key-2024
AWS_REGION=ap-northeast-2
DYNAMODB_TABLE_NAME=gacha-devices
```

## 🏆 아키텍처 평가

**점수**: 34.10점 (3위)

**강점**:
- 모던 프레임워크 활용
- 데코레이터 기반 깔끔한 코드
- 의존성 주입으로 테스트 용이성

**개선점**:
- 입력 검증 강화 필요
- 에러 처리 세분화
- 보안 요소 추가 구현

## 🛠️ 개발 도구

- **Linting**: ESLint + Prettier
- **Testing**: Jest + Supertest
- **Build**: TypeScript Compiler
- **Hot Reload**: Nodemon 기반

서버 실행 후 `http://localhost:3000`에서 API를 테스트할 수 있습니다.