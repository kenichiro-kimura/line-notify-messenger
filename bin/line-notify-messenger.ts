#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';
import { S3Stack } from '../lib/s3-stack';

const app = new cdk.App();
new LambdaStack(app, 'LambdaStack');
new S3Stack(app, 'S3Stack');
