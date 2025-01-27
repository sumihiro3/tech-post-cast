export * from './headline-topic-programs';

/**
 * ポッドキャスト配信サービスを表す型
 */
export type Podcast = {
  title: string;
  icon: string;
  link: string;
};

/**
 * SNS サービスを表す型
 */
export type Sns = Podcast;
