# CLAUDE.md

このファイルは、このリポジトリで作業するエージェントへの指示です。

## プロジェクトの目的

中高生が**銀行員**と**広告代理店社員**の仕事をリアルに体験できるWebアプリのプロトタイプ。

目的は完成度を上げることではなく、**4つの体験形式をスマホで触り比べて今後の方針を決めること**。
利用者は開発者本人と成人テスターのみで、一般公開はしていない。

### 4つのプロトタイプ

| ID | 形式 | 職業 | 内容 |
| --- | --- | --- | --- |
| `novel-bank` | ショートドラマ型 | 銀行員 | 動画でドラマが進み、分岐で選択して仕事を体験する |
| `novel-ad` | ショートドラマ型 | 広告代理店社員 | 同上 |
| `task-bank` | 業務のミニ版に挑戦 | 銀行員 | 課題に答え、AIから講評をもらう |
| `task-ad` | 業務のミニ版に挑戦 | 広告代理店社員 | 同上 |

## 技術構成

- React + Vite + TypeScript
- Tailwind CSS v4（`@tailwindcss/vite`。設定はCSS内の `@theme`）
- React Router（`createBrowserRouter`）
- 進行状況は localStorage（`src/lib/storage.ts` 経由）
- AIフィードバックは Vercel Functions（`api/`）。APIキーはサーバー側の環境変数のみ
- GitHub + Vercel。ブランチごとのプレビューURLをスマホで確認する

## ディレクトリの役割

```
src/engine/episode/ ショートドラマ再生エンジン（共通）
src/engine/task/    課題画面・フィードバック表示（共通）
src/components/     共通UI
src/pages/          ホーム、各プロトタイプの入口ページ
src/types/          シナリオ・課題のデータ型（プロトタイプ間の契約）
src/lib/            localStorage などの共通処理
src/theme/          デザイン3案のテーマ定義と、適用するテーマ
src/prototypes.ts   4つのプロトタイプの一覧（公開状態は持たない）
content/<名前>/     各プロトタイプのコンテンツ（エピソード・課題）と制作メモ
scripts/            ショットリスト生成・素材取り込み
scripts/media/      脚本から動画までの生成パイプライン（Gemini / Veo）
docs/shotlist/      エピソードごとのショットリスト（自動生成）
media/spec/         機械可読なショットリスト（自動生成）
media/takes/        採用テイクの指定
media/manifest/     生成ログ（使ったプロンプト・モデル・推定費用）
media/work/         生成途中の素材とテイク（gitignore）
api/feedback.ts     AIフィードバックのAPI
public/assets/      画像素材（素材IDで参照）
docs/asset-list.md  必要な素材の一覧
```

## 並列開発のルール

各プロトタイプは git worktree で並列に開発する。**担当範囲の外は触らない。**

### 編集してよい範囲

- 担当する `content/<プロトタイプ名>/` の中身
- そのプロトタイプ専用のページ（例：`novel-ad` なら `src/pages/NovelAdPage.tsx`）
- `docs/asset-list.md` への追記（自分の担当セクション）

### 編集してはいけない範囲

- `src/engine/`
- `scripts/`、`media/`
- `src/types/`
- `api/`
- `src/prototypes.ts`
- `src/theme/`
- `src/components/`、`src/lib/`、`src/App.tsx`、`src/pages/HomePage.tsx`、共通のCSS

これらに変更が必要になった場合は、**実装せずに必要な変更内容を報告する**（main側で対応する）。
報告には「どのファイルの何を、なぜ変えたいか」「回避策を試したか」を書く。

### 「準備中」の外し方

公開状態を管理するファイルはない。**コンテンツの有無から自動で判定される。**

- `content/novel-*/episodes.ts` の `export const episodes` に1本でも入れば公開
- `content/task-*/tasks.ts` の `export const taskSet` が `null` 以外になれば公開

空のままなら、ホームでは「準備中」として遷移できない状態で表示される。
**エクスポート名（`episodes` / `taskSet`）と型注釈は変更しないこと。**

