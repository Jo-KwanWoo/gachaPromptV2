import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class DeviceValidator {
  private readonly registrationSchema = Joi.object({
    hardwareId: Joi.string().required().min(3).max(50),
    tenantId: Joi.string().uuid().required(),
    ipAddress: Joi.string().ip().required(),
    systemInfo: Joi.object({
      os: Joi.string().required(),
      version: Joi.string().required(),
      architecture: Joi.string().required(),
      memory: Joi.string().required(),
      storage: Joi.string().required(),
    }).required(),
  });

  validateRegistration(data: any): boolean {
    const { error } = this.registrationSchema.validate(data);
    return !error;
  }

  getValidationErrors(data: any): string[] {
    const { error } = this.registrationSchema.validate(data);
    return error ? error.details.map(detail => detail.message) : [];
  }
}