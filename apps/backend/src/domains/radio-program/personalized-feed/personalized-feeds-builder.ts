import { AppConfigService } from '@/app-config/app-config.service';
import { qiitaPostSummarizeAgent } from '@/mastra/agents';
import {
  PersonalizedProgramScript,
  QiitaPost,
  personalizedProgramScriptSchema,
  qiitaPostSchema,
} from '@/mastra/schemas';
import {
  CREATE_GENERATE_SCRIPT_WORKFLOW,
  createPersonalizedProgramScriptGenerationWorkflow,
} from '@/mastra/workflows';
import {
  AppUserNotFoundError,
  InsufficientPostsError,
  PersonalizeProgramError,
  PersonalizedFeedNotFoundError,
  PersonalizedProgramPersistenceError,
  PersonalizedProgramUploadError,
} from '@/types/errors';
import { IAppUsersRepository } from '@domains/app-user/app-users.repository.interface';
import { IQiitaPostsRepository } from '@domains/qiita-posts/qiita-posts.repository.interface';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';
import { Workflow } from '@mastra/core/workflows';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { QiitaPostApiResponse, formatDate } from '@tech-post-cast/commons';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import { setTimeout } from 'timers/promises';
import { z } from 'zod';
import {
  PersonalizedProgramAudioGenerateResult,
  PersonalizedProgramChapterInfo,
  PersonalizedProgramGenerateResult,
  PersonalizedProgramMetadata,
  PersonalizedProgramScriptGenerationResult,
} from '.';
import {
  IProgramFileUploader,
  ProgramFileUploadCommand,
} from '../file-uploader.interface';
import {
  IProgramFileMaker,
  ProgramFileChapter,
} from '../program-file-maker.interface';
import {
  ITextToSpeechClient,
  PersonalizedProgramAudioFilesGenerateCommand,
  PersonalizedProgramAudioFilesGenerateResult,
} from '../text-to-speech.interface';
import { ProgramUploadResult } from './index';
import { PersonalizedFeedFilterMapper } from './personalized-feed-filter.mapper';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';

// パーソナルプログラム生成に必要な最小記事数
const MIN_POSTS_COUNT = 3;

@Injectable()
export class PersonalizedFeedsBuilder {
  private readonly logger = new Logger(PersonalizedFeedsBuilder.name);

  // Mastra インスタンス
  private mastra: Mastra;

  // 生成した番組の音声ファイルの出力先ディレクトリ
  private readonly programAudioFilesOutputDir;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly filterMapper: PersonalizedFeedFilterMapper,
    private readonly qiitaPostsApiClient: QiitaPostsApiClient,
    @Inject('AppUsersRepository')
    private readonly appUsersRepository: IAppUsersRepository,
    @Inject('PersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
    @Inject('QiitaPostsRepository')
    private readonly qiitaPostsRepository: IQiitaPostsRepository,
    @Inject('TextToSpeechClient')
    private readonly textToSpeechClient: ITextToSpeechClient,
    @Inject('ProgramFileMaker')
    private readonly programFileMaker: IProgramFileMaker,
    @Inject('ProgramFileUploader')
    private readonly programFileUploader: IProgramFileUploader,
  ) {
    // 番組音声ファイルの出力先ディレクトリ
    this.programAudioFilesOutputDir =
      this.appConfig.PersonalizedProgramTargetDir;
    // パーソナルフィード用番組台本生成ワークフローの設定
    const personalizedProgramWorkflow = new Workflow({
      name: 'personalizedProgramWorkflow',
      triggerSchema: z.object({
        userName: z.string().describe('ユーザー名'),
        posts: z.array(qiitaPostSchema).describe('記事のリスト'),
      }),
      mastra: new Mastra(),
      result: {
        schema: personalizedProgramScriptSchema,
      },
    });
    personalizedProgramWorkflow
      .step(createPersonalizedProgramScriptGenerationWorkflow)
      .commit();
    // Mastra インスタンスの初期化
    this.mastra = new Mastra({
      workflows: { personalizedProgramWorkflow },
      agents: { qiitaPostSummarizeAgent },
      logger: createLogger({
        name: 'TechPostCastBackend',
        level: 'info',
      }),
    });
  }

