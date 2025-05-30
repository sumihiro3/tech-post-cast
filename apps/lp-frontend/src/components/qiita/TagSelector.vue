<template>
  <div>
    <div class="mb-3">
      <div class="d-flex align-center mb-2">
        <v-icon size="small" class="mr-1">mdi-tag</v-icon>
        <span class="font-weight-medium">タグ</span>
        <div class="text-caption text-grey ml-2">(最大{{ maxTags }}件まで)</div>
      </div>
      <v-combobox
        v-model="displayTags"
        :items="[]"
        :disabled="selectedTags.length >= maxTags"
        multiple
        closable-chips
        chips
        variant="outlined"
        density="comfortable"
        label="タグを入力..."
        class="mb-4"
        @update:model-value="onDisplayTagsChange"
        @keydown.space.prevent="onTagInput"
        @keydown.enter="onEnterKey"
        @compositionstart="onCompositionStart"
        @compositionend="onCompositionEnd"
        @blur="validateCurrentTag"
      >
        <template #chip="{ props: slotProps, item }">
          <v-chip
            v-bind="slotProps"
            :color="getTagColor(item.title.toString())"
            :prepend-icon="getTagIcon(item.title.toString())"
            closable
            class="font-weight-medium"
            variant="elevated"
          >
            {{ item.title }}
          </v-chip>
        </template>
      </v-combobox>
      <p v-if="invalidTagsExist" class="text-caption text-error">
        <v-icon size="small" class="mr-1">mdi-alert-circle</v-icon>
        赤色のタグはQiitaに存在しないため、検索結果に影響しません
      </p>
      <p v-if="pendingTagsExist" class="text-caption text-grey">
        <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
        グレー色のタグは存在確認中です
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGetQiitaTag } from '@/composables/qiita-api/useGetQiitaTag';
import type { QiitaTagApiResponse } from '@/types/qiita-api';
import { computed, ref, watch } from 'vue';

const app = useNuxtApp();

const props = defineProps({
  /**
   * 選択されたタグのリスト
   */
  modelValue: {
    type: Array as () => string[],
    default: () => [],
  },
  /**
   * 最大タグ数
   */
  maxTags: {
    type: Number,
    default: 10,
  },
});

/**
 * タグの選択を更新するイベントを発火します。
 * @param {string[]} tags - 選択されたタグのリスト
 */
const emit = defineEmits(['update:modelValue']);

/**
 * 選択されたタグリスト
 * @type {string[]}
 */
const selectedTags = ref<string[]>([...props.modelValue]);

/**
 * 表示用のタグリスト
 * @type {string[]}
 */
const displayTags = ref<string[]>([...props.modelValue]);

/**
 * 有効なタグ（存在確認済みのタグ）のリスト
 * @type {string[]}
 */
const validTags = ref<string[]>([]);

/**
 * 検証中のタグリスト
 * @type {string[]}
 */
const pendingTags = ref<string[]>([]);

/**
 * バリデーション済みのタグを保持するSet
 * @type {Set<string>}
 */
const validatedTags = ref(new Set<string>());

/**
 * IME（日本語入力）の変換中かどうかを示すフラグ
 * @type {boolean}
 */
const isComposing = ref<boolean>(false);

/**
 * 無効なタグが存在するかどうか
 * @return {boolean}
 */
const invalidTagsExist = computed(() => {
  return selectedTags.value.some(
    (tag: string) => !validTags.value.includes(tag) && !pendingTags.value.includes(tag),
  );
});

/**
 * 検証中のタグが存在するかどうか
 * @return {boolean}
 */
const pendingTagsExist = computed(() => {
  return pendingTags.value.length > 0;
});

/**
 * Qiita に登録されているタグであるかなどを識別するための表示色を取得する
 * @param {string} tag - タグ名
 * @return {string} - 色のクラス名
 */
const getTagColor = (tag: string): string => {
  if (pendingTags.value.includes(tag)) return 'grey'; // 検証中
  if (validTags.value.includes(tag)) return 'primary'; // 有効
  return 'error'; // 無効
};

/**
 * Qiita に登録されているタグであるかなどを識別するためのアイコンを取得する
 * @param {string} tag - タグ名
 * @return {string} - アイコンのクラス名
 */
const getTagIcon = (tag: string): string => {
  if (pendingTags.value.includes(tag)) return 'mdi-clock-outline'; // 検証中
  if (validTags.value.includes(tag)) return 'mdi-check-circle'; // 有効
  return 'mdi-alert-circle'; // 無効
};

