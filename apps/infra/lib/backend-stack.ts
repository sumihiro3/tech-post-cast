import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as apiGatewayV2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apiGatewayV2Integration from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as chatbot from 'aws-cdk-lib/aws-chatbot';
import * as cloudWatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudWatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudWatchLogs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { StageConfig } from '../config';

export class TechPostCastBackendStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    stage: StageConfig,
  ) {
    super(scope, id, props);

    // ECR
    const repository = new ecr.Repository(
      this,
      'TechPostCastBackendRepository',
      {
        repositoryName: `tech-post-cast-backend-repository${stage.suffix}`,
        removalPolicy: RemovalPolicy.DESTROY,
        imageScanOnPush: true,
      },
    );
    repository.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // Lifecycle rule
    repository.addLifecycleRule({
      tagStatus: ecr.TagStatus.UNTAGGED,
      maxImageCount: 5,
      description: 'Leave 5 untagged images and delete all others',
    });

    // Lambda with Docker Image
    const backendLambda = new lambda.DockerImageFunction(
      this,
      'TechPostCastBackendLambda',
      {
        code: lambda.DockerImageCode.fromEcr(repository, {
          tagOrDigest: 'latest',
        }),
        functionName: `TechPostCastBackendLambda${stage.suffixLarge}`,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(15 * 60),
        logRetention: cloudWatchLogs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          // 環境変数
          PORT: '3000',
          // API token for frontend API v1
          V1_API_ACCESS_TOKEN: stage.v1ApiAccessToken,
          // API token for backend API
          BACKEND_API_ACCESS_TOKEN: stage.backendApiAccessToken,
          // Database
          DATABASE_URL: stage.databaseUrl,
          SHOW_QUERY_LOGS: 'true',
          // Qiita API
          QIITA_API_ACCESS_TOKEN: stage.qiitaApiAccessToken,
          // OpenAI
          OPENAI_API_KEY: stage.openAiApiKey,
          OPEN_AI_SUMMARIZATION_MODEL: 'gpt-4o-mini',
          OPEN_AI_SCRIPT_GENERATION_MODEL: 'gpt-4o-mini',
          // ffmpeg
          FFMPEG_PATH: '/usr/bin/ffmpeg',
          FFPROBE_PATH: '/usr/bin/ffprobe',
          // 番組ファイル生成で利用する一時ファイルの保存先
          PROGRAM_FILE_GENERATION_TEMP_DIR: '/tmp/program-file-maker',
          // ヘッドライントピック番組用音声ファイル
          HEADLINE_TOPIC_PROGRAM_TARGET_DIR: '/tmp/headline-topic-programs',
          HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH:
            'assets/audio/headline-topic-programs/bgm.mp3',
          HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH:
            'assets/audio/headline-topic-programs/opening.mp3',
          HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH:
            'assets/audio/headline-topic-programs/ending.mp3',
          HEADLINE_TOPIC_PROGRAM_SE_SHORT_FILE_PATH:
            'assets/audio/headline-topic-programs/se_short.mp3',
          HEADLINE_TOPIC_PROGRAM_SE_LONG_FILE_PATH:
            'assets/audio/headline-topic-programs/se_long.mp3',
          HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH:
            'assets/audio/headline-topic-programs/preview.jpg',
          PROGRAM_AUDIO_BUCKET_NAME: stage.programFileBucketName,
          PROGRAM_AUDIO_FILE_URL_PREFIX: stage.programFileUrlPrefix,
          // Cloudflare
          CLOUDFLARE_ACCESS_KEY_ID: stage.cloudflareAccessKeyId,
          CLOUDFLARE_SECRET_ACCESS_KEY: stage.cloudflareSecretAccessKey,
          CLOUDFLARE_R2_ENDPOINT: stage.cloudflareR2Endpoint,
          // LP 再生成実行用の Deploy Hook URL
          LP_DEPLOY_HOOK_URL: stage.lpDeployHookUrl,
          // LP のベース URL
          LP_BASE_URL: stage.lpBaseUrl,
          // Google Cloud
          GCP_CREDENTIALS_FILE_PATH: stage.gcpCredentialsFilePath,
          // X へのポスト設定
          POST_TO_X: stage.postToX,
          X_API_KEY: stage.xApiKey,
          X_API_SECRET: stage.xApiSecret,
          X_API_ACCESS_TOKEN: stage.xApiAccessToken,
          X_API_ACCESS_SECRET: stage.xApiAccessSecret,
        },
      },
    );
    // Lambda 実行ロール
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

    // エラー通知用の SNS トピック
    const errorTopic = new sns.Topic(this, 'TechPostCastErrorTopic', {
      displayName: `TechPostCastErrorTopic${stage.suffixLarge}`,
      topicName: `TechPostCastErrorTopic${stage.suffixLarge}`,
    });
    // Chatbot用のIAMロール・ポリシー
    const chatbotRole = new iam.Role(this, 'TechPostCastChatbotRole', {
      roleName: `TechPostCastChatbotRole${stage.suffixLarge}`,
      assumedBy: new iam.ServicePrincipal('chatbot.amazonaws.com'),
    });
    chatbotRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'CloudWatchLogsReadOnlyAccess',
      ),
    );
    chatbotRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: [
          'cloudwatch:Describe*',
          'cloudwatch:Get*',
          'cloudwatch:List*',
        ],
      }),
    );
    // Chatbot設定
    const cb = new chatbot.SlackChannelConfiguration(
      this,
      'TechPostCastSlackChannelConfiguration',
      {
        slackChannelConfigurationName: `TechPostCastSlackChannelConfiguration${stage.suffixLarge}`,
        slackWorkspaceId: stage.awsChatbotSlackWorkspaceId,
        slackChannelId: stage.slackChannelId,
        notificationTopics: [errorTopic],
        loggingLevel: chatbot.LoggingLevel.INFO,
        role: chatbotRole,
      },
    );
    // CloudWatchアラーム
    const backendLambdaErrorAlarm = new cloudWatch.Alarm(
      this,
      'TechPostCastBackendLambdaErrorAlarm',
      {
        alarmName: `TechPostCastBackendLambdaErrorAlarm${stage.suffixLarge}`,
        alarmDescription: `TechPostCast's backend lambda error log alarm for ${stage.name}`,
        threshold: 1,
        evaluationPeriods: 1,
        metric: backendLambda.metricErrors(),
        datapointsToAlarm: 1,
        treatMissingData: cloudWatch.TreatMissingData.NOT_BREACHING,
      },
    );
    backendLambdaErrorAlarm.addAlarmAction(
      new cloudWatchActions.SnsAction(errorTopic),
    );

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
