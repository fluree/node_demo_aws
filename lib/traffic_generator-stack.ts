import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
export interface TrafficGeneratorProps extends cdk.StackProps {
    queryUrl: string
}

export class TrafficGeneratorStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: TrafficGeneratorProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "TrafficGenVpc", {
            maxAzs: 2
        })

        const cluster = new ecs.Cluster(this, 'TrafficGenCluster', {
            vpc
        })
        const logging = new ecs.AwsLogDriver({
            streamPrefix: "traffic-generator"
        });

        const taskDef = new ecs.FargateTaskDefinition(this, 'FargateTaskDef', {});
        taskDef.addContainer('trafficgen', {
            image: ecs.ContainerImage.fromAsset('./traffic_generator'),
            logging,
            environment: {
                URL: props.queryUrl
            }
        })
        new ecs.FargateService(this, 'TrafficGenService', {
            cluster,
            taskDefinition: taskDef,
            desiredCount: 50
        })


    }
}