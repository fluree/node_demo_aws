import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns';
import * as path from 'path';
export class NodeDemoAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create vpc 
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2
    })

    //create ledger ec2 backed ecs
    const ledger = this.createLedgerService(vpc)

    const frontend = this.createNodeAppService(vpc)


  }

  createLedgerService(vpc: ec2.Vpc) {
    const cluster = new ecs.Cluster(this, 'ledger-cluster', {
      clusterName: 'ledger-cluster',
      vpc: vpc
    })

    cluster.addCapacity('ledger-scaling-group', {
      instanceType: new ec2.InstanceType('t3.2xlarge'),
      desiredCapacity: 1
    });

    return new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'ledger-service', {
      cluster,
      desiredCount: 1,
      serviceName: 'ledger-service-app',
      memoryLimitMiB: 31744,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("fluree/ledger:master"),
        containerPort: 8090
      },
      publicLoadBalancer: true
    })
  }

  createNodeAppService(vpc: ec2.Vpc) {
    const cluster = new ecs.Cluster(this, 'NodeCluster', { vpc })
    return new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'NodeFargateService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, "../", "nodejs_server_docker")),
        containerPort: 3000
      }
    })
  }
}
