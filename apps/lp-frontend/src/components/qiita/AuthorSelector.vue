<template>
  <div>
    <div class="mb-3">
      <div class="d-flex align-center mb-2">
        <v-icon size="small" class="mr-1">mdi-account</v-icon>
        <span class="font-weight-medium">著者</span>
        <div class="text-caption text-grey ml-2">(最大10人まで)</div>
      </div>
      <v-combobox
        v-model="displayAuthors"
        :items="[]"
        :disabled="selectedAuthors.length >= maxAuthors"
        multiple
        closable-chips
        chips
        variant="outlined"
        density="comfortable"
        label="著者IDを入力..."
        class="mb-4"
        @update:model-value="onDisplayAuthorsChange"
        @keydown.space.prevent="onAuthorInput"
        @blur="validateCurrentAuthor"
      >
        <template #chip="{ props: slotProps, item }">
          <v-chip
            v-bind="slotProps"
            :color="getAuthorColor(item.title.toString())"
            :prepend-icon="getAuthorIcon(item.title.toString())"
            closable
            class="font-weight-medium"
            variant="elevated"
          >
            {{ item.title }}
          </v-chip>
        </template>
      </v-combobox>
      <p v-if="invalidAuthorsExist" class="text-caption text-error">
        <v-icon size="small" class="mr-1">mdi-alert-circle</v-icon>
        赤色の著者IDはQiitaに存在しないため、検索結果に影響しません
      </p>
      <p v-if="pendingAuthorsExist" class="text-caption text-grey">
        <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
        グレー色の著者IDは存在確認中です
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGetQiitaAuthor } from '@/composables/qiita-api/useGetQiitaAuthor';
import type { QiitaUserApiResponse } from '@/types/qiita-api';
import { computed, ref, watch } from 'vue';

const app = useNuxtApp();

const props = defineProps({
  /**
   * 選択された著者のリスト
   */
  modelValue: {
    type: Array as () => string[],
    default: () => [],
  },
  /**
   * 最大著者数
   */
  maxAuthors: {
    type: Number,
    default: 10,
  },
});

/**
 * 著者の選択を更新するイベントを発火します。
 * @param {string[]} authors - 選択された著者のリスト
 */
const emit = defineEmits(['update:modelValue']);

/**
 * 選択された著者リスト
 * @type {string[]}
 */
const selectedAuthors = ref<string[]>([...props.modelValue]);

/**
 * 表示用の著者リスト
 * @type {string[]}
 */
const displayAuthors = ref<string[]>([...props.modelValue]);

/**
 * 有効な著者（存在確認済みの著者）のリスト
 * @type {string[]}
 */
const validAuthors = ref<string[]>([]);

/**
 * 検証中の著者リスト
 * @type {string[]}
 */
const pendingAuthors = ref<string[]>([]);

/**
 * バリデーション済みの著者を保持するSet
 * @type {Set<string>}
 */
const validatedAuthors = ref(new Set<string>());

/**
 * 無効な著者が存在するかどうか
 * @return {boolean}
 */
const invalidAuthorsExist = computed(() => {
  return selectedAuthors.value.some(
    author => !validAuthors.value.includes(author) && !pendingAuthors.value.includes(author),
  );
});

/**
 * 検証中の著者が存在するかどうか
 * @return {boolean}
 */
const pendingAuthorsExist = computed(() => {
  return pendingAuthors.value.length > 0;
});

/**
 * Qiita に登録されている著者であるかなどを識別するための表示色を取得する
 * @param {string} author - 著者名
 * @return {string} - 色のクラス名
 */
const getAuthorColor = (author: string): string => {
  if (pendingAuthors.value.includes(author)) return 'grey'; // 検証中
  if (validAuthors.value.includes(author)) return 'primary'; // 有効
  return 'error'; // 無効
};

/**
 * Qiita に登録されている著者であるかなどを識別するためのアイコンを取得する
 * @param {string} author - 著者名
 * @return {string} - アイコンのクラス名
 */
const getAuthorIcon = (author: string): string => {
  if (pendingAuthors.value.includes(author)) return 'mdi-clock-outline'; // 検証中
  if (validAuthors.value.includes(author)) return 'mdi-check-circle'; // 有効
  return 'mdi-alert-circle'; // 無効
};

