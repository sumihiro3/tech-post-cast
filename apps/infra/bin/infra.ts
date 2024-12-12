#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TechPostCastInfraStack } from '../lib/infra-stack';

const app = new cdk.App();
const stack = new TechPostCastInfraStack(app, 'TechPostCastStack', {
  env: { account: '788588148195', region: 'ap-northeast-1' },
});

// Tag 付け
cdk.Tags.of(app).add('ServiceName', 'TechPostCast');
// cdk.Tags.of(stack).add('Environment', stageConfig.name);
