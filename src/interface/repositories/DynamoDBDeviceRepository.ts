import AWS from 'aws-sdk';
import { DeviceEntity, DeviceStatus, SystemInfo } from '../../domain/Device';
import { IDeviceRepository } from './IDeviceRepository';

export class DynamoDBDeviceRepository implements IDeviceRepository {
  private dynamodb: AWS.DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.tableName = process.env.DEVICES_TABLE_NAME || 'VendingMachineDevices';
  }

  async save(device: DeviceEntity): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        hardwareId: device.hardwareId,
        tenantId: device.tenantId,
        ipAddress: device.ipAddress,
        systemInfo: device.systemInfo,
        status: device.status,
        deviceId: device.deviceId,
        sqsQueueUrl: device.sqsQueueUrl,
        createdAt: device.createdAt.toISOString(),
        updatedAt: device.updatedAt.toISOString(),
        rejectionReason: device.rejectionReason,
        // GSI for status queries
        statusIndex: device.status
      }
    };

    try {
      await this.dynamodb.put(params).promise();
    } catch (error) {
      throw new Error(`Failed to save device: ${error}`);
    }
  }

  async findByHardwareId(hardwareId: string): Promise<DeviceEntity | null> {
    const params = {
      TableName: this.tableName,
      Key: { hardwareId }
    };

    try {
      const result = await this.dynamodb.get(params).promise();
      if (!result.Item) {
        return null;
      }
      return this.mapToEntity(result.Item);
    } catch (error) {
      throw new Error(`Failed to find device by hardware ID: ${error}`);
    }
  }

  async findByDeviceId(deviceId: string): Promise<DeviceEntity | null> {
    const params = {
      TableName: this.tableName,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId
      }
    };

    try {
      const result = await this.dynamodb.query(params).promise();
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      return this.mapToEntity(result.Items[0]);
    } catch (error) {
      throw new Error(`Failed to find device by device ID: ${error}`);
    }
  }

  async findPendingDevices(): Promise<DeviceEntity[]> {
    const params = {
      TableName: this.tableName,
      IndexName: 'StatusIndex',
      KeyConditionExpression: 'statusIndex = :status',
      ExpressionAttributeValues: {
        ':status': DeviceStatus.PENDING
      }
    };

    try {
      const result = await this.dynamodb.query(params).promise();
      if (!result.Items) {
        return [];
      }
      return result.Items.map(item => this.mapToEntity(item));
    } catch (error) {
      throw new Error(`Failed to find pending devices: ${error}`);
    }
  }

  async update(device: DeviceEntity): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: { hardwareId: device.hardwareId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, deviceId = :deviceId, sqsQueueUrl = :sqsQueueUrl, rejectionReason = :rejectionReason, statusIndex = :statusIndex',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': device.status,
        ':updatedAt': device.updatedAt.toISOString(),
        ':deviceId': device.deviceId,
        ':sqsQueueUrl': device.sqsQueueUrl,
        ':rejectionReason': device.rejectionReason,
        ':statusIndex': device.status
      }
    };

    try {
      await this.dynamodb.update(params).promise();
    } catch (error) {
      throw new Error(`Failed to update device: ${error}`);
    }
  }

  async delete(hardwareId: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: { hardwareId }
    };

    try {
      await this.dynamodb.delete(params).promise();
    } catch (error) {
      throw new Error(`Failed to delete device: ${error}`);
    }
  }

  async exists(hardwareId: string): Promise<boolean> {
    const device = await this.findByHardwareId(hardwareId);
    return device !== null;
  }

  private mapToEntity(item: any): DeviceEntity {
    return new DeviceEntity(
      item.hardwareId,
      item.tenantId,
      item.ipAddress,
      item.systemInfo as SystemInfo,
      item.status as DeviceStatus,
      item.deviceId,
      item.sqsQueueUrl,
      new Date(item.createdAt),
      new Date(item.updatedAt),
      item.rejectionReason
    );
  }
}