/**
 * 表示用の著者が変更されたときの処理
 * - 選択された著者を更新
 * - 最大著者数を超えないようにする
 * - 新しく追加された著者を検出し、バリデーションを行う
 * - 既存著者との大文字小文字を無視した重複をチェック
 * - 親コンポーネントに変更を通知
 * @returns {void}
 */
const onDisplayAuthorsChange = (): void => {
  // イベントループ中にチェックするためにキャッシュ
  const prevSelectedAuthors = [...selectedAuthors.value];
  // 表示著者から選択著者へ同期
  selectedAuthors.value = [...displayAuthors.value];
  // 最大数を超えないようにする
  if (selectedAuthors.value.length > props.maxAuthors) {
    selectedAuthors.value = selectedAuthors.value.slice(0, props.maxAuthors);
    displayAuthors.value = [...selectedAuthors.value]; // 上限を超えた場合は表示も更新
  }
  // 新しく追加された著者を検出
  const newAuthors = selectedAuthors.value.filter(
    author => !prevSelectedAuthors.includes(author),
  );
  if (newAuthors.length > 0) {
    console.log('新しく追加された著者:', newAuthors);
    // 既存著者との大文字小文字を無視した重複をチェック
    for (const newAuthor of newAuthors) {
      // 大文字小文字を無視した重複チェック - 既存の著者で同じものがあるか
      const lowerCaseNewAuthor = newAuthor.toLowerCase();
      const duplicateIndex = selectedAuthors.value.findIndex(
        (author, index) =>
          author.toLowerCase() === lowerCaseNewAuthor
          && author !== newAuthor
          && selectedAuthors.value.indexOf(newAuthor) !== index,
      );
      if (duplicateIndex !== -1) {
        // すでに入力済みの著者が見つかった場合
        console.warn(
          `重複著者を検出: "${newAuthor}" は "${selectedAuthors.value[duplicateIndex]}" と重複しています（大文字小文字の違いを無視）`,
        );
        // 重複著者を削除
        const newAuthorIndex = selectedAuthors.value.indexOf(newAuthor);
        if (newAuthorIndex !== -1) {
          selectedAuthors.value.splice(newAuthorIndex, 1);
        }
        // 表示も更新する
        displayAuthors.value = [...selectedAuthors.value];
        // モデル値を更新して親コンポーネントに通知する
        emit('update:modelValue', selectedAuthors.value);
        // 既に重複が処理されたので、この著者のバリデーションはスキップする
        continue;
      }
      // 重複していない新しい著者はバリデーションを行う
      console.log(`新しい著者 "${newAuthor}" を検証中...`);
      validateAuthor(newAuthor);
    }
  }
  // 親コンポーネントに変更を通知
  emit('update:modelValue', selectedAuthors.value);
};

/**
 * 著者入力を処理する共通関数
 * - 入力値を著者リストに追加
 * - 既存著者との大文字小文字を無視した重複をチェック
 * - 最大著者数を超えないようにする
 * - 新しい著者を検証する
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} value - 入力された著者名
 * @param {HTMLInputElement} input - 入力要素
 */
const handleAuthorInput = (value: string, input: HTMLInputElement): void => {
  if (
    value
    && !selectedAuthors.value.includes(value)
    && selectedAuthors.value.length < props.maxAuthors
  ) {
    selectedAuthors.value.push(value);
    displayAuthors.value.push(value);
    validateAuthor(value);
    input.value = '';
    emit('update:modelValue', selectedAuthors.value);
  }
};

/**
 * スペースキーが押されたときに新しい著者を追加する
 * @param {KeyboardEvent} e - キーボードイベント
 */
const onAuthorInput = (e: KeyboardEvent): void => {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();
  handleAuthorInput(value, input);
};

/**
 * フォーカスが外れたときに入力中の著者を検証する
 * @param {FocusEvent} e - フォーカスイベント
 */
const validateCurrentAuthor = (e: FocusEvent): void => {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();
  handleAuthorInput(value, input);
};

/**
 * 著者の存在検証を行う
 * - 既に検証済みの著者は再検証しない
 * - 大文字小文字を無視した重複チェック
 * - Qiita APIを使った著者検証
 * - 検証済みとしてマーク
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} author - 検証する著者名
 */
