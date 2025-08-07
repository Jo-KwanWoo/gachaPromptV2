// src/domain/device.ts
// 장치와 관련된 데이터 모델, 상태, 유효성 검사 규칙을 정의합니다.
// SRP에 따라 도메인 지식에 대한 책임만을 가집니다.

export enum DeviceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// 장치 등록 요청에 필요한 데이터
export interface DeviceRegistrationRequest {
  hardwareId: string;
  tenantId: string;
  ipAddress: string;
  systemInfo: string;
}

// DynamoDB에 저장될 장치 데이터 모델
export interface Device {
  deviceId?: string; // 승인 시 생성되는 고유 ID
  hardwareId: string; // 고유 하드웨어 ID
  tenantId: string;
  ipAddress: string;
  systemInfo: string;
  status: DeviceStatus;
  sqsQueueUrl?: string; // 승인 시 할당되는 큐 URL
  createdAt: number;
  updatedAt: number;
  rejectedReason?: string;
}

// 입력 데이터에 대한 유효성 검사 함수
export function validateDeviceRegistrationRequest(data: any): data is DeviceRegistrationRequest {
  return (
    data &&
    typeof data.hardwareId === 'string' &&
    typeof data.tenantId === 'string' &&
    typeof data.ipAddress === 'string' &&
    typeof data.systemInfo === 'string'
  );
}

// src/interface/dynamoDbClient.ts
// 데이터베이스(DynamoDB)와의 통신을 담당하는 추상화 계층입니다.
// 비즈니스 로직이 DB의 구현체에 의존하지 않도록 합니다.

import { Device, DeviceRegistrationRequest, DeviceStatus } from '../domain/device';

// AWS SDK를 직접 사용하는 대신, 모의(mock) 객체를 사용하여
// 실제 DB 연동 로직을 추상화합니다.
class DynamoDBClient {
  private devices: Device[] = [];

  // 장치 등록 요청을 DynamoDB에 저장
  public async createDevice(request: DeviceRegistrationRequest): Promise<Device> {
    // DynamoDB의 복합 파티션 키 및 GSI(Global Secondary Index) 설계 가정:
    // Partition Key: tenantId#hardwareId (고유성 보장)
    // Sort Key: -
    // GSI: GSI-1 (Partition Key: status) -> 대기 중인 장치 목록 조회를 위해 사용
    const newDevice: Device = {
      ...request,
      status: DeviceStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.devices.push(newDevice);
    console.log(`[DynamoDB] New device created: ${newDevice.hardwareId}`);
    return newDevice;
  }

  // hardwareId로 장치 정보 조회 (GSI-1 활용)
  public async getDeviceByHardwareId(hardwareId: string): Promise<Device | undefined> {
    return this.devices.find(d => d.hardwareId === hardwareId);
  }

  // 상태 업데이트 및 고유 deviceId, SQS URL 할당
  public async approveDevice(hardwareId: string, deviceId: string, sqsQueueUrl: string): Promise<Device | undefined> {
    const device = this.devices.find(d => d.hardwareId === hardwareId);
    if (device) {
      device.status = DeviceStatus.APPROVED;
      device.deviceId = deviceId;
      device.sqsQueueUrl = sqsQueueUrl;
      device.updatedAt = Date.now();
      console.log(`[DynamoDB] Device ${hardwareId} approved.`);
      return device;
    }
    return undefined;
  }

  // 장치 거부
  public async rejectDevice(hardwareId: string, reason: string): Promise<Device | undefined> {
    const device = this.devices.find(d => d.hardwareId === hardwareId);
    if (device) {
      device.status = DeviceStatus.REJECTED;
      device.rejectedReason = reason;
      device.updatedAt = Date.now();
      console.log(`[DynamoDB] Device ${hardwareId} rejected.`);
      return device;
    }
    return undefined;
  }

  // 상태가 'pending'인 모든 장치 조회 (GSI 활용)
  public async getPendingDevices(): Promise<Device[]> {
    return this.devices.filter(d => d.status === DeviceStatus.PENDING);
  }
}

export const dynamoDbClient = new DynamoDBClient();

// src/interface/sqsClient.ts
// SQS와의 통신을 담당하는 추상화 계층입니다.
// 향후 Kafka 등으로 교체 시 이 파일만 수정하면 됩니다.

class SQSClient {
  public async createQueueForDevice(deviceId: string): Promise<string> {
    // 실제 SQS 큐 생성 로직을 가정
    const queueUrl = `https://sqs.aws.com/1234567890/${deviceId}-queue`;
    console.log(`[SQS] Queue created for deviceId ${deviceId}: ${queueUrl}`);
    return queueUrl;
  }
}

export const sqsClient = new SQSClient();

// src/service/deviceService.ts
// 핵심 비즈니스 로직을 처리하는 계층입니다.
// SRP에 따라 기능별로 함수가 분리되어 있습니다.
// I/O(DB, SQS)는 interface 계층에 위임합니다.

import { dynamoDbClient } from '../interface/dynamoDbClient';
import { sqsClient } from '../interface/sqsClient';
import { Device, DeviceStatus, DeviceRegistrationRequest } from '../domain/device';
import crypto from 'crypto';

class DeviceService {
  // 장치 등록 요청 처리
  public async registerDevice(request: DeviceRegistrationRequest): Promise<{ status: DeviceStatus }> {
    const existingDevice = await dynamoDbClient.getDeviceByHardwareId(request.hardwareId);
    if (existingDevice) {
      if (existingDevice.status === DeviceStatus.APPROVED) {
        throw new Error('Device already approved.');
      }
      // 중복 요청의 경우, 기존 상태를 유지
      return { status: existingDevice.status };
    }
    await dynamoDbClient.createDevice(request);
    return { status: DeviceStatus.PENDING };
  }

