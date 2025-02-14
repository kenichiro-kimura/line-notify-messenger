import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export interface LambdaStackProps extends cdk.StackProps {
  bucket: IBucket;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // S3バケットは S3Stack で作成されたものを受け取る
    const bucket = props.bucket;

    // Lambda関数の作成
    const myFunction = new lambda.Function(this, 'LineNotifyMessenger', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('dist'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
        AUTHORIZATION_TOKEN: process.env.AUTHORIZATION_TOKEN || '',
      },
      timeout: cdk.Duration.minutes(3),
    });

    // S3バケットへの読み書き権限を付与
    bucket.grantReadWrite(myFunction);

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
