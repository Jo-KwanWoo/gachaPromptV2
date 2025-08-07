import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface DeviceConfig {
  hardwareId: string;
  tenantId: string;
  ipAddress: string;
  systemInfo: {
    os: string;
    version: string;
    architecture: string;
    memory: string;
    storage: string;
  };
}

class SampleVendingMachineClient {
  private api: AxiosInstance;
  private config: DeviceConfig;
  private sampleData: any;

  constructor(config: DeviceConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: process.env.SERVER_URL || 'http://localhost:3000/api',
      timeout: 10000,
    });

    // 샘플 데이터 로드
    try {
      const dataPath = path.join(__dirname, '../../src/data/sample-data.json');
      this.sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (error) {
      console.error('샘플 데이터 로드 실패:', error);
      this.sampleData = null;
    }

    console.log(`🤖 샘플 자판기 클라이언트 초기화됨`);
    console.log(`   하드웨어 ID: ${config.hardwareId}`);
    console.log(`   테넌트 ID: ${config.tenantId}`);
    console.log(`   IP 주소: ${config.ipAddress}`);
  }

  async registerDevice(): Promise<void> {
    try {
      console.log(`📡 장치 등록 요청 중...`);
      const response = await this.api.post('/devices/register', this.config);
      
      if (response.data.status === 'success') {
        console.log(`✅ 등록 요청 성공: ${response.data.message}`);
      } else {
        console.log(`❌ 등록 요청 실패: ${response.data.message}`);
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log(`⚠️  중복 등록: ${error.response.data.message}`);
      } else {
        console.error(`❌ 등록 요청 오류:`, error.response?.data?.message || error.message);
      }
    }
  }

  async checkStatus(): Promise<void> {
    try {
      console.log(`🔍 승인 상태 확인 중...`);
      const response = await this.api.get(`/devices/status/${this.config.hardwareId}`);
      
      const { status, deviceId, sqsQueueUrl } = response.data.data;
      
      switch (status) {
        case 'approved':
          console.log(`🎉 장치 승인됨!`);
          console.log(`   장치 ID: ${deviceId}`);
          console.log(`   SQS 큐 URL: ${sqsQueueUrl}`);
          break;
          
        case 'rejected':
          console.log(`❌ 장치 거부됨: ${response.data.message}`);
          break;
          
        case 'pending':
          console.log(`⏳ 승인 대기 중...`);
          break;
          
        default:
          console.log(`❓ 알 수 없는 상태: ${status}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`❌ 장치를 찾을 수 없음. 등록이 필요합니다.`);
      } else {
        console.error(`❌ 상태 확인 오류:`, error.response?.data?.message || error.message);
      }
    }
  }

  async runDemo(): Promise<void> {
    console.log(`🚀 샘플 클라이언트 데모 시작\n`);

    // 1. 장치 등록
    await this.registerDevice();
    await this.sleep(2000);

    // 2. 상태 확인
    await this.checkStatus();
    await this.sleep(2000);

    console.log(`\n✅ 데모 완료`);
    console.log(`\n💡 관리자 대시보드에서 장치를 승인/거부할 수 있습니다:`);
    console.log(`   http://localhost:3001`);
    console.log(`   로그인: admin@example.com / admin123`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 샘플 데이터에서 장치 설정 로드
function loadSampleConfig(): DeviceConfig {
  try {
    const dataPath = path.join(__dirname, '../../src/data/sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // 첫 번째 등록 요청 데이터 사용
    const firstRequest = sampleData.deviceRegistrationRequests[0];
    
    return {
      hardwareId: firstRequest.hardwareId,
      tenantId: firstRequest.tenantId,
      ipAddress: firstRequest.ipAddress,
      systemInfo: firstRequest.systemInfo
    };
  } catch (error) {
    console.error('샘플 설정 로드 실패, 기본값 사용:', error);
    
    // 기본 설정
    return {
      hardwareId: process.env.HARDWARE_ID || `VM-DEMO-${Date.now()}`,
      tenantId: process.env.TENANT_ID || '550e8400-e29b-41d4-a716-446655440000',
      ipAddress: '192.168.1.100',
      systemInfo: {
        os: 'Ubuntu 22.04.3 LTS',
        version: 'v18.17.0',
        architecture: 'x64',
        memory: '8GB',
        storage: '256GB SSD'
      }
    };
  }
}

// 메인 실행
async function main() {
  const config = loadSampleConfig();
  const client = new SampleVendingMachineClient(config);

  // 종료 시그널 처리
  process.on('SIGINT', () => {
    console.log(`\n👋 클라이언트 종료`);
    process.exit(0);
  });

  await client.runDemo();
}

if (require.main === module) {
  main().catch(console.error);
}