<template lang="pug">
  v-row
    v-col(v-if="!liff.isLoggedIn()" cols="12")
      //- ログインしていない場合は、ログインボタンを表示する
      LineLoginButton
    v-col(v-else cols="12")
      h2
        | 📧 お便りを投稿する 📧
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
import { helpers, required, minLength } from '@vuelidate/validators';
import LineLoginButton from '~/components/line-login-button.vue';

const nuxtApp = useNuxtApp();
const liff = nuxtApp.$liff;

// フォームの状態
const state = reactive({
  penName: '',
  password: '',
});

onMounted(async () => {
  if (!liff.isLoggedIn()) {
    return;
  }
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
  },
  body: {
    required: helpers.withMessage('お便りの内容を入力してください', required),
    minLength: helpers.withMessage(
      ({ $params }: string) => `お便りの内容は${$params.min}文字以上で入力してください`, minLength(10),
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

  // お便りを投稿する処理を実装する
  alert('お便りを投稿しました。');
};
</script>
