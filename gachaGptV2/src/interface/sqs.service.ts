import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsService {
  async createQueue(deviceId: string): Promise<string> {
    console.log(`📨 SQS 큐 생성: ${deviceId}`);
    
    // 실제 환경에서는 AWS SQS 큐 생성
    const queueUrl = `https://sqs.ap-northeast-2.amazonaws.com/123456789012/gacha-vm-queue-${deviceId}`;
    
    // Mock 지연 시간 (실제 AWS 호출 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return queueUrl;
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    console.log(`📤 SQS 메시지 전송: ${queueUrl}`);
    console.log(`   메시지: ${JSON.stringify(message)}`);
  }
}