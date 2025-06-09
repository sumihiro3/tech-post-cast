const {
  SlackNotificationService,
} = require('../../packages/commons/dist/slack/slack-notification.service');

// テストデータ: 成功したプログラムがある場合
const userData = {
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

const message = SlackNotificationService.buildPersonalProgramNotificationMessage(userData);
console.log(JSON.stringify(message, null, 2));
