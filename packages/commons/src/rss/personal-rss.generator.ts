import * as RSS from 'rss';
import { formatDate, TIME_ZONE_JST } from '../date.util';
import { RssGenerationOptions, RssGenerationResult } from './types/rss-feed.types';

/**
 * RSS 向けのユーザー情報
 * 実際のAppUserモデルに依存しないように抽象化
 */
export interface RssUser {
  id: string;
  displayName: string;
  rssToken: string;
}

/**
 * RSS 向けのパーソナルプログラム情報
 * 実際のPersonalizedFeedProgramモデルに依存しないように抽象化
 */
export interface RssProgram {
  id: string;
  title: string;
  audioUrl: string;
  audioDuration: number; // ミリ秒
  createdAt: Date;
  imageUrl?: string;
}

/**
 * パーソナルRSSジェネレーター
 * ユーザーのパーソナルプログラムからRSSフィードを生成する
 */
export class PersonalRssGenerator {
  /**
   * ユーザーのRSSフィードを生成する
   */
  static generateUserRss(
    user: RssUser,
    programs: RssProgram[],
    options: RssGenerationOptions,
  ): RssGenerationResult {
    const generatedAt = new Date();

    // 最大エピソード数でフィルタリング
    const maxEpisodes = options.maxEpisodes || 30;
    const limitedPrograms = programs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // 新しい順
      .slice(0, maxEpisodes);

    // RSS フィードのURL
    const feedUrl = `${options.rssUrlPrefix}/u/${user.rssToken}/rss.xml`;

    // フィードのタイトルと説明
    const title = `Tech Post Cast - ${user.displayName}のパーソナルプログラム`;
    const description = `${user.displayName}さん専用のパーソナルプログラムフィードです。あなたの興味に合わせた技術記事を音声でお届けします。`;
    const author = options.authorName || 'Tech Post Cast';
    const category = 'Technology';
    const authorEmail = options.authorEmail || 'info@techpostcast.com';

    // RSSフィードを生成
    const feed = new RSS({
      title,
      description,
      site_url: `${options.rssUrlPrefix}/u/${user.rssToken}`,
      feed_url: feedUrl,
      copyright: author,
      image_url: options.defaultImageUrl,
      generator: `${title} Feed Generator`,
      language: 'ja',
      pubDate: generatedAt,
      categories: [category],
      custom_namespaces: {
        itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
      },
      custom_elements: [
        { 'itunes:author': author },
        {
          'itunes:summary': description,
        },
        {
          'itunes:owner': [{ 'itunes:name': author }, { 'itunes:email': authorEmail }],
        },
        {
          'itunes:image': {
            _attr: {
              href: options.defaultImageUrl,
            },
          },
        },
        {
          'itunes:category': [
            {
              _attr: {
                text: category,
              },
            },
          ],
        },
      ],
    });

    // パーソナライズドプログラムをRSSフィードに追加
    limitedPrograms.forEach((program) => {
      // 再生時間（ミリ秒）を秒に変換する
      const duration = program.audioDuration;
      const seconds = Math.floor(duration / 1000);

      // 日付フォーマット
      const programPublishedAt = this.formatDateForTitle(program.createdAt);

      // 番組ページのURLを生成する
      const programUrl = `${options.baseUrl}/programs/${program.id}`;

      feed.item({
        title: `${programPublishedAt} ${program.title}`,
        description: `今回の紹介記事など詳しくはこちら。\n\n${programUrl}`,
        guid: program.id,
        url: programUrl,
        date: program.createdAt,
        enclosure: {
          url: program.audioUrl,
          type: 'audio/mpeg',
        },
        custom_elements: [
          { 'itunes:author': author },
          {
            'itunes:image': {
              _attr: {
                href: program.imageUrl || options.defaultImageUrl,
              },
            },
          },
          {
            'itunes:duration': seconds,
          },
        ],
      });
    });

    // RSSフィードを文字列に変換する
    const xml = feed.xml({ indent: true });

    return {
      xml,
      episodeCount: limitedPrograms.length,
      generatedAt,
    };
  }

  /**
   * タイトル用の日付フォーマット
   */
  private static formatDateForTitle(date: Date): string {
    // 共通のformatDate関数を使用してJSTで年/月/日形式にフォーマット
    return formatDate(date, 'YYYY/MM/DD', TIME_ZONE_JST);
  }

  /**
   * RSSフィードのバリデーション
   */
  static validateRssGeneration(user: RssUser, programs: RssProgram[]): string[] {
    const errors: string[] = [];

    if (!user.rssToken) {
      errors.push('RSS token is required');
    }

    if (!user.displayName) {
      errors.push('User display name is required');
    }

    if (programs.length === 0) {
      errors.push('At least one program is required');
    }

    for (const program of programs) {
      if (!program.audioUrl) {
        errors.push(`Program ${program.id} is missing audio URL`);
      }

      if (program.audioDuration <= 0) {
        errors.push(`Program ${program.id} has invalid audio duration`);
      }
    }

    return errors;
  }
}