  // 장치 상태 확인
  public async getDeviceStatus(hardwareId: string): Promise<Partial<Device>> {
    const device = await dynamoDbClient.getDeviceByHardwareId(hardwareId);
    if (!device) {
      throw new Error('Device not found.');
    }
    // 승인된 경우, deviceId와 SQS 큐 URL만 반환
    if (device.status === DeviceStatus.APPROVED) {
      return {
        deviceId: device.deviceId,
        sqsQueueUrl: device.sqsQueueUrl,
      };
    }
    return { status: device.status };
  }

  // 관리자 - 장치 승인
  public async approveDevice(hardwareId: string): Promise<Device> {
    const device = await dynamoDbClient.getDeviceByHardwareId(hardwareId);
    if (!device) {
      throw new Error('Device not found.');
    }
    if (device.status !== DeviceStatus.PENDING) {
      throw new Error(`Device status is not pending. Current status: ${device.status}`);
    }

    const deviceId = crypto.randomUUID();
    const sqsQueueUrl = await sqsClient.createQueueForDevice(deviceId);

    const approvedDevice = await dynamoDbClient.approveDevice(hardwareId, deviceId, sqsQueueUrl);
    if (!approvedDevice) {
      throw new Error('Failed to approve device.');
    }
    return approvedDevice;
  }

  // 관리자 - 장치 거부
  public async rejectDevice(hardwareId: string, reason: string): Promise<Device> {
    const device = await dynamoDbClient.getDeviceByHardwareId(hardwareId);
    if (!device) {
      throw new Error('Device not found.');
    }
    if (device.status !== DeviceStatus.PENDING) {
      throw new Error(`Device status is not pending. Current status: ${device.status}`);
    }

    const rejectedDevice = await dynamoDbClient.rejectDevice(hardwareId, reason);
    if (!rejectedDevice) {
      throw new Error('Failed to reject device.');
    }

    // 거부 사유는 로그에 기록
    console.log(`[Log] Device ${hardwareId} rejected. Reason: ${reason}`);
    return rejectedDevice;
  }

  // 관리자 - 대기 중인 장치 목록 조회
  public async getPendingDevices(): Promise<Device[]> {
    return dynamoDbClient.getPendingDevices();
  }
}

export const deviceService = new DeviceService();

// src/middleware/authMiddleware.ts
// JWT 기반 인증을 처리하는 미들웨어입니다.
// 실제 구현에서는 JWT 라이브러리를 사용하여 토큰을 검증합니다.

import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    // 실제 JWT 검증 로직 (예: jwt.verify(token, 'secret'))
    // 여기서는 간단히 토큰이 존재하면 인증 성공으로 간주
    console.log('JWT Token verified successfully.');
    next();
  } else {
    res.status(401).json({ status: 'error', message: 'Authentication failed.' });
  }
};

