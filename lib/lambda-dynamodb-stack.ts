import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class LambdaDynamoDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDBテーブルの作成
    const table = new dynamodb.Table(this, 'LINE-Notify-Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.RETAIN, // デプロイ時に既存のテーブルの内容を保持
    });

    // Lambda関数の作成
    const myFunction = new lambda.Function(this, 'LineNotifyMessenger', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('dist'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Lambda関数にDynamoDBテーブルへのアクセス権限を付与
    table.grantReadWriteData(myFunction);
  }
}
