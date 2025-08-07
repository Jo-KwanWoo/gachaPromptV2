# 🚀 Git 리포지토리 설정 가이드

## 1. Git 초기화

```bash
# Git 리포지토리 초기화
git init

# 현재 상태 확인
git status
```

## 2. 파일 추가 및 첫 커밋

```bash
# 모든 파일 스테이징
git add .

# 첫 번째 커밋
git commit -m "🎉 Initial commit: 가챠 무인 판매기 장치 등록 시스템

✨ Features:
- 3가지 백엔드 구현체 (Express, NestJS, 단일파일)
- 완전한 UI/UX (관리자 대시보드, 장치 등록 화면)
- 포괄적 테스트 시나리오 및 샘플 데이터
- 아키텍처 평가 및 비교 분석

🏗️ Architecture:
- gachaClaudeV2: Express.js 기반 엔터프라이즈급 구현 (45.29점)
- gachaGptV2: NestJS 기반 모던 프레임워크 구현 (34.10점)  
- gachaGeminiV2: 교육용 단일파일 구현 (35.58점)

🎨 UI/UX:
- dashboard.html: 관리자 대시보드 (승인/거부, 통계, 차트)
- device-registration.html: 3단계 장치 등록 화면
- 반응형 디자인 + Tailwind CSS + Chart.js

🧪 Testing:
- API 테스트 시나리오
- 샘플 데이터 (UI용, API용)
- 통합 테스트 실행기"
```

## 3. GitHub 리포지토리 연결

### 3-1. GitHub에서 새 리포지토리 생성
1. GitHub.com 접속
2. "New repository" 클릭
3. Repository name: `gacha-vending-machine-system`
4. Description: `TypeScript 기반 무인 자판기 장치 등록 및 관리 시스템`
5. Public/Private 선택
6. "Create repository" 클릭

### 3-2. 로컬과 원격 연결
```bash
# 원격 리포지토리 추가 (GitHub URL로 변경)
git remote add origin https://github.com/YOUR_USERNAME/gacha-vending-machine-system.git

# 기본 브랜치를 main으로 설정
git branch -M main

# 첫 푸시
git push -u origin main
```

## 4. 추가 브랜치 전략 (선택사항)

```bash
# 개발 브랜치 생성
git checkout -b develop

# 기능별 브랜치 생성 예시
git checkout -b feature/ui-improvements
git checkout -b feature/api-enhancements
git checkout -b feature/testing-improvements

# 브랜치 목록 확인
git branch -a
```

## 5. 일반적인 Git 워크플로우

```bash
# 변경사항 확인
git status
git diff

# 파일 추가
git add .
# 또는 특정 파일만
git add dashboard.html sample-data-ui.json

# 커밋 (의미있는 메시지 작성)
git commit -m "✨ Add new feature: 실시간 알림 시스템"

# 푸시
git push origin main
```

## 6. 커밋 메시지 컨벤션

```bash
# 새 기능
git commit -m "✨ feat: 새로운 장치 상태 모니터링 기능 추가"

# 버그 수정  
git commit -m "🐛 fix: 장치 등록 시 IP 검증 오류 수정"

# 문서 업데이트
git commit -m "📚 docs: README에 설치 가이드 추가"

# 스타일 변경
git commit -m "💄 style: 대시보드 UI 색상 테마 개선"

# 리팩토링
git commit -m "♻️ refactor: 장치 서비스 로직 모듈화"

# 테스트 추가
git commit -m "✅ test: 장치 승인 API 테스트 케이스 추가"

# 성능 개선
git commit -m "⚡ perf: 장치 목록 로딩 속도 최적화"
```

## 7. .gitignore 확인

현재 `.gitignore` 파일이 다음을 제외하도록 설정되어 있습니다:
- `node_modules/` - 의존성 패키지
- `*.log` - 로그 파일
- `.env*` - 환경 변수 파일
- `dist/`, `build/` - 빌드 결과물
- `.vscode/` - IDE 설정 (일부 제외)
- `*.zip` - 압축 파일

## 8. 리포지토리 구조 최종 확인

```
📦 gacha-vending-machine-system/
├── 📄 README.md                    # 프로젝트 메인 문서
├── 📄 README-UI.md                 # UI 실행 가이드  
├── 📄 package.json                 # 프로젝트 메타데이터
├── 📄 .gitignore                   # Git 제외 파일 목록
├── 🎨 dashboard.html               # 관리자 대시보드
├── 🎨 device-registration.html     # 장치 등록 화면
├── 📊 sample-data.json             # API 테스트용 데이터
├── 📊 sample-data-ui.json          # UI용 샘플 데이터
├── 🧪 test-gachaClaudeV2.ts       # Express 테스트
├── 🧪 test-gachaGptV2.ts          # NestJS 테스트  
├── 🧪 test-gachaGeminiV2.js       # 단일파일 테스트
├── 🧪 run-all-tests.js            # 통합 테스트 실행기
├── 🏗️ gachaClaudeV2/              # Express 구현체
├── 🏗️ gachaGptV2/                 # NestJS 구현체
└── 🏗️ gachaGeminiV2.ts            # 단일파일 구현체
```

## 9. 다음 단계 추천

1. **GitHub Pages 설정**: UI 데모를 온라인에서 볼 수 있도록
2. **GitHub Actions**: 자동 테스트 및 배포 설정
3. **Issues/Projects**: 기능 개선 및 버그 추적
4. **Wiki**: 상세한 기술 문서 작성
5. **Releases**: 버전별 릴리즈 노트 작성

---

이제 `git init` 부터 시작해서 GitHub에 푸시까지 완료하시면 됩니다! 🚀