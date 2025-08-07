import { Request, Response } from 'express';
import { DeviceRegistrationService } from '../service/DeviceRegistrationService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class DeviceController {
  constructor(private deviceService: DeviceRegistrationService) {}

  async registerDevice(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.deviceService.registerDevice(req.body);
      
      if (result.success) {
        res.status(201).json({
          status: 'success',
          message: result.message
        });
      } else {
        res.status(409).json({
          status: 'error',
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to register device'
      });
    }
  }

  async getDeviceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { hardwareId } = req.params;
      const status = await this.deviceService.getDeviceStatus(hardwareId);
      
      res.status(200).json({
        status: 'success',
        message: status.message,
        data: {
          status: status.status,
          deviceId: status.deviceId,
          sqsQueueUrl: status.sqsQueueUrl
        }
      });
    } catch (error: any) {
      const statusCode = error.message?.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        status: 'error',
        message: error.message || 'An error occurred'
      });
    }
  }

  async getPendingDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const devices = await this.deviceService.getPendingDevices();
      
      res.status(200).json({
        status: 'success',
        message: 'Pending devices retrieved successfully',
        data: {
          devices: devices.map(device => device.toJSON())
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve pending devices'
      });
    }
  }

  async approveDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hardwareId } = req.params;
      const result = await this.deviceService.approveDevice(hardwareId);
      
      if (result.success) {
        res.status(200).json({
          status: 'success',
          message: result.message
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          status: 'error',
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to approve device'
      });
    }
  }

  async rejectDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hardwareId } = req.params;
      const { reason } = req.body;
      const result = await this.deviceService.rejectDevice(hardwareId, reason);
      
      if (result.success) {
        res.status(200).json({
          status: 'success',
          message: result.message
        });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          status: 'error',
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to reject device'
      });
    }
  }
}