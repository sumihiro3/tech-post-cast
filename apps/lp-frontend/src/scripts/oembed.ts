import { mkdirSync, writeFileSync } from 'fs';
import type { Nitro } from 'nitropack';
import path from 'path';
import { getHeadlineTopicProgramList, utcToJstDateString } from './index';

/**
 * 各番組ページ用の oEmbed JSON ファイルを生成する
 * @param nitro Nitro
*/
export default async function generateOembedJsonFiles(nitro: Nitro): Promise<void> {
  console.log('Generating oEmbed json files');
  if (!nitro._prerenderedRoutes) {
    console.warn('No pre-rendered routes found');
    return;
  }
  const publicDir = nitro.options.output.publicDir;
  const lpUrl = process.env.LP_BASE_URL;
  const siteName = process.env.LP_SITE_NAME!;
  const author = process.env.PODCAST_AUTHOR_NAME;
  const thumbnailImageUrl = process.env.LP_SITE_OGP_IMAGE_URL;
  // ヘッドライントピック番組一覧を取得
  const programs = await getHeadlineTopicProgramList(0);

  const outputDirPath = path.resolve(`${publicDir}/oembed/headline-topic-programs`);
  mkdirSync(outputDirPath, { recursive: true });

  for (const program of programs) {
    // 日付
    const programPublishedAt = utcToJstDateString(program.createdAt);
    const programTitle = `${programPublishedAt} ${program.title}`;
    const oembedData = {
      version: '1.0',
      type: 'rich',
      provider_name: siteName,
      provider_url: lpUrl,
      title: programTitle,
      author_name: author,
      author_url: lpUrl,
      cache_age: 3600,
      thumbnail_url: thumbnailImageUrl,
      thumbnail_width: 600,
      thumbnail_height: 600,
      html: `<iframe src="${lpUrl}/headline-topic-programs/embed/${program.id}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`,
      width: 600,
      height: 400,
    };

    const filePath = path.resolve(outputDirPath, `${program.id}.json`);
    writeFileSync(filePath, JSON.stringify(oembedData, null, 2));
    console.log(`oEmbed JSON generated: ${filePath}`);
  }
}
