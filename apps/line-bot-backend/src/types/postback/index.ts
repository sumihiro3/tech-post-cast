/**
 * Postback イベントで送信されるデータを表す型
 *
 * - Postback で送信されるデータは、`data` プロパティに格納される
 * - データは `type=headlineTopicProgram&id=xxxx` のような形式で送信される
 */
export class PostbackData {
  /** ポストバックイベントの種別を表す */
  type: string;

  /**
   * ポストバックイベントで扱う ID を表す
   */
  id: string;

  /**
   * コンストラクター
   * PostbackEvent で送信されるデータを解析して、プロパティに格納する
   */
  constructor(data: string) {
    const [type, id] = data.split('&');
    this.type = type.split('=')[1];
    this.id = id.split('=')[1];
    // プロパティが正しく設定されたことを確認する
    if (!this.type || !this.id) {
      // TODO 例外クラスを作成してエラーを投げる
      throw new Error('Invalid postback data');
    }
  }
}
