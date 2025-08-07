const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB({
  region: process.env.AWS_REGION || 'us-east-1'
});

const tableName = process.env.DEVICES_TABLE_NAME || 'VendingMachineDevices';

const tableParams = {
  TableName: tableName,
  KeySchema: [
    {
      AttributeName: 'hardwareId',
      KeyType: 'HASH' // Partition key
    }
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'hardwareId',
      AttributeType: 'S'
    },
    {
      AttributeName: 'deviceId',
      AttributeType: 'S'
    },
    {
      AttributeName: 'statusIndex',
      AttributeType: 'S'
    }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'DeviceIdIndex',
      KeySchema: [
        {
          AttributeName: 'deviceId',
          KeyType: 'HASH'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      BillingMode: 'PAY_PER_REQUEST'
    },
    {
      IndexName: 'StatusIndex',
      KeySchema: [
        {
          AttributeName: 'statusIndex',
          KeyType: 'HASH'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      BillingMode: 'PAY_PER_REQUEST'
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

async function createTable() {
  try {
    console.log(`Creating DynamoDB table: ${tableName}`);
    
    const result = await dynamodb.createTable(tableParams).promise();
    console.log('Table created successfully:', result.TableDescription.TableName);
    
    // Wait for table to be active
    console.log('Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
    console.log('Table is now active and ready to use!');
    
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log(`Table ${tableName} already exists`);
    } else {
      console.error('Error creating table:', error);
      process.exit(1);
    }
  }
}

async function deleteTable() {
  try {
    console.log(`Deleting DynamoDB table: ${tableName}`);
    await dynamodb.deleteTable({ TableName: tableName }).promise();
    console.log('Table deleted successfully');
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log(`Table ${tableName} does not exist`);
    } else {
      console.error('Error deleting table:', error);
    }
  }
}

// Command line arguments
const command = process.argv[2];

if (command === 'create') {
  createTable();
} else if (command === 'delete') {
  deleteTable();
} else {
  console.log('Usage: node create-dynamodb-table.js [create|delete]');
  process.exit(1);
}