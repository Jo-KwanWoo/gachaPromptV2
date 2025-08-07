import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DeviceRepository } from '../interface/dynamo.repository';
import { SqsService } from '../interface/sqs.service';
import { DeviceValidator } from '../domain/device.validator';
import { DeviceStatus } from '../domain/device-status.enum';

@Injectable()
export class DeviceService {
  constructor(
    private readonly repository: DeviceRepository,
    private readonly sqsService: SqsService,
    private readonly validator: DeviceValidator,
  ) {}

  async registerDevice(data: any) {
    const { hardwareId, tenantId, ipAddress, systemInfo } = data;

    if (!this.validator.validateRegistration(data)) {
      throw new HttpException({
        status: 'error',
        message: '입력값 오류',
      }, HttpStatus.BAD_REQUEST);
    }

    const existing = await this.repository.findByHardwareId(hardwareId);
    if (existing && existing.status !== DeviceStatus.REJECTED) {
      throw new HttpException({
        status: 'error',
        message: '중복 등록 요청',
      }, HttpStatus.CONFLICT);
    }

    await this.repository.save({
      hardwareId,
      tenantId,
      ipAddress,
      systemInfo,
      status: DeviceStatus.PENDING,
      createdAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: '등록 요청 완료',
      data: {},
    };
  }

  async getDeviceStatus(hardwareId: string) {
    const device = await this.repository.findByHardwareId(hardwareId);
    if (!device) {
      throw new HttpException({
        status: 'error',
        message: '장치 없음',
      }, HttpStatus.NOT_FOUND);
    }

    if (device.status === DeviceStatus.APPROVED) {
      return {
        status: 'success',
        message: '장치 승인됨',
        data: {
          deviceId: device.deviceId,
          sqsQueueUrl: device.sqsQueueUrl,
        },
      };
    }

    return {
      status: 'success',
      message: '승인 대기 중',
      data: {},
    };
  }

  async approveDevice(deviceId: string) {
    const sqsQueueUrl = await this.sqsService.createQueue(deviceId);
    const updated = await this.repository.updateStatus(deviceId, DeviceStatus.APPROVED, sqsQueueUrl);

    return {
      status: 'success',
      message: '장치 승인 완료',
      data: {
        deviceId: updated.deviceId,
        sqsQueueUrl,
      },
    };
  }

  async rejectDevice(deviceId: string, reason: string) {
    await this.repository.updateStatus(deviceId, DeviceStatus.REJECTED, undefined, reason);

    return {
      status: 'success',
      message: '장치 거부 완료',
      data: {},
    };
  }
}