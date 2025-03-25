#!/bin/bash

# 使用方法の表示
show_usage() {
    echo "使用方法: $0 <BACKLOG_API_KEY>"
    echo "  <BACKLOG_API_KEY> - BacklogのAPIキー（必須）"
    echo ""
    echo "例: $0 abcdef1234567890"
    exit 1
}

# 引数のチェック
if [ $# -lt 1 ]; then
    echo "エラー: BacklogのAPIキーが指定されていません。"
    show_usage
fi

# APIキーを引数から取得
BACKLOG_API_KEY="$1"

# Backlog API設定
BACKLOG_SPACE="tep-lab"
BACKLOG_PROJECT_ID="584159"  # プロジェクトID

# デフォルト値
DEFAULT_ISSUE_TYPE_ID="3077206"  # タスクタイプのID
DEFAULT_PRIORITY_ID="3"  # 優先度「中」に相当するID
DEFAULT_CATEGORY_ID="1641115"  # カテゴリID：有料機能開発

# Backlog APIエンドポイント（クエリパラメータとしてAPIキーを付与）
API_ENDPOINT="https://${BACKLOG_SPACE}.backlog.com/api/v2/issues?apiKey=${BACKLOG_API_KEY}"

# issuesディレクトリのパス
# ISSUES_DIR="docs/有料機能の追加/issues"
ISSUES_DIR="issues"

# メタデータファイル（タスク設定を格納するファイル）
METADATA_FILE="docs/有料機能の追加/task_metadata.csv"

# メタデータファイルの存在確認
if [ ! -f "$METADATA_FILE" ]; then
    echo "メタデータファイル $METADATA_FILE が存在しません。"
    echo "デフォルト設定で全てのタスクを登録します。"
    echo "カスタム設定を使用するには、以下の形式でCSVファイルを作成してください:"
    echo "タスク番号,課題タイプID,優先度ID,カテゴリID"
    echo "例: 01,123456,3,9876"
fi

# 課題作成関数
create_issue() {
    local file=$1
    local issue_number=$(basename "$file" | cut -d'-' -f1)
    
    # ファイルからタイトルと内容を抽出
    local title=$(head -n 1 "$file" | sed 's/^# //')
    local content=$(tail -n +2 "$file")
    
    # メタデータファイルからタスク固有の設定を取得
    local issue_type_id=$DEFAULT_ISSUE_TYPE_ID
    local priority_id=$DEFAULT_PRIORITY_ID
    local category_id=$DEFAULT_CATEGORY_ID
    
    if [ -f "$METADATA_FILE" ]; then
        # タスク番号に対応する行を検索
        local metadata_line=$(grep "^$issue_number," "$METADATA_FILE")
        if [ ! -z "$metadata_line" ]; then
            # CSVから値を抽出
            issue_type_id=$(echo $metadata_line | cut -d',' -f2)
            priority_id=$(echo $metadata_line | cut -d',' -f3)
            category_id=$(echo $metadata_line | cut -d',' -f4)
        fi
    fi
    
    echo "Creating issue: $title"
    echo "  Issue Type: $issue_type_id, Priority: $priority_id, Category: $category_id"
    
    # Backlog APIにPOSTリクエストを送信
    curl -X POST "$API_ENDPOINT" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          --data-urlencode "projectId=$BACKLOG_PROJECT_ID" \
          --data-urlencode "summary=$title" \
          --data-urlencode "description=$content" \
          --data-urlencode "issueTypeId=$issue_type_id" \
          --data-urlencode "priorityId=$priority_id" \
          --data-urlencode "categoryId[]=$category_id"
    
    echo -e "\n"
    
    # APIリクエスト間隔を空ける（レート制限対策）
    sleep 1
}

# 実行前の確認
echo "このスクリプトは ${ISSUES_DIR} 内の全Markdownファイルから"
echo "Backlog課題を作成します（${BACKLOG_SPACE}.backlog.com）"
echo "続行するには「yes」と入力してください: "
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "スクリプトを中止しました"
    exit 1
fi

# 全ファイルを処理
for file in $(find "$ISSUES_DIR" -name "*.md" | grep -v "README.md" | sort); do
    create_issue "$file"
done

echo "すべての課題の登録が完了しました" 