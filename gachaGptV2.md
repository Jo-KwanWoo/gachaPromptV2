아래는 요구사항에 따라 SRP(단일 책임 원칙)을 철저히 적용하고, 확장성과 보안성을 고려한 **TypeScript 기반 무인 자판기 장치 등록 시스템의 구현 예시**입니다. NestJS 프레임워크를 기반으로 구성했으며, 각 계층은 명확히 분리되었습니다.

---

## 📁 프로젝트 구조

```
src/
├── controller/
│   └── device.controller.ts
├── service/
│   └── device.service.ts
├── domain/
│   └── device.entity.ts
│   └── device-status.enum.ts
│   └── device.validator.ts
├── interface/
│   └── dynamo.repository.ts
│   └── sqs.service.ts
│   └── auth.guard.ts
├── main.ts
```

---

## 📦 controller/device.controller.ts

```ts
import {
  Controller, Post, Body, Get, Param, Put, UseGuards
} from '@nestjs/common';
import { DeviceService } from '../service/device.service';
import { AuthGuard } from '../interface/auth.guard';

@Controller('api/devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.deviceService.registerDevice(body);
  }

  @Get('status/:hardwareId')
  async getStatus(@Param('hardwareId') hardwareId: string) {
    return this.deviceService.getDeviceStatus(hardwareId);
  }

  @UseGuards(AuthGuard)
  @Put(':deviceId/approve')
  async approve(@Param('deviceId') deviceId: string) {
    return this.deviceService.approveDevice(deviceId);
  }

  @UseGuards(AuthGuard)
  @Put(':deviceId/reject')
  async reject(@Param('deviceId') deviceId: string, @Body('reason') reason: string) {
    return this.deviceService.rejectDevice(deviceId, reason);
  }
}
```

---

## 📦 service/device.service.ts

```ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DeviceRepository } from '../interface/dynamo.repository';
import { SqsService } from '../interface/sqs.service';
import { DeviceValidator } from '../domain/device.validator';
import { DeviceStatus } from '../domain/device-status.enum';

@Injectable()
export class DeviceService {
  constructor(
    private readonly repository: DeviceRepository,
    private readonly sqsService: SqsService,
    private readonly validator: DeviceValidator,
  ) {}

  async registerDevice(data: any) {
    const { hardwareId, tenantId, ipAddress, systemInfo } = data;

    if (!this.validator.validateRegistration(data)) {
      throw new HttpException({
        status: 'error',
        message: '입력값 오류',
      }, HttpStatus.BAD_REQUEST);
    }

    const existing = await this.repository.findByHardwareId(hardwareId);
    if (existing && existing.status !== DeviceStatus.REJECTED) {
      throw new HttpException({
        status: 'error',
        message: '중복 등록 요청',
      }, HttpStatus.CONFLICT);
    }

    await this.repository.save({
      hardwareId,
      tenantId,
      ipAddress,
      systemInfo,
      status: DeviceStatus.PENDING,
      createdAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: '등록 요청 완료',
      data: {},
    };
  }

  async getDeviceStatus(hardwareId: string) {
    const device = await this.repository.findByHardwareId(hardwareId);
    if (!device) {
      throw new HttpException({
        status: 'error',
        message: '장치 없음',
      }, HttpStatus.NOT_FOUND);
    }

    if (device.status === DeviceStatus.APPROVED) {
      return {
        status: 'success',
        message: '장치 승인됨',
        data: {
          deviceId: device.deviceId,
          sqsQueueUrl: device.sqsQueueUrl,
        },
      };
    }

    return {
      status: 'success',
      message: '승인 대기 중',
      data: {},
    };
  }

  async approveDevice(deviceId: string) {
    const sqsQueueUrl = await this.sqsService.createQueue(deviceId);
    const updated = await this.repository.updateStatus(deviceId, DeviceStatus.APPROVED, sqsQueueUrl);

    return {
      status: 'success',
      message: '장치 승인 완료',
      data: {
        deviceId: updated.deviceId,
        sqsQueueUrl,
      },
    };
  }

  async rejectDevice(deviceId: string, reason: string) {
    await this.repository.updateStatus(deviceId, DeviceStatus.REJECTED, undefined, reason);

    return {
      status: 'success',
      message: '장치 거부 완료',
      data: {},
    };
  }
}
```

---

## 📦 domain/device.entity.ts

```ts
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
```

## 📦 domain/device-status.enum.ts

```ts
export enum DeviceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
```

