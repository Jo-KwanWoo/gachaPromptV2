import { Request, Response, NextFunction } from 'express';
import { DeviceValidator } from '../domain/validators/DeviceValidator';

export const validateDeviceRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validation = DeviceValidator.validateRegistration(req.body);
  
  if (validation.error) {
    return res.status(400).json({
      status: 'error',
      message: validation.error
    });
  }

  req.body = validation.value;
  next();
};

export const validateDeviceApproval = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validation = DeviceValidator.validateApproval(req.params);
  
  if (validation.error) {
    return res.status(400).json({
      status: 'error',
      message: validation.error
    });
  }

  next();
};

export const validateDeviceRejection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const deviceId = req.params.deviceId;
  const reason = req.body.reason;
  
  const validation = DeviceValidator.validateRejection({ deviceId, reason });
  
  if (validation.error) {
    return res.status(400).json({
      status: 'error',
      message: validation.error
    });
  }

  next();
};