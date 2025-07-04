# データベース設計ルール

## 新機能追加時のデータベース設計原則

### 1. 既存構造の活用を優先
- 新機能追加時は、まず既存のテーブル構造で要件を満たせるか検討する
- 不要なテーブル追加は避け、既存の関連を活用することで、システムの複雑性を抑制する
- 既存のデータを最大限活用することで、データの整合性を保ちやすい

### 2. 多対多関連の活用
- 中間テーブルを活用することで、柔軟な関連付けが可能
- Prismaの自動生成される中間テーブルで十分な場合が多い
- 明示的な中間テーブルが必要な場合は、その理由を明確に文書化する

### 3. データの重複回避
- 同じ情報を複数のテーブルに保存することを避ける
- データの整合性を保つために、単一の信頼できる情報源を維持する
- 参照整合性を確保するために、適切な外部キー制約を設定する

### 4. マイグレーション戦略
- スキーマ変更時は、必ずテスト環境でマイグレーションをテストする
- 本番データへの影響を最小限にする戦略を立てる
- ロールバック計画を必ず用意する

## エラーハンドリングとデータ整合性

### 1. トランザクション管理
- 関連するデータの更新は、必ずトランザクション内で実行する
- トランザクションの境界を明確にし、適切なロールバック処理を実装する
- デッドロックを防ぐために、トランザクションの実行順序を考慮する

### 2. エラーハンドリング
- データベース操作のエラーは、具体的なエラーメッセージを提供する
- エラーの種類を明確に分類し、適切な対応を実装する
- エラーログには、デバッグに必要な十分な情報を含める

### 3. データ検証
- データの整合性を保つために、適切なバリデーションを実装する
- 重複データのチェックと防止の仕組みを実装する
- 不正なデータの挿入や更新を防ぐための制約を設定する

## パフォーマンス最適化

### 1. インデックス設計
- 頻繁に検索されるカラムには適切なインデックスを設定する
- 複合インデックスは、クエリのパターンを考慮して設計する
- インデックスの追加は、パフォーマンスへの影響を考慮して行う

### 2. クエリ最適化
- N+1問題を避けるために、適切なJOINとプリロードを活用する
- 大量のデータを扱う場合は、ページネーションを実装する
- クエリの実行計画を確認し、必要に応じて最適化する

### 3. キャッシュ戦略
- 頻繁にアクセスされるデータは、適切なキャッシュ戦略を実装する
- キャッシュの無効化戦略を明確にし、データの整合性を保つ
- キャッシュのサイズと有効期限を適切に設定する