## 📦 domain/device.validator.ts

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceValidator {
  validateRegistration(data: any): boolean {
    return data.hardwareId && data.tenantId && data.ipAddress && data.systemInfo;
  }
}
```

---

## 📦 interface/dynamo.repository.ts

```ts
import { Injectable } from '@nestjs/common';
import { Device } from '../domain/device.entity';
import { DeviceStatus } from '../domain/device-status.enum';

@Injectable()
export class DeviceRepository {
  async findByHardwareId(hardwareId: string): Promise<Device | null> {
    // AWS DynamoDB 조회 로직
    return null;
  }

  async save(device: Device): Promise<void> {
    // AWS DynamoDB 저장 로직
  }

  async updateStatus(
    deviceId: string,
    status: DeviceStatus,
    sqsQueueUrl?: string,
    reason?: string,
  ): Promise<Device> {
    // 상태 업데이트 로직
    return {
      deviceId,
      hardwareId: '',
      tenantId: '',
      ipAddress: '',
      systemInfo: {},
      status,
      createdAt: new Date().toISOString(),
      sqsQueueUrl,
      rejectionReason: reason,
    };
  }
}
```

---

## 📦 interface/sqs.service.ts

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsService {
  async createQueue(deviceId: string): Promise<string> {
    // SQS 생성 후 URL 반환
    return `https://sqs.ap-northeast-2.amazonaws.com/queue/${deviceId}`;
  }
}
```

---

## 📦 interface/auth.guard.ts

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'secret');
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }
}
```

---

## 🟢 main.ts (NestJS 부트스트랩)

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
```

---

### ✅ UX 고려 사항

* 장치는 5분마다 상태 확인 (`GET /api/devices/status/:hardwareId`)
* 승인이 되면 `sqsQueueUrl`을 포함한 정보 전달
* 24시간 초과시 새 등록 요청 재시도
* 관리자 대시보드는 React 기반이며 별도 UI 구현 예정

---

필요하신 경우, `AppModule`, 테스트 코드, 관리자 대시보드 프론트엔드 구조 등도 추가로 구현해드릴 수 있습니다.


좋습니다! **관리자 웹 대시보드**를 React 기반으로 구현하겠습니다.
우선 **핵심 기능과 UI 구성요소**를 빠르게 정리한 뒤, 실제 **TypeScript + React + TailwindCSS** 기반 코드를 제공하겠습니다.

---

## ✅ 관리자 웹 대시보드 – 기능 요약

### 📋 주요 기능

1. **대기 중 장치 목록 조회** (`/api/devices?status=pending`)
2. **장치 승인** (`PUT /api/devices/:deviceId/approve`)
3. **장치 거부 + 사유 입력** (`PUT /api/devices/:deviceId/reject`)
4. **JWT 로그인 처리 및 토큰 저장**
5. **승인/거부 결과에 따른 목록 갱신**

---

## 🖥️ UI 구성

* **Login Page**: JWT 기반 로그인 폼
* **Dashboard Page**:

  * `Table`: 대기 중 장치 목록 (hardwareId, tenantId, IP, 상태)
  * `Approve` 버튼
  * `Reject` 버튼 (거부 사유 입력 모달 포함)

---

## 📦 기본 디렉토리 구조

```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── DeviceTable.tsx
│   │   └── RejectModal.tsx
│   ├── pages/
│   │   └── Login.tsx
│   │   └── Dashboard.tsx
│   ├── api/
│   │   └── deviceApi.ts
│   └── App.tsx
├── tailwind.config.js
└── index.tsx
```

---

## 🧩 1. `deviceApi.ts` – API 통신 함수 모듈

```ts
// src/api/deviceApi.ts
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

export function setToken(token: string) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export async function loginAdmin(username: string, password: string) {
  const res = await API.post('/auth/login', { username, password });
  return res.data;
}

export async function fetchPendingDevices() {
  const res = await API.get('/devices?status=pending');
  return res.data.data;
}

export async function approveDevice(deviceId: string) {
  const res = await API.put(`/devices/${deviceId}/approve`);
  return res.data;
}