`/novel-<職業>` は `episodes[0]` を再生する。2本目以降は
`/novel-<職業>?episode=<id>` で開け、ホームの「開発用」に自動で並ぶ。
共有ファイルを書き換える必要はなく、書き換えるとマージ時に衝突する。

ホームのカードに出る職業名と説明は、コンテンツの `jobTitle` と `description` が使われる
（未投入のあいだだけ `src/prototypes.ts` の暫定文が出る）。

## コンテンツのルール

- 業務描写は**公開情報**（採用サイトの社員紹介、業界団体の資料、公的統計など）をもとに書き、
  根拠を各データの `sources` に残す（`title` と、あれば `url`、どの記述の根拠かを `note` に）
- 推測や創作を含むものは `verified: false` にする。裏取りできたものだけ `verified: true`
- **実在の企業名・ロゴ・実在人物は使わない。** 登場する会社・人物・数値はすべて架空にする
- 対象読者は中高生。難しい用語には `terms` で短い解説をつける（1〜2文）
- 仕事の大変さも省かずに描く。ただし特定の職業を貶めない

## ショットの書き方

ノベル型の体験は**分岐する縦型ショートドラマ**。縦画面いっぱいに動画を再生し、
セリフは字幕としてアプリ側で重ねる（**動画に文字を焼き込まない**）。

エピソードは `Shot` の並び。実装済みの見本は `content/novel-bank/bank-ep01.ts` にあるので、
まずそれを読むこと。検証用の短いものは `content/novel-bank/pilot-01.ts`。

| フィールド | 何ができるか | 書き方 |
| --- | --- | --- |
| `durationSec` | ショットの尺 | 秒。**素材が無くてもこの尺で進む**ので、間の設計はここで決まる |
| `videoAssetId` | 動画 | 素材ID。無ければ `imageAssetId`、それも無ければ絵コンテ風に落ちる |
| `imageAssetId` | 動画が無いときの静止画 | 素材ID。ゆっくりズームして見せる |
| `audioMode` | 音声方式 | `'embedded'`（動画に音声込み）／`'separate'`（無音動画＋アプリ側の音） |
| `subtitles` | 字幕 | `[{ speaker?, text, atSec, durationSec?, terms? }]` |
| `telop` | 時刻と場所 | `{ time: '9:02', place: '港南支店 融資課' }` |
| `interrupt` | チャット・メール・電話の割り込み | `{ kind, from, body, atSec? }`。出ているあいだ再生が止まる |
| `sound` | BGM・効果音 | `{ bgm?, se?, stopBgm? }`（`audioMode: 'separate'` のとき使う） |
| `next` | 次のショット | ショットID |
| `branch` | 分岐 | 下の例を参照。あれば `next` より優先される |
| `kind` | ショットの種類 | `'story'` / `'reaction'` / `'ending'` / `'debrief'` |

### 書き方の例

```ts
{
  id: 's05-ask',
  kind: 'story',
  durationSec: 10,
  videoAssetId: 'v-s05-ask',
  imageAssetId: 'i-s05-ask',
  subtitles: [
    { speaker: '山田社長', text: '3,000万、なんとかならないか。', atSec: 3.4 },
  ],
  branch: {
    atSec: 7.5,            // ここで動画が止まり、選択肢が出る
    timeLimitSec: 10,
    onTimeout: { label: '答えられなかった', nextShotId: 's06b-silence',
                 effects: [{ key: 'trust', delta: -1 }] },
    choices: [
      { label: 'お任せください', nextShotId: 's06b-silence',
        effects: [{ key: 'trust', delta: 1 }, { key: 'result', delta: -2 }] },
      { label: '使いみちを教えて', nextShotId: 's06a-listen',
        effects: [{ key: 'trust', delta: 2 }, { key: 'result', delta: 2 }] },
    ],
  },
}
```

### 分岐は「一度分かれて合流する」形にする

**必ず合流させること。** 合流しないと、分岐のたびに必要なクリップ数が倍に増える。

