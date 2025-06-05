<template lang="pug">
div
  //- Hero Section
  v-container.hero-section(fluid, class="pa-0")
    v-row.hero-bg(no-gutters, align="center", justify="center")
      v-col(cols="12")
        .hero-content.text-center.pa-2.pa-md-4
          .d-flex.align-center.justify-center.mb-4
            img(src="@/assets/main_transparent_512.png", alt="Tech Post Cast", style="height: 300px;")
          p.text-h4.font-weight-bold.text-white.mb-4 あなた専用のAIラジオ番組を毎日お届け
          p.text-body-1.text-md-h6.mb-8.text-white.green-lighten-1--text.mx-auto(style="max-width: 720px")
            | 従来の人気記事配信に加えて、Qiitaの中からあなたが興味のあるタグや著者の記事を選んで、AIのMC「ポステル」が音声でわかりやすく解説します。
            br
            | あなただけのパーソナルラジオ、ついに配信スタート！
          .d-flex.flex-column.flex-sm-row.gap-4.justify-center.align-center.mb-8
            v-chip(variant="outlined", color="white", size="large", class="px-4 py-2") 2025年7月上旬リリース予定
            v-chip(color="white", size="large", class="px-4 py-2") 先行ユーザー招待開始
          v-btn(
            size="x-large",
            color="orange",
            class="px-8 py-3",
            @click="scrollToRegister"
          ) 事前登録する

  //- Features Section
  v-container.py-16
    v-row.justify-center
      v-col(cols="12", class="text-center mb-16")
        h2.text-h4.text-md-h3.font-weight-bold.mb-4 主要機能
        p.text-body-1.text-md-h6.grey--text.mx-auto(style="max-width: 600px") 話題の技術記事を「耳で楽しむ」新しい体験をお届けします
      v-col(cols="12")
        v-row
          v-col(
            v-for="(feature, index) in features",
            :key="index",
            cols="12",
            sm="6",
            lg="3"
          )
            v-card.text-center.h-100(hover, elevation="2")
              v-card-text.pa-6
                .mx-auto.mb-4(style="width: 48px; height: 48px;")
                  v-avatar(color="green-lighten-4", size="48")
                    v-icon(color="green-darken-2", size="24") {{ feature.icon }}
                h3.text-h6.font-weight-bold.mb-2 {{ feature.title }}
                p.text-body-2.grey--text {{ feature.description }}

  //- Sample Audio Section
  v-container.py-16(style="background-color: #f5f5f5;")
    v-row.justify-center
      v-col(cols="12", md="8", lg="6")
        .text-center
          h2.text-h4.text-md-h3.font-weight-bold.mb-8 サンプル音声を体験
          v-card.pa-8
            v-card-text.text-center
              .d-flex.justify-center.mb-6
                img(src="@/assets/logo_green.png", alt="Tech Post Cast", style="height: 96px;")
              //- h3.text-h5.font-weight-bold.mb-2 AIのMC「ポステル」
              p.text-body-1.grey--text.mb-6 FMラジオ番組のようにAIのMC「ポステル」が親しみやすい解説で技術記事を分かりやすく解説します
              v-btn(
                size="large",
                color="primary",
                class="px-8 py-3",
                @click="togglePlay"
              )
                v-icon(class="mr-2") {{ isPlaying ? 'mdi-volume-high' : 'mdi-play' }}
                | {{ isPlaying ? '再生中...' : 'サンプル音声を再生' }}
              p.text-caption.grey--text.mt-4(v-if="isPlaying") ※ 実際のサンプル音声は近日公開予定です

  //- Registration Form
  v-container#register.py-16
    v-row.justify-center
      v-col(cols="12", md="8", lg="6")
        .text-center.mb-12
          h2.text-h4.text-md-h3.font-weight-bold.mb-4 事前登録
          p.text-body-1.text-md-h6.grey--text リリース通知とベータ版招待をいち早くお届けします

        v-card.pa-8(v-if="!isSubmitted")
          v-card-text
            p.text-body-1.font-weight-medium.mb-4 事前登録していただくとリリース通知とベータ版招待を受け取れます
            v-btn(
              size="large",
              color="orange",
              block,
              class="py-3"
              @click="goToForm",
            ) 事前登録する

        v-card.pa-8.text-center(v-else)
          .d-flex.justify-center.mb-4
            v-avatar(color="green-lighten-4", size="64")
              v-icon(color="green-darken-2", size="32") mdi-star
          h3.text-h5.font-weight-bold.mb-2 登録完了！
          p.text-body-1.grey--text.mb-6 ありがとうございます。リリース情報をお送りいたします。
          .d-flex.justify-center.gap-4
            v-btn(
              variant="outlined",
              href="https://twitter.com/techpostcast",
              target="_blank",
              rel="noopener noreferrer"
            )
              v-icon(class="mr-2") mdi-twitter
              | フォロー
            v-btn(
              variant="outlined",
              href="https://lin.ee/a1dD32a",
              target="_blank",
              rel="noopener noreferrer"
            )
              v-icon(class="mr-2") mdi-chat-outline
              | LINE友だち追加

  //- FAQ Section
  v-container.py-16(style="background-color: #f5f5f5;")
    v-row.justify-center
      v-col(cols="12", md="10", lg="8")
        .text-center.mb-12
          h2.text-h4.text-md-h3.font-weight-bold.mb-4 よくある質問
        v-expansion-panels(variant="accordion")
          v-expansion-panel(
            v-for="(faq, index) in faqs",
            :key="index",
            class="faq-panel"
          )
            v-expansion-panel-title(class="faq-question")
              h3.text-h6.font-weight-medium {{ faq.question }}
            v-expansion-panel-text(class="faq-answer")
              p.text-body-1.grey--text {{ faq.answer }}

  //- Footer
  v-footer.bg-grey-darken-4.white--text.py-12
    v-container
      v-row.justify-center
        v-col(cols="12", class="text-center")
          .d-flex.align-center.justify-center.mb-6
            v-icon(size="32", class="mr-3") mdi-radio
            h3.text-h5.font-weight-bold Tech Post Cast
          p.text-body-2.grey-lighten-1--text.mb-8.mx-auto(style="max-width: 400px") 話題の技術記事を「耳で楽しむ」新しい体験をお届けします
          .d-flex.justify-center.flex-wrap.gap-6.mb-8
            a.text-decoration-none.text-white(
              href="https://twitter.com/techpostcast",
              target="_blank",
              rel="noopener noreferrer",
              class="hover-white"
            )
              v-icon(class="mr-2") mdi-twitter
              | @techpostcast
            a.text-decoration-none.text-white(
              href="https://lin.ee/a1dD32a",
              target="_blank",
              rel="noopener noreferrer",
              class="hover-white"
            )
              v-icon(class="mr-2") mdi-chat-outline
              | LINE公式アカウント
          v-divider.my-8
          p.text-caption.grey--text © 2025 TEP Lab. All rights reserved.
