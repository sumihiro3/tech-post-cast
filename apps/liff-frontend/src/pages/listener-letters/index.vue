<template lang="pug">
  v-row
    //- Snackbar の表示
    v-snackbar(
      v-model="snackbar"
      location="top"
      :timeout="snackbarTimeout"
    )
      | {{ snackbarText }}
      template(#actions)
        v-btn(
          :color="snackbarColor"
          variant="text"
          @click="snackbar = false"
        )
          | Close
    v-col(v-if="!liff.isLoggedIn()" cols="12")
      //- ログインしていない場合は、ログインボタンを表示する
      LineLoginButton
    v-col(v-else cols="12")
      h2
        | 📮 お便りを投稿する 📮
      div.text-body-2
        | Tech Post Cast へお便りを投稿してください！<br />
        | いただいたお便りは、AI MC ポステルが番組内で紹介いたします。
    v-col(cols="12")
      //- ログイン済みの場合は、お便りを投稿するフォームを表示する
      v-text-field(
          v-model="state.penName",
          label="ペンネーム",
          :error-messages="v$.penName.$errors.map((e) => e.$message)"
          @input="v$.penName.$touch()"
          @blur="v$.penName.$touch()")
    v-col(cols="12")
      v-textarea(
        v-model="state.body",
        label="お便りの内容",
        :error-messages="v$.body.$errors.map((e) => e.$message)"
        @input="v$.body.$touch()"
        @blur="v$.body.$touch()")
    v-col(cols="12")
      v-btn(color="primary", block @click="sendLetter")
        | 投稿する
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app';
import { reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { helpers, required, minLength, maxLength } from '@vuelidate/validators';
import LineLoginButton from '~/components/line-login-button.vue';
import type { ListenerLetterSchema } from '@/api';

const nuxtApp = useNuxtApp();
const liff = nuxtApp.$liff;

// Snackbar の表示状態
const snackbar = ref(false);
// Snackbar のテキスト
const snackbarText = ref('');
// Snackbar の色
const snackbarColor = ref('success');
// Snackbar の表示時間
const snackbarTimeout = 10 * 1000;

// LIFF Access token
const liffAccessToken = ref('');

// フォームの状態
const state = reactive({
  penName: '',
  body: '',
});

onMounted(async () => {
  if (!liff.isLoggedIn()) {
    return;
  }
  // LIFF Access token を取得する
  liffAccessToken.value = await liff.getAccessToken();
  // ユーザーのプロフィール情報を取得する
  const profile = await liff.getProfile();
  if (profile) {
    state.penName = profile.displayName;
  }
});

// フォームのバリデーションルール
const rules = {
  penName: {
    required: helpers.withMessage('ペンネームを入力してください', required),
    minLength: helpers.withMessage(
      ({ $params }: string) => `ペンネームは${$params.min}文字以上で入力してください`, minLength(3),
    ),
    maxLength: helpers.withMessage(
      ({ $params }: string) => `ペンネームは${$params.max}文字以内で入力してください`, maxLength(50),
    ),
  },
  body: {
    required: helpers.withMessage('お便りの内容を入力してください', required),
    minLength: helpers.withMessage(
      ({ $params }: string) => `お便りの内容は${$params.min}文字以上で入力してください`, minLength(10),
    ),
    maxLength: helpers.withMessage(
      ({ $params }: string) => `お便りの内容は${$params.max}文字以内で入力してください`, maxLength(500),
    ),
  },
};
// バリデーションの実行
const v$ = useVuelidate(rules, state);

/**
 * お便りを投稿する処理
 */
const sendLetter = async (): void => {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;

  try {
    // お便りを投稿する
    const result: ListenerLetterSchema = await useSendListenerLetters(
      nuxtApp,
      state.penName,
      state.body,
      liffAccessToken.value,
    );
    // お便りの投稿に成功した場合は、スナックバーを表示する
    snackbarText.value = 'お便りを投稿しました！';
    snackbarColor.value = 'success';
    snackbar.value = true;
    console.debug(snackbarText.value, { result });
    liff.sendMessages([
      {
        type: 'text',
        text: `お便りを投稿しました！📮\n\nペンネーム: ${state.penName}\n\n内容: ${state.body}`,
      },
    ]);
    state.body = '';
  }
  catch (error) {
    snackbarText.value = 'お便りの投稿に失敗しました。';
    snackbarColor.value = 'error';
    snackbar.value = true;
    console.error(snackbarText.value, error);
  }
};
</script>