const validateAuthor = async (author: string): Promise<void> => {
  if (!author) return;
  // 1. 既に検証済みの著者は再検証しない（ループ防止）
  if (isAuthorAlreadyValidated(author)) return;
  // 2. 大文字小文字を無視した重複チェック
  const existingAuthorData = findExistingAuthor(author);
  if (existingAuthorData) {
    handleExistingAuthorDuplication(author, existingAuthorData.index);
    return;
  }
  // 3. Qiita APIを使った著者検証
  await validateAuthorWithQiitaApi(author);
};

/**
 * 著者が既に検証済みかチェックする
 * @param {string} author - 検証する著者名
 * @return {boolean} - 検証済みの場合は true, そうでない場合は false
 */
const isAuthorAlreadyValidated = (author: string): boolean => {
  if (validatedAuthors.value.has(author)) {
    console.debug(`Author ${author} is already validated, skipping validation`);
    return true;
  }
  return false;
};

/**
 * 大文字小文字を無視して既存著者を検索する
 * @param {string} author - 検索する著者名
 * @return {object|null} - 既存著者のインデックスと著者名を含むオブジェクト、または null
 */
const findExistingAuthor = (author: string): { index: number; author: string } | null => {
  const authorLowerCase = author.toLowerCase();
  const existingAuthorIndex = selectedAuthors.value.findIndex(
    a => a.toLowerCase() === authorLowerCase && a !== author,
  );
  if (existingAuthorIndex !== -1) {
    // 既存著者が見つかった場合
    return {
      index: existingAuthorIndex,
      author: selectedAuthors.value[existingAuthorIndex],
    };
  }

  return null;
};

/**
 * 既存著者との重複を処理する
 * - 大文字小文字を無視した重複チェック
 * - 既存著者を選択リストに追加
 * - 検証済みとしてマーク
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} inputAuthor - 入力された著者名
 * @param {number} existingAuthorIndex - 既存著者のインデックス
 */
const handleExistingAuthorDuplication = (
  inputAuthor: string,
  existingAuthorIndex: number,
): void => {
  const existingAuthor = selectedAuthors.value[existingAuthorIndex];
  console.warn(
    `重複した著者の登録が試行されました。既存の著者「${existingAuthor}」と新しい著者「${inputAuthor}」は大文字小文字の違いを無視すると同一です。`,
  );
  // 入力著者を既存著者で置き換える
  const inputAuthorIndex = selectedAuthors.value.indexOf(inputAuthor);
  if (inputAuthorIndex !== -1) {
    selectedAuthors.value[inputAuthorIndex] = existingAuthor;
    // 表示用リストも更新する
    updateDisplayAuthors();
  }
  // 検証済みとしてマーク
  validatedAuthors.value.add(inputAuthor);
  validatedAuthors.value.add(existingAuthor);
  // モデル値を更新
  emit('update:modelValue', selectedAuthors.value);
};

/**
 * Qiita APIを使って入力された著者が存在するかを検証する
 * - 検証中としてマーク
 * - 検証が完了したら、検証中から削除
 * - APIから取得した著者IDで重複チェック
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} author - 検証する著者名
 */
const validateAuthorWithQiitaApi = async (author: string): Promise<void> => {
  // 検証中としてマーク
  pendingAuthors.value.push(author);
  validatedAuthors.value.add(author);
  try {
    console.log(`著者を検証中: "${author}"`);
    const userData = await useGetQiitaAuthor(app, author);
    // 検証中から削除
    pendingAuthors.value = pendingAuthors.value.filter(a => a !== author);
    if (userData) {
      console.log(`著者の検証完了: "${author}" は有効です。ID="${userData.id}"`);
      // APIから取得した著者IDで重複チェック
      handleAuthorFromApiResponse(author, userData);
    }
    else {
      console.warn(`著者の検証完了: "${author}" は無効です。Qiitaに存在しません。`);
    }
  }
  catch (error) {
    console.error('Error validating author:', error);
    pendingAuthors.value = pendingAuthors.value.filter(a => a !== author);
  }
  finally {
    // モデル値を更新
    emit('update:modelValue', selectedAuthors.value);
  }
};

/**
 * APIレスポンスから取得した著者IDの処理
 * - APIから取得した著者IDが既存著者と重複する場合の処理
 * - 重複がない場合は正確な著者IDに置き換え
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} inputAuthor - 入力された著者名
 * @param {QiitaUserApiResponse} userData - APIから取得した著者データ
 */
