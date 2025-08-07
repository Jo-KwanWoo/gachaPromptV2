import { IMessageQueue } from './IMessageQueue';

export class MockMessageQueue implements IMessageQueue {
  private queues: Map<string, string> = new Map();

  async createQueue(queueName: string): Promise<string> {
    const queueUrl = `https://mock-sqs.amazonaws.com/123456789/${queueName}`;
    this.queues.set(queueName, queueUrl);
    console.log(`Mock SQS Queue created: ${queueUrl}`);
    return queueUrl;
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    console.log(`Mock message sent to ${queueUrl}:`, message);
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    console.log(`Mock SQS Queue deleted: ${queueUrl}`);
  }
}