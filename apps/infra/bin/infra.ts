#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {
  developStageConfig,
  productionStageConfig,
  StageConfig,
} from '../config';
import { TechPostCastBackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// 環境名が指定されているかをチェック
const argEnvironmentKey = 'environment';
const environmentName = app.node.tryGetContext(argEnvironmentKey);
if (environmentName === undefined) {
  throw new Error(
    `環境名が指定されていません ex) cdk deploy --context ${argEnvironmentKey}=develop`,
  );
}
// 環境別の設定を取得
const stageConfig = getStageConfig(environmentName);
console.log(`[${stageConfig.nameJp}] の環境構築を開始します`);

// 環境構築
const stack = new TechPostCastBackendStack(
  app,
  stageConfig.stackName,
  {
    env: { account: '788588148195', region: 'ap-northeast-1' },
  },
  stageConfig,
);

// Tag 付け
cdk.Tags.of(app).add('ServiceName', 'TechPostCast');
cdk.Tags.of(stack).add('Environment', stageConfig.name);

console.log(`[${stageConfig.nameJp}] の環境構築が完了しました`);

/**
 * 環境別設定を取得する
 * @param envName 環境名
 */
function getStageConfig(envName: string): StageConfig {
  console.debug(`getStageConfig: [environment: ${envName}]`);
  switch (envName) {
    case 'develop':
      return developStageConfig;
    case 'production':
      return productionStageConfig;
    default:
      throw new Error(`指定された環境名 [${envName}] が不正です`);
  }
}
