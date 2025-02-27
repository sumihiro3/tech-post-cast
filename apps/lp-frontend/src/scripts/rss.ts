import { writeFileSync } from 'fs';
import type { Nitro } from 'nitropack';
import path from 'path';
import RSS from 'rss';
import { getHeadlineTopicProgramList, utcToJstDateString } from '.';

/**
 * Podcast サービス用の RSS フィードを生成する
 * @param nitro Nitro
 */
export default async function generateSpotifyRssFeed(nitro: Nitro): Promise<void> {
  console.log('Generating Spotify RSS feed');
  if (!nitro._prerenderedRoutes) {
    console.warn('No pre-rendered routes found');
    return;
  }
  const publicDir = nitro.options.output.publicDir;
  const lpUrl = process.env.LP_BASE_URL;
  const title = process.env.LP_SITE_NAME!;
  const author = process.env.PODCAST_AUTHOR_NAME;
  const email = process.env.PODCAST_AUTHOR_EMAIL;
  const category = 'Technology';
  const podcastImageUrl = process.env.PODCAST_IMAGE_URL;
  const programImageUrl = process.env.PODCAST_IMAGE_URL;
  const programDescription = process.env.PODCAST_PROGRAM_DESCRIPTION;
  // RSS フィードのファイル名
  const feedFileName = 'rss.xml';
  // ヘッドライントピック番組一覧を取得
  const programs = await getHeadlineTopicProgramList(30);
  // RSSフィードを生成
  const feed = new RSS({
    title,
    description: programDescription,
    site_url: lpUrl!,
    feed_url: `${lpUrl}/${feedFileName}`,
    copyright: author,
    image_url: podcastImageUrl,
    generator: `${title} Feed Generator`,
    language: 'ja',
    pubDate: new Date(),
    categories: [category],
    custom_namespaces: {
      itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
    },
    custom_elements: [
      { 'itunes:author': author },
      {
        'itunes:summary': programDescription,
      },
      {
        'itunes:owner': [{ 'itunes:name': author }, { 'itunes:email': email }],
      },
      {
        'itunes:image': {
          _attr: {
            href: podcastImageUrl,
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
  // ヘッドライントピック番組をRSSフィードに追加
  programs.forEach((program) => {
    // ヘッドライントピック番組の再生時間（ミリ秒）を 秒に変換する
    const duration = program.audioDuration;
    const seconds = Math.floor(duration / 1000);
    // 日付
    const programPublishedAt = utcToJstDateString(program.createdAt);
    // 番組ページのURLを生成する
    const programUrl = `${lpUrl}/headline-topic-programs/${program.id}`;
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
              href: programImageUrl,
            },
          },
        },
        {
          'itunes:duration': seconds,
        },
      ],
    });
  });
  const feedString = feed.xml({ indent: true }); // RSSフィードを文字列に変換する
  // RSSフィードをファイルに書き込む
  writeFileSync(path.join(publicDir, feedFileName), feedString);
}
