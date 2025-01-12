import { HeadlineTopicProgram } from '@prisma/client';
import dayjs from 'dayjs';
import { defineNitroPlugin } from 'nitropack/runtime';
import type { Feed } from 'nuxt-module-feed';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('feed:generate', async ({ feed, options }) => {
    switch (options.path) {
      case '/feed.xml': {
        await createTestFeed(feed);
        break;
      }
      case '/atom-feed': {
        await createTestFeed(feed);
        break;
      }
    }
  });

  /**
   * ヘッドライントピック番組の一覧を取得する
   * @returns ヘッドライントピック番組の一覧
   */
  async function getHeadlineTopicProgramList(): Promise<
    HeadlineTopicProgram[]
  > {
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
    // const response = await fetch(
    //   `${apiUrl}/api/v1/headline-topic-programs/count`,
    //   {
    //     method: 'GET',
    //     headers: {
    //       Authorization: `Bearer ${token!}`,
    //     },
    //   },
    // );
    // const dto = (await response.json()) as HeadlineTopicProgramsCountDto;
    // const pageCount = Math.ceil(dto.count / programsPerPage);
    // const dtoList = [];
    // for (let p = 1; p <= pageCount; p++) {
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
    //   dtoList.push(...programs);
    // }
    console.log(
      `ヘッドライントピック番組一覧（${programs.length}件）を取得しました`,
    );
    return programs;
  }

  async function createTestFeed(feed: Feed) {
    const lpUrl = process.env.LP_BASE_URL;
    const title = 'TechPostCast';
    const author = 'TEP Lab';
    const email = 'tpc@tep-lab.com';
    const programDescription = '人気のIT技術記事をAIが解説するポッドキャスト';
    feed.options = {
      id: title,
      title,
      description: programDescription,
      copyright: author,
      image:
        'https://pub-2bec3306c9a1436e8bc204465623e633.r2.dev/headline-topic-program/technology.jpg',
      link: lpUrl,
      generator: 'TechPostCast Feed Generator',
      language: 'ja',
    };
    // feed.addExtension({
    //   name: 'itunes',
    //   objects: {
    //     author,
    //     summary: programDescription,
    //     owner: {
    //       name: author,
    //       email,
    //     },
    //   },
    // });
    feed.addExtension({
      name: 'itunes:author',
      objects: author,
    });

    // ヘッドライントピック番組の一覧を取得する
    const programs = await getHeadlineTopicProgramList();

    programs.forEach((program) => {
      feed.addItem({
        id: program.id,
        title: program.title,
        description: program.title,
        guid: program.id,
        link: `${lpUrl}/headline-topic-programs/${program.id}`,
        content: program.title,
        date: dayjs(program.createdAt.toString()).toDate(),
        enclosure: {
          url: program.audioUrl,
          type: 'audio/mpeg',
          duration: program.audioDuration,
        },
      });
    });

    feed.addCategory('Technology');

    feed.addContributor({
      name: 'TEP Lab',
      email: 'info@tep-lab.com',
      link: lpUrl,
    });
  }
});
