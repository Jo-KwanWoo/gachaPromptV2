import { DeviceRegistrationService } from '../service/DeviceRegistrationService';
import { DeviceEntity, DeviceStatus } from '../domain/Device';
import { IDeviceRepository } from '../interface/repositories/IDeviceRepository';
import { IMessageQueue } from '../interface/messaging/IMessageQueue';

// Mock implementations
class MockDeviceRepository implements IDeviceRepository {
  private devices: Map<string, DeviceEntity> = new Map();

  async save(device: DeviceEntity): Promise<void> {
    this.devices.set(device.hardwareId, device);
  }

  async findByHardwareId(hardwareId: string): Promise<DeviceEntity | null> {
    return this.devices.get(hardwareId) || null;
  }

  async findByDeviceId(deviceId: string): Promise<DeviceEntity | null> {
    for (const device of this.devices.values()) {
      if (device.deviceId === deviceId) {
        return device;
      }
    }
    return null;
  }

  async findPendingDevices(): Promise<DeviceEntity[]> {
    return Array.from(this.devices.values()).filter(d => d.isPending());
  }

  async update(device: DeviceEntity): Promise<void> {
    this.devices.set(device.hardwareId, device);
  }

  async delete(hardwareId: string): Promise<void> {
    this.devices.delete(hardwareId);
  }

  async exists(hardwareId: string): Promise<boolean> {
    return this.devices.has(hardwareId);
  }
}

class MockMessageQueue implements IMessageQueue {
  async createQueue(queueName: string): Promise<string> {
    return `https://sqs.us-east-1.amazonaws.com/123456789/${queueName}`;
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    // Mock implementation
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    // Mock implementation
  }
}

describe('DeviceRegistrationService', () => {
  let service: DeviceRegistrationService;
  let mockRepository: MockDeviceRepository;
  let mockMessageQueue: MockMessageQueue;

  beforeEach(() => {
    mockRepository = new MockDeviceRepository();
    mockMessageQueue = new MockMessageQueue();
    service = new DeviceRegistrationService(mockRepository, mockMessageQueue);
  });

  describe('registerDevice', () => {
    const validRequest = {
      hardwareId: 'VM-TEST123',
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      ipAddress: '192.168.1.100',
      systemInfo: {
        os: 'Linux 5.4.0',
        version: 'v16.14.0',
        architecture: 'x64',
        memory: '8GB',
        storage: '500GB SSD'
      }
    };

    it('should successfully register a new device', async () => {
      const result = await service.registerDevice(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device registration request submitted successfully');

      const savedDevice = await mockRepository.findByHardwareId(validRequest.hardwareId);
      expect(savedDevice).toBeTruthy();
      expect(savedDevice!.status).toBe(DeviceStatus.PENDING);
    });

    it('should reject registration with invalid hardware ID', async () => {
      const invalidRequest = { ...validRequest, hardwareId: 'abc' };
      const result = await service.registerDevice(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('hardwareId');
    });

    it('should reject duplicate registration for pending device', async () => {
      await service.registerDevice(validRequest);
      const result = await service.registerDevice(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Device registration is already pending approval');
    });

    it('should reject duplicate registration for approved device', async () => {
      await service.registerDevice(validRequest);
      const device = await mockRepository.findByHardwareId(validRequest.hardwareId);
      device!.approve('test-device-id', 'test-queue-url');
      await mockRepository.update(device!);

      const result = await service.registerDevice(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Device is already registered and approved');
    });
  });

  describe('getDeviceStatus', () => {
    it('should return pending status for pending device', async () => {
      const request = {
        hardwareId: 'VM-TEST123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        ipAddress: '192.168.1.100',
        systemInfo: {
          os: 'Linux 5.4.0',
          version: 'v16.14.0',
          architecture: 'x64',
          memory: '8GB',
          storage: '500GB SSD'
        }
      };

      await service.registerDevice(request);
      const status = await service.getDeviceStatus(request.hardwareId);

      expect(status.status).toBe('pending');
      expect(status.message).toBe('Device registration is pending approval');
    });

    it('should return approved status with device details', async () => {
      const request = {
        hardwareId: 'VM-TEST123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        ipAddress: '192.168.1.100',
        systemInfo: {
          os: 'Linux 5.4.0',
          version: 'v16.14.0',
          architecture: 'x64',
          memory: '8GB',
          storage: '500GB SSD'
        }
      };

      await service.registerDevice(request);
      const device = await mockRepository.findByHardwareId(request.hardwareId);
      device!.approve('test-device-id', 'test-queue-url');
      await mockRepository.update(device!);

      const status = await service.getDeviceStatus(request.hardwareId);

      expect(status.status).toBe('approved');
      expect(status.deviceId).toBe('test-device-id');
      expect(status.sqsQueueUrl).toBe('test-queue-url');
    });

    it('should throw error for non-existent device', async () => {
      await expect(service.getDeviceStatus('NON-EXISTENT'))
        .rejects.toThrow('Device not found');
    });

    it('should throw error for invalid hardware ID', async () => {
      await expect(service.getDeviceStatus('abc'))
        .rejects.toThrow('Invalid hardware ID format');
    });
  });

  describe('approveDevice', () => {
    it('should successfully approve a pending device', async () => {
      const request = {
        hardwareId: 'VM-TEST123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        ipAddress: '192.168.1.100',
        systemInfo: {
          os: 'Linux 5.4.0',
          version: 'v16.14.0',
          architecture: 'x64',
          memory: '8GB',
          storage: '500GB SSD'
        }
      };

      await service.registerDevice(request);
      const result = await service.approveDevice(request.hardwareId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device approved successfully');

      const device = await mockRepository.findByHardwareId(request.hardwareId);
      expect(device!.isApproved()).toBe(true);
      expect(device!.deviceId).toBeTruthy();
      expect(device!.sqsQueueUrl).toBeTruthy();
    });

    it('should fail to approve non-existent device', async () => {
      const result = await service.approveDevice('NON-EXISTENT');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Device not found');
    });
  });

  describe('rejectDevice', () => {
    it('should successfully reject a pending device', async () => {
      const request = {
        hardwareId: 'VM-TEST123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        ipAddress: '192.168.1.100',
        systemInfo: {
          os: 'Linux 5.4.0',
          version: 'v16.14.0',
          architecture: 'x64',
          memory: '8GB',
          storage: '500GB SSD'
        }
      };

      await service.registerDevice(request);
      const result = await service.rejectDevice(request.hardwareId, 'Test rejection reason');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device rejected successfully');

      const device = await mockRepository.findByHardwareId(request.hardwareId);
      expect(device!.isRejected()).toBe(true);
      expect(device!.rejectionReason).toBe('Test rejection reason');
    });
  });
});