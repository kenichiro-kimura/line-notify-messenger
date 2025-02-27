#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

const appSuffix = process.env.APP_SUFFIX ? `-${process.env.APP_SUFFIX}` : '';
const s3Stack = new S3Stack(app, `LineNotifyMessengerS3Stack${appSuffix}`);
new LambdaStack(app, `LineNotifyMessengerLambdaStack${appSuffix}`, {
  bucket: s3Stack.bucket,
});
