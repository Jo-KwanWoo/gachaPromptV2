export enum DeviceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface SystemInfo {
  os: string;
  version: string;
  architecture: string;
  memory: string;
  storage: string;
}

export interface Device {
  hardwareId: string;
  tenantId: string;
  ipAddress: string;
  systemInfo: SystemInfo;
  status: DeviceStatus;
  deviceId?: string;
  sqsQueueUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}

export class DeviceEntity {
  constructor(
    public readonly hardwareId: string,
    public readonly tenantId: string,
    public readonly ipAddress: string,
    public readonly systemInfo: SystemInfo,
    public status: DeviceStatus = DeviceStatus.PENDING,
    public deviceId?: string,
    public sqsQueueUrl?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public rejectionReason?: string
  ) {}

  approve(deviceId: string, sqsQueueUrl: string): void {
    this.status = DeviceStatus.APPROVED;
    this.deviceId = deviceId;
    this.sqsQueueUrl = sqsQueueUrl;
    this.updatedAt = new Date();
  }

  reject(reason: string): void {
    this.status = DeviceStatus.REJECTED;
    this.rejectionReason = reason;
    this.updatedAt = new Date();
  }

  isPending(): boolean {
    return this.status === DeviceStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === DeviceStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === DeviceStatus.REJECTED;
  }

  isExpired(): boolean {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.createdAt < twentyFourHoursAgo;
  }

  toJSON(): Device {
    return {
      hardwareId: this.hardwareId,
      tenantId: this.tenantId,
      ipAddress: this.ipAddress,
      systemInfo: this.systemInfo,
      status: this.status,
      deviceId: this.deviceId,
      sqsQueueUrl: this.sqsQueueUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      rejectionReason: this.rejectionReason
    };
  }
}