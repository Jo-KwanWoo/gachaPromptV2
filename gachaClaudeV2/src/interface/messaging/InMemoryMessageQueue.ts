import { IMessageQueue } from './IMessageQueue';

/**
 * In-memory implementation of message queue for testing and development
 */
export class InMemoryMessageQueue implements IMessageQueue {
  private queues: Map<string, any[]> = new Map();

  async createQueue(queueName: string): Promise<string> {
    const queueUrl = `memory://queue/${queueName}`;
    this.queues.set(queueUrl, []);
    return queueUrl;
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    const queue = this.queues.get(queueUrl);
    if (!queue) {
      throw new Error(`Queue ${queueUrl} does not exist`);
    }
    queue.push({
      message,
      timestamp: new Date(),
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    this.queues.delete(queueUrl);
  }

  // Additional methods for testing
  getMessages(queueUrl: string): any[] {
    return this.queues.get(queueUrl) || [];
  }

  getQueueCount(): number {
    return this.queues.size;
  }

  clear(): void {
    this.queues.clear();
  }
}