- 合流しない場合：分岐2回で終端が4通り。その先のショットを全部作り直すことになる
- 合流する場合：分岐1回で増えるのは**反応ショット2本だけ**。本筋は1本で済む

手作業で動画を生成する以上、クリップ数がそのまま作業量になる。
物語の差は「反応ショット」と「ゲージの動き」、そして最後の結末で付ける。

### 守ること

- **1ショットは8秒以下**。動画生成（Veo）が一度に作れるのが8秒までなので、
  延長機能は使わず脚本側で割る。ショートドラマはカットが速いほうが合う
  （生成の尺は 4 / 6 / 8 秒のどれかに丸められるので、その3つに合わせると無駄が出ない）
- **選択肢は常に2択。ラベルは10文字以内**（スマホで1行に収めるため）
- `branch` には `onTimeout` を必ず書く。黙っていた結果もドラマとして描く
- 選択の直後は `kind: 'reaction'` のショットにする。ここでゲージが動いて手応えが返る
- **一人称視点。主人公（プレイヤー＝新人）は画面に映さない。** 手元・相手の顔・書類で見せる
- 1話は**1〜2分**。タイトル画面は作らない（最初のタップで即本編）
- 字幕は**短く1行**（目安24文字）。長い説明は書かず、場面で見せる
- 答え合わせ（`kind: 'debrief'`）は先輩キャラの短いショットで行う
- 結末は複数用意し、`EndingCard` にタイプ診断の名前と説明を書く
  （結果カードで「エンディング n/m」の回収状況が出る）
- 答え合わせショットは複数の結末で使い回してよい

これらは `npm run shotlist` が検査する。破っているとショットリストが生成されない。

### 素材の作り方

1. 脚本（`content/<名前>/episodes.ts`）と制作メモ（同 `production.ts`）を書く
2. `npm run shotlist` → `docs/shotlist/<エピソードID>.md` ができる
3. 素材を作る。**自動生成（`npm run media`、下の節）か、手作業（ChatGPT + Google Flow）**
4. 手作業の場合は、できたファイルを `inbox/` に置いて `npm run import-assets`
   （WebP / MP4 に変換され、`public/assets/<名前>/` に入る）

**素材が1本も無くても、絵コンテ風の代替表示で最後まで再生できる。**
先に脚本と尺を固め、素材はあとから差し替えていく。

制作メモ（`production.ts`）は3つに分かれている。
**エクスポート名 `production` と、この3つのキーは変えないこと。**

| キー | 中身 |
| --- | --- |
| `characters` | 登場人物。`id`（設定画の素材ID）・`name`・`appearance`（見た目）・`expressions`（表情違い） |
| `places` | 場所。`id`・`name`・`prompt`（人物なしの背景プロンプト） |
| `shots` | ショットID → `imagePrompt` / `motionPrompt` / `cameraNote` / `placeId` / `characterIds` / `soundNote` |

同じ人物が出るショットでは `characterIds` に同じ設定画IDを書き、**見た目を揃える**こと。

### 音声方式の使い分け

| | 使いどころ | 注意 |
| --- | --- | --- |
| `'embedded'`（既定） | 人物がしゃべるショット | 口の動きと合うが、差し替えのたびに動画を作り直す |
| `'separate'` | 風景・手元など、声の無いショット | 無音で取り込み、`sound` でBGMと効果音を足す |

どちらが扱いやすいかは `pilot-01`（試作用エピソード）で確かめられる。
**音は最初のタップまで鳴らない**（iOSの自動再生制限）。音だけで伝わる情報は書かない。

### 見た目（テーマ）

字幕・選択肢・テロップ・結果カードの見た目は `src/theme/` のテーマで決まる。
3案の比較は `/style-lab` で見られる。
**テーマとその適用（`ACTIVE_THEME`）は共通基盤なので、worktree側では変更しない。**


## メディアパイプライン（`npm run media`）

脚本から動画までを Gemini API で作る。**お金がかかるので、必ず見積もりを見てから実行する。**

