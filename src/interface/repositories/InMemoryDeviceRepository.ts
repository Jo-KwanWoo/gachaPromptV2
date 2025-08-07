import { DeviceEntity, DeviceStatus } from '../../domain/Device';
import { IDeviceRepository } from './IDeviceRepository';

/**
 * In-memory implementation of device repository for testing and development
 */
export class InMemoryDeviceRepository implements IDeviceRepository {
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
    return Array.from(this.devices.values()).filter(device => 
      device.status === DeviceStatus.PENDING
    );
  }

  async update(device: DeviceEntity): Promise<void> {
    if (this.devices.has(device.hardwareId)) {
      this.devices.set(device.hardwareId, device);
    } else {
      throw new Error(`Device with hardware ID ${device.hardwareId} not found`);
    }
  }

  async delete(hardwareId: string): Promise<void> {
    this.devices.delete(hardwareId);
  }

  async exists(hardwareId: string): Promise<boolean> {
    return this.devices.has(hardwareId);
  }

  // Additional methods for testing
  clear(): void {
    this.devices.clear();
  }

  size(): number {
    return this.devices.size;
  }

  getAllDevices(): DeviceEntity[] {
    return Array.from(this.devices.values());
  }
}