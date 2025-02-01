import { formatDate } from '@tech-post-cast/commons';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import {
  ProgramFileChapter,
  ProgramFileMetadata,
} from '../program-file-maker.interface';
import { HeadlineTopicProgramAudioFilesGenerateResult } from '../text-to-speech.interface';

export * from './headline-topic-program-maker';

/**
 * 記事の要約を表すインターフェイス
 */
export interface PostSummary {
  /** 記事ID */
  postId: string;
  /** 記事のタイトル */
  title: string;
  /** 記事の要約 */
  summary: string;
}

/**
 * ヘッドライントピック番組の台本を表すインターフェイス
 */
export interface HeadlineTopicProgramScript {
  /**
   * タイトル
   */
  title: string;

  /**
   * イントロダクション
   */
  intro: string;

  /**
   * 紹介記事の要約
   */
  posts: PostSummary[];

  /**
   * エンディング
   */
  ending: string;
}

/**
 * ヘッドライントピック番組のチャプター情報生成に必要となる情報を表すインターフェイス
 */
export interface HeadlineTopicProgramChapterInfo {
  /** 番組の台本 */
  script: HeadlineTopicProgramScript;
  /** 番組の音声ファイルの生成結果 */
  programAudioFileGenerateResult: HeadlineTopicProgramAudioFilesGenerateResult;
  /** 番組オープニングBGMのファイルパス */
  openingBgmFilePath: string;
  /** 番組エンディングBGMのファイルパス */
  endingBgmFilePath: string;
  /** 短い効果音のファイルパス */
  seShortFilePath: string;
  /** 長い効果音のファイルパス */
  seLongFilePath: string;
}

/**
 * ヘッドライントピック番組の情報を表すクラス
 * ffmpeg で音声ファイル、動画ファイルに埋め込むメタデータ情報
 */
export class HeadlineTopicProgramMetadata implements ProgramFileMetadata {
  /** artist */
  artist: string;
  /** album */
  album: string;
  /** albumArtist */
  albumArtist: string;
  /** title */
  title: string;
  /** copyright */
  copyright: string;
  /** date */
  date: string;
  /** genre */
  genre: string;
  /** language */
  language: string;
  /** filename */
  filename: string;
  /** チャプター一覧 */
  chapters?: ProgramFileChapter[];

  constructor(
    script: HeadlineTopicProgramScript,
    artistName: string,
    programDate: Date,
    fileName: string,
    chapters: ProgramFileChapter[],
  ) {
    this.artist = artistName;
    this.album = 'ヘッドライントピック';
    this.albumArtist = artistName;
    this.title = `${script.title}（${formatDate(programDate, 'YYYY-MM-DD')}）`;
    this.date = formatDate(programDate, 'YYYY');
    this.genre = 'Technology';
    this.language = 'jpn';
    this.filename = fileName;
    this.chapters = chapters;
  }
}

/**
 * 指定のヘッドライントピック番組および、前後の日付の番組を表すインターフェイス
 */
export interface HeadlineTopicProgramWithNeighbors {
  /** 前日の番組 */
  previous: HeadlineTopicProgramWithQiitaPosts | null;
  /** 指定の番組 */
  target: HeadlineTopicProgramWithQiitaPosts;
  /** 翌日の番組 */
  next: HeadlineTopicProgramWithQiitaPosts | null;
}

/**
 * ヘッドライントピック番組の生成結果を表すインターフェイス
 */
export interface HeadlineTopicProgramGenerateResult {
  /**
   * 音声ファイル名
   */
  audioFileName: string;
  /**
   * 音声ファイルのパス
   */
  audioFilePath: string;
  /**
   * 音声ファイルの長さ（ミリ秒）
   */
  audioDuration: number;
  /**
   * 台本
   */
  script: HeadlineTopicProgramScript;
  /** チャプター一覧 */
  chapters: ProgramFileChapter[];
}

/**
 * 番組音声ファイル、動画ファイルのアップロード結果を表すインターフェイス
 */
export interface ProgramUploadResult {
  audioUrl: string;
}

/** 番組の再生成種別 */
export const ProgramRegenerationTypeEnum = [
  'AUDIO_ONLY', // 音声のみ
  'SCRIPT_AND_AUDIO', // 台本と音声
] as const;

/** 番組の再生成種別 */
export type ProgramRegenerationType =
  (typeof ProgramRegenerationTypeEnum)[number];
