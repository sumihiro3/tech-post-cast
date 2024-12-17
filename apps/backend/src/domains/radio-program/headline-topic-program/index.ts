import { formatDate } from '@tech-post-cast/commons';

export * from './headline-topic-program-maker';

/**
 * 記事の要約を表すインターフェイス
 */
export interface PostSummary {
  /**
   * 記事の要約
   */
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
export class HeadlineTopicProgramInMetadata {
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

  // getFFmpegMetadataOptions(): string[][] {
  //   return [
  //     ['-metadata', `artist="${this.artist}"`],
  //     ['-metadata', `album="${this.album}"`],
  //     ['-metadata', `album_artist="${this.albumArtist}"`],
  //     ['-metadata', `title="${this.title}"`],
  //     ['-metadata', `date="${this.date}"`],
  //     ['-metadata', `genre="${this.genre}"`],
  //     ['-metadata', `language="${this.language}"`],
  //   ];
  // }
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
   * 動画ファイル名
   */
  videoFileName: string;
  /**
   * 動画ファイルのパス
   */
  videoFilePath: string;
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
  videoUrl: string;
}
