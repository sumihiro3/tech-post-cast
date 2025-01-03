import * as cdk from 'aws-cdk-lib';
import * as apiGatewayV2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apiGatewayV2Integration from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudWatchLogs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import { StageConfig } from '../config';
import { TechPostCastBackendStack } from './backend-stack';

const dockerfileDir = path.join(__dirname, '../../..');

export class TechPostCastLineBotBackendStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    stage: StageConfig,
    backendStack: TechPostCastBackendStack,
  ) {
    super(scope, id, props);

    // Lambda with Docker Image
    const backendLambda = new lambda.DockerImageFunction(
      this,
      'TechPostCastLineBotBackendLambda',
      {
        code: lambda.DockerImageCode.fromImageAsset(dockerfileDir, {
          file: 'Dockerfile.line-bot-backend',
          platform: Platform.LINUX_AMD64,
        }),
        functionName: `TechPostCastLineBotBackendLambda${stage.suffixLarge}`,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        logRetention: cloudWatchLogs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          PORT: '4000',
          SHOW_QUERY_LOGS: 'true',
        },
      },
    );
    // Lambda 実行ロール
    const lambdaArnExportName = `TechPostCastLineBotBackendLambdaArn${stage.suffixLarge}`;
    new cdk.CfnOutput(this, lambdaArnExportName, {
      value: backendLambda.functionArn,
      exportName: lambdaArnExportName,
    });
    const lambdaNameExportName = `TechPostCastLineBotBackendLambdaName${stage.suffixLarge}`;
    new cdk.CfnOutput(this, lambdaNameExportName, {
      value: backendLambda.functionName,
      exportName: lambdaNameExportName,
    });

    // API Gateway
    const backendGateway = new apiGatewayV2.HttpApi(
      this,
      'TechPostCastLineBotBackendApi',
      {
        defaultIntegration: new apiGatewayV2Integration.HttpLambdaIntegration(
          `TechPostCastLineBotBackendLambdaIntegration${stage.suffixLarge}`,
          backendLambda,
        ),
        apiName: `TechPostCastLineBotBackendApi${stage.suffixLarge}`,
      },
    );
    const backendApiUrlExportName = `TechPostCastLineBotBackendApiUrl${stage.suffixLarge}`;
    new cdk.CfnOutput(this, backendApiUrlExportName, {
      value: backendGateway.url ?? 'NO URL',
      exportName: backendApiUrlExportName,
    });
  }
}
