import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { SpeakerMode } from '@prisma/client';
import { getJapaneseDateStringWithWeekday } from '@tech-post-cast/commons';
import { QiitaPostWithSummaryAndKeyPoints } from '../schemas';

/**
 * ヘッドライントピック番組の台本生成エージェント
 */
export const headlineTopicProgramScriptGenerationAgent = new Agent({
  name: 'headlineTopicProgramScriptGenerationAgent',
  instructions: '', // Instructions は getHeadlineTopicProgramScriptGenerationInstructions で生成すること
  // model: openai('gpt-4o'),
  model: google('gemini-2.0-flash-exp'),
});

/**
 * ヘッドライントピック番組の台本生成用の Instructions を生成する
 * @param programName 番組名
 * @param posts 記事のリスト
 * @param programDate 番組日
 * @param listenerLetters リスナーからのお便り（オプション）
 * @param speakerMode 話者モード
 * @returns Instructions
 */
export const getHeadlineTopicProgramScriptGenerationInstructions = (
  programName: string,
  posts: QiitaPostWithSummaryAndKeyPoints[],
  programDate: Date,
  listenerLetters?: Array<{
    id: string;
    penName: string;
    body: string;
  }>,
  speakerMode: SpeakerMode = SpeakerMode.SINGLE,
): string => {
  const dt = getJapaneseDateStringWithWeekday(programDate);

  // 話者モードに応じた基本指示を生成
  const speakerInstructions = getSpeakerModeInstructions(speakerMode);

  const instructions = `
## Instruction

あなたはプロの放送作家です。
与えられる情報をもとに、ラジオでMCが読み上げる台本を作成します。

${speakerInstructions}

- 番組名は「${programName}」です

## 番組の構成

### 番組の概要

- この番組は毎日のヘッドライントピックとして、注目すべき技術記事を紹介する番組です

### 番組タイトル

- 番組タイトルは、必ず紹介する記事タイトルを2つ使って25文字以内で考えてください
- 最後に「など」をつけてください

${getHeadlineOpeningInstructions(speakerMode, posts.length)}

${getHeadlinePostExplanationInstructions(speakerMode, posts.length)}

${getHeadlineListenerLettersInstructions(speakerMode, listenerLetters)}

${getHeadlineEndingInstructions(speakerMode, posts.length)}

${getHeadlineScriptConstraints(speakerMode)}

${getHeadlineOutputStructureInstructions(speakerMode)}

### 今日の日付

${dt}

### 紹介する記事

`;
  // 今日紹介する記事を組み立てる
  const postsScript = posts.map((post, index) => {
    return `#### ${index + 1}つ目の記事

##### 記事ID

${post.id}

##### 記事の著者

${post.author}

##### タイトル

${post.title}

##### 記事のタグ

${post.tags || post.tags.length > 0 ? post.tags.join(', ') : 'なし'}

##### 記事の要約

${post.summary}

##### 記事の要点

${post.keyPoints.join('\n')}
`;
  });
  const postsScriptText = postsScript.join('\n\n');

  // リスナーからのお便りセクション
  const listenerLettersSection =
    listenerLetters && listenerLetters.length > 0
      ? `
### リスナーからのお便り

${listenerLetters
  .map(
    (letter, index) => `
#### お便り ${index + 1}: ${letter.penName}さんより

${letter.body}
`,
  )
  .join('\n')}
`
      : '';

  return `${instructions}\n\n${postsScriptText}${listenerLettersSection}`;
};

/**
 * 話者モードに応じた基本指示を生成
 */
function getSpeakerModeInstructions(speakerMode: SpeakerMode): string {
  if (speakerMode === SpeakerMode.MULTI) {
    return `
- ラジオは楽しい雰囲気で、スピーカーは日本のFMラジオのような喋り方をします
- ラジオのMCは2人で、名前は「ポステル（Postel）」と「ジョン（John）」です
- ポステルは知的で物静かな人物で、エンジニアをリスペクトしています。司会進行と質問を担当します
- ジョンは技術に詳しく、分かりやすい解説が得意です。技術的な詳細解説を担当します
- 両者とも口調は優しく丁寧で、自然な対話を心がけます
- 2人の掛け合いで記事の内容を分かりやすく解説します`;
  } else {
  }
}

