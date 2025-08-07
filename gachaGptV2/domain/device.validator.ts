import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceValidator {
  validateRegistration(data: any): boolean {
    return data.hardwareId && data.tenantId && data.ipAddress && data.systemInfo;
  }
}