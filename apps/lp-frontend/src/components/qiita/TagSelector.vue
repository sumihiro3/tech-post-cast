<template>
  <div>
    <div class="mb-3">
      <div class="d-flex align-center mb-2">
        <v-icon size="small" class="mr-1">mdi-tag</v-icon>
        <span class="font-weight-medium">タグ</span>
        <div class="text-caption text-grey ml-2">(最大10個まで)</div>
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
  modelValue: {
    type: Array as () => string[],
    default: () => [],
  },
  maxTags: {
    type: Number,
    default: 10,
  },
});

const emit = defineEmits(['update:modelValue']);

// 選択されたタグリスト
const selectedTags = ref<string[]>([...props.modelValue]);

// 表示用のタグリスト
const displayTags = ref<string[]>([...props.modelValue]);

// 有効なタグ（存在確認済みのタグ）のリスト
const validTags = ref<string[]>([]);

// 検証中のタグリスト
const pendingTags = ref<string[]>([]);

// バリデーション済みのタグを保持するSet
const validatedTags = ref(new Set<string>());

// 無効なタグが存在するかどうか
const invalidTagsExist = computed(() => {
  return selectedTags.value.some(
    (tag: string) => !validTags.value.includes(tag) && !pendingTags.value.includes(tag),
  );
});

// 検証中のタグが存在するかどうか
const pendingTagsExist = computed(() => {
  return pendingTags.value.length > 0;
});

// タグの色を取得する
const getTagColor = (tag: string): string => {
  if (pendingTags.value.includes(tag)) return 'grey'; // 検証中
  if (validTags.value.includes(tag)) return 'primary'; // 有効
  return 'error'; // 無効
};

// タグのアイコンを取得する
const getTagIcon = (tag: string): string => {
  if (pendingTags.value.includes(tag)) return 'mdi-clock-outline'; // 検証中
  if (validTags.value.includes(tag)) return 'mdi-check-circle'; // 有効
  return 'mdi-alert-circle'; // 無効
};

// 表示用のタグが変更されたときの処理
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
  const newTags = selectedTags.value.filter(tag => !prevSelectedTags.includes(tag));
  if (newTags.length > 0) {
    console.log('新しく追加されたタグ:', newTags);

    // 既存タグとの大文字小文字を無視した重複をチェック
    for (const newTag of newTags) {
      // 大文字小文字を無視した重複チェック - 既存のタグで同じものがあるか
      const lowerCaseNewTag = newTag.toLowerCase();
      const duplicateIndex = selectedTags.value.findIndex(
        (tag, index) =>
          tag.toLowerCase() === lowerCaseNewTag
          && tag !== newTag
          && selectedTags.value.indexOf(newTag) !== index,
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

      // 重複していない新しいタグはバリデーション
      validateTag(newTag);
    }
  }

  // 親コンポーネントに変更を通知
  emit('update:modelValue', selectedTags.value);
};

// スペースキーが押されたときに新しいタグを追加
const onTagInput = (e: KeyboardEvent): void => {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();

  if (value && !selectedTags.value.includes(value) && selectedTags.value.length < props.maxTags) {
    selectedTags.value.push(value);
    displayTags.value.push(value);
    validateTag(value);
    input.value = '';
    emit('update:modelValue', selectedTags.value);
  }
};

// フォーカスが外れたときに入力中のタグを検証
const validateCurrentTag = (e: FocusEvent): void => {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();

  if (value && !selectedTags.value.includes(value) && selectedTags.value.length < props.maxTags) {
    selectedTags.value.push(value);
    displayTags.value.push(value);
    validateTag(value);
    input.value = '';
    emit('update:modelValue', selectedTags.value);
  }
};

// タグの存在検証メイン関数
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

// 1. タグが既に検証済みかチェック
const isTagAlreadyValidated = (tag: string): boolean => {
  if (validatedTags.value.has(tag)) {
    console.debug(`Tag ${tag} is already validated, skipping validation`);
    return true;
  }
  return false;
};

// 2. 大文字小文字を無視して既存タグを検索
const findExistingTag = (tag: string): { index: number; tag: string } | null => {
  const tagLowerCase = tag.toLowerCase();
  const existingTagIndex = selectedTags.value.findIndex(
    t => t.toLowerCase() === tagLowerCase && t !== tag,
  );

  // 既存タグが見つかった場合はそのインデックスとタグを返す
  if (existingTagIndex !== -1) {
    return {
      index: existingTagIndex,
      tag: selectedTags.value[existingTagIndex],
    };
  }
  // それ以外はnullを返す
  return null;
};

// 3. 既存タグとの重複を処理
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

// 4. Qiita APIを使ったタグ検証
const validateTagWithQiitaApi = async (tag: string): Promise<void> => {
  // 検証中としてマーク
  pendingTags.value.push(tag);
  validatedTags.value.add(tag);

  try {
    console.log(`タグを検証中: "${tag}"`);
    const tagData = await useGetQiitaTag(app, tag);

    // 検証中から削除
    pendingTags.value = pendingTags.value.filter(t => t !== tag);

    if (tagData) {
      console.log(`タグの検証完了: "${tag}" は有効です。ID="${tagData.id}"`);
      // APIから取得したタグIDで重複チェック
      handleTagFromApiResponse(tag, tagData);
    }
    else {
      console.warn(`タグの検証完了: "${tag}" は無効です。Qiitaに存在しません。`);
    }
  }
  catch (error) {
    console.error('Error validating tag:', error);
    pendingTags.value = pendingTags.value.filter(t => t !== tag);
  }
  finally {
    // モデル値を更新
    emit('update:modelValue', selectedTags.value);
  }
};

// 5. APIレスポンスから取得したタグIDの処理
const handleTagFromApiResponse = (inputTag: string, tagData: QiitaTagApiResponse): void => {
  // APIから取得した正確なタグIDで再度重複チェック
  const correctTagLowerCase = tagData.id.toLowerCase();
  const correctTagExistingIndex = selectedTags.value.findIndex(
    t => t.toLowerCase() === correctTagLowerCase && t !== inputTag,
  );

  if (correctTagExistingIndex !== -1) {
    // APIから取得した正確なタグIDが既に存在する場合
    handleApiTagDuplication(inputTag, correctTagExistingIndex, tagData);
  }
  else {
    // 重複がない場合は正確なタグIDに置き換え
    updateTagWithCorrectId(inputTag, tagData);
  }
};

// 6. APIから取得したタグIDが既存タグと重複する場合の処理
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

// 7. タグを正確なIDに更新
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
  }
  else {
    console.warn(`タグ "${inputTag}" が選択リストに見つかりません`);
  }
};

// 表示用タグリストを更新
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
