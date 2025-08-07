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
import { InMemoryMessageQueue } from './interface/messaging/InMemoryMessageQueue';
import { JWTAuthService } from './interface/auth/JWTAuthService';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { config, isDevelopment } from './config/environment';
import { DataSeeder } from './scripts/seed-data';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.PORT;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dependency injection - use in-memory services for development
const deviceRepository = config.USE_IN_MEMORY_DB 
  ? new InMemoryDeviceRepository() 
  : new DynamoDBDeviceRepository();
const messageQueue = config.USE_IN_MEMORY_DB 
  ? new InMemoryMessageQueue() 
  : new SQSMessageQueue();
const authService = new JWTAuthService();
const deviceService = new DeviceRegistrationService(deviceRepository, messageQueue);
const deviceController = new DeviceController(deviceService);

// 개발 환경에서 샘플 데이터 로드
async function loadSampleData() {
  if (config.USE_SAMPLE_DATA && deviceRepository instanceof InMemoryDeviceRepository) {
    try {
      const dataSeeder = new DataSeeder(deviceRepository);
      await dataSeeder.seedDevices();
      logger.info('✅ 샘플 데이터가 로드되었습니다');
    } catch (error) {
      logger.error('❌ 샘플 데이터 로드 실패:', error);
    }
  }
}

// Routes
app.use('/api/devices', createDeviceRoutes(deviceController, authService));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    usingSampleData: config.USE_SAMPLE_DATA,
    usingInMemoryDB: config.USE_IN_MEMORY_DB
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  logger.info(`📊 환경: ${config.NODE_ENV}`);
  logger.info(`💾 인메모리 DB 사용: ${config.USE_IN_MEMORY_DB}`);
  logger.info(`🌱 샘플 데이터 사용: ${config.USE_SAMPLE_DATA}`);
  
  // 샘플 데이터 로드
  await loadSampleData();
  
  logger.info('✅ 서버 초기화 완료');
});

export default app;