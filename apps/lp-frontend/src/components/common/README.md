# 共通UIコンポーネント

このディレクトリには、アプリケーション全体で使用される共通UIコンポーネントが含まれています。

## 概要

共通UIコンポーネントは、`useUIState` composableと組み合わせて使用し、アプリケーション全体で統一されたUI状態管理を提供します。

## 利用可能なコンポーネント

### 1. AppSnackbar.vue

アプリケーション全体で使用されるSnackbar（通知メッセージ）コンポーネント

**特徴:**

- `useUIState`と自動連携
- 成功、エラー、警告、情報の4つのメッセージタイプに対応
- 自動非表示機能
- アイコン付き表示
- レスポンシブ対応

### 2. AppProgress.vue

アプリケーション全体で使用されるプログレス（ローディング）コンポーネント

**特徴:**

- `useUIState`と自動連携
- オーバーレイ表示対応
- カスタマイズ可能なサイズと色
- ローディングメッセージ表示
- 中央配置とスタイリング

### 3. ConfirmDialog.vue

確認ダイアログコンポーネント

**Props:**

- `modelValue` (boolean): ダイアログの表示状態
- `title` (string): ダイアログのタイトル
- `message` (string): ダイアログのメッセージ
- `confirmButtonText` (string): 確認ボタンのテキスト
- `cancelButtonText` (string): キャンセルボタンのテキスト
- `confirmButtonColor` (string): 確認ボタンの色
- `cancelButtonColor` (string): キャンセルボタンの色

**Events:**

- `update:modelValue`: ダイアログ表示状態の更新
- `confirm`: 確認ボタンがクリックされた時
- `cancel`: キャンセルボタンがクリックされた時

## 推奨される使用方法

### useUIState composableを使用した統一管理

これらのコンポーネントは、`useUIState` composableと組み合わせて使用することを強く推奨します。

```typescript
// composableをインポート
import { useUIState } from '@/composables/useUIState';

// コンポーネント内で使用
const ui = useUIState();

// ローディング表示
ui.showLoading({ message: '処理中...', overlay: true });
ui.hideLoading();

// 成功メッセージ表示
ui.showSuccess('保存が完了しました');

// エラーメッセージ表示
ui.showError('エラーが発生しました', { autoHideDelay: 5000 });

// 情報メッセージ表示
ui.showInfo('情報をお知らせします');

// 警告メッセージ表示
ui.showWarning('注意が必要です');

// すべてのメッセージを非表示
ui.hideAllMessages();

// すべてのUI状態をリセット
ui.resetUIState();
```

### レイアウトでの設定

アプリケーションレベルでは、以下の共通コンポーネントをレイアウトに配置することで、`useUIState`で管理される状態が自動的に表示されます。

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <!-- メインコンテンツ -->
    <slot />
    
    <!-- 共通UIコンポーネント -->
    <AppSnackbar />
    <AppProgress />
  </div>
</template>

<script setup lang="ts">
import AppSnackbar from '@/components/common/AppSnackbar.vue';
import AppProgress from '@/components/common/AppProgress.vue';
</script>
```

## 使用例

### 基本的な使用例

```vue
<template>
  <div>
    <v-btn @click="handleSave">保存</v-btn>
    
    <!-- 確認ダイアログの使用例 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="削除確認"
      message="この項目を削除しますか？この操作は取り消せません。"
      confirm-button-text="削除する"
      cancel-button-text="キャンセル"
      confirm-button-color="error"
      cancel-button-color="primary"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUIState } from '@/composables/useUIState';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const ui = useUIState();
const showDeleteDialog = ref(false);

const handleSave = async () => {
  try {
    // ローディング開始
    ui.showLoading({ message: '保存中...' });
    
    // API呼び出し
    await saveData();
    
    // 成功メッセージ表示
    ui.showSuccess('保存が完了しました');
  } catch (error) {
    // エラーメッセージ表示
    ui.showError('保存に失敗しました');
  } finally {
    // ローディング終了
    ui.hideLoading();
  }
};

const handleDelete = async () => {
  try {
    ui.showLoading({ message: '削除中...' });
    await deleteData();
    ui.showSuccess('削除が完了しました');
    showDeleteDialog.value = false;
  } catch (error) {
    ui.showError('削除に失敗しました');
  } finally {
    ui.hideLoading();
  }
};
</script>
```

### 複数のメッセージタイプの使用例

```vue
<template>
  <div>
    <v-btn @click="ui.showSuccess('成功メッセージ')">成功</v-btn>
    <v-btn @click="ui.showError('エラーメッセージ')">エラー</v-btn>
    <v-btn @click="ui.showWarning('警告メッセージ')">警告</v-btn>
    <v-btn @click="ui.showInfo('情報メッセージ')">情報</v-btn>
  </div>
</template>

<script setup lang="ts">
import { useUIState } from '@/composables/useUIState';

const ui = useUIState();
</script>
```

## 注意事項

1. **統一性の維持**: 可能な限り`useUIState`を使用して、アプリケーション全体でUI状態管理を統一してください。

2. **パフォーマンス**: `useUIState`はグローバル状態を管理するため、不要な再レンダリングを避けるために適切に使用してください。

3. **アクセシビリティ**: エラーメッセージや成功メッセージは、スクリーンリーダーでも読み上げられるように適切なARIA属性が設定されています。

4. **レスポンシブ対応**: すべてのコンポーネントはモバイルデバイスでも適切に表示されるように設計されています。

## 開発者向け情報

### 新しいメッセージタイプの追加

新しいメッセージタイプを追加する場合は、以下のファイルを更新してください：

1. `useUIState.ts`: 新しいメッセージタイプの状態管理を追加
2. `AppSnackbar.vue`: 新しいタイプに対応するスタイルとアイコンを追加

### カスタマイズ

コンポーネントのスタイルをカスタマイズする場合は、Vuetify3のテーマシステムを使用してください。

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vuetify: {
    theme: {
      themes: {
        light: {
          colors: {
            primary: '#1976D2',
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3',
          }
        }
      }
    }
  }
});
```

## 技術仕様

- **フレームワーク**: Vue 3 + Vuetify 3
- **テンプレート**: Pug
- **TypeScript**: 完全対応
- **スタイル**: Scoped CSS
- **状態管理**: useUIState composable

## アーキテクチャ

```
src/components/common/
├── AppSnackbar.vue     # グローバルSnackbar
├── AppProgress.vue     # グローバルProgress
├── ConfirmDialog.vue   # 確認ダイアログ
└── README.md          # このファイル

src/composables/
├── useUIState.ts      # UI状態管理
├── useSnackbar.ts     # Snackbar状態管理（内部使用）
└── useProgress.ts     # Progress状態管理（内部使用）
```

## 注意事項

- これらのコンポーネントはVuetify3に依存しているため、Vuetifyが正しく設定されている必要があります
- Pugテンプレートを使用しているため、Pugの設定が必要です
- TypeScriptで型安全性を提供しています
- `AppSnackbar`と`AppProgress`は必ずレイアウトに配置してください