/**
 * ヘッドライントピック番組のオープニング部分の指示を生成
 */
function getHeadlineOpeningInstructions(
  speakerMode: SpeakerMode,
  postsLength: number,
): string {
  if (speakerMode === SpeakerMode.MULTI) {
    return `
### オープニング

- 最初に番組名とポステル、ジョンの名前を含めて挨拶をします
    - 冒頭は「こんにちは、Tech Post Cast のポステルです。」「そして、ジョンです。」のように言います
- 挨拶では、今日の日付（月、日、曜日）を添えて、今日の日付に応じた雑談を30秒程度します
    - 「如月」や「師走」などの和風月名は使わないでください
    - 2人の自然な会話として展開してください
- そして、Qiita（キータ）で注目の技術記事を紹介していることを伝えます
- 今日紹介する記事の本数（${postsLength} 本）を伝えます`;
  } else {
    return `
### オープニング

- 最初に番組名とポステルの名前を含めて挨拶をします
    - 冒頭は「こんにちは、Tech Post Cast のポステルです。」のように言います
- 挨拶では、今日の日付（月、日、曜日）を添えて、今日の日付に応じた雑談を30秒程度します
    - 「如月」や「師走」などの和風月名は使わないでください
- そして、Qiita（キータ）で注目の技術記事を紹介していることを伝えます
- 今日紹介する記事の本数（${postsLength} 本）を伝えます`;
  }
}

/**
 * ヘッドライントピック番組の記事解説部分の指示を生成
 */
function getHeadlinePostExplanationInstructions(
  speakerMode: SpeakerMode,
  postsLength: number,
): string {
  if (speakerMode === SpeakerMode.MULTI) {
    return `
### 紹介記事の解説

- ${postsLength} 本の「紹介記事」を解説します
- 必ず ${postsLength} 本すべての記事を解説します（厳守してください）
    - 'posts' に含まれる記事のみ解説してください（それ以外の記事は解説しないでください）
    - ただし、同じ記事を2回以上解説しないでください
- 紹介する技術記事の要約と要点です
    - この内容を元に、要点を漏らさずに記事を解説してください
    - 記事の解説は番組用の話し言葉の台本として生成してください
    - 記事の解説は「導入」「ポイントごとの解説」「まとめ」の3部構成とし、5分以内になるように構成を考えてください
        - 「導入」では、ポステルが記事のタイトルと著者名、タグを紹介します
            - 記事の冒頭は「最初の記事は 『{記事のタイトル}』 です。」のように始めてください
                - 必ず記事のタイトルを伝えます
                - 何番目の記事であるか、最後の記事であるかが分かるようにしてください
            - 必ず著者名を伝えます
            - タグがある場合は必ずタグを伝えます
                - 指定したタグ以外は伝えないでください
        - 「ポイントごとの解説」では、ポステルとジョンの対話形式で記事の内容を解説してください
            - ポステルは質問や確認を行い、ジョンが技術的な詳細を分かりやすく解説します
            - テクニカルな内容もやさしく噛み砕いて解説してください
            - ただし、要点はそのまま読み上げないでください
            - 必要に応じて例え話や比喩を使って分かりやすく説明してください
            - 例え話や比喩は1記事につき最大1つまでとし、特に複雑な概念を説明する際にのみ使用してください
            - 2人の自然な会話として展開し、相手の発言を受けて応答するようにしてください
        - 「まとめ」では、ポステルが記事の内容を簡潔にまとめ、ジョンが補足します
    - 自然な対話スタイル（2人のMCが会話しているイメージ）で、テクニカルな内容もやさしく噛み砕いて解説してください
- 一つの記事の解説文は必ず1000文字以上にしてください（この文字数は遵守してください）
    - また、一つの記事の解説文の最大文字数は1200文字にしてください（この文字数は遵守してください）
- 記事の解説はセリフ部分だけを出力します
    - 生成した台本を元に Gemini 2.5 Flash TTS で音声合成を行います
    - TTS での音声合成時にエラーとならないよう文章は長くしないでください
    - 必ず 「This request contains sentences that are too long. Consider splitting up long sentences with sentence ending punctuation e.g. periods.」 というエラーが出ないようにしてください
    - 文章の長さは、音声合成時にエラーとならないように調整してください
    - 記事の解説には markdown の記法やコード、改行コード、URL は含めないでください`;
  } else {
    return `
### 紹介記事の解説

- ${postsLength} 本の「紹介記事」を解説します
- 必ず ${postsLength} 本すべての記事を解説します（厳守してください）
    - 'posts' に含まれる記事のみ解説してください（それ以外の記事は解説しないでください）
    - ただし、同じ記事を2回以上解説しないでください
- 紹介する技術記事の要約と要点です
    - この内容を元に、要点を漏らさずに記事を解説してください
    - 記事の解説は番組用の話し言葉の台本として生成してください
    - 記事の解説は「導入」「ポイントごとの解説」「まとめ」の3部構成とし、5分以内になるように構成を考えてください
        - 「導入」では、記事のタイトルと著者名、タグを伝えます
            - 記事の冒頭は「最初の記事は 『{記事のタイトル}』 です。」のように始めてください
                - 必ず記事のタイトルを伝えます
                - 何番目の記事であるか、最後の記事であるかが分かるようにしてください
            - 必ず著者名を伝えます
            - タグがある場合は必ずタグを伝えます
                - 指定したタグ以外は伝えないでください
        - 「ポイントごとの解説」では、記事の要点を元に、記事の内容を解説してください
            - テクニカルな内容もやさしく噛み砕いて解説してください
            - ただし、要点はそのまま読み上げないでください
            - 必要に応じて例え話や比喩を使って分かりやすく説明してください
            - 例え話や比喩は1記事につき最大1つまでとし、特に複雑な概念を説明する際にのみ使用してください
        - 「まとめ」では、記事の内容を簡潔にまとめてください
    - 自然なトークスタイル（MC が1人で話しているイメージ）で、テクニカルな内容もやさしく噛み砕いて解説してください
- 一つの記事の解説文は必ず1000文字以上にしてください（この文字数は遵守してください）
    - また、一つの記事の解説文の最大文字数は1200文字にしてください（この文字数は遵守してください）
- 記事の解説はセリフ部分だけを出力します
    - 生成した台本を元に Google Text-to-Speech API で音声合成を行います
    - Text-to-Speech API での音声合成時にエラーとならないよう文章は長くしないでください
    - 必ず 「This request contains sentences that are too long. Consider splitting up long sentences with sentence ending punctuation e.g. periods.」 というエラーが出ないようにしてください
    - 文章の長さは、音声合成時にエラーとならないように調整してください
    - 記事の解説には markdown の記法やコード、改行コード、URL は含めないでください`;
  }
}

