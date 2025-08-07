// gachaGptV2 NestJS 시스템 테스트
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

// 샘플 데이터 타입 정의
interface SampleData {
  deviceRegistrationRequests: any[];
  existingDevices: any[];
  adminUsers: any[];
  testScenarios: any;
  jwtTokens: any;
}

// 샘플 데이터 로드
const sampleData: SampleData = JSON.parse(fs.readFileSync('./sample-data.json', 'utf8'));

// JWT 토큰 생성
const generateTestToken = () => {
  return jwt.sign(
    { userId: 'admin-001', role: 'admin' },
    'gacha-secret-key-2024',
    { expiresIn: '1h' }
  );
};

console.log('=== gachaGptV2 NestJS 시스템 테스트 ===\n');

// Mock DeviceService 클래스 (실제 구현 시뮬레이션)
class MockDeviceService {
  private devices = sampleData.existingDevices;

  async registerDevice(data: any) {
    console.log(`📝 장치 등록 요청: ${data.hardwareId}`);
    
    // 중복 체크
    const existing = this.devices.find(d => d.hardwareId === data.hardwareId);
    if (existing && existing.status !== 'rejected') {
      return {
        status: 'error',
        message: '중복 등록 요청',
        data: {}
      };
    }

    return {
      status: 'success',
      message: '등록 요청 완료',
      data: {}
    };
  }

  async getDeviceStatus(hardwareId: string) {
    console.log(`🔍 장치 상태 조회: ${hardwareId}`);
    
    const device = this.devices.find(d => d.hardwareId === hardwareId);
    if (!device) {
      return {
        status: 'error',
        message: '장치 없음',
        data: {}
      };
    }

    if (device.status === 'approved') {
      return {
        status: 'success',
        message: '장치 승인됨',
        data: {
          deviceId: device.deviceId,
          sqsQueueUrl: device.sqsQueueUrl
        }
      };
    }

    return {
      status: 'success',
      message: '승인 대기 중',
      data: {}
    };
  }

  async approveDevice(deviceId: string) {
    console.log(`✅ 장치 승인: ${deviceId}`);
    return {
      status: 'success',
      message: '장치 승인 완료',
      data: {
        deviceId,
        sqsQueueUrl: `https://sqs.ap-northeast-2.amazonaws.com/queue/${deviceId}`
      }
    };
  }

  async rejectDevice(deviceId: string, reason: string) {
    console.log(`❌ 장치 거부: ${deviceId}, 사유: ${reason}`);
    return {
      status: 'success',
      message: '장치 거부 완료',
      data: {}
    };
  }
}

// 테스트 실행
async function runTests() {
  const deviceService = new MockDeviceService();

  console.log('🚀 API 엔드포인트 테스트 시작\n');

  // 1. 장치 등록 테스트
  console.log('1️⃣ POST /api/devices/register');
  for (const request of sampleData.deviceRegistrationRequests.slice(0, 3)) {
    const result = await deviceService.registerDevice(request);
    console.log(`   ${request.hardwareId}: ${result.message}`);
  }

  console.log('\n2️⃣ GET /api/devices/status/:hardwareId');
  // 2. 상태 조회 테스트
  const testHardwareIds = [
    'VM101APPROVED01',
    'VM103PENDING001', 
    'NONEXISTENT001'
  ];

  for (const hardwareId of testHardwareIds) {
    const result = await deviceService.getDeviceStatus(hardwareId);
    console.log(`   ${hardwareId}: ${result.message}`);
    if (result.data.deviceId) {
      console.log(`     → 장치 ID: ${result.data.deviceId}`);
    }
  }

  console.log('\n3️⃣ PUT /api/devices/:deviceId/approve');
  // 3. 승인 테스트
  const approveResult = await deviceService.approveDevice('dev-test-001');
  console.log(`   승인 결과: ${approveResult.message}`);

  console.log('\n4️⃣ PUT /api/devices/:deviceId/reject');
  // 4. 거부 테스트
  const rejectResult = await deviceService.rejectDevice('dev-test-002', '보안 정책 위반');
  console.log(`   거부 결과: ${rejectResult.message}`);

  // 5. JWT 토큰 정보
  console.log('\n🔐 JWT 토큰 샘플:');
  const testToken = generateTestToken();
  console.log(`   테스트 토큰: ${testToken.substring(0, 50)}...`);
  console.log(`   샘플 관리자 토큰: ${sampleData.jwtTokens.validAdminToken.substring(0, 50)}...`);

  // 6. NestJS 특징 설명
  console.log('\n🏗️ NestJS 아키텍처 특징:');
  console.log('   ✅ 데코레이터 기반 컨트롤러');
  console.log('   ✅ 의존성 주입 (DI) 패턴');
  console.log('   ✅ 가드 기반 인증/인가');
  console.log('   ✅ Joi 스키마 검증');
  console.log('   ✅ 모듈화된 구조');

  console.log('\n📊 실행 명령어:');
  console.log('   개발 서버: cd gachaGptV2 && npm run start:dev');
  console.log('   E2E 테스트: cd gachaGptV2 && npm run test:e2e');
  console.log('   빌드: cd gachaGptV2 && npm run build');

  console.log('\n=== gachaGptV2 테스트 완료 ===');
}

// 테스트 실행
runTests().catch(console.error);