#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NodeDemoAwsStack } from '../lib/node_demo_aws-stack';
import { TrafficGeneratorStack } from '../lib/traffic_generator-stack';
import { S3ToLambdaSeedStack } from '../lib/s3_to_lambda_seed-stack';

const app = new cdk.App();
new NodeDemoAwsStack(app, 'NodeDemoAwsStack');
// new ledger
// curl --location --request POST 'http://NodeD-NodeF-16YAE08JGSD8T-1591755771.us-east-1.elb.amazonaws.com/api/db/jake/test/new_ledger' --header 'Content-Type: application/json'
// add netork/ledger to the alb url
const host = 'http://NodeD-NodeF-16YAE08JGSD8T-1591755771.us-east-1.elb.amazonaws.com'
const ledger = 'jake/test';
const queryUrl = `${host}/api/db/${ledger}/query`;
new TrafficGeneratorStack(app, 'TrafficGeneratorStack', {
    queryUrl: queryUrl,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-2'
    }
})
new S3ToLambdaSeedStack(app, 'S3ToLambdaSeedStack', { host: host, ledger: ledger })
