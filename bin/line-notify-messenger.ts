#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

const s3Stack = new S3Stack(app, 'LineNotifyMessangerS3Stack');
new LambdaStack(app, 'LineNotifyMessengerLambdaStack', {
  bucket: s3Stack.bucket,
});
