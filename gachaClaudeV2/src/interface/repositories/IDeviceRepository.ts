import { DeviceEntity } from '../../domain/Device';

export interface IDeviceRepository {
  save(device: DeviceEntity): Promise<void>;
  findByHardwareId(hardwareId: string): Promise<DeviceEntity | null>;
  findByDeviceId(deviceId: string): Promise<DeviceEntity | null>;
  findPendingDevices(): Promise<DeviceEntity[]>;
  update(device: DeviceEntity): Promise<void>;
  delete(hardwareId: string): Promise<void>;
  exists(hardwareId: string): Promise<boolean>;
}