const handleAuthorFromApiResponse = (inputAuthor: string, userData: QiitaUserApiResponse): void => {
  // APIから取得した正確な著者IDで再度重複チェック
  const correctAuthorLowerCase = userData.id.toLowerCase();
  const correctAuthorExistingIndex = selectedAuthors.value.findIndex(
    a => a.toLowerCase() === correctAuthorLowerCase && a !== inputAuthor,
  );
  if (correctAuthorExistingIndex !== -1) {
    // APIから取得した正確な著者IDが既に存在する場合
    handleApiAuthorDuplication(inputAuthor, correctAuthorExistingIndex, userData);
  }
  else {
    // 重複がない場合は正確な著者IDに置き換え
    updateAuthorWithCorrectId(inputAuthor, userData);
  }
};

/**
 * APIから取得した著者IDが既存著者と重複する場合の処理
 * - 入力著者を既存著者に置き換え
 * - 検証済みとしてマーク
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} inputAuthor - 入力された著者名
 * @param {number} existingAuthorIndex - 既存著者のインデックス
 * @param {QiitaUserApiResponse} userData - APIから取得した著者データ
 */
const handleApiAuthorDuplication = (
  inputAuthor: string,
  existingAuthorIndex: number,
  userData: QiitaUserApiResponse,
): void => {
  console.warn(
    `APIから取得した著者「${userData.id}」は既に登録されている著者「${selectedAuthors.value[existingAuthorIndex]}」と重複しています。`,
  );

  // 入力著者を既存著者に置き換え
  const inputAuthorIndex = selectedAuthors.value.indexOf(inputAuthor);
  if (inputAuthorIndex !== -1) {
    selectedAuthors.value[inputAuthorIndex] = selectedAuthors.value[existingAuthorIndex];

    // 検証済みとしてマーク
    validatedAuthors.value.add(selectedAuthors.value[existingAuthorIndex]);

    // 表示用リストも更新
    updateDisplayAuthors();
  }
};

/**
 * 著者を正確なIDに更新
 * - 大文字小文字の違いがある場合は置き換える
 * - 新しいIDも検証済みとしてマーク
 * - モデル値を更新して親コンポーネントに通知する
 * @param {string} inputAuthor - 入力された著者名
 * @param {QiitaUserApiResponse} userData - APIから取得した著者データ
 */
const updateAuthorWithCorrectId = (inputAuthor: string, userData: QiitaUserApiResponse): void => {
  const authorIndex = selectedAuthors.value.indexOf(inputAuthor);
  if (authorIndex !== -1) {
    // 元の入力値と大文字小文字の違いがある場合は置き換える
    // 大文字小文字の違いだけでなく、APIから取得した正確なIDを使用
    selectedAuthors.value[authorIndex] = userData.id;
    // 新しいIDも検証済みとしてマーク
    validatedAuthors.value.add(userData.id);
    // 表示用リストも更新
    updateDisplayAuthors();
    // 有効な著者として追加（まだ追加されていない場合）
    if (!validAuthors.value.includes(userData.id)) {
      validAuthors.value.push(userData.id);
    }
    console.log(`著者を正規化: "${inputAuthor}" → "${userData.id}"`);
  }
  else {
    console.warn(`著者 "${inputAuthor}" が選択リストに見つかりません`);
  }
};

/**
 * 表示用著者リストを更新する
 * - 選択された著者の順序を保持しながら表示用著者を更新する
 */
const updateDisplayAuthors = (): void => {
  // 選択された著者の順序を保持しながら表示用著者も更新
  displayAuthors.value = [...selectedAuthors.value];
};

/**
 * props.modelValueが外部から変更されたら選択著者を更新
 * - 親コンポーネントからの変更を受け取る
 * - 新しい著者の検証を行う
 */
watch(
  () => props.modelValue,
  (newVal) => {
    selectedAuthors.value = [...newVal];
    displayAuthors.value = [...newVal];
    // 新しい著者の検証を行う
    for (const author of selectedAuthors.value) {
      if (!validatedAuthors.value.has(author)) {
        validateAuthor(author);
      }
    }
  },
  { deep: true },
);

// 初期著者の検証
(async (): Promise<void> => {
  for (const author of selectedAuthors.value) {
    await validateAuthor(author);
  }
})();
</script>
