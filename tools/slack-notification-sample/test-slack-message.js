const {
  SlackNotificationService,
} = require('../../packages/commons/dist/slack/slack-notification.service');

// テストデータ1: 成功したプログラムがある場合
const successUserData = {
  displayName: '山田太郎',
  attempts: [
    {
      feedName: 'TypeScript 最新情報',
      status: 'SUCCESS',
      reason: null,
      postCount: 8,
      program: {
        id: 'cm9uh6vdr0000l110yr2uf2u9',
        title: 'TypeScript 5.3の新機能とReact 18.2のパフォーマンス改善について',
        audioUrl: 'https://program-files.techpostcast.com/audio/cm9uh6vdr0000l110yr2uf2u9.mp3',
      },
    },
    {
      feedName: 'React 開発情報',
      status: 'SUCCESS',
      reason: null,
      postCount: 5,
      program: {
        id: 'cm9uh6vdr0000l110yr2uf2u8',
        title: 'React Server Componentsの実践的な使い方とNext.js 14の新機能',
        audioUrl: 'https://program-files.techpostcast.com/audio/cm9uh6vdr0000l110yr2uf2u8.mp3',
      },
    },
  ],
};

// テストデータ2: 混合ステータス（成功、スキップ、失敗）
const mixedUserData = {
  displayName: '佐藤花子',
  attempts: [
    {
      feedName: 'JavaScript フレームワーク',
      status: 'SUCCESS',
      reason: null,
      postCount: 3,
      program: {
        id: 'cm9uh6vdr0000l110yr2uf2u7',
        title: 'Vue.js 3.4とAngular 17の比較検討',
        audioUrl: 'https://program-files.techpostcast.com/audio/cm9uh6vdr0000l110yr2uf2u7.mp3',
      },
    },
    {
      feedName: 'Python データサイエンス',
      status: 'SKIPPED',
      reason: '新しい記事が見つかりませんでした',
      postCount: 0,
      program: null,
    },
    {
      feedName: 'AWS クラウド技術',
      status: 'FAILED',
      reason: 'Qiita API制限に達しました',
      postCount: 2,
      program: null,
    },
  ],
};

// テストデータ3: 全て失敗の場合
const failedUserData = {
  displayName: '田中次郎',
  attempts: [
    {
      feedName: 'Docker & Kubernetes',
      status: 'FAILED',
      reason: 'ネットワークエラーが発生しました',
      postCount: 0,
      program: null,
    },
    {
      feedName: 'GraphQL API設計',
      status: 'FAILED',
      reason: 'OpenAI API制限に達しました',
      postCount: 1,
      program: null,
    },
  ],
};

console.log('='.repeat(80));
console.log('🎧 TechPostCast Slack通知メッセージ ペイロード検証');
console.log('='.repeat(80));

console.log('\n📋 テストケース1: 成功したプログラムが複数ある場合');
console.log('-'.repeat(50));
const message1 = SlackNotificationService.buildPersonalProgramNotificationMessage(successUserData);
console.log(JSON.stringify(message1, null, 2));

console.log('\n📋 テストケース2: 混合ステータス（成功、スキップ、失敗）');
console.log('-'.repeat(50));
const message2 = SlackNotificationService.buildPersonalProgramNotificationMessage(mixedUserData);
console.log(JSON.stringify(message2, null, 2));

console.log('\n📋 テストケース3: 全て失敗の場合');
console.log('-'.repeat(50));
const message3 = SlackNotificationService.buildPersonalProgramNotificationMessage(failedUserData);
console.log(JSON.stringify(message3, null, 2));

console.log('\n🔍 メッセージサイズ情報');
console.log('-'.repeat(50));
console.log(`テストケース1: ${JSON.stringify(message1).length} 文字`);
console.log(`テストケース2: ${JSON.stringify(message2).length} 文字`);
console.log(`テストケース3: ${JSON.stringify(message3).length} 文字`);

console.log('\n✅ ペイロード検証完了');
console.log('='.repeat(80));