</template>

<script setup lang="ts">
// layout
definePageMeta({
  layout: 'teaser',
});

// SEO設定
const title = 'Tech Post Cast - 事前登録 | 話題のQiita記事をAIラジオで毎日配信';
const description
  = '2025年7月上旬リリース予定！Qiitaの人気IT技術記事をAIのMC「ポステル」が解説するラジオ番組を毎日配信。事前登録でベータ版招待をいち早くお届けします。';

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: '/ogp_image.png',
  twitterCard: 'summary_large_image',
  twitterImage: '/ogp_image.png',
});

// リアクティブデータ
const isSubmitted = ref(false);
const isPlaying = ref(false);

// 主要機能
const features = [
  {
    icon: 'mdi-clock-outline',
    title: '毎朝7時自動配信',
    description: '最新の技術トレンドはもちろん、あなた専用のAIラジオ番組を毎朝お届け',
  },
  {
    icon: 'mdi-rss',
    title: 'パーソナルフィード機能',
    description: 'あなたが興味のあるタグや著者の記事を選んで、あなた専用のAIラジオ番組を配信します',
  },
  {
    icon: 'mdi-lightning-bolt',
    title: 'チャプター機能',
    description: '興味のある部分にさっとスキップして聴取できます',
  },
  {
    icon: 'mdi-headphones',
    title: 'マルチプラットフォーム',
    description: 'Spotify、Amazon Music、Apple Podcasts、YouTubeで配信しています',
  },
];

// FAQ
const faqs = [
  {
    question: 'どんな記事が紹介されますか？',
    answer:
      '従来のQiitaで話題になっている最新のIT技術記事を紹介するヘッドライントピック番組に加えて、あなたが指定したタグや著者の記事を解説したパーソナライズされた番組も配信予定です。',
  },
  {
    question: 'パーソナルフィード機能とは？',
    answer:
      'あなたが興味のあるタグ（例：LLM、React、Pythonなど）や著者を指定することで、その条件に合った記事だけを集めた、あなた専用の番組を生成・配信する機能です。より効率的に欲しい情報をキャッチアップできます。',
  },
  {
    question: '料金はかかりますか？',
    answer:
      'ヘッドライントピック番組（人気記事配信）は無料でご利用いただけます。パーソナルフィード機能は有料プランでご提供予定です。',
  },
  {
    question: 'どのデバイスで聴けますか？',
    answer:
      'スマートフォン、タブレット、PC、スマートスピーカーなど、Podcastに対応したデバイスでお楽しみいただけます。',
  },
];

// メソッド
const scrollToRegister = (): void => {
  const element = document.getElementById('register');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const goToForm = (): void => {
  isSubmitted.value = true;
  // 別タブでフォームを開く
  window.open('https://forms.gle/MtLCnCQ3seDLXb8D6', '_blank');
};

const togglePlay = (): void => {
  isPlaying.value = !isPlaying.value;
  // TODO: 実際の音声再生処理を実装
};
</script>

<style lang="scss" scoped>
.hero-section {
  background: linear-gradient(135deg, #55c500 0%, #2b6300 100%);
  position: relative;
  overflow: hidden;
}

.hero-bg {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  padding: 4rem 0;
  display: flex;
  align-items: center;
}

@media (min-width: 768px) {
  .hero-bg {
    padding: 6rem 0;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.gradient-avatar {
  background: linear-gradient(135deg, #55c500 0%, #2b6300 100%);
}

.hover-white:hover {
  color: white !important;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}

// FAQ セクションのスタイル
.faq-panel {
  margin-bottom: 0.5rem;
  border-radius: 8px;
  overflow: hidden;
}

.faq-question {
  background-color: #e8f5e8 !important;
  border-bottom: 1px solid #c8e6c9;

  &:hover {
    background-color: #dcedc8 !important;
  }
}

.faq-answer {
  background-color: #f9f9f9 !important;
  padding: 1.5rem !important;
}
</style>
