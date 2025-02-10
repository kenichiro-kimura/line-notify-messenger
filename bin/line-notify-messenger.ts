#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaDynamoDBStack } from '../lib/lambda-dynamodb-stack';

const app = new cdk.App();
new LambdaDynamoDBStack(app, 'LambdaDynamoDBStack');
