import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsService {
  async createQueue(deviceId: string): Promise<string> {
    // SQS 생성 후 URL 반환
    return `https://sqs.ap-northeast-2.amazonaws.com/queue/${deviceId}`;
  }
}