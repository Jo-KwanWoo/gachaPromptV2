export interface Device {
  deviceId?: string;
  hardwareId: string;
  tenantId: string;
  ipAddress: string;
  systemInfo: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  sqsQueueUrl?: string;
  rejectionReason?: string;
}