import * as fs from 'fs';
import * as path from 'path';
import { DeviceRegistrationService } from '../../service/DeviceRegistrationService';
import { InMemoryDeviceRepository } from '../../interface/repositories/InMemoryDeviceRepository';
import { InMemoryMessageQueue } from '../../interface/messaging/InMemoryMessageQueue';
import { DataSeeder } from '../../scripts/seed-data';
import { logger } from '../../utils/logger';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

export class VendingMachineAPITest {
  private deviceService: DeviceRegistrationService;
  private deviceRepository: InMemoryDeviceRepository;
  private messageQueue: InMemoryMessageQueue;
  private dataSeeder: DataSeeder;
  private testResults: TestResult[] = [];

  constructor() {
    this.deviceRepository = new InMemoryDeviceRepository();
    this.messageQueue = new InMemoryMessageQueue();
    this.deviceService = new DeviceRegistrationService(
      this.deviceRepository,
      this.messageQueue
    );
    this.dataSeeder = new DataSeeder(this.deviceRepository);
  }

  private addTestResult(testName: string, success: boolean, message: string, details?: any): void {
    this.testResults.push({ testName, success, message, details });
    const status = success ? '✅' : '❌';
    logger.info(`${status} ${testName}: ${message}`);
    if (details) {
      logger.debug('세부사항:', details);
    }
  }

  async setupTestData(): Promise<void> {
    logger.info('🚀 테스트 데이터 설정 중...');
    await this.dataSeeder.clearData();
    await this.dataSeeder.seedDevices();
  }

  async testDeviceRegistration(): Promise<void> {
    logger.info('\n1️⃣ 장치 등록 테스트');

    const sampleData = this.dataSeeder.getSampleData();
    
    // 정상적인 등록 테스트
    const validRequest = sampleData.testScenarios.validRegistration.request;
    try {
      const result = await this.deviceService.registerDevice(validRequest);
      this.addTestResult(
        '정상 장치 등록',
        result.success,
        result.message,
        { hardwareId: validRequest.hardwareId }
      );
    } catch (error: any) {
      this.addTestResult('정상 장치 등록', false, error.message);
    }

    // 잘못된 등록 테스트
    const invalidRequest = sampleData.testScenarios.invalidRegistration.request;
    try {
      const result = await this.deviceService.registerDevice(invalidRequest);
      this.addTestResult(
        '잘못된 등록 요청',
        !result.success, // 실패해야 성공
        result.success ? '예상과 다르게 성공함' : '예상대로 실패함'
      );
    } catch (error: any) {
      this.addTestResult('잘못된 등록 요청', true, '예상대로 실패함');
    }

    // 중복 등록 테스트
    const existingDevice = sampleData.existingDevices[0];
    try {
      const result = await this.deviceService.registerDevice({
        hardwareId: existingDevice.hardwareId,
        tenantId: existingDevice.tenantId,
        ipAddress: existingDevice.ipAddress,
        systemInfo: existingDevice.systemInfo
      });
      this.addTestResult(
        '중복 장치 등록',
        !result.success, // 실패해야 성공
        result.success ? '예상과 다르게 성공함' : '예상대로 실패함'
      );
    } catch (error: any) {
      this.addTestResult('중복 장치 등록', true, '예상대로 실패함');
    }
  }