/**
 * IME変換開始時の処理
 * @param {CompositionEvent} _e - コンポジションイベント
 */
const onCompositionStart = (_e: CompositionEvent): void => {
  isComposing.value = true;
  console.debug('IME変換開始');
};

/**
 * IME変換終了時の処理
 * @param {CompositionEvent} _e - コンポジションイベント
 */
const onCompositionEnd = (_e: CompositionEvent): void => {
  isComposing.value = false;
  console.debug('IME変換終了');
};

/**
 * Enterキーが押されたときの処理
 * IME変換中の場合はタグ追加を行わない
 * @param {KeyboardEvent} e - キーボードイベント
 */
const onEnterKey = (e: KeyboardEvent): void => {
  // IME変換中の場合はタグ追加を行わない
  if (isComposing.value) {
    console.debug('IME変換中のため、Enterキーによるタグ追加をスキップ');
    return;
  }

  // IME変換中でない場合はタグを追加
  e.preventDefault();
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();
  handleTagInput(value, input);
};

/**
 * 表示用のタグが変更されたときの処理
 * - 選択されたタグを更新
 * - 最大タグ数を超えないようにする
 * - 新しく追加されたタグを検出し、バリデーションを行う
 * - 既存タグとの大文字小文字を無視した重複をチェック
 * - 親コンポーネントに変更を通知
 * @returns {void}
 */
const onDisplayTagsChange = (): void => {
  // イベントループ中にチェックするためにキャッシュ
  const prevSelectedTags = [...selectedTags.value];
  // 表示タグから選択タグへ同期
  selectedTags.value = [...displayTags.value];
  // 最大数を超えないようにする
  if (selectedTags.value.length > props.maxTags) {
    selectedTags.value = selectedTags.value.slice(0, props.maxTags);
    displayTags.value = [...selectedTags.value]; // 上限を超えた場合は表示も更新
  }

  // 新しく追加されたタグを検出
  const newTags = selectedTags.value.filter((tag) => !prevSelectedTags.includes(tag));
  if (newTags.length > 0) {
    console.log('新しく追加されたタグ:', newTags);
    // 既存タグとの大文字小文字を無視した重複をチェック
    for (const newTag of newTags) {
      // 大文字小文字を無視した重複チェック - 既存のタグで同じものがあるか
      const lowerCaseNewTag = newTag.toLowerCase();
      const duplicateIndex = selectedTags.value.findIndex(
        (tag, index) =>
          tag.toLowerCase() === lowerCaseNewTag &&
          tag !== newTag &&
          selectedTags.value.indexOf(newTag) !== index,
      );
      if (duplicateIndex !== -1) {
        console.warn(
          `重複タグを検出: "${newTag}" は "${selectedTags.value[duplicateIndex]}" と重複しています（大文字小文字の違いを無視）`,
        );
        // 重複タグを削除
        const newTagIndex = selectedTags.value.indexOf(newTag);
        if (newTagIndex !== -1) {
          selectedTags.value.splice(newTagIndex, 1);
        }
        // 表示も更新
        displayTags.value = [...selectedTags.value];
        // モデル値を更新して親コンポーネントに通知
        emit('update:modelValue', selectedTags.value);
        // 既に重複が処理されたので、このタグのバリデーションはスキップ
        continue;
      }
      // 重複していない新しいタグはバリデーションを行う
      console.log(`新しいタグ "${newTag}" のバリデーションを検証中...`);
      validateTag(newTag);
    }
  }

  // 親コンポーネントに変更を通知
  emit('update:modelValue', selectedTags.value);
};

/**
 * タグ入力を処理する共通関数
 * - 入力値をタグリストに追加
 * - 既存タグとの大文字小文字を無視した重複をチェック
 * - 最大タグ数を超えないようにする
 * - 新しいタグを検証する
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} value - 入力されたタグ名
 * @param {HTMLInputElement} input - 入力要素
 */
const handleTagInput = (value: string, input: HTMLInputElement): void => {
  if (value && !selectedTags.value.includes(value) && selectedTags.value.length < props.maxTags) {
    selectedTags.value.push(value);
    displayTags.value.push(value);
    validateTag(value);
    input.value = '';
    emit('update:modelValue', selectedTags.value);
  }
};

/**
 * スペースキーが押されたときに新しいタグを追加する
 * IME変換中の場合はタグ追加を行わない
 * @param {KeyboardEvent} e - キーボードイベント
 */
