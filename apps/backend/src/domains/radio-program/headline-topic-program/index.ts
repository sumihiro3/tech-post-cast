import { formatDate } from '@tech-post-cast/commons';
import {
  ProgramFileChapter,
  ProgramFileMetadata,
} from '../program-file-maker.interface';

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
  ) {
    this.artist = artistName;
    this.album = 'ヘッドライントピック';
    this.albumArtist = artistName;
    this.title = `${script.title}（${formatDate(programDate, 'YYYY-MM-DD')}）`;
    this.date = formatDate(programDate, 'YYYY');
    this.genre = 'Technology';
    this.language = 'jpn';
    this.filename = fileName;
  }
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
