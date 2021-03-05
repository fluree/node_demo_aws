import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns';
import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
export class NodeDemoAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create vpc 
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2
    });


    //create ledger ec2 backed ecs
    const ledger = this.createLedgerService(vpc)

    //create ALB frontend
    const frontend = this.createNodeAppService(vpc)

  }

  createLedgerService(vpc: ec2.IVpc) {
    const cluster = new ecs.Cluster(this, 'ledger-cluster', {
      clusterName: 'ledger-cluster',
      vpc: vpc
    })

    cluster.addCapacity('ledger-scaling-group', {
      instanceType: new ec2.InstanceType('t3.2xlarge'),
      desiredCapacity: 1
    });

    cluster.addDefaultCloudMapNamespace({ name: "ledger.local" });

    const containerTaskRole = new iam.Role(this, 'LedgerTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'LedgerTask', {
      taskRole: containerTaskRole,
    })
    const logging = new ecs.AwsLogDriver({
      streamPrefix: "ledger"
    });
    const container = taskDefinition.addContainer('LedgerContainer', {
      image: ecs.ContainerImage.fromRegistry("fluree/ledger:master"),
      memoryLimitMiB: 31744,
      logging,
    })

    container.addPortMappings({
      containerPort: 8090,
      protocol: ecs.Protocol.TCP
    })

    const service = new ecs.Ec2Service(this, 'ledger-service', {
      cluster,
      desiredCount: 1,
      serviceName: 'ledger1',
      cloudMapOptions: { name: 'ledger1' },
      taskDefinition
    })
    service.connections.allowFromAnyIpv4(ec2.Port.tcp(8090));
    //TODO: figure out allow ports on external docker port
    return service;
  }

  createNodeAppService(vpc: ec2.IVpc) {
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