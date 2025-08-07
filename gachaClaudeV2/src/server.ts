import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createDeviceRoutes } from './routes/deviceRoutes';
import { DeviceController } from './controllers/DeviceController';
import { DeviceRegistrationService } from './service/DeviceRegistrationService';
import { DynamoDBDeviceRepository } from './interface/repositories/DynamoDBDeviceRepository';
import { InMemoryDeviceRepository } from './interface/repositories/InMemoryDeviceRepository';
import { SQSMessageQueue } from './interface/messaging/SQSMessageQueue';
import { MockMessageQueue } from './interface/messaging/MockMessageQueue';
import { JWTAuthService } from './interface/auth/JWTAuthService';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dependency injection - use mock services for development
const isDevelopment = process.env.NODE_ENV === 'development';
const deviceRepository = isDevelopment 
  ? new InMemoryDeviceRepository() 
  : new DynamoDBDeviceRepository();
const messageQueue = isDevelopment 
  ? new MockMessageQueue() 
  : new SQSMessageQueue();
const authService = new JWTAuthService();
const deviceService = new DeviceRegistrationService(deviceRepository, messageQueue);
const deviceController = new DeviceController(deviceService);

// Routes
app.use('/api/devices', createDeviceRoutes(deviceController, authService));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;