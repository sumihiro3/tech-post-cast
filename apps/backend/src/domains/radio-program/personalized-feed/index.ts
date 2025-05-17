import { PersonalizedProgramScript } from '@/mastra/schemas';
import { PersonalizedFeedProgram } from '@prisma/client';
import { formatDate, QiitaPostApiResponse } from '@tech-post-cast/commons';
import { ProgramFileChapter } from '../program-file-maker.interface';
import { PersonalizedProgramAudioFilesGenerateResult } from '../text-to-speech.interface';

/**
 * パーソナルプログラムの台本生成結果
 */
export type PersonalizedProgramScriptGenerationResult = {
  /** 番組台本 */
  script: PersonalizedProgramScript;
  /** 番組で紹介している Qiita 記事 */
  posts: QiitaPostApiResponse[];
  /** Qiita API 残り回数 */
  qiitaApiRateRemaining: number;
  /** Qiita API リセット時間 */
  qiitaApiRateReset: number;
};

/**
 * パーソナルプログラムのチャプター情報生成に必要となる情報を表すインターフェイス
 */
export interface PersonalizedProgramChapterInfo {
  /** 番組の台本 */
  script: PersonalizedProgramScript;
  /** 番組の音声ファイルの生成結果 */
  programAudioFileGenerateResult: PersonalizedProgramAudioFilesGenerateResult;
  /** 番組オープニングBGMのファイルパス */
  openingBgmFilePath: string;
  /** 番組エンディングBGMのファイルパス */
  endingBgmFilePath: string;
  /** 効果音1のファイルパス */
  se1FilePath: string;
  /** 効果音2のファイルパス */
  se2FilePath: string;
  /** 効果音3のファイルパス */
  se3FilePath: string;
}

/**
 * パーソナルプログラムの音声ファイルの生成結果を表すインターフェイス
 */
export interface PersonalizedProgramAudioGenerateResult {
  /** 音声ファイル名 */
  audioFileName: string;
  /** 音声ファイルパス */
  audioFilePath: string;
  /** 音声ファイルの長さ（ミリ秒） */
  audioDuration: number;
  /** 台本 */
  script: PersonalizedProgramScript;
  /** チャプター情報 */
  chapters: ProgramFileChapter[];
}

/**
 * アップロード結果を表すインターフェイス
 */
export interface ProgramUploadResult {
  /** 音声ファイルURL */
  audioUrl: string;
  /** 動画ファイルURL */
  videoUrl?: string;
  /** 画像ファイルURL */
  imageUrl?: string;
}

/**
 * パーソナルプログラムの情報を表すクラス
 * ffmpeg で音声ファイル、動画ファイルに埋め込むメタデータ情報
 */
export class PersonalizedProgramMetadata {
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
    script: PersonalizedProgramScript,
    artistName: string,
    programDate: Date,
    fileName: string,
    chapters: ProgramFileChapter[],
  ) {
    this.artist = artistName;
    this.album = 'パーソナルプログラム';
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
 * パーソナルプログラムの生成結果を表すインターフェイス
 */
export interface PersonalizedProgramGenerateResult {
  /** パーソナルプログラム */
  program: PersonalizedFeedProgram;
  /** Qiita API 残り回数 */
  qiitaApiRateRemaining: number;
  /** Qiita API リセット時間 */
  qiitaApiRateReset: number;
}
