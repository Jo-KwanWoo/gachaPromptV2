import AWS from 'aws-sdk';

export const configureDynamoDB = (): AWS.DynamoDB.DocumentClient => {
  const config: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {
    region: process.env.AWS_REGION || 'us-east-1'
  };

  // For local development with LocalStack
  if (process.env.NODE_ENV === 'development' && process.env.LOCALSTACK_ENDPOINT) {
    config.endpoint = process.env.LOCALSTACK_ENDPOINT;
    config.accessKeyId = 'test';
    config.secretAccessKey = 'test';
  }

  return new AWS.DynamoDB.DocumentClient(config);
};

export const configureSQS = (): AWS.SQS => {
  const config: AWS.SQS.Types.ClientConfiguration = {
    region: process.env.AWS_REGION || 'us-east-1'
  };

  // For local development with LocalStack
  if (process.env.NODE_ENV === 'development' && process.env.LOCALSTACK_ENDPOINT) {
    config.endpoint = process.env.LOCALSTACK_ENDPOINT;
    config.accessKeyId = 'test';
    config.secretAccessKey = 'test';
  }

  return new AWS.SQS(config);
};