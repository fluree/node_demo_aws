#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NodeDemoAwsStack } from '../lib/node_demo_aws-stack';

const app = new cdk.App();
new NodeDemoAwsStack(app, 'NodeDemoAwsStack');
