import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットの参照
    const bucket = Bucket.fromBucketName(this, 'LineNotifyMessengerImageBucket', 'line-notify-messenger-image-bucket-name');

    // Lambda関数の作成
    const myFunction = new lambda.Function(this, 'LineNotifyMessenger', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('dist'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      },
    });

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
