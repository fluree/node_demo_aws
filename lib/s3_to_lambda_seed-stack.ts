import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from "@aws-cdk/aws-lambda";
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
export interface S3ToLambdaSeedStackProps extends cdk.StackProps {
    host: string,
    ledger: string
}

export class S3ToLambdaSeedStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: S3ToLambdaSeedStackProps) {
        super(scope, id, props);

        const bucket = new s3.Bucket(this, 'OnBoardBucket', {})

        const onboardFromS3Lambda = new lambda.Function(this, "OnboardFromS3Lambda", {
            code: lambda.Code.fromAsset("./onboard_lambda"),
            handler: 'onboards3.handler',
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                HOST: props.host,
                LEDGER: props.ledger
            }
        });

        bucket.grantRead(onboardFromS3Lambda);

        onboardFromS3Lambda.addEventSource(new S3EventSource(bucket, {
            events: [s3.EventType.OBJECT_CREATED]
        }))
    }
}