```
npm run media -- estimate --episode pilot-01                       # 見積もりだけ（無料）
npm run media -- gen --episode pilot-01 --stage characters         # 設定画
npm run media -- gen --episode pilot-01 --stage places             # 場所
npm run media -- gen --episode pilot-01 --stage frames             # 最初のフレーム
npm run media -- gen --episode pilot-01 --stage videos             # 動画
npm run media -- review --episode pilot-01 --serve                 # テイクを見比べる
npm run media -- pick --episode pilot-01 --stage videos --item p1 --take 2
npm run media -- export --episode pilot-01                         # 圧縮して配置
```

### 段階を分けている理由

`characters` → `places` → `frames` → `videos` の順で、**前の段階の採用テイクが無いと次に進めない**。
キャラクターが気に入らないまま動画まで進むと、その分の費用がまるごと無駄になるため。

顔と服装を揃える仕掛けもこの順番で効いている：設定画と場所の画像を**参照画像として渡して**
最初のフレームを作り、そのフレームを動画の1コマ目にする。

### 費用の決まり

- `gen` は実行前に必ず枚数・秒数・推定費用を表示し、`y` の入力を待つ（`--yes` で省略）
- `MEDIA_MAX_COST_USD`（既定 5ドル）を超える見積もりは実行しない
- `--quality draft`（既定）で構図とセリフを確かめ、採用したショットだけ `--quality final` で作り直す
- モデルIDと料金は `scripts/media/config.mts` にまとめてある。**推測で書かず、公式ドキュメントで確かめて直す**
- 使ったプロンプト・モデル・推定費用・拒否理由は `media/manifest/<エピソードID>.jsonl` に残る

### テイクと作り直し

- 採用テイクがあるものは**作り直さない**。`--force` か `--shots <ID>` で狙ったものだけ作り直す
- 作り直しは上書きせず `t01, t02...` と増える。採用は `media/takes/<エピソードID>.json`
- `media/work/` は gitignore。**コミットするのは圧縮済みの `public/assets/` と、採用・ログだけ**

### 生成できなかったとき

安全フィルタなどで断られたものは理由を記録してスキップし、最後にまとめて表示する。
`veo-3.1-lite` が画像入力を受け付けなかった場合だけ `veo-3.1-fast` に切り替わり、
切り替えが起きたことと上限側の費用が報告される。

## 素材のルール

- 画像・動画・音は**素材ID**で参照し、実ファイルは
  `public/assets/<プロトタイプ名>/<素材ID>.<拡張子>` に置く
  （動画 `.mp4` ／ 静止画 `.webp` ／ 音 `.mp3`。変換は `npm run import-assets` がやる）
- 縦 9:16。動画は 720×1280 目安、静止画は長辺1080目安
- **ノベル型の素材は `content/<名前>/production.ts` に書き、`npm run shotlist` で一覧化する。**
  `docs/asset-list.md` は課題型プロトタイプ用に残している
- 素材は開発者が手作業で生成する。**実装は代替表示（絵コンテ風）のまま進める**
- 実在の企業名・ロゴ・実在人物を思わせるものを出さない
- 画面に文字を焼き込まない（字幕はアプリ側で重ねる）
- **絵柄は実写**（写真と見分けがつかない質感）で統一する。
  絵柄の指定は `production.ts` の `STYLE` に1か所だけ書き、全プロンプトに付ける

## APIのルール

- APIキーをフロントに置かない。環境変数に `VITE_` を付けない
- 素材生成のキーも同じ。`GEMINI_API_KEY` は `.env.local` にだけ置き、コミットしない
- 出力トークン上限（`AI_MAX_OUTPUT_TOKENS`、既定 1024）と入力文字数上限
  （`FEEDBACK_LIMITS`）を守る。緩めたいときは報告する
- `APP_PASSCODE` による簡易保護を外さない

## 作業の進め方

- こまめにコミットする。コミットメッセージは**日本語**で簡潔に書く
- 区切りごとに `npm run build` が通ることを確認する
- エピソードを触ったら `npm run shotlist` を実行し、検査に通ることを確認する
- 画面はスマホ縦画面（幅375px）で確認する
