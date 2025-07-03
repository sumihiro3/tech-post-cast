# 画面設計 - 共通UIコンポーネント

## 概要

Tech Post Castアプリケーションでは、統一されたユーザー体験を提供するため、共通UIコンポーネントシステムを採用しています。これらのコンポーネントは`useUIState` composableと連携し、アプリケーション全体で一貫したUI状態管理を実現します。

## アーキテクチャ

### レイヤード統一アーキテクチャ

```
┌─────────────────────────────────────────┐
│           アプリケーション層              │
│  (Pages/Components using useUIState)    │
├─────────────────────────────────────────┤
│           統一インターフェース層          │
│         (useUIState composable)         │
├─────────────────────────────────────────┤
│           既存資産活用層                 │
│    (useSnackbar / useProgress)          │
├─────────────────────────────────────────┤
│           共通コンポーネント層            │
│  (AppSnackbar / AppProgress / etc.)     │
└─────────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: Vue 3 + Composition API
- **UIライブラリ**: Vuetify 3
- **テンプレート**: Pug
- **言語**: TypeScript
- **状態管理**: Reactive Refs + Composables

## 共通コンポーネント仕様

### 1. AppSnackbar（通知メッセージ）

#### 概要

アプリケーション全体で使用される統一通知システム

#### 機能仕様

- **メッセージタイプ**: success, error, warning, info
- **自動非表示**: タイプ別のタイムアウト設定
- **手動クローズ**: ×ボタンによる手動クローズ
- **アイコン表示**: タイプ別の視覚的アイコン
- **位置設定**: top, bottom, left, right対応

#### 技術仕様

```typescript
interface SnackbarState {
  isVisible: boolean;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout: number;
  position: string;
}
```

#### デザイン仕様

- **成功**: 緑色背景 + チェックアイコン
- **エラー**: 赤色背景 + 警告アイコン
- **警告**: オレンジ色背景 + 注意アイコン
- **情報**: 青色背景 + 情報アイコン

#### 使用方法

```typescript
const ui = useUIState();
ui.showSuccess('保存が完了しました');
ui.showError('エラーが発生しました');
```

### 2. AppProgress（ローディング表示）

#### 概要

アプリケーション全体で使用される統一ローディングシステム

#### 機能仕様

- **オーバーレイ表示**: 全画面オーバーレイ対応
- **プログレスサークル**: 不確定モードのスピナー
- **ローディングメッセージ**: カスタマイズ可能なテキスト
- **サイズ・色設定**: 用途に応じたカスタマイズ

#### 技術仕様

```typescript
interface ProgressState {
  isVisible: boolean;
  text: string;
  color: string;
  size: number;
  overlay: boolean;
}
```

#### デザイン仕様

- **オーバーレイ**: 半透明黒背景（rgba(0,0,0,0.5)）
- **コンテナー**: 白背景、角丸、シャドウ付き
- **スピナー**: プライマリカラー、サイズ70px
- **テキスト**: 中央配置、読みやすいフォント

#### 使用方法

```typescript
const ui = useUIState();
ui.showLoading({ message: '処理中...', overlay: true });
ui.hideLoading();
```

### 3. ConfirmDialog（確認ダイアログ）

#### 概要

ユーザーの重要な操作に対する確認を求める統一ダイアログ

#### 機能仕様

- **カスタマイズ可能なタイトル・メッセージ**
- **ボタンテキスト・色の設定**
- **モーダル表示**
- **キーボード操作対応**

#### 技術仕様

```typescript
interface ConfirmDialogProps {
  modelValue: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
  confirmButtonColor: string;
  cancelButtonColor: string;
  maxWidth: string;
}
```

#### デザイン仕様

- **最大幅**: 500px
- **角丸**: 8px
- **背景**: サーフェスカラー
- **ボタン配置**: 右寄せ（キャンセル・確認の順）

#### 使用方法

```vue
<ConfirmDialog
  v-model="showDialog"
  title="削除確認"
  message="この項目を削除しますか？"
  confirm-button-text="削除する"
  cancel-button-text="キャンセル"
  confirm-button-color="error"
  @confirm="handleDelete"
