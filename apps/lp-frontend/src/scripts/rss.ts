import type { HeadlineTopicProgram } from '@prisma/client';
import { writeFileSync } from 'fs';
import type { Nitro } from 'nitropack';
import path from 'path';
import RSS from 'rss';

export default async function generateSpotifyRssFeed(nitro: Nitro) {
  console.log('Generating Spotify RSS feed');
  if (!nitro._prerenderedRoutes) {
    console.warn('No pre-rendered routes found');
    return;
  }
  const publicDir = nitro.options.output.publicDir;
  const lpUrl = process.env.LP_BASE_URL;
  const title = 'TechPostCast';
  const author = 'TEP Lab';
  const email = 'tpc@tep-lab.com';
  const category = 'Technology';
  const programImageUrl = `https://pub-2bec3306c9a1436e8bc204465623e633.r2.dev/headline-topic-program/technology.jpg`;
  const programDescription = '人気のIT技術記事をAIが解説するポッドキャスト';
  // ヘッドライントピック番組一覧を取得
  const programs = await getHeadlineTopicProgramList();
  // RSSフィードを生成
  const feed = new RSS({
    title,
    description: programDescription,
    site_url: lpUrl!,
    feed_url: `${lpUrl}/feed`,
    copyright: author,
    image_url: programImageUrl,
    generator: 'TechPostCast Feed Generator',
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
            href: programImageUrl,
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
    // ヘッドライントピック番組の再生時間（ミリ秒）を 「{時間}: {分}: {秒}.{ミリ秒}」 の形式に変換する
    const duration = program.audioDuration;
    const hours = Math.floor(duration / (60 * 60 * 1000)); // 時間を算出する
    const minutes = Math.floor(duration / (60 * 1000)); // 分を算出する
    const seconds = Math.floor((duration % (60 * 1000)) / 1000);
    const milliseconds = duration % 1000; // 秒未満の値を算出する
    // 時間、分、秒を2桁の0埋めの文字列に変換する
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    // 番組ページのURLを生成する
    const programUrl = `${lpUrl}/headline-topic-programs/${program.id}`;
    feed.item({
      title: program.title,
      description: `紹介記事: ${programUrl}`,
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
          'itunes:duration': `${hoursString}:${minutesString}:${secondsString}.${milliseconds}`,
        },
      ],
    });
  });
  const feedString = feed.xml({ indent: true }); //This returns the XML as a string.
  writeFileSync(path.join(publicDir, 'feed-by-rss.xml'), feedString);
}

/**
 * ヘッドライントピック番組の一覧を取得する
 * @returns ヘッドライントピック番組の一覧
 */
async function getHeadlineTopicProgramList(): Promise<HeadlineTopicProgram[]> {
  console.debug('getHeadlineTopicProgramList called');
  const apiUrl = process.env.API_BASE_URL;
  const token = process.env.API_ACCESS_TOKEN;
  const programsPerPage = Number(process.env.PROGRAMS_PER_PAGE || 10);
  const lpUrl = process.env.LP_BASE_URL;
  console.log(`API_BASE_URL: ${apiUrl}`);
  console.log(`API_ACCESS_TOKEN: ${token}`);
  console.log(`PROGRAMS_PER_PAGE: ${programsPerPage}`);
  if (!apiUrl || !token || !lpUrl) {
    console.warn(
      'API_BASE_URL または API_ACCESS_TOKEN または LP_BASE_URL が設定されていません',
    );
    return [];
  }
  const response = await fetch(
    `${apiUrl}/api/v1/headline-topic-programs?page=1&limit=${programsPerPage}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token!}`,
      },
    },
  );
  const programs = (await response.json()) as HeadlineTopicProgram[];
  console.log(
    `ヘッドライントピック番組一覧（${programs.length}件）を取得しました`,
  );
  return programs;
}
