# 【実装解説】「Gemini 2.5 プレビュー版 TTS」で複数話者ラジオ番組を自動生成してみた

## はじめに

**「人気の技術記事を『ながら聴き』で効率的に情報収集したい！」**

そんな思いから開発している「[Tech Post Cast](https://techpostcast.com/)」では、Google Cloud の最新TTS（Text-to-Speech）技術「**Gemini 2.5 プレビュー版 TTS**」を使って、複数話者による対話形式のラジオ番組を自動生成する機能を実装しました。

従来の単調な一人語りから、司会者と専門家の掛け合いによる深掘り解説へと進化させることで、**より聞きやすく理解しやすい番組作り** を目指しています。

### 🎧 実際に生成した番組はこちら

**[AI週4日勤務とCISSP合格、応用情報の学習など](https://techpostcast.com/headline-topic-programs/cmcnxhy5a0000s60oovpuw7od)**

本記事では、Gemini 2.5 プレビュー版 TTSの概要から実装方法、実際に使ってみて感じた課題まで詳しく解説します。

## 🚀 Gemini 2.5 プレビュー版 TTSとは

Gemini 2.5 プレビュー版 TTSは、Googleが提供する **最新の音声合成技術** です。従来のText-to-Speech APIと比べて、以下のような革新的な特徴があります。

### 主な特徴

- **複数話者対応**: 1つのリクエストで複数の話者による対話を生成可能
- **自然な音声**: より人間らしい自然な発話
- **話者の識別**: セリフ形式のテキストから自動的に話者を判別

### 🔄 従来のText-to-Speech APIとの違い

従来のGoogle Cloud Text-to-Speech APIでは、1つのリクエストで一人の話者の音声しか生成できませんでした。複数話者の対話を実現するには、話者ごとに別々のリクエストを送り、後から音声ファイルを結合する必要がありました。

**Gemini 2.5 プレビュー版 TTS** では、以下のようなセリフ形式のテキストを渡すだけで、自動的に複数話者の対話音声を生成できます。

```txt
Postel: こんにちは、Tech Post Cast のポステルです。
John: そして、ジョンです。
Postel: 今日は面白い技術記事を紹介していきますね。
John: はい、楽しみにしています。
```

## 💡 実装のポイント

### 1. 📝 台本生成の工夫

複数話者モードでは、AIに以下のような指示を与えて台本を生成しています。

```typescript
const speakerInstructions = `
- ラジオは楽しい雰囲気で、スピーカーは日本のFMラジオのような喋り方をします
- ラジオのMCは2人で、名前は「ポステル（Postel）」と「ジョン（John）」です
- ポステルは知的で物静かな人物で、エンジニアをリスペクトしています。司会進行と質問を担当します
- ジョンは技術に詳しく、分かりやすい解説が得意です。技術的な詳細解説を担当します
- 両者とも口調は優しく丁寧で、自然な対話を心がけます
- 2人の掛け合いで記事の内容を分かりやすく解説します
`;
```

### 2. 🎤 音声合成の実装

#### Gemini 2.5 プレビュー版 TTSを使った音声生成の実装例

```typescript
/**
 * Gemini 2.5 Flash TTSを使用して音声ファイルを生成する
 */
async generateGeminiTtsAudio(
  text: string,
  outputFilePath: string,
): Promise<void> {
  const apiKey = this.appConfig.GoogleGenAiApiKey;
  const ai = new GoogleGenAI({ apiKey });

  const contents: ContentListUnion = {
    parts: [{ text }],
  };

  const config: GenerateContentConfig = {
    responseModalities: ['AUDIO'],
    speechConfig: {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          {
            speaker: 'POSTEL',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
          {
            speaker: 'JOHN',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Sadaltager' },
            },
          },
        ],
      },
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents,
    config,
  });

  const audioBuffer = Buffer.from(response.data, 'base64');
  await this.saveAudioFile(outputFilePath, audioBuffer);
}
```

### 3. 📋 セリフ形式の台本フォーマット

重要なのは、台本を以下の形式で出力することです。

```txt
Postel: 最初の記事は『AI週4日勤務制度の導入事例』です。
John: 興味深いテーマですね。どのような内容でしょうか？
Postel: この記事では、AI活用による業務効率化で週4日勤務を実現した企業の事例が紹介されています。
John: 具体的にはどのような AI を活用したのでしょうか？
```

**重要なポイント：**

- 話者名は英語表記（`Postel:`, `John:`）
- 半角コロン（`:`）を使用
- 各発言は必ず話者名から始める

### 4. 🔄 エラーハンドリングとリトライ機能

プレビュー版のため、API呼び出しが失敗することがあります。 **安定して音声合成できるようリトライ機能を実装しています。**

```typescript
const maxRetries = 5;
const retryDelayMs = 2000;

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents,
      config,
    });

    if (response.data) {
      const audioBuffer = Buffer.from(response.data, 'base64');
      await this.saveAudioFile(outputFilePath, audioBuffer);
      return; // 成功したら終了
    }
  } catch (error) {
    if (attempt === maxRetries) {
      throw error;
    }
    await setTimeout(retryDelayMs);
  }
}
```

## 📊 実際に使ってみた感想

### ✅ 良かった点

1. **実装の簡単さ**: セリフ形式のテキストと話者のタイプを指定するだけで複数話者の音声が生成できる
2. **自然な対話**: セリフの読み上げが自然で聞き取りやすい
3. **音声の一貫性**: 同一リクエスト内で生成されるため、話者間の音量や音質のバランスが自然に保たれる

### ⚠️ 改善してほしい点

実際に使用してみて、以下のような課題を感じました。

#### 1. 🗣️ 日本語の読み上げ精度

日本語の読み上げ精度は全体的にはとても良いのですが、読み間違いがところどころあります。
今回生成したところでは、下記のような読み間違いがありました。

```txt
台本: 「John: そして、ジョンです。」
実際の音声: 「ジョン。そして、ジョンです。」
```

```txt
台本: 「今日のTech Post Castでは…」
実際の音声: 「こんなTech Post Castでは…」
```

とても細かいところなのですが、音声だけ聞いていると頭に残ってしまうんですよね。

#### 2. 👥 話者の誤認識

同じ話者のセリフが連続すると、別の話者に切り替わってしまうことがあります。

```txt
台本: Postel: こんにちは
      Postel: 今日は2025年7月4日ですね

実際: Postel: こんにちは
      John: 今日は2025年7月4日ですね  # 話者が勝手に切り替わってしまう
```

#### 3. 🎛️ SSML非対応

SSMLに非対応なので、以下のような読み上げの調整ができません。

- 単語の読み方を指定できない
- 全体の読み上げスピードやピッチを調整できない
- 話者切り替え時の間を制御できず、前の話者の発話が終わると間髪入れずに次の話者が始まる

#### 4. ⏱️ レート制限

プレビュー版のため、[レート制限](https://ai.google.dev/gemini-api/docs/rate-limits?hl=ja)があり、大量の番組生成には制約があります。

## 🎯 まとめ

「**Gemini 2.5 プレビュー版 TTS**」は、複数話者による自然な対話音声を簡単に生成できる画期的な技術です。実装も従来の方法と比べて大幅に簡略化されました。

一方で、プレビュー版ということもあり、日本語の読み上げ精度や話者認識の改善余地があります。GA版では、これらの課題が解決され、SSMLサポートなども追加されることを期待しています。

### 🚀 Tech Post Cast で体験してみませんか？

**Tech Post Cast** では、この技術を活用してエンジニアの皆さんがより効率的に技術情報をキャッチアップできるラジオ番組を提供しています。興味のある方は、ぜひ一度お聞きください！

🎧 **Tech Post Cast**: <https://techpostcast.com/>

**Tech Post Cast** をどういう思いで開発したか、次にどのような機能を追加しようとしているかを下記の記事にまとめましたので、ぜひこちらもご覧ください！

📝 **開発背景記事**: <https://qiita.com/sumihiro3/items/105c0b74ef080ba05a5d>

📝 **新機能「パーソナルフィード」の紹介**: <https://zenn.dev/sumihiro3/articles/66643cce7dcb60>

---

## 参考リンク

- [Gemini API 音声生成ドキュメント](https://ai.google.dev/gemini-api/docs/speech-generation?hl=ja)
- [Tech Post Cast](https://techpostcast.com/)
- [複数話者での番組の生成例](https://techpostcast.com/headline-topic-programs/cmcnxhy5a0000s60oovpuw7od)
- [Tech Post Castの開発背景記事](https://qiita.com/sumihiro3/items/105c0b74ef080ba05a5d)
- [Tech Post Cast — AIが届ける、あなただけのテックラジオ番組](https://zenn.dev/sumihiro3/articles/66643cce7dcb60)