/>
```

## 統一UI状態管理（useUIState）

### 概要

すべての共通コンポーネントを統一的に制御するcomposable

### インターフェイス仕様

```typescript
interface UIStateReturn {
  // 状態（読み取り専用）
  loadingState: ProgressState;
  messageState: SnackbarState;

  // ローディング制御
  showLoading: (options?: LoadingOptions) => void;
  hideLoading: () => void;

  // メッセージ制御
  showSuccess: (message: string, options?: MessageOptions) => void;
  showError: (message: string, options?: MessageOptions) => void;
  showInfo: (message: string, options?: MessageOptions) => void;
  showWarning: (message: string, options?: MessageOptions) => void;
  hideAllMessages: () => void;

  // リセット
  resetUIState: () => void;
}
```

### 設計原則

1. **統一インターフェイス**: すべてのUI状態を単一のcomposableで管理
2. **既存資産活用**: useSnackbar/useProgressを内部で活用
3. **型安全性**: TypeScriptによる完全な型定義
4. **SSR対応**: サーバーサイドレンダリング対応

## 配置・実装ガイドライン

### レイアウト配置

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- グローバル共通コンポーネント -->
    <ClientOnly>
      <AppSnackbar />
    </ClientOnly>
    <ClientOnly>
      <AppProgress />
    </ClientOnly>
  </div>
</template>
```

### ページでの使用

```vue
<script setup lang="ts">
import { useUIState } from '@/composables/useUIState';

const ui = useUIState();

const handleSave = async () => {
  try {
    ui.showLoading({ message: '保存中...' });
    await saveData();
    ui.showSuccess('保存が完了しました');
  } catch (error) {
    ui.showError('保存に失敗しました');
  } finally {
    ui.hideLoading();
  }
};
</script>
```

## パフォーマンス考慮事項

### 最適化ポイント

1. **グローバル状態の最小化**: 必要最小限の状態のみ管理
2. **Computed活用**: 派生状態はcomputedで効率的に算出
3. **SSR対応**: クライアントサイドでのみ状態を管理
4. **メモリリーク防止**: 適切なクリーンアップ処理

### 監視指標

- **レンダリング回数**: 不要な再レンダリングの監視
- **メモリ使用量**: グローバル状態のメモリ使用量
- **応答性**: UI操作からフィードバックまでの時間

## アクセシビリティ対応

### 実装済み機能

1. **ARIA属性**: 適切なrole、aria-labelの設定
2. **キーボード操作**: Tab、Enter、Escapeキー対応
3. **スクリーンリーダー**: 状態変化の音声読み上げ
4. **色覚対応**: アイコンと色の組み合わせによる情報伝達

### 準拠基準

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines準拠
- **JIS X 8341**: 日本工業規格準拠

## 今後の拡張計画

### Phase 1（完了）

- ✅ 基本的な通知・ローディング機能
- ✅ 確認ダイアログ機能
- ✅ 統一状態管理システム

### Phase 2（検討中）

- 🔄 トースト通知の複数表示対応
- 🔄 プログレスバー（進捗率表示）
- 🔄 モーダルダイアログの汎用化

### Phase 3（将来）

- 📋 ドラッグ&ドロップ対応
- 📋 アニメーション効果の強化
- 📋 テーマシステムの拡張

## 品質保証

### テスト戦略

1. **単体テスト**: 各composableの動作確認
2. **結合テスト**: コンポーネント間の連携確認
3. **E2Eテスト**: ユーザーシナリオの動作確認
4. **アクセシビリティテスト**: 支援技術での動作確認

### コードレビュー観点

1. **型安全性**: TypeScript型定義の適切性
2. **パフォーマンス**: 不要な再レンダリングの有無
3. **アクセシビリティ**: WCAG準拠の確認
4. **保守性**: コードの可読性・拡張性

## 関連ドキュメント

- [共通コンポーネント実装ガイド](../apps/lp-frontend/src/components/common/README.md)
- [Nuxt3フロントエンド実装ルール](../docs/coding-rules/lp-frontend.md)
- [共通実装ルール](../docs/coding-rules/common.md)
- [アーキテクチャ決定記録](../.cursor/memory/architecture-decisions.md)