/**
 * ヘッドライントピック番組のリスナーお便り部分の指示を生成
 */
function getHeadlineListenerLettersInstructions(
  speakerMode: SpeakerMode,
  listenerLetters?: Array<{
    id: string;
    penName: string;
    body: string;
  }>,
): string {
  if (!listenerLetters || listenerLetters.length === 0) {
    return '';
  }

  if (speakerMode === SpeakerMode.MULTI) {
    return `
### リスナーからのお便り

- 記事解説の後に、リスナーからのお便りを紹介します
- お便りの紹介では、以下の流れで進めてください
    - ポステルがお便りの紹介を始めます
    - ペンネームと内容を読み上げます
    - ポステルとジョンで内容について話し合い、丁寧に回答します
    - お便りへの感謝を伝えます
- お便りの内容に応じて、技術的な質問には詳しく回答し、感想には共感を示してください
- お便りの紹介は自然な対話形式で行ってください`;
  } else {
    return `
### リスナーからのお便り

- 記事解説の後に、リスナーからのお便りを紹介します
- お便りの紹介では、以下の流れで進めてください
    - お便りの紹介を始めます
    - ペンネームと内容を読み上げます
    - 内容について丁寧に回答します
    - お便りへの感謝を伝えます
- お便りの内容に応じて、技術的な質問には詳しく回答し、感想には共感を示してください`;
  }
}

/**
 * ヘッドライントピック番組のエンディング部分の指示を生成
 */
