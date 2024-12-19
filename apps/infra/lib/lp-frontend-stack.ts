import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { StageConfig } from '../config';

export class TechPostCastLpFrontendStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    stage: StageConfig,
  ) {
    super(scope, id, props);
    // アクセスログを保存するS3バケット
    const accessLogBucket = new s3.Bucket(
      this,
      'TechPostCastLpAccessLogBucket',
      {
        bucketName: `tech-post-cast-lp-access-log-bucket${stage.suffix}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: new s3.BlockPublicAccess({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        enforceSSL: true,
        versioned: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      },
    );
    // 1年を過ぎたオブジェクトは GLACIER へ変更するライフサイクルルール
    const lifecycleRule: s3.LifecycleRule = {
      transitions: [
        {
          transitionAfter: cdk.Duration.days(365),
          storageClass: s3.StorageClass.GLACIER,
        },
      ],
    };
    accessLogBucket.addLifecycleRule(lifecycleRule);

    // LP用のS3バケット
    // Nuxt3 で生成された静的ファイルを保存する
    const lpBucket = new s3.Bucket(this, 'TechPostCastLpBucket', {
      bucketName: `tech-post-cast-lp-bucket${stage.suffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }),
      enforceSSL: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: `tech-post-cast-lp-access-log/`,
    });

    // CloudFront ディストリビューション
    // TODO 独自ドメインを設定する
    const distribution = new cloudfront.Distribution(this, 'Default', {
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          ttl: cdk.Duration.minutes(1),
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
        },
        {
          ttl: cdk.Duration.minutes(1),
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error.html',
        },
      ],
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(lpBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      logBucket: accessLogBucket,
      logFilePrefix: `tech-post-cast-lp-cloudfront-log/`,
    });
    const programFileUrlPrefix = `https://${distribution.distributionDomainName}`;
    new cdk.CfnOutput(
      this,
      `TechPostCastLpDistributionUrl${stage.suffixLarge}`,
      {
        value: programFileUrlPrefix,
      },
    );
  }
}
