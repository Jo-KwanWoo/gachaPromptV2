import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

  // DynamoDB Configuration
  DEVICES_TABLE_NAME: process.env.DEVICES_TABLE_NAME || 'VendingMachineDevices',

  // SQS Configuration
  SQS_QUEUE_PREFIX: process.env.SQS_QUEUE_PREFIX || 'vending-machine-',

  // LocalStack Configuration (for development)
  LOCALSTACK_ENDPOINT: process.env.LOCALSTACK_ENDPOINT,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'),

  // Development Configuration
  USE_SAMPLE_DATA: process.env.USE_SAMPLE_DATA === 'true' || process.env.NODE_ENV === 'development',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'development'
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';