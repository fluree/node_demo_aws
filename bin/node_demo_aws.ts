#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NodeDemoAwsStack } from '../lib/node_demo_aws-stack';
import { TrafficGeneratorStack } from '../lib/traffic_generator-stack';

const app = new cdk.App();
new NodeDemoAwsStack(app, 'NodeDemoAwsStack');
// add netork/ledger to the alb url
const url = `http://NodeD-NodeF-MUOQXA562N12-926410140.us-east-1.elb.amazonaws.com/api/db/jake/test/query`;
new TrafficGeneratorStack(app, 'TrafficGeneratorStack', {
    url: url,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-2'
    }
})
