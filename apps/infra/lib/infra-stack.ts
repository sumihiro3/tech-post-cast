import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGatewayV2Integration from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apiGatewayV2 from "aws-cdk-lib/aws-apigatewayv2";
import * as cloudWatchLogs from "aws-cdk-lib/aws-logs";
import * as path from 'path';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';

const dockerfileDir = path.join(__dirname, '../../..');

export class TechPostCastInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Lambda with Docker Image
    const backendLambda = new lambda.DockerImageFunction(this, 'TechPostCastBackendLambda', {
      code: lambda.DockerImageCode.fromImageAsset(dockerfileDir, {
        file: 'Dockerfile.backend',
        platform: Platform.LINUX_AMD64,
      }),
        functionName: 'TechPostCastBackendLambda',
        memorySize: 128,
        timeout: cdk.Duration.seconds(10 * 60),
        logRetention: cloudWatchLogs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
      });
    new cdk.CfnOutput(this, 'TechPostCastBackendLambdaArn', {
      value: backendLambda.functionArn,
      exportName: 'TechPostCastBackendLambdaArn',
    });
    new cdk.CfnOutput(this, 'TechPostCastBackendLambdaName', {
      value: backendLambda.functionName,
      exportName: 'TechPostCastBackendLambdaName',
    });

    // API Gateway
    const backendGateway = new apiGatewayV2.HttpApi(this, 'TechPostCastBackendApi', {
      defaultIntegration: new apiGatewayV2Integration.HttpLambdaIntegration(
        `TechPostCastBackendLambdaIntegration`, backendLambda,
      ),
      apiName: `TechPostCastBackendApi`,
    });
    new cdk.CfnOutput(this, 'TechPostCastBackendApiUrl', {
      value: backendGateway.url ?? 'NO URL',
      exportName: 'TechPostCastBackendApiUrl',
    });
  }
}
