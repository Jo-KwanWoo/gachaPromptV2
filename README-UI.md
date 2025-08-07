# 가챠 무인 판매기 장치 등록 시스템 - UI 데모

## 📋 파일 구성

### 🎨 HTML UI 파일
- `dashboard.html` - 관리자 대시보드 (장치 승인/거부 관리)
- `device-registration.html` - 장치 등록 화면 (신규 장치 등록)

### 📊 데이터 파일
- `sample-data-ui.json` - UI용 샘플 데이터 (차트, 통계, 장치 정보 등)
- `sample-data.json` - 기존 API 테스트용 데이터

### 🧪 테스트 파일 (기존 유지)
- `test-gachaGeminiV2.js` - Node.js 콘솔 테스트
- `test-gachaGptV2.ts` - NestJS 시뮬레이션 테스트  
- `test-gachaClaudeV2.ts` - Express 시뮬레이션 테스트
- `run-all-tests.js` - 통합 테스트 실행기

## 🚀 실행 방법

### 1. HTML UI 실행
```bash
# 로컬 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js 서버
npx http-server

# 브라우저에서 접속
http://localhost:8000/dashboard.html
http://localhost:8000/device-registration.html
```

### 2. 기존 콘솔 테스트 실행
```bash
# Node.js 테스트
node test-gachaGeminiV2.js

# TypeScript 테스트 (ts-node 필요)
npx ts-node test-gachaGptV2.ts
npx ts-node test-gachaClaudeV2.ts

# 전체 테스트 정보
node run-all-tests.js
```

## 🎯 UI 기능

### 📊 관리자 대시보드 (`dashboard.html`)
- **실시간 통계**: 전체/대기/승인/거부 장치 수
- **승인 대기 목록**: 우선순위별 장치 목록
- **장치 상세 모달**: 시스템 정보 확인 및 승인/거부
- **시스템 상태**: API, DB, 큐 상태 모니터링
- **최근 활동**: 등록, 승인, 거부 이력
- **알림**: 긴급 알림 및 일반 정보
- **차트**: 등록 추이 및 상태별 분포

### 📝 장치 등록 화면 (`device-registration.html`)
- **3단계 등록**: 기본정보 → 시스템정보 → 확인
- **실시간 검증**: IP 주소, UUID 형식 등
- **샘플 데이터**: 자동 입력 기능
- **진행 표시**: 단계별 진행 상황
- **등록 상태**: 처리 중/완료 상태 표시

## 📊 샘플 데이터 구조

### `sample-data-ui.json` 주요 섹션:
```json
{
  "dashboard": {
    "stats": { "totalDevices": 15, "pendingDevices": 5, ... }
  },
  "pendingDevices": [
    {
      "hardwareId": "VM001SEOUL2024",
      "location": "서울 강남구",
      "priority": "high",
      "systemInfo": { ... }
    }
  ],
  "chartData": {
    "registrationTrend": { ... },
    "statusDistribution": { ... }
  }
}
```

## 🎨 UI 특징

### 🎯 반응형 디자인
- **Tailwind CSS**: 모던한 디자인 시스템
- **모바일 대응**: 다양한 화면 크기 지원
- **다크 모드**: 준비된 색상 체계

### 📈 인터랙티브 요소
- **Chart.js**: 실시간 차트 및 그래프
- **Font Awesome**: 직관적인 아이콘
- **모달 팝업**: 상세 정보 표시
- **애니메이션**: 부드러운 전환 효과

### 🔧 확장성
- **모듈화**: 컴포넌트별 분리 가능
- **API 연동**: 실제 백엔드 연결 준비
- **상태 관리**: 클라이언트 사이드 상태 관리

## 🌟 주요 기능 시연

### 1. 대시보드 시연
1. `dashboard.html` 열기
2. 통계 카드 확인
3. 승인 대기 장치 클릭 → 상세 모달
4. 승인/거부 버튼 테스트
5. 차트 및 활동 로그 확인

### 2. 장치 등록 시연  
1. `device-registration.html` 열기
2. "샘플 데이터로 자동 입력" 클릭
3. 3단계 등록 과정 진행
4. 최종 확인 및 등록 완료

## 🔗 실제 시스템 연동

### API 연동 포인트:
```javascript
// dashboard.html에서 실제 API 호출 예시
async function approveDevice(deviceId) {
  const response = await fetch(`/api/devices/${deviceId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  // 결과 처리...
}
```

### 백엔드 연동:
- `gachaClaudeV2`: Express 서버와 직접 연동
- `gachaGptV2`: NestJS API와 연동  
- `gachaGeminiV2`: 단일 파일 서버와 연동

## 💡 개발 팁

1. **로컬 개발**: `python -m http.server`로 간단 서버 실행
2. **CORS 해결**: 실제 API 연동 시 CORS 설정 필요
3. **상태 관리**: 복잡한 상태는 Vue.js/React 고려
4. **실시간 업데이트**: WebSocket 또는 Server-Sent Events 활용

---

이제 브라우저에서 `dashboard.html`과 `device-registration.html`을 열어보시면 완전한 UI/UX를 체험할 수 있습니다! 🎉