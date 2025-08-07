import { Router } from 'express';
import { DeviceController } from '../controllers/DeviceController';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { 
  validateDeviceRegistration, 
  validateDeviceApproval, 
  validateDeviceRejection 
} from '../middleware/validationMiddleware';
import { IAuthService } from '../interface/auth/IAuthService';

export const createDeviceRoutes = (
  deviceController: DeviceController,
  authService: IAuthService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(authService);

  // Public routes (for devices)
  router.post('/register', validateDeviceRegistration, (req, res) => 
    deviceController.registerDevice(req, res)
  );
  
  router.get('/status/:hardwareId', (req, res) => 
    deviceController.getDeviceStatus(req, res)
  );

  // Protected routes (for admin)
  router.get('/pending', authMiddleware, (req, res) => 
    deviceController.getPendingDevices(req, res)
  );
  
  router.put('/:deviceId/approve', authMiddleware, validateDeviceApproval, (req, res) => 
    deviceController.approveDevice(req, res)
  );
  
  router.put('/:deviceId/reject', authMiddleware, validateDeviceRejection, (req, res) => 
    deviceController.rejectDevice(req, res)
  );

  return router;
};