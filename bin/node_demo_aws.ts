#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NodeDemoAwsStack } from '../lib/node_demo_aws-stack';
import { TrafficGeneratorStack } from '../lib/traffic_generator-stack';
import { S3ToLambdaSeedStack } from '../lib/s3_to_lambda_seed-stack';

const app = new cdk.App();
const ledgerStack = new NodeDemoAwsStack(app, 'NodeDemoAwsStack', {});
const vpc = ledgerStack.vpc;

const host = "http://" + ledgerStack.lbUrl;
const ledger = 'jake/test'; // ledger name you create with curl command

const queryUrl = `${host}/api/db/${ledger}/query`; // used to ping the node app cluster from the traffic gnerator stack

new TrafficGeneratorStack(app, 'TrafficGeneratorStack', {
    queryUrl: queryUrl,
    vpc: vpc
});

new S3ToLambdaSeedStack(app, 'S3ToLambdaSeedStack', {
    host: host,
    ledger: ledger,
    vpc: vpc
})
