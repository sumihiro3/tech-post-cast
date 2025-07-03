/**
 * 番組ファイルのチャプター情報
 */
export interface ProgramFileChapter {
  /**
   * チャプター名
   */
  title: string;

  /**
   * チャプター開始位置（ミリ秒）
   */
  startTime: number;

  /**
   * チャプター終了位置（ミリ秒）
   */
  endTime: number;
}

/**
 * 番組ファイルのメタデータ
 */
export interface ProgramFileMetadata {
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
}

/**
 * 番組音声ファイルの生成要求コマンドのインターフェース
 */
export interface GenerateProgramAudioFileCommand {
  /**
   * 番組の音声ファイルパス群
   */
  programAudioFilePaths: string[];

  /**
   * BGM音声ファイルのパス
   * @example '/path/to/bgm-audio.mp3'
   */
  bgmAudioFilePath: string;

  /**
   * 生成する音声ファイルの音量調整倍率
   */
  volumeRate: number;

  /**
   * オープニング音声ファイルのパス
   * @example '/path/to/opening-audio.mp
   */
  openingAudioFilePath: string;

  /**
   * エンディング音声ファイルのパス
   * @example '/path/to/ending-audio.mp3'
   */
  endingAudioFilePath: string;

  /**
   * 番組ファイルのメタデータ
   */
  metadata: ProgramFileMetadata;

  /**
   * 生成した番組ファイルの保存先のパス
   * @example '/path/to/program.mp3'
   */
  outputFilePath: string;
}

/**
 * 番組音声ファイル生成結果
 */
export interface GenerateProgramAudioFileResult {
  /**
   * 生成した番組音声ファイルのパス
   */
  filePath: string;

  /**
   * 生成した番組音声ファイルの長さ（ミリ秒）
   */
  duration: number;
}

/**
 * 番組音声ファイルから動画ファイルを生成する要求コマンドのインターフェース
 */
export interface GenerateProgramVideoFileCommand {
  /**
   * 番組音声ファイルのパス
   * @example '/path/to/program-audio.mp3'
   */
  audioFilePath: string;

  /**
   * 番組画像ファイルのパス
   * @example '/path/to/program-picture.jpg'
   */
  pictureFilePath: string;

  /**
   * 番組動画ファイルの保存先のパス
   * @example '/path/to/program-video.mp4'
   */
  outputFilePath: string;

  /**
   * 番組ファイルのメタデータ
   */
  metadata: ProgramFileMetadata;
}

/**
 * 番組ファイルを作成する機能のインターフェース
 */
export interface IProgramFileMaker {
  /**
   * 音声ファイルの長さを取得する
   * @param filePath 音声ファイルのパス
   * @returns 音声ファイルの長さ（ミリ秒）
   */
  getAudioDuration(filePath: string): Promise<number>;

  /**
   * WAV ファイルを MP3 ファイルに変換する
   * @param waveFilePath WAV ファイルパス
   * @param mp3FilePath MP3 ファイルパス
   */
  convertWavToMp3(waveFilePath: string, mp3FilePath: string): Promise<void>;

  /**
   * 番組の音声ファイルを生成する
   * @param command 番組音声ファイル生成要求コマンド
   * @returns 番組音声ファイル生成結果
   */
  generateProgramAudioFile(
    command: GenerateProgramAudioFileCommand,
  ): Promise<GenerateProgramAudioFileResult>;

  /**
   * 番組の動画ファイルを生成する
   * @param command 番組動画ファイル生成要求コマンド
   */
  generateProgramVideoFile(
    command: GenerateProgramVideoFileCommand,
  ): Promise<void>;

  /**
   * 複数の音声ファイルをシーケンシャルに結合する（セグメント結合）
   * このメソッドは特にSSMLセグメントから生成された音声ファイルの結合に適しています
   * @param inputFiles 入力音声ファイルのパスの配列
   * @param outputFile 出力音声ファイルのパス
   * @returns 結合された音声ファイルのパス
   */
  mergeAudioFilesSegments(
    inputFiles: string[],
    outputFile: string,
  ): Promise<string>;
}
