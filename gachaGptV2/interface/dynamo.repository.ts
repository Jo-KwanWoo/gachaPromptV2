import { Injectable } from '@nestjs/common';
import { Device } from '../domain/device.entity';
import { DeviceStatus } from '../domain/device-status.enum';

@Injectable()
export class DeviceRepository {
  async findByHardwareId(hardwareId: string): Promise<Device | null> {
    // AWS DynamoDB 조회 로직
    return null;
  }

  async save(device: Device): Promise<void> {
    // AWS DynamoDB 저장 로직
  }

  async updateStatus(
    deviceId: string,
    status: DeviceStatus,
    sqsQueueUrl?: string,
    reason?: string,
  ): Promise<Device> {
    // 상태 업데이트 로직
    return {
      deviceId,
      hardwareId: '',
      tenantId: '',
      ipAddress: '',
      systemInfo: {},
      status,
      createdAt: new Date().toISOString(),
      sqsQueueUrl,
      rejectionReason: reason,
    };
  }
}