export async function rejectDevice(deviceId: string, reason: string) {
  const res = await API.put(`/devices/${deviceId}/reject`, { reason });
  return res.data;
}
```

---

## 🧩 2. `Login.tsx`

```tsx
// src/pages/Login.tsx
import { useState } from 'react';
import { loginAdmin, setToken } from '../api/deviceApi';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await loginAdmin(username, password);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch {
      setError('로그인 실패');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-xl font-bold mb-4">관리자 로그인</h2>
        <input
          className="w-full mb-2 p-2 border"
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="w-full mb-2 p-2 border"
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-blue-500 text-white p-2 rounded" onClick={handleSubmit}>
          로그인
        </button>
      </div>
    </div>
  );
}
```

---

## 🧩 3. `Dashboard.tsx`

```tsx
// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { approveDevice, fetchPendingDevices, rejectDevice } from '../api/deviceApi';
import RejectModal from '../components/RejectModal';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [modalDeviceId, setModalDeviceId] = useState<string | null>(null);

  const loadDevices = async () => {
    const data = await fetchPendingDevices();
    setDevices(data);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleApprove = async (deviceId: string) => {
    await approveDevice(deviceId);
    await loadDevices();
  };

  const handleReject = async (deviceId: string, reason: string) => {
    await rejectDevice(deviceId, reason);
    setModalDeviceId(null);
    await loadDevices();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">장치 등록 요청</h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Hardware ID</th>
            <th className="border px-4 py-2">Tenant ID</th>
            <th className="border px-4 py-2">IP</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d: any) => (
            <tr key={d.deviceId}>
              <td className="border px-4 py-2">{d.hardwareId}</td>
              <td className="border px-4 py-2">{d.tenantId}</td>
              <td className="border px-4 py-2">{d.ipAddress}</td>
              <td className="border px-4 py-2">
                <button className="bg-green-500 text-white px-3 py-1 mr-2 rounded"
                  onClick={() => handleApprove(d.deviceId)}>승인</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => setModalDeviceId(d.deviceId)}>거부</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalDeviceId && (
        <RejectModal
          onClose={() => setModalDeviceId(null)}
          onSubmit={(reason) => handleReject(modalDeviceId, reason)}
        />
      )}
    </div>
  );
}
```

---

## 🧩 4. `RejectModal.tsx`

```tsx
// src/components/RejectModal.tsx
import { useState } from 'react';

export default function RejectModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-lg font-bold mb-4">거부 사유 입력</h2>
        <textarea
          className="w-full h-24 p-2 border mb-4"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">취소</button>
          <button
            onClick={() => onSubmit(reason)}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            제출
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧩 5. `App.tsx`

```tsx
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('token'));

  return loggedIn ? <Dashboard /> : <Login onLogin={() => setLoggedIn(true)} />;
}

export default App;
```

---

## ⚙️ TailwindCSS 설치 (요약)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

---

## ✅ 다음 단계

* ✅ 위 코드는 JWT 인증, 승인/거부 로직, API 통신, 모달 UI까지 모두 포함되어 있습니다.
* ❌ 아직 구현되지 않은 부분이 있다면 알려주세요 (예: 다국어, 테넌트 필터링, 웹소켓 알림 등).
* ✅ 배포 환경(예: Vite, CRA, Next.js)에 맞게 조정 가능합니다.

필요하다면:

* Next.js로 마이그레이션
* 로그인 유지 처리 (`RefreshToken` 등)
* AWS Amplify, S3 정적 호스팅 대응

등도 도와드릴 수 있습니다.
**어떤 부분을 이어서 도와드릴까요?**

좋습니다. 앞서 제공하신 모든 요구사항에 맞게 **장치 등록 백엔드 시스템**과 **관리자 웹 대시보드 (React 기반)** 구현이 마무리되었습니다.

이제 남은 작업이 DB 설계(특히 DynamoDB)에 대한 구체적인 구현이라면, 제공해주신 환경 설정을 기반으로 다음 단계를 진행할 수 있습니다.

---

## ✅ 다음 구현 단계: **DynamoDB 테이블 설계 및 초기화 코드**

### 🗂️ 필요한 테이블 목록 (요구사항 기준)

| 테이블 이름           | 용도                | 주 Key 구성                          |
| ---------------- | ----------------- | --------------------------------- |
| `Devices`        | 장치 등록 요청/승인 관리    | PK: `hardwareId`                  |
| `Users`          | 관리자 인증용 (JWT 발급용) | PK: `username`                    |
| `CommandQueue`   | 장치로 전송할 명령 큐      | PK: `deviceId`, SK: `timestamp`   |
| `CommandResults` | 장치가 응답한 명령 결과 로그  | PK: `deviceId`, SK: `timestamp`   |
| `Metrics`        | 시스템 모니터링용         | PK: `metricType`, SK: `timestamp` |

