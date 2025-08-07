import { Injectable } from '@nestjs/common';
import { Device } from '../domain/device.entity';
import { DeviceStatus } from '../domain/device-status.enum';

// Mock 데이터 (실제 환경에서는 AWS DynamoDB 연동)
const mockDevices: Device[] = [
  // 승인된 장치들
  {
    deviceId: 'dev-550e8400-e29b-41d4-a716-446655440101',
    hardwareId: 'VM101APPROVED01',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    ipAddress: '192.168.1.201',
    systemInfo: {
      os: 'Ubuntu',
      version: '22.04.3 LTS',
      architecture: 'x86_64',
      memory: '8GB',
      storage: '256GB SSD'
    },
    status: 'approved',
    createdAt: '2024-01-15T10:15:00Z',
    sqsQueueUrl: 'https://sqs.ap-northeast-2.amazonaws.com/123456789012/device-queue-001'
  },
  {
    deviceId: 'dev-550e8400-e29b-41d4-a716-446655440102',
    hardwareId: 'VM102APPROVED02',
    tenantId: '550e8400-e29b-41d4-a716-446655440002',
    ipAddress: '192.168.1.202',
    systemInfo: {
      os: 'CentOS',
      version: '8.5',
      architecture: 'x86_64',
      memory: '16GB',
      storage: '512GB SSD'
    },
    status: 'approved',
    createdAt: '2024-01-14T15:30:00Z',
    sqsQueueUrl: 'https://sqs.ap-northeast-2.amazonaws.com/123456789012/device-queue-002'
  },
  // 대기 중인 장치들
  {
    deviceId: 'pending-001',
    hardwareId: 'VM001SEOUL2024',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    ipAddress: '192.168.1.101',
    systemInfo: {
      os: 'Ubuntu',
      version: '22.04.3 LTS',
      architecture: 'x86_64',
      memory: '8GB',
      storage: '256GB SSD'
    },
    status: 'pending',
    createdAt: '2024-01-16T09:30:00Z'
  },
  {
    deviceId: 'pending-002',
    hardwareId: 'VM002BUSAN2024',
    tenantId: '550e8400-e29b-41d4-a716-446655440002',
    ipAddress: '192.168.1.102',
    systemInfo: {
      os: 'CentOS',
      version: '8.5',
      architecture: 'x86_64',
      memory: '16GB',
      storage: '512GB SSD'
    },
    status: 'pending',
    createdAt: '2024-01-16T11:15:00Z'
  },
  {
    deviceId: 'pending-003',
    hardwareId: 'VM003DAEGU2024',
    tenantId: '550e8400-e29b-41d4-a716-446655440003',
    ipAddress: '10.0.0.15',
    systemInfo: {
      os: 'Windows',
      version: '11 Pro',
      architecture: 'x64',
      memory: '32GB',
      storage: '1TB NVMe'
    },
    status: 'pending',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    deviceId: 'pending-004',
    hardwareId: 'VM004INCHEON24',
    tenantId: '550e8400-e29b-41d4-a716-446655440004',
    ipAddress: '172.16.0.50',
    systemInfo: {
      os: 'Raspberry Pi OS',
      version: '11',
      architecture: 'armv7l',
      memory: '4GB',
      storage: '64GB microSD'
    },
    status: 'pending',
    createdAt: '2024-01-16T16:45:00Z'
  },
  {
    deviceId: 'pending-005',
    hardwareId: 'VM005GWANGJU24',
    tenantId: '550e8400-e29b-41d4-a716-446655440005',
    ipAddress: '203.252.33.100',
    systemInfo: {
      os: 'Ubuntu',
      version: '20.04.6 LTS',
      architecture: 'aarch64',
      memory: '8GB',
      storage: '128GB eMMC'
    },
    status: 'pending',
    createdAt: '2024-01-16T18:10:00Z'
  },
  // 거부된 장치들
  {
    deviceId: 'rejected-001',
    hardwareId: 'VM201REJECTED01',
    tenantId: '550e8400-e29b-41d4-a716-446655440201',
    ipAddress: '10.1.1.100',
    systemInfo: {
      os: 'Ubuntu',
      version: '18.04',
      architecture: 'x86_64',
      memory: '2GB',
      storage: '64GB HDD'
    },
    status: 'rejected',
    createdAt: '2024-01-14T16:45:00Z',
    rejectionReason: '하드웨어 사양이 최소 요구사항을 충족하지 않음 (메모리 부족: 2GB < 4GB)'
  },
  {
    deviceId: 'rejected-002',
    hardwareId: 'VM202REJECTED02',
    tenantId: '550e8400-e29b-41d4-a716-446655440202',
    ipAddress: '172.20.0.50',
    systemInfo: {
      os: 'CentOS',
      version: '7.9',
      architecture: 'x86_64',
      memory: '8GB',
      storage: '256GB SSD'
    },
    status: 'rejected',
    createdAt: '2024-01-13T11:20:00Z',
    rejectionReason: '보안 정책 위반: 승인되지 않은 네트워크 포트 개방 감지'
  }
];

@Injectable()
export class DeviceRepository {
  async findByHardwareId(hardwareId: string): Promise<Device | null> {
    console.log(`🔍 DynamoDB 조회: ${hardwareId}`);
    return mockDevices.find(device => device.hardwareId === hardwareId) || null;
  }

  async findByStatus(status: DeviceStatus): Promise<Device[]> {
    console.log(`📋 상태별 조회: ${status}`);
    return mockDevices.filter(device => device.status === status);
  }

  async findAll(): Promise<Device[]> {
    console.log(`📊 전체 장치 조회`);
    return mockDevices;
  }

  async save(device: Device): Promise<void> {
    console.log(`💾 DynamoDB 저장: ${device.hardwareId}`);
    mockDevices.push(device);
  }

  async updateStatus(
    deviceId: string,
    status: DeviceStatus,
    sqsQueueUrl?: string,
    reason?: string,
  ): Promise<Device> {
    console.log(`🔄 상태 업데이트: ${deviceId} -> ${status}`);
    
    const device = mockDevices.find(d => d.deviceId === deviceId);
    if (device) {
      device.status = status;
      if (sqsQueueUrl) device.sqsQueueUrl = sqsQueueUrl;
      if (reason) device.rejectionReason = reason;
      return device;
    }

    // 새 장치 생성 (테스트용)
    const newDevice: Device = {
      deviceId,
      hardwareId: `HW-${deviceId}`,
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      ipAddress: '192.168.1.100',
      systemInfo: {},
      status,
      createdAt: new Date().toISOString(),
      sqsQueueUrl,
      rejectionReason: reason,
    };
    
    mockDevices.push(newDevice);
    return newDevice;
  }
}