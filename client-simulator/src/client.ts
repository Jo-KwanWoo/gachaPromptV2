import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface SystemInfo {
  os: string;
  version: string;
  architecture: string;
  memory: string;
  storage: string;
}

interface DeviceConfig {
  hardwareId: string;
  tenantId: string;
  serverUrl: string;
}

class VendingMachineClient {
  private api: AxiosInstance;
  private config: DeviceConfig;
  private isRunning: boolean = false;
  private registrationInterval?: NodeJS.Timeout;
  private statusCheckInterval?: NodeJS.Timeout;

  constructor(config: DeviceConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.serverUrl,
      timeout: 10000,
    });

    console.log(`🤖 자판기 클라이언트 초기화됨`);
    console.log(`   하드웨어 ID: ${config.hardwareId}`);
    console.log(`   테넌트 ID: ${config.tenantId}`);
    console.log(`   서버 URL: ${config.serverUrl}`);
  }

  private getSystemInfo(): SystemInfo {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      os: `${os.type()} ${os.release()}`,
      version: process.version,
      architecture: os.arch(),
      memory: `${Math.round(totalMem / 1024 / 1024 / 1024)}GB (${Math.round(freeMem / 1024 / 1024 / 1024)}GB 사용 가능)`,
      storage: '500GB SSD'
    };
  }

  private getLocalIPAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const nets = interfaces[name];
      if (nets) {
        for (const net of nets) {
          if (net.family === 'IPv4' && !net.internal) {
            return net.address;
          }
        }
      }
    }
    return '127.0.0.1';
  }

  private async registerDevice(): Promise<boolean> {
    try {
      const registrationData = {
        hardwareId: this.config.hardwareId,
        tenantId: this.config.tenantId,
        ipAddress: this.getLocalIPAddress(),
        systemInfo: this.getSystemInfo()
      };

      console.log(`📡 장치 등록 요청 중...`);
      const response = await this.api.post('/devices/register', registrationData);
      
      if (response.data.status === 'success') {
        console.log(`✅ 등록 요청 성공: ${response.data.message}`);
        return true;
      } else {
        console.log(`❌ 등록 요청 실패: ${response.data.message}`);
        return false;
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log(`⚠️  중복 등록: ${error.response.data.message}`);
        return true; // 이미 등록된 경우 성공으로 처리
      }
      console.error(`❌ 등록 요청 오류:`, error.response?.data?.message || error.message);
      return false;
    }
  }

  private async checkStatus(): Promise<{ approved: boolean; deviceId?: string; sqsQueueUrl?: string }> {
    try {
      console.log(`🔍 승인 상태 확인 중...`);
      const response = await this.api.get(`/devices/status/${this.config.hardwareId}`);
      
      const { status, deviceId, sqsQueueUrl } = response.data.data;
      
      switch (status) {
        case 'approved':
          console.log(`🎉 장치 승인됨!`);
          console.log(`   장치 ID: ${deviceId}`);
          console.log(`   SQS 큐 URL: ${sqsQueueUrl}`);
          return { approved: true, deviceId, sqsQueueUrl };
          
        case 'rejected':
          console.log(`❌ 장치 거부됨: ${response.data.message}`);
          return { approved: false };
          
        case 'pending':
          console.log(`⏳ 승인 대기 중...`);
          return { approved: false };
          
        default:
          console.log(`❓ 알 수 없는 상태: ${status}`);
          return { approved: false };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`❌ 장치를 찾을 수 없음. 재등록이 필요합니다.`);
        return { approved: false };
      }
      console.error(`❌ 상태 확인 오류:`, error.response?.data?.message || error.message);
      return { approved: false };
    }
  }

  private async startOperationalMode(deviceId: string, sqsQueueUrl: string): Promise<void> {
    console.log(`🚀 운영 모드 시작`);
    console.log(`   장치 ID: ${deviceId}`);
    console.log(`   메시지 큐: ${sqsQueueUrl}`);
    
    // 실제 자판기 운영 로직이 여기에 들어갑니다
    // 예: 상품 재고 관리, 결제 처리, 메시지 큐 모니터링 등
    
    setInterval(() => {
      console.log(`💼 자판기 운영 중... (${new Date().toLocaleTimeString('ko-KR')})`);
    }, 30000); // 30초마다 상태 로그
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`⚠️  클라이언트가 이미 실행 중입니다.`);
      return;
    }

    this.isRunning = true;
    console.log(`🔄 자판기 클라이언트 시작...`);

    // 초기 등록 시도
    let registered = await this.registerDevice();
    
    if (!registered) {
      // 등록 실패 시 5분마다 재시도
      this.registrationInterval = setInterval(async () => {
        console.log(`🔄 등록 재시도...`);
        registered = await this.registerDevice();
        
        if (registered && this.registrationInterval) {
          clearInterval(this.registrationInterval);
          this.registrationInterval = undefined;
        }
      }, 5 * 60 * 1000); // 5분
    }

    // 승인 상태 확인 (5분마다)
    this.statusCheckInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      const statusResult = await this.checkStatus();
      
      if (statusResult.approved && statusResult.deviceId && statusResult.sqsQueueUrl) {
        // 승인됨 - 운영 모드 시작
        if (this.statusCheckInterval) {
          clearInterval(this.statusCheckInterval);
          this.statusCheckInterval = undefined;
        }
        
        await this.startOperationalMode(statusResult.deviceId, statusResult.sqsQueueUrl);
      }
    }, 5 * 60 * 1000); // 5분

    // 24시간 후 재등록 (만료 방지)
    setTimeout(() => {
      if (this.isRunning) {
        console.log(`🔄 24시간 경과 - 재등록 시작`);
        this.restart();
      }
    }, 24 * 60 * 60 * 1000); // 24시간
  }

  public stop(): void {
    console.log(`🛑 자판기 클라이언트 중지...`);
    this.isRunning = false;
    
    if (this.registrationInterval) {
      clearInterval(this.registrationInterval);
      this.registrationInterval = undefined;
    }
    
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = undefined;
    }
  }

  private async restart(): Promise<void> {
    this.stop();
    setTimeout(() => this.start(), 1000);
  }
}

// 설정 파일에서 또는 환경 변수에서 설정 로드
function loadConfig(): DeviceConfig {
  const configPath = path.join(__dirname, '../config.json');
  
  if (fs.existsSync(configPath)) {
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return configFile;
  }
  
  // 기본 설정 또는 환경 변수 사용
  return {
    hardwareId: process.env.HARDWARE_ID || `VM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    tenantId: process.env.TENANT_ID || uuidv4(),
    serverUrl: process.env.SERVER_URL || 'http://localhost:3000/api'
  };
}

// 메인 실행
async function main() {
  const config = loadConfig();
  const client = new VendingMachineClient(config);

  // 종료 시그널 처리
  process.on('SIGINT', () => {
    console.log(`\n👋 종료 신호 수신됨`);
    client.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(`\n👋 종료 신호 수신됨`);
    client.stop();
    process.exit(0);
  });

  await client.start();
}

if (require.main === module) {
  main().catch(console.error);
}