  /**
   * 番組生成対象となるアクティブなパーソナルフィード一覧を取得する
   * @returns アクティブなパーソナルフィード一覧
   */
  async getActiveFeeds(): Promise<PersonalizedFeedWithFilters[]> {
    this.logger.debug(`PersonalizedFeedsBuilder.getActiveFeeds called`);
    const feeds = await this.personalizedFeedsRepository.findActive();
    return feeds;
  }

  /**
   * 指定パーソナルフィードに基づいた番組を生成する
   * @param feedId パーソナルフィードID
   * @param programDate 番組日
   * @returns 生成したパーソナルプログラム
   */
  async buildProgramByFeed(
    feedId: string,
    programDate: Date,
  ): Promise<PersonalizedProgramGenerateResult> {
    this.logger.debug(`PersonalizedFeedsBuilder.buildProgramByFeed called`, {
      feedId,
      programDate,
    });
    try {
      // パーソナルフィードを取得する
      const feed = await this.personalizedFeedsRepository.findOne(feedId);
      if (!feed) {
        throw new PersonalizedFeedNotFoundError(
          `パーソナルフィード [${feedId}] が見つかりませんでした`,
        );
      }
      // パーソナルフィードのユーザーを取得する
      const user = await this.appUsersRepository.findOne(feed.userId);
      if (!user) {
        throw new AppUserNotFoundError(
          `パーソナルフィード [${feedId}] のユーザー [${feed.userId}] が見つかりませんでした`,
        );
      }
      // パーソナルフィードIDを指定して番組生成を行う
      const result = await this.buildProgram(user, feed, programDate);
      this.logger.log(
        `パーソナルフィード [${feedId}] に基づいた番組を生成しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      const errorMessage = `パーソナルフィード [${feedId}] に基づいた番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      if (error instanceof PersonalizeProgramError) {
        throw error;
      }
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }

  /**
   * 指定ユーザーのアクティブなパーソナルフィードに基づいた番組を生成する
   * @param user ユーザー
   * @param programDate 番組日
   * @returns 生成した番組
   */
  async buildProgramByUser(user: AppUser, programDate: Date): Promise<void> {
    this.logger.debug(`PersonalizedFeedsBuilder.buildProgramByUser called`, {
      userId: user.id,
      programDate,
    });
    try {
      // ユーザーのアクティブなパーソナルフィード（番組設定）を取得する
      const feeds =
        await this.personalizedFeedsRepository.findActiveByUser(user);
      this.logger.debug(
        `ユーザー [${user.id}] のアクティブなパーソナルフィードを取得しました`,
        { feeds },
      );
      if (feeds.length === 0) {
        this.logger.warn(
          `ユーザー [${user.id}] のアクティブなパーソナルフィードが見つかりませんでした`,
        );
        return;
      }
      // パーソナルフィードに合致した番組を生成する
      // TODO アクティブなパーソナルフィードが複数ある場合、すべてのフィードに基づいて番組を生成する
      await this.buildProgram(user, feeds[0], programDate);
      this.logger.log(
        `ユーザー [${user.id}] のアクティブなパーソナルフィードに基づいた番組を生成しました`,
      );
    } catch (error) {
      const errorMessage = `ユーザー [${user.id}] のアクティブなパーソナルフィードに基づいた番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }

  /**
   * 指定ユーザーのアクティブなパーソナルフィードに基づいた番組を生成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @returns 生成したパーソナルプログラム
   */
  async buildProgram(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
  ): Promise<PersonalizedProgramGenerateResult> {
    this.logger.debug(`PersonalizedFeedsBuilder.buildProgram called`, {
      userId: user.id,
      feedId: feed.id,
      programDate,
    });
    try {
      // 番組台本の生成
      const scriptGenerationResult =
        await this.generatePersonalizedProgramScript(user, feed, programDate);
      const { script, posts } = scriptGenerationResult;

      // 番組の台本読み上げ音声ファイルを生成する
      const audioFilesGenerateResult =
        await this.generatePersonalizedProgramAudioFiles(
          user,
          feed,
          programDate,
          script,
        );

      this.logger.debug(
        `パーソナルプログラムの音声ファイル生成が完了しました`,
        {
          userId: user.id,
          feedId: feed.id,
          audioFilesGenerateResult,
        },
      );

      // BGM などを組み合わせてパーソナルプログラムの音声ファイルを生成する
      const generateResult = await this.generateProgramFiles(
        user,
        feed,
        script,
        programDate,
        audioFilesGenerateResult,
      );

      this.logger.debug(`パーソナルプログラムの生成が完了しました`, {
        userId: user.id,
        feedId: feed.id,
        generateResult,
      });

      // 1. 番組音声ファイルをS3にアップロード
      const uploadResult = await this.uploadProgramFiles(
        generateResult.audioFilePath,
        user,
        feed,
        programDate,
      );
      this.logger.log(`S3 に番組ファイルをアップロードしました`, {
        uploadResult,
      });

      // 2. DB に記事を登録
      const registeredPosts =
        await this.qiitaPostsRepository.upsertQiitaPosts(posts);
      this.logger.debug(`${registeredPosts.length} 件の記事を登録しました`);

      // 3. DB にパーソナルプログラムを登録
      const program =
        await this.personalizedFeedsRepository.createPersonalizedProgram(
          user,
          feed,
          programDate,
          registeredPosts,
          generateResult,
          uploadResult,
        );

      this.logger.log(`パーソナルプログラムを生成しました`, { program });

      return {
        program,
        qiitaApiRateRemaining: scriptGenerationResult.qiitaApiRateRemaining,
        qiitaApiRateReset: scriptGenerationResult.qiitaApiRateReset,
      };
    } catch (error) {
      const errorMessage = `ユーザー [${user.id}] のアクティブなパーソナルフィードに基づいた番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);

      // エラー種別に応じて適切なエラーをスローする
      if (error instanceof PersonalizedProgramUploadError) {
        throw error; // アップロードエラーはそのまま再スロー
      } else if (error instanceof PersonalizedProgramPersistenceError) {
        throw error; // 永続化エラーはそのまま再スロー
      } else {
        throw new PersonalizeProgramError(errorMessage, { cause: error });
      }
    }
  }

  /**
   * パーソナルプログラムの台本読み上げ音声ファイルを生成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param script 台本
   * @returns パーソナルプログラム音声ファイルの生成結果
   */
  async generatePersonalizedProgramAudioFiles(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    script: PersonalizedProgramScript,
  ): Promise<PersonalizedProgramAudioFilesGenerateResult> {
    this.logger.debug(
      `PersonalizedFeedsBuilder.generatePersonalizedProgramAudioFiles called`,
      {
        userId: user.id,
        feedId: feed.id,
        programDate,
        script,
      },
    );

    const command: PersonalizedProgramAudioFilesGenerateCommand = {
      user,
      feed,
      programDate,
      script,
      outputDir: this.programAudioFilesOutputDir,
    };

    const result =
      await this.textToSpeechClient.generatePersonalizedProgramAudioFiles(
        command,
      );

    this.logger.debug(`パーソナルプログラムの音声ファイルを生成しました`, {
      result,
    });

    return result;
  }

  /**
   * パーソナルプログラムの音声ファイルを生成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param script 台本
   * @param programDate 番組日
   * @param programAudioFileGenerateResult パーソナルプログラムの音声ファイル群生成結果
   * @return パーソナルプログラムファイル生成結果
   */
  async generateProgramFiles(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    script: PersonalizedProgramScript,
    programDate: Date,
    programAudioFileGenerateResult: PersonalizedProgramAudioFilesGenerateResult,
  ): Promise<PersonalizedProgramAudioGenerateResult> {
    this.logger.debug(`PersonalizedFeedsBuilder.generateProgramFiles called`, {
      userId: user.id,
      feedId: feed.id,
      title: script.title,
      programDate,
      programAudioFileGenerateResult,
    });

    // 音声ファイル書き出しまでに時間を要するケースがあるため3秒待つ
    await setTimeout(3 * 1000);

    // 番組で使用する各種音声ファイルのパスを取得
    const bgmAudioFilePath = this.appConfig.PersonalizedProgramBgmFilePath;
    const openingAudioFilePath =
      this.appConfig.PersonalizedProgramOpeningFilePath;
    const endingAudioFilePath =
      this.appConfig.PersonalizedProgramEndingFilePath;

    // 番組メイン部分の音声ファイルリストを作成
    const programAudioFilePaths = this.createProgramMainAudioFileList(
      programAudioFileGenerateResult,
    );

    // 音量設定
    const volumeRate = 2.5;

    // 出力ファイル名とパスを設定
    const now = new Date();
    const programAudioFileName = `personalized-program_${feed.id}_${programDate.getTime()}.mp3`;
    const outputFilePath = `${this.programAudioFilesOutputDir}/${programAudioFileName}`;

    // 番組音声ファイルのチャプターを生成する
    const chapters = await this.generateProgramChapters({
      script,
      programAudioFileGenerateResult,
      openingBgmFilePath: openingAudioFilePath,
      endingBgmFilePath: endingAudioFilePath,
      se1FilePath: this.appConfig.PersonalizedProgramSe1FilePath,
      se2FilePath: this.appConfig.PersonalizedProgramSe2FilePath,
      se3FilePath: this.appConfig.PersonalizedProgramSe3FilePath,
    });

    const userName = `${user.lastName} ${user.firstName}さん`;
    // パーソナルプログラムのメタデータ情報
    const metadata = new PersonalizedProgramMetadata(
      script,
      `${userName}のパーソナルプログラム`,
      programDate,
      programAudioFileName,
      chapters,
    );

    // 番組音声ファイルを生成
    const audioResult = await this.programFileMaker.generateProgramAudioFile({
      programAudioFilePaths,
      bgmAudioFilePath,
      openingAudioFilePath,
      endingAudioFilePath,
      outputFilePath,
      volumeRate,
      metadata,
    });

    // 生成結果を返却
    const result: PersonalizedProgramAudioGenerateResult = {
      audioFileName: programAudioFileName,
      audioFilePath: outputFilePath,
      audioDuration: audioResult.duration,
      script,
      chapters,
    };

    this.logger.log(`パーソナルプログラムを生成しました`, { result });

    return result;
  }

  /**
   * パーソナルプログラムのメイン音声ファイルを構成する音声ファイルのリストを生成する
   * @param programAudioFileGenerateResult パーソナルプログラムの音声ファイル群生成結果
   * @returns メイン音声ファイルを構成する音声ファイルのリスト
   */
  createProgramMainAudioFileList(
    programAudioFileGenerateResult: PersonalizedProgramAudioFilesGenerateResult,
  ): string[] {
    this.logger.debug(
      `PersonalizedFeedsBuilder.createProgramMainAudioFileList called`,
      { programAudioFileGenerateResult },
    );

    // 記事紹介前後に入れる効果音1ファイル
    const se1FilePath = this.appConfig.PersonalizedProgramSe1FilePath;

    // 記事解説部分の音声ファイルリストを生成
    const postExplanationAudioFilePaths: string[] = [];

    // オープニング & イントロダクション
    postExplanationAudioFilePaths.push(
      programAudioFileGenerateResult.openingAudioFilePath,
    );
    postExplanationAudioFilePaths.push(se1FilePath);

    // 各記事の解説パート
    for (
      let i = 0;
      i < programAudioFileGenerateResult.postExplanationAudioFilePaths.length;
      i++
    ) {
      const post =
        programAudioFileGenerateResult.postExplanationAudioFilePaths[i];

      // 記事の紹介
      postExplanationAudioFilePaths.push(post.introAudioFilePath);

      // 効果音（導入と解説の間）
      postExplanationAudioFilePaths.push(
        this.appConfig.PersonalizedProgramSe2FilePath,
      );

      // 記事の解説
      postExplanationAudioFilePaths.push(post.explanationAudioFilePath);

      // 効果音（解説とまとめの間）
      postExplanationAudioFilePaths.push(
        this.appConfig.PersonalizedProgramSe2FilePath,
      );

      // 記事のまとめ
      postExplanationAudioFilePaths.push(post.summaryAudioFilePath);

      // 記事間の効果音（最後の記事の後には入れない）
      if (
        i <
        programAudioFileGenerateResult.postExplanationAudioFilePaths.length - 1
      ) {
        postExplanationAudioFilePaths.push(se1FilePath);
      }
    }

    // エンディング前の効果音
    postExplanationAudioFilePaths.push(
      this.appConfig.PersonalizedProgramSe3FilePath,
    );

    // エンディング
    postExplanationAudioFilePaths.push(
      programAudioFileGenerateResult.endingAudioFilePath,
    );

    return postExplanationAudioFilePaths;
  }

  /**
   * パーソナルプログラムのチャプター情報を生成する
   * @param chapterInfo パーソナルプログラムのチャプター情報生成に必要となる情報
   * @returns パーソナルプログラムのチャプター情報
   */
  async generateProgramChapters(
    chapterInfo: PersonalizedProgramChapterInfo,
  ): Promise<ProgramFileChapter[]> {
    this.logger.debug(
      `PersonalizedFeedsBuilder.generateProgramChapters called`,
      {
        chapterInfo,
      },
    );

    const result: ProgramFileChapter[] = [];

    // 効果音の長さを取得
    const se1Duration = await this.programFileMaker.getAudioDuration(
      chapterInfo.se1FilePath,
    );
    const se2Duration = await this.programFileMaker.getAudioDuration(
      chapterInfo.se2FilePath,
    );
    const se3Duration = await this.programFileMaker.getAudioDuration(
      chapterInfo.se3FilePath,
    );

    // オープニングBGM 部分のチャプター
    const openingEndTime = await this.programFileMaker.getAudioDuration(
      chapterInfo.openingBgmFilePath,
    );
    const openingChapter: ProgramFileChapter = {
      title: 'オープニング',
      startTime: 0,
      endTime: openingEndTime,
    };
    this.logger.debug(`オープニング部分のチャプター`, { openingChapter });
    result.push(openingChapter);

    // イントロ部分のチャプター
    const introDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.programAudioFileGenerateResult.openingAudioFilePath,
    );
    const introEndTime = openingEndTime + introDuration + se1Duration;
    const introChapter: ProgramFileChapter = {
      title: 'イントロダクション',
      startTime: openingEndTime,
      endTime: introEndTime,
    };
    this.logger.debug(`イントロ部分のチャプター`, { introChapter });
    result.push(introChapter);

    // 各記事の解説パートのチャプター（1記事あたり1チャプター）
    let currentTime = introEndTime;
    for (
      let i = 0;
      i <
      chapterInfo.programAudioFileGenerateResult.postExplanationAudioFilePaths
        .length;
      i++
    ) {
      const post = chapterInfo.script.posts[i];
      const explanation =
        chapterInfo.programAudioFileGenerateResult
          .postExplanationAudioFilePaths[i];

      // 記事の紹介部分の長さを取得
      const introDuration = await this.programFileMaker.getAudioDuration(
        explanation.introAudioFilePath,
      );

      // 解説部分の長さを取得
      const explanationDuration = await this.programFileMaker.getAudioDuration(
        explanation.explanationAudioFilePath,
      );

      // まとめ部分の長さを取得
      const summaryDuration = await this.programFileMaker.getAudioDuration(
        explanation.summaryAudioFilePath,
      );

      // 記事パートの合計時間（導入 + 効果音 + 解説 + 効果音 + まとめ）
      const totalPostDuration =
        introDuration +
        se2Duration +
        explanationDuration +
        se2Duration +
        summaryDuration;

      // 記事チャプターの作成
      const postChapter: ProgramFileChapter = {
        title: `記事${i + 1}: ${post.title}`,
        startTime: currentTime,
        endTime: currentTime + totalPostDuration,
      };
      result.push(postChapter);
      this.logger.debug(`記事チャプター`, { postChapter });

      // 次の記事へ
      currentTime += totalPostDuration;

      // 記事間の効果音（最後の記事の後には入れない）
      if (
        i <
        chapterInfo.programAudioFileGenerateResult.postExplanationAudioFilePaths
          .length -
          1
      ) {
        currentTime += se1Duration;
      }
    }

    // エンディング部分のチャプター
    const endingStartTime = currentTime;

    // エンディング前の効果音
    currentTime += se3Duration;

    // エンディング音声の長さ
    const endingDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.programAudioFileGenerateResult.endingAudioFilePath,
    );