  async testDeviceStatusCheck(): Promise<void> {
    logger.info('\n2️⃣ 장치 상태 조회 테스트');

    const sampleData = this.dataSeeder.getSampleData();

    // 승인된 장치 상태 조회
    const approvedDevice = sampleData.existingDevices.find((d: any) => d.status === 'approved');
    if (approvedDevice) {
      try {
        const result = await this.deviceService.getDeviceStatus(approvedDevice.hardwareId);
        this.addTestResult(
          '승인된 장치 상태 조회',
          result.status === 'approved',
          result.message,
          { deviceId: result.deviceId, sqsQueueUrl: result.sqsQueueUrl }
        );
      } catch (error: any) {
        this.addTestResult('승인된 장치 상태 조회', false, error.message);
      }
    }

    // 대기중인 장치 상태 조회
    const pendingDevice = sampleData.existingDevices.find((d: any) => d.status === 'pending');
    if (pendingDevice) {
      try {
        const result = await this.deviceService.getDeviceStatus(pendingDevice.hardwareId);
        this.addTestResult(
          '대기중인 장치 상태 조회',
          result.status === 'pending',
          result.message
        );
      } catch (error: any) {
        this.addTestResult('대기중인 장치 상태 조회', false, error.message);
      }
    }

    // 존재하지 않는 장치 조회
    try {
      await this.deviceService.getDeviceStatus('NONEXISTENT001');
      this.addTestResult('존재하지 않는 장치 조회', false, '예상과 다르게 성공함');
    } catch (error: any) {
      this.addTestResult('존재하지 않는 장치 조회', true, '예상대로 실패함');
    }
  }

  async testDeviceApproval(): Promise<void> {
    logger.info('\n3️⃣ 장치 승인/거부 테스트');

    // 대기중인 장치 찾기
    const pendingDevices = await this.deviceService.getPendingDevices();
    
    if (pendingDevices.length > 0) {
      const deviceToApprove = pendingDevices[0];
      
      // 장치 승인 테스트
      try {
        const result = await this.deviceService.approveDevice(deviceToApprove.hardwareId);
        this.addTestResult(
          '장치 승인',
          result.success,
          result.message,
          { hardwareId: deviceToApprove.hardwareId }
        );
      } catch (error: any) {
        this.addTestResult('장치 승인', false, error.message);
      }
    }

    if (pendingDevices.length > 1) {
      const deviceToReject = pendingDevices[1];
      
      // 장치 거부 테스트
      try {
        const result = await this.deviceService.rejectDevice(
          deviceToReject.hardwareId,
          '테스트용 거부 사유'
        );
        this.addTestResult(
          '장치 거부',
          result.success,
          result.message,
          { hardwareId: deviceToReject.hardwareId }
        );
      } catch (error: any) {
        this.addTestResult('장치 거부', false, error.message);
      }
    }
  }

  async testPendingDevicesList(): Promise<void> {
    logger.info('\n4️⃣ 대기중인 장치 목록 테스트');

    try {
      const pendingDevices = await this.deviceService.getPendingDevices();
      this.addTestResult(
        '대기중인 장치 목록 조회',
        true,
        `${pendingDevices.length}개의 대기중인 장치 발견`,
        { 
          count: pendingDevices.length,
          devices: pendingDevices.map(d => d.hardwareId)
        }
      );
    } catch (error: any) {
      this.addTestResult('대기중인 장치 목록 조회', false, error.message);
    }
  }

  async runAllTests(): Promise<void> {
    logger.info('=== 무인 자판기 시스템 통합 테스트 시작 ===\n');

    try {
      await this.setupTestData();
      await this.testDeviceRegistration();
      await this.testDeviceStatusCheck();
      await this.testDeviceApproval();
      await this.testPendingDevicesList();

      this.printTestSummary();
    } catch (error) {
      logger.error('테스트 실행 중 오류 발생:', error);
    }
  }

  private printTestSummary(): void {
    logger.info('\n=== 테스트 결과 요약 ===');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    logger.info(`총 테스트: ${totalTests}`);
    logger.info(`성공: ${passedTests} ✅`);
    logger.info(`실패: ${failedTests} ❌`);
    logger.info(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      logger.info('\n실패한 테스트:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => logger.info(`  - ${r.testName}: ${r.message}`));
    }

    logger.info('\n=== 테스트 완료 ===');
  }

  getTestResults(): TestResult[] {
    return this.testResults;
  }
}

// CLI에서 직접 실행
if (require.main === module) {
  const apiTest = new VendingMachineAPITest();
  apiTest.runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('테스트 실행 실패:', error);
      process.exit(1);
    });
}