const onTagInput = (e: KeyboardEvent): void => {
  // IME変換中の場合はタグ追加を行わない
  if (isComposing.value) {
    console.debug('IME変換中のため、スペースキーによるタグ追加をスキップ');
    return;
  }

  const input = e.target as HTMLInputElement;
  const value = input.value.trim();
  handleTagInput(value, input);
};

/**
 * フォーカスが外れたときに入力中のタグを検証する
 * @param {FocusEvent} e - フォーカスイベント
 */
const validateCurrentTag = (e: FocusEvent): void => {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();
  handleTagInput(value, input);
};

/**
 * タグの存在検証を行う
 * - 既に検証済みのタグは再検証しない
 * - 大文字小文字を無視した重複チェック
 * - Qiita APIを使ったタグ検証
 * - 検証済みとしてマーク
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} tag - 検証するタグ名
 */
const validateTag = async (tag: string): Promise<void> => {
  if (!tag) return;
  // 1. 既に検証済みのタグは再検証しない（ループ防止）
  if (isTagAlreadyValidated(tag)) return;
  // 2. 大文字小文字を無視した重複チェック
  const existingTagData = findExistingTag(tag);
  if (existingTagData) {
    handleExistingTagDuplication(tag, existingTagData.index);
    return;
  }
  // 3. Qiita APIを使ったタグ検証
  await validateTagWithQiitaApi(tag);
};

/**
 * タグが既に検証済みかチェックする
 * @param {string} tag - 検証するタグ名
 * @return {boolean} - 検証済みの場合は true, そうでない場合は false
 */
const isTagAlreadyValidated = (tag: string): boolean => {
  if (validatedTags.value.has(tag)) {
    console.debug(`Tag ${tag} is already validated, skipping validation`);
    return true;
  }
  return false;
};

/**
 * 大文字小文字を無視して既存タグを検索する
 * @param {string} tag - 検索するタグ名
 * @return {object|null} - 既存タグのインデックスとタグ名を含むオブジェクト、または null
 */
const findExistingTag = (tag: string): { index: number; tag: string } | null => {
  const tagLowerCase = tag.toLowerCase();
  const existingTagIndex = selectedTags.value.findIndex(
    (t) => t.toLowerCase() === tagLowerCase && t !== tag,
  );
  if (existingTagIndex !== -1) {
    // 既存タグが見つかった場合
    return {
      index: existingTagIndex,
      tag: selectedTags.value[existingTagIndex],
    };
  }
  return null;
};

/**
 * 既存タグとの重複を処理する
 * - 大文字小文字を無視した重複チェック
 * - 既存タグを選択リストに追加
 * - 検証済みとしてマーク
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} inputTag - 入力されたタグ名
 * @param {number} existingTagIndex - 既存タグのインデックス
 */
const handleExistingTagDuplication = (inputTag: string, existingTagIndex: number): void => {
  const existingTag = selectedTags.value[existingTagIndex];
  console.warn(
    `重複したタグの登録が試行されました。既存のタグ「${existingTag}」と新しいタグ「${inputTag}」は大文字小文字の違いを無視すると同一です。`,
  );
  // 入力タグを既存タグで置き換え
  const inputTagIndex = selectedTags.value.indexOf(inputTag);
  if (inputTagIndex !== -1) {
    selectedTags.value[inputTagIndex] = existingTag;
    // 表示用のタグリストも更新
    updateDisplayTags();
  }
  // 検証済みとしてマーク
  validatedTags.value.add(inputTag);
  validatedTags.value.add(existingTag);
  // モデル値を更新
  emit('update:modelValue', selectedTags.value);
};

/**
 * Qiita APIを使って入力されたタグが存在するかを検証する
 * - 検証中としてマーク
 * - 検証が完了したら、検証中から削除
 * - APIから取得したタグIDで重複チェック
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} tag - 検証するタグ名
 */
const validateTagWithQiitaApi = async (tag: string): Promise<void> => {
  // 検証中としてマーク
  pendingTags.value.push(tag);
  validatedTags.value.add(tag);
  try {
    console.log(`タグを検証中: "${tag}"`);
    const tagData = await useGetQiitaTag(app, tag);
    // 検証中から削除
    pendingTags.value = pendingTags.value.filter((t) => t !== tag);
    if (tagData) {
      console.log(`タグの検証完了: "${tag}" は有効です。ID="${tagData.id}"`);
      // APIから取得したタグIDで重複チェック
      handleTagFromApiResponse(tag, tagData);
    } else {
      console.warn(`タグの検証完了: "${tag}" は無効です。Qiitaに存在しません。`);
    }
  } catch (error) {
    console.error('Error validating tag:', error);
    pendingTags.value = pendingTags.value.filter((t) => t !== tag);
  } finally {
    // モデル値を更新
    emit('update:modelValue', selectedTags.value);
  }
};

