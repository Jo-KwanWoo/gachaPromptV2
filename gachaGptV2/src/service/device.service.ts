import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DeviceRepository } from '../interface/dynamo.repository';
import { SqsService } from '../interface/sqs.service';
import { DeviceValidator } from '../domain/device.validator';
import { DeviceStatus } from '../domain/device-status.enum';
import { v4 as uuidv4 } from 'uuid';

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

    const deviceId = `dev-${uuidv4()}`;
    await this.repository.save({
      deviceId,
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
      data: {
        deviceId,
        hardwareId
      },
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
      data: {
        status: device.status
      },
    };
  }

  async getPendingDevices() {
    const devices = await this.repository.findByStatus(DeviceStatus.PENDING);
    return {
      status: 'success',
      message: '대기 중인 장치 목록',
      data: devices,
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

  async getDashboardStats() {
    const allDevices = await this.repository.findAll();
    const stats = {
      totalDevices: allDevices.length,
      pendingDevices: allDevices.filter(d => d.status === DeviceStatus.PENDING).length,
      approvedDevices: allDevices.filter(d => d.status === DeviceStatus.APPROVED).length,
      rejectedDevices: allDevices.filter(d => d.status === DeviceStatus.REJECTED).length,
      todayRegistrations: allDevices.filter(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.createdAt.startsWith(today);
      }).length
    };

    return {
      status: 'success',
      message: '대시보드 통계 조회 완료',
      data: stats,
    };
  }

  async getRecentActivities() {
    const activities = [
      {
        id: 'activity-001',
        type: 'registration',
        message: '새로운 장치 등록 요청: VM005GWANGJU24',
        timestamp: new Date().toISOString(),
        severity: 'info'
      },
      {
        id: 'activity-002',
        type: 'approval',
        message: '장치 승인 완료: VM101APPROVED01',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: 'success'
      }
    ];

    return {
      status: 'success',
      message: '최근 활동 조회 완료',
      data: activities,
    };
  }
}