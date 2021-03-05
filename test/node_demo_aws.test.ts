import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as NodeDemoAws from '../lib/node_demo_aws-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new NodeDemoAws.NodeDemoAwsStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
