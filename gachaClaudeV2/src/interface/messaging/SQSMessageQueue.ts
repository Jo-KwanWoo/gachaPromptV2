import AWS from 'aws-sdk';
import { IMessageQueue } from './IMessageQueue';

export class SQSMessageQueue implements IMessageQueue {
  private sqs: AWS.SQS;

  constructor() {
    this.sqs = new AWS.SQS({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async createQueue(queueName: string): Promise<string> {
    const params = {
      QueueName: queueName,
      Attributes: {
        MessageRetentionPeriod: '1209600', // 14 days
        VisibilityTimeoutSeconds: '30'
      }
    };

    try {
      const result = await this.sqs.createQueue(params).promise();
      if (!result.QueueUrl) {
        throw new Error('Failed to create queue: No queue URL returned');
      }
      return result.QueueUrl;
    } catch (error) {
      throw new Error(`Failed to create SQS queue: ${error}`);
    }
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message)
    };

    try {
      await this.sqs.sendMessage(params).promise();
    } catch (error) {
      throw new Error(`Failed to send message to SQS: ${error}`);
    }
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    const params = {
      QueueUrl: queueUrl
    };

    try {
      await this.sqs.deleteQueue(params).promise();
    } catch (error) {
      throw new Error(`Failed to delete SQS queue: ${error}`);
    }
  }
}