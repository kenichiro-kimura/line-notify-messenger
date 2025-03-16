import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';

export interface LambdaStackProps extends cdk.StackProps {
  bucket: IBucket;
  dynamo: ITable;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // S3バケットは S3Stack で作成されたものを受け取る
    const bucket = props.bucket;
    // DynamoDBテーブルは DynamoDBStack で作成されたものを受け取る
    const dynamo = props.dynamo;
    // Lambda関数の作成
    const myFunction = new lambda.Function(this, 'LineNotifyMessenger', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambdahandler.handler',
      code: lambda.Code.fromAsset('dist'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
        AUTHORIZATION_TOKEN: process.env.AUTHORIZATION_TOKEN || '',
        S3_REGION: bucket.env.region,
        TABLE_NAME: dynamo.tableName,
        DYNAMO_REGION: dynamo.env.region,
        SEND_MODE: process.env.SEND_MODE || 'broadcast',
      },
      timeout: cdk.Duration.minutes(3),
    });

    // S3バケットへの読み書き権限を付与
    bucket.grantReadWrite(myFunction);

    // DynamoDBテーブルへの読み書き権限を付与
    dynamo.grantReadWriteData(myFunction);

    // Lambda Function URL の作成
    const functionUrl = myFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
      },
    });

    // Function URL を CloudFormation 出力に追加
    new cdk.CfnOutput(this, 'LambdaFunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL',
    });
  }
}