/**
 * APIレスポンスから取得したタグIDの処理
 * - APIから取得したタグIDが既存タグと重複する場合の処理
 * - 重複がない場合は正確なタグIDに置き換え
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} inputTag - 入力されたタグ名
 * @param {QiitaTagApiResponse} tagData - APIから取得したタグデータ
 */
const handleTagFromApiResponse = (inputTag: string, tagData: QiitaTagApiResponse): void => {
  // APIから取得した正確なタグIDで再度重複チェック
  const correctTagLowerCase = tagData.id.toLowerCase();
  const correctTagExistingIndex = selectedTags.value.findIndex(
    (t) => t.toLowerCase() === correctTagLowerCase && t !== inputTag,
  );
  if (correctTagExistingIndex !== -1) {
    // APIから取得した正確なタグIDが既に存在する場合
    handleApiTagDuplication(inputTag, correctTagExistingIndex, tagData);
  } else {
    // 重複がない場合は正確なタグIDに置き換え
    updateTagWithCorrectId(inputTag, tagData);
  }
};

/**
 * APIから取得したタグIDが既存タグと重複する場合の処理
 * - 入力タグを既存タグに置き換え
 * - 検証済みとしてマーク
 * - 表示用タグも更新する
 * @param {string} inputTag - 入力されたタグ名
 * @param {number} existingTagIndex - 既存タグのインデックス
 * @param {QiitaTagApiResponse} tagData - APIから取得したタグデータ
 */
const handleApiTagDuplication = (
  inputTag: string,
  existingTagIndex: number,
  tagData: QiitaTagApiResponse,
): void => {
  console.warn(
    `APIから取得したタグ「${tagData.id}」は既に登録されているタグ「${selectedTags.value[existingTagIndex]}」と重複しています。`,
  );
  // 入力タグを既存タグに置き換え
  const inputTagIndex = selectedTags.value.indexOf(inputTag);
  if (inputTagIndex !== -1) {
    selectedTags.value[inputTagIndex] = selectedTags.value[existingTagIndex];
    // 検証済みとしてマーク
    validatedTags.value.add(selectedTags.value[existingTagIndex]);
    // 表示用タグも更新
    updateDisplayTags();
  }
};

/**
 * タグを正確なIDに更新
 * - 大文字小文字の違いがある場合は置き換える
 * - 新しいIDも検証済みとしてマーク
 * - 表示用タグも更新する
 * - 有効なタグとして追加する
 * @param {string} inputTag - 入力されたタグ名
 * @param {QiitaTagApiResponse} tagData - APIから取得したタグデータ
 */
const updateTagWithCorrectId = (inputTag: string, tagData: QiitaTagApiResponse): void => {
  const tagIndex = selectedTags.value.indexOf(inputTag);
  if (tagIndex !== -1) {
    // 元の入力値と大文字小文字の違いがある場合は置き換える
    // 大文字小文字の違いだけでなく、APIから取得した正確なIDを使用
    selectedTags.value[tagIndex] = tagData.id;
    // 新しいIDも検証済みとしてマーク
    validatedTags.value.add(tagData.id);
    // 表示用タグも更新
    updateDisplayTags();
    // 有効なタグとして追加（まだ追加されていない場合）
    if (!validTags.value.includes(tagData.id)) {
      validTags.value.push(tagData.id);
    }
    console.log(`タグを正規化: "${inputTag}" → "${tagData.id}"`);
  } else {
    console.warn(`タグ "${inputTag}" が選択リストに見つかりません`);
  }
};

/**
 * 表示用タグリストを更新する
 * - 選択されたタグの順序を保持しながら表示用タグを更新する
 */
const updateDisplayTags = (): void => {
  // 選択されたタグの順序を保持しながら表示用タグも更新
  displayTags.value = [...selectedTags.value];
};

// props.modelValueが外部から変更されたら選択タグを更新
watch(
  () => props.modelValue,
  (newVal) => {
    selectedTags.value = [...newVal];
    displayTags.value = [...newVal];
    // 新しいタグの検証を行う
    for (const tag of selectedTags.value) {
      if (!validatedTags.value.has(tag)) {
        validateTag(tag);
      }
    }
  },
  { deep: true },
);

// 初期タグの検証
(async (): Promise<void> => {
  for (const tag of selectedTags.value) {
    await validateTag(tag);
  }
})();
</script>