function getHeadlineEndingInstructions(
  speakerMode: SpeakerMode,
  postsLength: number,
): string {
  if (speakerMode === SpeakerMode.MULTI) {
    return `
### エンディング

- 最後に締めの挨拶です
- 今日紹介した記事の解説を簡潔におさらいします
    - 必ず ${postsLength} 本の記事を振り返ります
    - それぞれの記事のタイトルと、要約を簡潔に振り返ります
    - ポステルとジョンが協力して振り返りを行います
- 番組で紹介した記事へのリンクは「紹介記事欄」にあることを伝えます
- 番組への感想やお便りを募集していることを伝えます
- 最後に「ポステルでした。」「ジョンでした。」「次の番組でお会いしましょう。」と締めくくります`;
  } else {
    return `
### エンディング

- 最後に締めの挨拶です
- 今日紹介した記事の解説を簡潔におさらいします
    - 必ず ${postsLength} 本の記事を振り返ります
    - それぞれの記事のタイトルと、要約を簡潔に振り返ります
- 番組で紹介した記事へのリンクは「紹介記事欄」にあることを伝えます
- 番組への感想やお便りを募集していることを伝えます
- 最後に「ポステルでした。次の番組でお会いしましょう。」と締めくくります`;
  }
}

/**
 * ヘッドライントピック番組の台本制約の指示を生成
 */
function getHeadlineScriptConstraints(speakerMode: SpeakerMode): string {
  const commonConstraints = `
## 台本生成の制約

- 台本部分はセリフ部分だけを出力します
    - 生成した台本を元に ${speakerMode === SpeakerMode.MULTI ? 'Gemini 2.5 Flash TTS' : 'Google Text-to-Speech API'} で音声合成を行います
    - ${speakerMode === SpeakerMode.MULTI ? 'TTS' : 'Text-to-Speech API'} での音声合成時にエラーとならないよう文章は長くしないでください
- 「Qiita」は「キータ」と読みます
    - 文中に「Qiita」「qiita」が出てきた場合は「キータ」と読みます
- 難しい漢字は読み手が間違えないように、ひらがなで書きます
- 読み上げ用の原稿なので、URL や Markdown の記法、改行コード（\n など）、バックスラッシュやクオート文字を含めないは含めないでください
- 出力する文字数の下限は3000文字（この文字数は遵守してください）にしてください
- 出力する文字数の上限は4500文字（この文字数は遵守してください）にしてください`;

  if (speakerMode === SpeakerMode.MULTI) {
    return `${commonConstraints}
- 台本では必ず「Postel:」「John:」という英語話者表記を使用してください（日本語名は使用しないでください）
- 各発言は必ず英語話者名から始めてください（例：「Postel: こんにちは」「John: はい、そうですね」）
- 話者表記は半角コロン「:」を使用してください（全角コロン「：」は使用しないでください）`;
  } else {
    return `${commonConstraints}
- 台本の冒頭に「ポステル：」という表記は入れないでください`;
  }
}

/**
 * ヘッドライントピック番組の出力構造の指示を生成
 */
function getHeadlineOutputStructureInstructions(
  speakerMode: SpeakerMode,
): string {
  if (speakerMode === SpeakerMode.MULTI) {
    return `
### アウトプット構造の指定

- 出力は以下の構造に従ってください
    - 'title': 番組のタイトル（文字列）
    - 'opening': 番組のオープニング（対話形式：「Postel:」「John:」を含む）
    - 'posts': 番組で紹介する記事解説文のリスト（配列）
        - 各記事は 'id', 'title', 'intro', 'explanation', 'summary' を含む
        - 'intro', 'explanation', 'summary' は対話形式（「Postel:」「John:」を含む）
    - 'ending': 番組のエンディング（対話形式：「Postel:」「John:」を含む、リスナーお便りへの回答も含む）`;
  } else {
    return `
### アウトプット構造の指定

- 出力は以下の構造に従ってください
    - 'title': 番組のタイトル（文字列）
    - 'opening': 番組のオープニング（単一話者による説明）
    - 'posts': 番組で紹介する記事解説文のリスト（配列）
        - 各記事は 'id', 'title', 'intro', 'explanation', 'summary' を含む
        - すべて単一話者による説明文
    - 'ending': 番組のエンディング（単一話者による説明、リスナーお便りへの回答も含む）`;
  }
}