    // エンディングBGMの長さ
    const endingBgmDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.endingBgmFilePath,
    );

    // エンディングチャプター
    const endingChapter: ProgramFileChapter = {
      title: 'エンディング',
      startTime: endingStartTime,
      endTime: currentTime + endingDuration + endingBgmDuration,
    };
    this.logger.debug(`エンディング部分のチャプター`, { endingChapter });
    result.push(endingChapter);

    return result;
  }

  /**
   * パーソナルフィードの設定に基づいた番組の台本を生成する
   * @param user
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @returns 生成した番組の台本
   */
  async generatePersonalizedProgramScript(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
  ): Promise<PersonalizedProgramScriptGenerationResult> {
    this.logger.debug(
      `PersonalizedFeedsBuilder.generatePersonalizedProgramScript called`,
      {
        userId: user.id,
        feedId: feed.id,
        feedName: feed.name,
        programDate,
      },
    );
    // パーソナルフィードの設定に合致した Qiita 記事を取得する
    const filter = this.filterMapper.buildQiitaFilterOptions(feed);
    const response =
      await this.qiitaPostsApiClient.findQiitaPostsByPersonalizedFeed(filter);
    const posts = response.posts;
    this.logger.debug(
      `パーソナルフィード [${feed.id}] に基づいた記事を取得しました`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        postsLength: posts.length,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          likes: post.likes_count,
        })),
        qiitaApiRateRemaining: response.rateRemaining,
        qiitaApiRateReset: response.rateReset,
      },
    );
    const filteredPosts = this.filterPostsByLikesCount(posts, feed);
    // 指定のパーソナルフィードの番組で扱っていない記事だけに絞り込む
    const notExistsPosts =
      await this.qiitaPostsRepository.findNotExistsPostsByPersonalizedFeedId(
        feed.id,
        filteredPosts,
      );
    if (notExistsPosts.length < MIN_POSTS_COUNT) {
      const errorMessage = `パーソナルフィード [${feed.id}] に基づいた番組台本の生成に必要な記事が見つかりませんでした`;
      this.logger.error(errorMessage, {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        postsLength: notExistsPosts.length,
      });
      // TODO パーソナルフィードの設定に基づいた番組台本の生成に必要な記事が見つからない場合、
      // エラーを出すのではなく、番組を生成できなかったことをユーザーに通知する
      throw new InsufficientPostsError(errorMessage);
    }
    // 番組で紹介する記事の件数を制限する
    const limitedPosts = notExistsPosts.slice(0, MIN_POSTS_COUNT);
    this.logger.log(
      `パーソナルフィード [${feed.id}] に基づいた番組台本の生成を開始します`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        posts: limitedPosts.map((post) => ({
          id: post.id,
          title: post.title,
          likes: post.likes_count,
        })),
      },
    );
    // 紹介対象記事を元に番組の台本生成フローを実行する
    const script = await this.runPersonalizedProgramScriptGenerationWorkflow(
      programDate,
      user,
      limitedPosts,
    );
    this.logger.log(
      `パーソナルフィード [${feed.id}] に基づいた番組の台本を生成しました`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        script: script,
        posts: limitedPosts.map((post) => ({
          id: post.id,
          title: post.title,
          likes: post.likes_count,
        })),
      },
    );
    return {
      script,
      posts: limitedPosts,
      qiitaApiRateRemaining: response.rateRemaining,
      qiitaApiRateReset: response.rateReset,
    };
  }

  /**
   * 指定のQiita記事リストをいいね数でフィルタリングする
   * @param posts Qiita記事リスト
   * @param feed パーソナルフィード
   * @returns フィルタリングされたQiita記事リスト
   */
  filterPostsByLikesCount(
    posts: QiitaPostApiResponse[],
    feed: PersonalizedFeedWithFilters,
  ): QiitaPostApiResponse[] {
    this.logger.debug(
      `PersonalizedFeedsBuilder.filterPostsByLikesCount called`,
      {
        feedId: feed.id,
        feedName: feed.name,
      },
    );
    const minLikesCount =
      feed.filterGroups[0].likesCountFilters[0].minLikes ?? 0;
    if (minLikesCount <= 0) return posts;
    return posts.filter((post) => post.likes_count >= minLikesCount);
  }

  /**
   * QiitaPostApiResponse から QiitaPost へ変換する
   * @param post QiitaPostApiResponse
   * @returns QiitaPost
   */
  convertToQiitaPost(post: QiitaPostApiResponse): QiitaPost {
    return {
      id: post.id,
      title: post.title,
      content: post.body,
      author: post.user.id,
      tags: post.tags.map((tag) => tag.name),
      createdAt: post.created_at,
    };
  }

  /**
   * パーソナル番組の台本生成ワークフローを実行する
   * @param programDate 番組日
   * @param user ユーザー
   * @param posts Qiita記事リスト
   * @returns 生成された台本
   */
  async runPersonalizedProgramScriptGenerationWorkflow(
    programDate: Date,
    user: AppUser,
    posts: QiitaPostApiResponse[],
  ): Promise<PersonalizedProgramScript> {
    this.logger.debug(
      `PersonalizedFeedsBuilder.runPersonalizedProgramScriptGenerationWorkflow called`,
      {
        programDate,
        userId: user.id,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
        })),
      },
    );
    try {
      // ワークフローの取得
      const workflow = this.mastra.getWorkflow('personalizedProgramWorkflow');
      const run = workflow.createRun();
      const programPosts = posts.map((post) => this.convertToQiitaPost(post));
      const userName = `${user.lastName} ${user.firstName}`;
      // ワークフローを実行する
      const result = await run.start({
        triggerData: {
          userName,
          posts: programPosts,
          programDate,
        },
      });
      this.logger.debug(
        `番組台本生成ワークフロー実行結果: ${JSON.stringify(result.results)}`,
      );
      const workflowName = CREATE_GENERATE_SCRIPT_WORKFLOW;
      const workflowResultStatus = result.results[workflowName].status;
      if (workflowResultStatus !== 'success') {
        const errorMessage = `パーソナルプログラムの台本生成ワークフローが失敗しました`;
        this.logger.error(errorMessage, { result });
        throw new PersonalizeProgramError(errorMessage);
      }
      const generatedScript = result.results[workflowName].output
        ?.scriptGenerationWorkflowResult as PersonalizedProgramScript;
      this.logger.debug(`パーソナル番組の台本生成が完了しました`, {
        generatedScript,
      });
      return generatedScript;
    } catch (error) {
      const errorMessage = `パーソナル番組の台本生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }

  /**
   * 番組音声ファイルを S3 にアップロードする
   * @param audioFilePath 番組音声ファイルのパス
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @returns アップロード結果
   */
  async uploadProgramFiles(
    audioFilePath: string,
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
  ): Promise<ProgramUploadResult> {
    this.logger.debug(`PersonalizedFeedsBuilder.uploadProgramFiles called`, {
      audioFilePath,
      userId: user.id,
      feedId: feed.id,
      programDate,
    });

    try {
      const bucketName = this.appConfig.ProgramAudioBucketName;
      const dt = formatDate(programDate, 'YYYYMMDD');
      const programId = `personalized-program`;
      const objectKeyPrefix = `${programId}/${feed.id}/${dt}/${programId}_${Date.now()}`;

      // 番組音声ファイルをアップロード
      const audioFileUploadCommand: ProgramFileUploadCommand = {
        programId,
        programDate,
        bucketName,
        uploadPath: `${objectKeyPrefix}.mp3`,
        filePath: audioFilePath,
        contentType: 'audio/mpeg',
      };

      const audioUrl = await this.programFileUploader.upload(
        audioFileUploadCommand,
      );

      this.logger.log(`番組音声ファイルをアップロードしました`, {
        uploadCommand: audioFileUploadCommand,
        audioUrl,
      });

      return {
        audioUrl,
      };
    } catch (error) {
      const errorMessage = `番組音声ファイルのアップロード中にエラーが発生しました`;
      this.logger.error(
        errorMessage,
        { error, userId: user.id, feedId: feed.id },
        error.stack,
      );
      throw new PersonalizedProgramUploadError(errorMessage, { cause: error });
    }
  }
}
