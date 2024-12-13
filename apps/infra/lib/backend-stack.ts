import * as cdk from 'aws-cdk-lib';
import * as apiGatewayV2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apiGatewayV2Integration from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudWatchLogs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { StageConfig } from '../config';

const dockerfileDir = path.join(__dirname, '../../..');

export class TechPostCastBackendStack extends cdk.Stack {
  /** 番組ファイルの URL Prefix */
  public readonly programFileUrlPrefix: string;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    stage: StageConfig,
  ) {
    super(scope, id, props);

    // 番組音声ファイルを保存するS3バケット
    const audioBucket = new s3.Bucket(this, 'TechPostCastAudioBucket', {
      bucketName: `tech-post-cast-program-audio-bucket${stage.suffix}`,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront
    const distribution = new cloudfront.Distribution(
      this,
      'TechPostCastDistribution',
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(audioBucket),
        },
      },
    );
    const programFileUrlPrefix = `https://${distribution.distributionDomainName}`;
    new cdk.CfnOutput(this, 'TechPostCastDistribution URL', {
      value: programFileUrlPrefix,
    });
    this.programFileUrlPrefix = programFileUrlPrefix;

    // Lambda with Docker Image
    const backendLambda = new lambda.DockerImageFunction(
      this,
      'TechPostCastBackendLambda',
      {
        code: lambda.DockerImageCode.fromImageAsset(dockerfileDir, {
          file: 'Dockerfile.backend',
          platform: Platform.LINUX_AMD64,
        }),
        functionName: `TechPostCastBackendLambda${stage.suffixLarge}`,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(15 * 60),
        logRetention: cloudWatchLogs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          // 環境変数
          PORT: '3000',
          SHOW_QUERY_LOGS: 'true',
          // ffmpeg
          FFMPEG_PATH: '/usr/bin/ffmpeg',
          FFPROBE_PATH: '/usr/bin/ffprobe',
          // ヘッドライントピック番組用音声ファイル
          HEADLINE_TOPIC_PROGRAM_TARGET_DIR: '/tmp/headline-topic-programs',
          HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH:
            'assets/audio/headline-topic-programs/bgm.mp3',
          HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH:
            'assets/audio/headline-topic-programs/opening.mp3',
          HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH:
            'assets/audio/headline-topic-programs/ending.mp3',
          HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH:
            'assets/audio/headline-topic-programs/preview.jpg',
          // AWS
          PROGRAM_AUDIO_BUCKET_NAME: audioBucket.bucketName,
          PROGRAM_AUDIO_FILE_URL_PREFIX: programFileUrlPrefix,
        },
      },
    );
    // Lambda 実行ロール
    const backendLambdaRole = backendLambda.role!;
    const lambdaArnExportName = `TechPostCastBackendLambdaArn${stage.suffixLarge}`;
    new cdk.CfnOutput(this, lambdaArnExportName, {
      value: backendLambda.functionArn,
      exportName: lambdaArnExportName,
    });
    const lambdaNameExportName = `TechPostCastBackendLambdaName${stage.suffixLarge}`;
    new cdk.CfnOutput(this, lambdaNameExportName, {
      value: backendLambda.functionName,
      exportName: lambdaNameExportName,
    });
    // Lambda 実行ロールにS3バケットへのアクセス権限を付与
    audioBucket.grantReadWrite(backendLambdaRole);

    // API Gateway
    const backendGateway = new apiGatewayV2.HttpApi(
      this,
      'TechPostCastBackendApi',
      {
        defaultIntegration: new apiGatewayV2Integration.HttpLambdaIntegration(
          `TechPostCastBackendLambdaIntegration${stage.suffixLarge}`,
          backendLambda,
        ),
        apiName: `TechPostCastBackendApi${stage.suffixLarge}`,
      },
    );
    const backendApiUrlExportName = `TechPostCastBackendApiUrl${stage.suffixLarge}`;
    new cdk.CfnOutput(this, backendApiUrlExportName, {
      value: backendGateway.url ?? 'NO URL',
      exportName: backendApiUrlExportName,
    });

    // EventBridge
    // EventBridge から BackendLambda へイベント送信する
    // BackendLambda では、イベントを受けてヘッドライントピック番組を作成する
    if (stage.isProduction()) {
      // 本番環境の場合は、毎日 6:55 (JST) に実行する
      const ruleName = `TechPostCastCreateHeadlineTopicProgramRule${stage.suffixLarge}`;
      const rule = new events.Rule(
        this,
        `TechPostCastCreateHeadlineTopicProgramRule`,
        {
          ruleName: ruleName,
          // JST 6:55 に実行
          schedule: events.Schedule.cron({
            minute: '55',
            hour: '21',
            day: '*',
          }),
          targets: [
            new targets.LambdaFunction(backendLambda, { retryAttempts: 3 }),
          ],
        },
      );
      new cdk.CfnOutput(this, `${ruleName}Arn`, {
        value: rule.ruleArn,
        exportName: `${ruleName}Arn`,
      });
    }
  }
}
