import { v4 as uuidv4 } from 'uuid';
import { DeviceEntity, SystemInfo } from '../domain/Device';
import { DeviceValidator } from '../domain/validators/DeviceValidator';
import { IDeviceRepository } from '../interface/repositories/IDeviceRepository';
import { IMessageQueue } from '../interface/messaging/IMessageQueue';

export interface DeviceRegistrationRequest {
  hardwareId: string;
  tenantId: string;
  ipAddress: string;
  systemInfo: SystemInfo;
}

export class DeviceRegistrationService {
  constructor(
    private deviceRepository: IDeviceRepository,
    private messageQueue: IMessageQueue
  ) {}

  async registerDevice(request: DeviceRegistrationRequest): Promise<{ success: boolean; message: string }> {
    // Validate input
    const validation = DeviceValidator.validateRegistration(request);
    if (validation.error) {
      return { success: false, message: validation.error };
    }

    // Check for duplicate hardware ID
    const existingDevice = await this.deviceRepository.findByHardwareId(request.hardwareId);
    if (existingDevice) {
      if (existingDevice.isPending()) {
        return { success: false, message: 'Device registration is already pending approval' };
      }
      if (existingDevice.isApproved()) {
        return { success: false, message: 'Device is already registered and approved' };
      }
      // If rejected or expired, allow re-registration
      if (existingDevice.isRejected() || existingDevice.isExpired()) {
        await this.deviceRepository.delete(request.hardwareId);
      }
    }

    // Create new device entity
    const device = new DeviceEntity(
      request.hardwareId,
      request.tenantId,
      request.ipAddress,
      request.systemInfo
    );

    // Save to repository
    await this.deviceRepository.save(device);

    return { success: true, message: 'Device registration request submitted successfully' };
  }

  async getDeviceStatus(hardwareId: string): Promise<{
    status: string;
    deviceId?: string;
    sqsQueueUrl?: string;
    message: string;
  }> {
    if (!DeviceValidator.validateHardwareId(hardwareId)) {
      throw new Error('Invalid hardware ID format');
    }

    const device = await this.deviceRepository.findByHardwareId(hardwareId);
    if (!device) {
      throw new Error('Device not found');
    }

    // Check if device registration has expired
    if (device.isPending() && device.isExpired()) {
      await this.deviceRepository.delete(hardwareId);
      throw new Error('Device registration has expired. Please register again.');
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
    const device = await this.deviceRepository.findByDeviceId(deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    if (!device.isPending()) {
      return { success: false, message: 'Device is not in pending status' };
    }

    // Generate unique device ID and SQS queue
    const newDeviceId = uuidv4();
    const queueName = `device-${newDeviceId}`;
    const sqsQueueUrl = await this.messageQueue.createQueue(queueName);

    // Approve device
    device.approve(newDeviceId, sqsQueueUrl);
    await this.deviceRepository.update(device);

    return { success: true, message: 'Device approved successfully' };
  }

  async rejectDevice(deviceId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const device = await this.deviceRepository.findByDeviceId(deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    if (!device.isPending()) {
      return { success: false, message: 'Device is not in pending status' };
    }

    // Reject device
    device.reject(reason);
    await this.deviceRepository.update(device);

    return { success: true, message: 'Device rejected successfully' };
  }

  async getPendingDevices(): Promise<DeviceEntity[]> {
    return this.deviceRepository.findPendingDevices();
  }
}