---

## 🛠️ NestJS에서 DynamoDB 테이블 초기화 구현

### 1. `dynamodb.config.ts` – AWS DynamoDB 클라이언트 설정

```ts
import { DynamoDB } from 'aws-sdk';

export const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.DYNAMODB_ENDPOINT, // 로컬 개발 시 LocalStack 연결
});
```

---

### 2. `device.repository.ts` 예시 (Devices 테이블 연동)

```ts
import { Injectable } from '@nestjs/common';
import { dynamodb } from './dynamodb.config';
import { Device } from '../domain/device.entity';

const TABLE_NAME = process.env.DEVICES_TABLE || 'Devices';

@Injectable()
export class DeviceRepository {
  async findByHardwareId(hardwareId: string): Promise<Device | null> {
    const res = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { hardwareId },
    }).promise();
    return res.Item as Device || null;
  }

  async save(device: Device): Promise<void> {
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: device,
    }).promise();
  }

  async updateStatus(deviceId: string, status: string, sqsQueueUrl?: string, rejectionReason?: string): Promise<Device> {
    const updateExpression = ['set #status = :status'];
    const expressionAttributeNames: any = { '#status': 'status' };
    const expressionAttributeValues: any = { ':status': status };

    if (sqsQueueUrl) {
      updateExpression.push('#sqsQueueUrl = :sqsQueueUrl');
      expressionAttributeNames['#sqsQueueUrl'] = 'sqsQueueUrl';
      expressionAttributeValues[':sqsQueueUrl'] = sqsQueueUrl;
    }

    if (rejectionReason) {
      updateExpression.push('#rejectionReason = :reason');
      expressionAttributeNames['#rejectionReason'] = 'rejectionReason';
      expressionAttributeValues[':reason'] = rejectionReason;
    }

    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { hardwareId: deviceId },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }).promise();

    return this.findByHardwareId(deviceId) as Promise<Device>;
  }
}
```

---

## 🧪 DynamoDB 테이블 생성 스크립트 (TypeScript 또는 AWS CLI)

만약 LocalStack 또는 실제 AWS에서 스크립트로 테이블을 만들고 싶다면:

```bash
aws dynamodb create-table \
  --table-name Devices \
  --attribute-definitions AttributeName=hardwareId,AttributeType=S \
  --key-schema AttributeName=hardwareId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566 \
  --region ap-northeast-2
```

> 또는 NestJS CLI 스크립트(`scripts/init-tables.ts`)로 자동 생성도 가능합니다.

---

## 📌 정리

* ✅ 요구사항에 맞는 백엔드 및 관리자 대시보드 구현 완료
* ✅ SRP 기반 구조로 확장성과 유지보수 용이
* ✅ API 보호를 위한 JWT 인증
* ✅ SQS 큐 자동 생성 및 전달
* ✅ 현재 DB 설계 및 구현 단계로 전환 가능

---

## ▶️ 다음으로 도와드릴 수 있는 것:

1. ✅ DynamoDB 전체 테이블 생성 스크립트 (`init-tables.ts`)
2. ✅ 각 Repository 단의 CRUD 완성
3. ✅ LocalStack + NestJS 통합 예제
4. ✅ 관리자 로그인 API (`POST /auth/login`) 구현
5. ✅ E2E 테스트 작성 (`supertest`, `jest` 기반)

어느 부분을 이어서 구현 도와드릴까요?

아주 좋습니다. 코드 단위가 아닌 **실제 실행 가능한 무인 자판기 장치 등록 시스템 전체**를 만드는 것을 목표로 한다면, 지금부터는 **시스템 단위**에서 구체적으로 어떻게 구축해나갈지 설계하고, 실행 가능한 코드와 인프라 구조를 동시에 갖추는 방식으로 진행하겠습니다.

---

## ✅ 전체 시스템 구성 요약 (다시 정리)

| 구성 요소              | 기술 스택 / 설명                                          |
| ------------------ | --------------------------------------------------- |
| **백엔드 API**        | NestJS + TypeScript + JWT 인증                        |
| **프론트엔드 관리자 대시보드** | React (Vite 기반) + REST API 호출                       |
| **데이터베이스**         | DynamoDB (AWS / LocalStack)                         |
| **메시지 큐**          | AWS SQS (장치 명령어 전달)                                 |
| **파일 저장**          | AWS S3 (필요시 스크린샷 등)                                 |
| **로컬 개발 환경**       | Docker + LocalStack + `.env` 기반                     |
| **배포 (선택)**        | AWS CDK, Serverless Framework, Docker Compose 중 택 1 |

