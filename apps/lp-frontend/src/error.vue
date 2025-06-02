<template lang="pug">
  div.error-page
    v-container.text-center
      v-row.justify-center.align-center(style="min-height: 60vh;")
        v-col(cols="12" md="6")
          v-icon(size="120" color="error") mdi-alert-circle-outline
          h1.text-h3.mb-4 {{ error.statusCode }}
          h2.text-h5.mb-6.text-medium-emphasis {{ error.statusMessage }}
          p.text-body-1.mb-8(v-if="error.statusCode === 404")
            | お探しのページが見つかりませんでした。
            br
            | URLが正しいかご確認ください。
          p.text-body-1.mb-8(v-else)
            | 申し訳ございませんが、エラーが発生しました。
            br
            | しばらく時間をおいてから再度お試しください。
          v-btn(
            color="primary"
            size="large"
            prepend-icon="mdi-home"
            @click="handleGoHome"
          ) ホームに戻る
</template>

<script setup lang="ts">
interface NuxtError {
  statusCode: number;
  statusMessage: string;
  message?: string;
}

const props = defineProps<{
  error: NuxtError;
}>();

const router = useRouter();

// ホームページに戻る
const handleGoHome = async (): Promise<void> => {
  try {
    if (import.meta.client) {
      // SSGビルドの場合、直接リロードが確実
      if (import.meta.env.MODE === 'production') {
        window.location.href = '/';
        return;
      }

      // 開発環境では通常のルーティング
      await clearError();
      await router.push('/');
    }
  } catch {
    // フォールバック: 直接リロード
    if (import.meta.client) {
      window.location.href = '/';
    }
  }
};

// ページタイトルを設定
useHead({
  title: `${props.error.statusCode} - ${props.error.statusMessage}`,
});
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
}
</style>
