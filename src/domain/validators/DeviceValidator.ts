import Joi from 'joi';
import { SystemInfo } from '../Device';

export class DeviceValidator {
  private static readonly systemInfoSchema = Joi.object({
    os: Joi.string().required(),
    version: Joi.string().required(),
    architecture: Joi.string().required(),
    memory: Joi.string().required(),
    storage: Joi.string().required()
  });

  private static readonly deviceRegistrationSchema = Joi.object({
    hardwareId: Joi.string().alphanum().min(8).max(64).required(),
    tenantId: Joi.string().uuid().required(),
    ipAddress: Joi.string().ip().required(),
    systemInfo: this.systemInfoSchema.required()
  });

  private static readonly deviceApprovalSchema = Joi.object({
    deviceId: Joi.string().uuid().required()
  });

  private static readonly deviceRejectionSchema = Joi.object({
    deviceId: Joi.string().uuid().required(),
    reason: Joi.string().min(1).max(500).required()
  });

  static validateRegistration(data: any): { error?: string; value?: any } {
    const { error, value } = this.deviceRegistrationSchema.validate(data);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateApproval(data: any): { error?: string; value?: any } {
    const { error, value } = this.deviceApprovalSchema.validate(data);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateRejection(data: any): { error?: string; value?: any } {
    const { error, value } = this.deviceRejectionSchema.validate(data);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateHardwareId(hardwareId: string): boolean {
    const schema = Joi.string().alphanum().min(8).max(64);
    const { error } = schema.validate(hardwareId);
    return !error;
  }

  static validateSystemInfo(systemInfo: SystemInfo): boolean {
    const { error } = this.systemInfoSchema.validate(systemInfo);
    return !error;
  }
}