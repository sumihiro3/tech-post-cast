export class StageConfig {
  /** 環境名 */
  readonly name: string;
  /** 環境名（日本語） */
  readonly nameJp: string;
  /** リソース名のサフィックス */
  readonly suffix: string;
  /** リソース名のサフィックス（アンダーバー） */
  readonly suffixWithUnderBar: string;
  /** リソース名のサフィックス */
  readonly suffixLarge: string;
  /** スタック名 */
  readonly stackName: string;

  /**
   * 環境が本番環境かどうかを判定する
   * 本番環境の場合は true を返す
   * @returns 環境が本番環境かどうか
   */
  isProduction(): boolean {
    return this.name === 'production';
  }

  /**
   * 環境情報を初期化する
   * @param name 環境名称
   */
  constructor(name: string) {
    let sn = `TechPostCastStack`;
    let s = `develop`;
    let nJp = `開発環境`;

    switch (name) {
      case 'develop':
        break;
      case 'production':
        s = ``;
        nJp = `本番環境`;
        break;
      default:
        const errorMessage = `想定外のステージ名 [name: ${name}] が指定されました。`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    this.name = name;
    if (s.length > 0) {
      this.suffix = `-${s}`;
      this.suffixWithUnderBar = `_${s}`;
      this.suffixLarge = s.charAt(0).toUpperCase() + s.slice(1);
    } else {
      this.suffix = ``;
      this.suffixWithUnderBar = ``;
      this.suffixLarge = ``;
    }
    this.stackName = sn + this.suffixLarge;
    this.nameJp = nJp;
    console.log(`環境情報を初期化しました `, {
      name: this.name,
      nameJp: this.nameJp,
      suffix: this.suffix,
      suffixWithUnderBar: this.suffixWithUnderBar,
      suffixLarge: this.suffixLarge,
      stackName: this.stackName,
    });
  }
}

/**
 * 開発環境用の設定
 */
export const developStageConfig = new StageConfig('develop');

/**
 * 本番環境用の設定
 */
export const productionStageConfig = new StageConfig('production');
