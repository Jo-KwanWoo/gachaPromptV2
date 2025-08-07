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
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}