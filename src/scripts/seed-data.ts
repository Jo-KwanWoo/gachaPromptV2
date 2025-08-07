import * as fs from 'fs';
import * as path from 'path';
import { DeviceEntity, DeviceStatus } from '../domain/Device';
import { InMemoryDeviceRepository } from '../interface/repositories/InMemoryDeviceRepository';
import { logger } from '../utils/logger';

interface SampleData {
  deviceRegistrationRequests: any[];
  existingDevices: any[];
  adminUsers: any[];
  testScenarios: any;
}

export class DataSeeder {
  private deviceRepository: InMemoryDeviceRepository;
  private sampleData: SampleData;

  constructor(deviceRepository: InMemoryDeviceRepository) {
    this.deviceRepository = deviceRepository;
    
    // 샘플 데이터 로드
    const dataPath = path.join(__dirname, '../data/sample-data.json');
    this.sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  async seedDevices(): Promise<void> {
    logger.info('🌱 샘플 장치 데이터 시딩 시작...');

    // 기존 장치 데이터 추가
    for (const deviceData of this.sampleData.existingDevices) {
      const device = new DeviceEntity(
        deviceData.hardwareId,
        deviceData.tenantId,
        deviceData.ipAddress,
        deviceData.systemInfo,
        deviceData.status as DeviceStatus,
        deviceData.deviceId,
        deviceData.sqsQueueUrl,
        new Date(deviceData.createdAt),
        new Date(deviceData.updatedAt),
        deviceData.rejectionReason
      );

      await this.deviceRepository.save(device);
      logger.info(`✅ 장치 추가됨: ${device.hardwareId} (${device.status})`);
    }

    // 새로운 등록 요청 데이터 추가 (pending 상태로)
    for (const requestData of this.sampleData.deviceRegistrationRequests) {
      const device = new DeviceEntity(
        requestData.hardwareId,
        requestData.tenantId,
        requestData.ipAddress,
        requestData.systemInfo,
        DeviceStatus.PENDING
      );

      await this.deviceRepository.save(device);
      logger.info(`📝 등록 요청 추가됨: ${device.hardwareId}`);
    }

    const totalDevices = this.deviceRepository.size();
    logger.info(`🎉 총 ${totalDevices}개의 샘플 장치 데이터가 추가되었습니다.`);
  }

  async clearData(): Promise<void> {
    logger.info('🧹 기존 데이터 정리 중...');
    this.deviceRepository.clear();
    logger.info('✅ 데이터 정리 완료');
  }

  getSampleData(): SampleData {
    return this.sampleData;
  }

  getAdminUsers() {
    return this.sampleData.adminUsers;
  }

  getTestScenarios() {
    return this.sampleData.testScenarios;
  }
}

// CLI에서 직접 실행할 수 있도록
if (require.main === module) {
  const repository = new InMemoryDeviceRepository();
  const seeder = new DataSeeder(repository);

  const command = process.argv[2];

  switch (command) {
    case 'seed':
      seeder.seedDevices()
        .then(() => {
          console.log('샘플 데이터 시딩 완료');
          process.exit(0);
        })
        .catch((error) => {
          console.error('시딩 실패:', error);
          process.exit(1);
        });
      break;

    case 'clear':
      seeder.clearData()
        .then(() => {
          console.log('데이터 정리 완료');
          process.exit(0);
        })
        .catch((error) => {
          console.error('정리 실패:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('사용법: ts-node seed-data.ts [seed|clear]');
      process.exit(1);
  }
}