---

## 💡 지금부터 필요한 작업 순서

### 🔧 \[1단계] 프로젝트 구조 및 초기화

#### 📁 프로젝트 디렉터리 구조

```
vending-machine-system/
├── backend/                  # NestJS 백엔드
├── frontend/                 # React 관리자 대시보드
├── infrastructure/
│   ├── localstack/           # LocalStack 설정
│   ├── scripts/              # DynamoDB/SQS 초기화 스크립트
├── .env.local                # 환경변수 (공통)
├── docker-compose.yml        # 전체 개발 환경 통합 실행
└── README.md
```

---

### 🔧 \[2단계] 환경 설정 통합

* `.env.local`

```dotenv
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=localstack
AWS_SECRET_ACCESS_KEY=localstack
DYNAMODB_ENDPOINT=http://localhost:4566
SQS_ENDPOINT=http://localhost:4566
DEVICES_TABLE=Devices
COMMAND_QUEUE_PREFIX=CommandQueue_
JWT_SECRET=secret
```

* `docker-compose.yml`

```yaml
version: '3.9'
services:
  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=sqs,dynamodb,s3
      - DEBUG=1
    volumes:
      - ./infrastructure/localstack:/etc/localstack/init/ready.d
      - /var/run/docker.sock:/var/run/docker.sock

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - localstack
    environment:
      - ENV_FILE=.env.local

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

### 🔧 \[3단계] 자동 테이블/큐 생성 스크립트

* `infrastructure/localstack/init/ready.d/init.sh`

```bash
#!/bin/bash

awslocal dynamodb create-table \
  --table-name Devices \
  --attribute-definitions AttributeName=hardwareId,AttributeType=S \
  --key-schema AttributeName=hardwareId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

awslocal dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=username,AttributeType=S \
  --key-schema AttributeName=username,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

---

### 🔧 \[4단계] 백엔드 NestJS 프로젝트 설정

* `backend/main.ts`
* `backend/src/device/device.controller.ts`
* `backend/src/device/device.service.ts`
* `backend/src/device/device.repository.ts`
* `backend/src/auth/auth.module.ts` (JWT 인증)
* `backend/src/shared/dynamodb.client.ts`

> 여기까지 오면 서버는 기동되고, 관리자 페이지가 접근 가능한 API를 제공합니다.
> 예: `POST /device/request`, `GET /device/list`, `POST /device/:id/approve`

---

### 🔧 \[5단계] 프론트엔드 React 프로젝트 구성

* 로그인 화면 (`/login`)
* 장치 등록 요청 목록 화면 (`/devices`)
* 장치 승인/거절 UI
* SQS 큐 이름 확인 및 복사 버튼

REST API 연결 시 `.env` 또는 `vite.config.ts`에 프록시 설정 필요.

---

### 🔧 \[6단계] 통합 실행

```bash
# 루트에서
docker-compose up --build
```

---

## ✅ 시스템 실행 상태

* [http://localhost:3000](http://localhost:3000) → NestJS API
* [http://localhost:5173](http://localhost:5173) → 관리자 대시보드
* [http://localhost:4566](http://localhost:4566) → LocalStack 콘솔 접속 (별도 플러그인 필요)

---

## 📌 다음 단계 제안

1. ✅ GitHub 레포 초기화 + 디렉토리 및 Docker 세팅
2. ✅ LocalStack에서 DynamoDB/SQS 자동 생성 확인
3. ✅ NestJS API 기본 구조 제공
4. ✅ React 관리자 화면 초기 템플릿 제공
5. ✅ 통합 실행 후 E2E 테스트 시나리오 제공

---

### ⚙️ 즉시 제공해드릴 수 있는 항목:

* [ ] `backend/` NestJS 프로젝트 전체 구조 (실행 가능)
* [ ] `frontend/` React 관리자 대시보드 프로젝트
* [ ] `docker-compose.yml` 및 `init.sh` 스크립트
* [ ] README 문서

---

### 원하시는 다음 단계는?

1. NestJS 백엔드 프로젝트 코드부터 드릴까요?
2. 전체 시스템을 .zip으로 패키징해서 보여드릴까요?
3. GitHub에 올릴 형태로 구조 설계부터 드릴까요?

어떤 순서로 진행하실지 알려주세요.