// src/controller/deviceController.ts
// API 엔드포인트를 정의하고, 요청을 처리하며, service 계층의 함수를 호출합니다.
// 요청 본문 유효성 검사 및 응답 처리에 대한 책임을 가집니다.

import { Router, Request, Response } from 'express';
import { deviceService } from '../service/deviceService';
import { validateDeviceRegistrationRequest } from '../domain/device';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendResponse } from '../utils/responseHandler';

export const deviceRouter = Router();

// 장치 등록 요청
deviceRouter.post('/register', async (req: Request, res: Response) => {
  try {
    if (!validateDeviceRegistrationRequest(req.body)) {
      return sendResponse(res, 400, 'error', 'Invalid request data.');
    }
    const result = await deviceService.registerDevice(req.body);
    sendResponse(res, 200, 'success', 'Device registration requested successfully.', result);
  } catch (error: any) {
    if (error.message === 'Device already approved.') {
      return sendResponse(res, 409, 'error', 'Device already approved.');
    }
    sendResponse(res, 500, 'error', 'Internal server error.', null, error.message);
  }
});

// 장치 승인 상태 확인
deviceRouter.get('/status/:hardwareId', async (req: Request, res: Response) => {
  try {
    const { hardwareId } = req.params;
    const statusData = await deviceService.getDeviceStatus(hardwareId);
    sendResponse(res, 200, 'success', 'Device status fetched successfully.', statusData);
  } catch (error: any) {
    if (error.message === 'Device not found.') {
      return sendResponse(res, 404, 'error', 'Device not found.');
    }
    sendResponse(res, 500, 'error', 'Internal server error.', null, error.message);
  }
});

// 관리자 - 대기 중인 장치 목록 조회 (JWT 인증 필요)
deviceRouter.get('/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pendingDevices = await deviceService.getPendingDevices();
    sendResponse(res, 200, 'success', 'Pending devices fetched successfully.', pendingDevices);
  } catch (error: any) {
    sendResponse(res, 500, 'error', 'Internal server error.', null, error.message);
  }
});

// 관리자 - 장치 승인 (JWT 인증 필요)
deviceRouter.put('/:hardwareId/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { hardwareId } = req.params;
    const device = await deviceService.approveDevice(hardwareId);
    sendResponse(res, 200, 'success', 'Device approved successfully.', device);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return sendResponse(res, 404, 'error', error.message);
    }
    if (error.message.includes('not pending')) {
      return sendResponse(res, 400, 'error', error.message);
    }
    sendResponse(res, 500, 'error', 'Internal server error.', null, error.message);
  }
});

// 관리자 - 장치 거부 (JWT 인증 필요)
deviceRouter.put('/:hardwareId/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { hardwareId } = req.params;
    const { reason } = req.body;
    if (!reason) {
      return sendResponse(res, 400, 'error', 'Rejection reason is required.');
    }
    const device = await deviceService.rejectDevice(hardwareId, reason);
    sendResponse(res, 200, 'success', 'Device rejected successfully.', device);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return sendResponse(res, 404, 'error', error.message);
    }
    if (error.message.includes('not pending')) {
      return sendResponse(res, 400, 'error', error.message);
    }
    sendResponse(res, 500, 'error', 'Internal server error.', null, error.message);
  }
});

// src/utils/responseHandler.ts
// 모든 API 응답의 형식을 통일하기 위한 유틸리티 함수입니다.

import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  status: 'success' | 'error',
  message: string,
  data?: any,
  errorMessage?: string
) => {
  res.status(statusCode).json({
    status,
    message,
    data: data || null,
    error: errorMessage || null,
  });
};

// src/index.ts
// 애플리케이션의 진입점입니다. Express 서버를 설정하고 라우터를 연결합니다.

import express from 'express';
import { deviceRouter } from './controller/deviceController';

const app = express();
const port = 3000;

app.use(express.json()); // JSON 요청 본문 파싱

app.use('/api/devices', deviceRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
