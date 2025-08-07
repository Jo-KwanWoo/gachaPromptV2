// gachaClaudeV2 Express 시스템 테스트
import * as fs from 'fs';

// 샘플 데이터 로드
const sampleData = JSON.parse(fs.readFileSync('./sample-data.json', 'utf8'));

console.log('=== gachaClaudeV2 Express 시스템 테스트 ===\n');

// Mock 클래스들 (실제 구현 시뮬레이션)
class MockDeviceEntity {
  constructor(
    public hardwareId: string,
    public tenantId: string,
    public ipAddress: string,
    public systemInfo: any,
    public status: string = 'pending',
    public deviceId?: string,
    public sqsQueueUrl?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public rejectionReason?: string
  ) {}

  approve(deviceId: string, sqsQueueUrl: string): void {
    this.status = 'approved';
    this.deviceId = deviceId;
    this.sqsQueueUrl = sqsQueueUrl;
    this.updatedAt = new Date();
  }

  reject(reason: string): void {
    this.status = 'rejected';
    this.rejectionReason = reason;
    this.updatedAt = new Date();
  }

  isPending(): boolean { return this.status === 'pending'; }
  isApproved(): boolean { return this.status === 'approved'; }
  isRejected(): boolean { return this.status === 'rejected'; }
}

class MockDeviceValidator {
  static validateRegistration(data: any): { error?: string; value?: any } {
    if (!data.hardwareId || !data.tenantId || !data.ipAddress || !data.systemInfo) {
      return { error: 'Required fields are missing' };
    }
    return { value: data };
  }
}

class MockDeviceRegistrationService {
  private devices: MockDeviceEntity[] = [];

  constructor() {
    // 기존 장치 데이터 초기화
    this.devices = sampleData.existingDevices.map((d: any) => 
      new MockDeviceEntity(
        d.hardwareId,
        d.tenantId,
        d.ipAddress,
        d.systemInfo,
        d.status,
        d.deviceId,
        d.sqsQueueUrl,
        new Date(d.createdAt),
        new Date(d.updatedAt),
        d.rejectionReason
      )
    );
  }

  async registerDevice(request: any): Promise<{ success: boolean; message: string }> {
    console.log(`📝 장치 등록 요청: ${request.hardwareId}`);

    // 유효성 검사
    const validation = MockDeviceValidator.validateRegistration(request);
    if (validation.error) {
      return { success: false, message: validation.error };
    }

    // 중복 체크
    const existingDevice = this.devices.find(d => d.hardwareId === request.hardwareId);
    if (existingDevice) {
      if (existingDevice.isPending()) {
        return { success: false, message: 'Device registration is already pending approval' };
      }
      if (existingDevice.isApproved()) {
        return { success: false, message: 'Device is already registered and approved' };
      }
    }

    // 새 장치 생성
    const device = new MockDeviceEntity(
      request.hardwareId,
      request.tenantId,
      request.ipAddress,
      request.systemInfo
    );
    this.devices.push(device);

    return { success: true, message: 'Device registration request submitted successfully' };
  }

  async getDeviceStatus(hardwareId: string): Promise<{
    status: string;
    deviceId?: string;
    sqsQueueUrl?: string;
    message: string;
  }> {
    console.log(`🔍 장치 상태 조회: ${hardwareId}`);

    const device = this.devices.find(d => d.hardwareId === hardwareId);
    if (!device) {
      throw new Error('Device not found');
    }

    if (device.isApproved()) {
      return {
        status: 'approved',
        deviceId: device.deviceId,
        sqsQueueUrl: device.sqsQueueUrl,
        message: 'Device has been approved and is ready for operation'
      };
    }

    if (device.isRejected()) {
      return {
        status: 'rejected',
        message: `Device registration was rejected: ${device.rejectionReason}`
      };
    }

    return {
      status: 'pending',
      message: 'Device registration is pending approval'
    };
  }

  async approveDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    console.log(`✅ 장치 승인: ${deviceId}`);

    const device = this.devices.find(d => d.deviceId === deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    if (!device.isPending()) {
      return { success: false, message: 'Device is not in pending status' };
    }

    // 승인 처리
    const newDeviceId = `dev-${Date.now()}`;
    const sqsQueueUrl = `https://sqs.ap-northeast-2.amazonaws.com/queue/device-${newDeviceId}`;
    device.approve(newDeviceId, sqsQueueUrl);

    return { success: true, message: 'Device approved successfully' };
  }

  async rejectDevice(deviceId: string, reason: string): Promise<{ success: boolean; message: string }> {
    console.log(`❌ 장치 거부: ${deviceId}, 사유: ${reason}`);

    const device = this.devices.find(d => d.deviceId === deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    if (!device.isPending()) {
      return { success: false, message: 'Device is not in pending status' };
    }

    device.reject(reason);
    return { success: true, message: 'Device rejected successfully' };
  }

  async getPendingDevices(): Promise<MockDeviceEntity[]> {
    return this.devices.filter(d => d.isPending());
  }
}

// 테스트 실행
async function runTests() {
  const deviceService = new MockDeviceRegistrationService();

  console.log('🚀 Express API 테스트 시작\n');

  // 1. 장치 등록 테스트
  console.log('1️⃣ POST /api/devices/register');
  for (const request of sampleData.deviceRegistrationRequests.slice(0, 3)) {
    try {
      const result = await deviceService.registerDevice(request);
      console.log(`   ${request.hardwareId}: ${result.success ? '✅' : '❌'} ${result.message}`);
    } catch (error: any) {
      console.log(`   ${request.hardwareId}: ❌ ${error.message}`);
    }
  }

  // 2. 상태 조회 테스트
  console.log('\n2️⃣ GET /api/devices/status/:hardwareId');
  const testHardwareIds = ['VM101APPROVED01', 'VM102REJECTED01', 'VM103PENDING001'];
  
  for (const hardwareId of testHardwareIds) {
    try {
      const result = await deviceService.getDeviceStatus(hardwareId);
      console.log(`   ${hardwareId}: ${result.message}`);
      if (result.deviceId) {
        console.log(`     → 장치 ID: ${result.deviceId}`);
        console.log(`     → SQS URL: ${result.sqsQueueUrl?.substring(0, 50)}...`);
      }
    } catch (error: any) {
      console.log(`   ${hardwareId}: ❌ ${error.message}`);
    }
  }

  // 3. 대기중인 장치 목록
  console.log('\n3️⃣ GET /api/devices/pending');
  const pendingDevices = await deviceService.getPendingDevices();
  console.log(`   대기중인 장치: ${pendingDevices.length}개`);
  pendingDevices.forEach(device => {
    console.log(`   - ${device.hardwareId} (${device.createdAt.toISOString()})`);
  });

  // 4. 관리자 정보
  console.log('\n👥 관리자 계정 정보:');
  sampleData.adminUsers.forEach((user: any) => {
    console.log(`   ${user.username} (${user.role}): ${user.permissions.join(', ')}`);
  });

  // 5. 환경 변수
  console.log('\n⚙️ 환경 설정:');
  Object.entries(sampleData.environmentVariables).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('\n=== gachaClaudeV2 테스트 완료 ===');
}

// 테스트 실행
runTests().catch(console.error);