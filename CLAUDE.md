# CLAUDE.md

このファイルは、このリポジトリで作業するエージェントへの指示です。

## プロジェクトの目的

中高生が**銀行員**と**広告代理店社員**の仕事をリアルに体験できるWebアプリのプロトタイプ。

目的は完成度を上げることではなく、**4つの体験形式をスマホで触り比べて今後の方針を決めること**。
利用者は開発者本人と成人テスターのみで、一般公開はしていない。

### 4つのプロトタイプ

| ID | 形式 | 職業 | 内容 |
| --- | --- | --- | --- |
| `novel-bank` | ノベルゲーム型 | 銀行員 | 物語を読み進めながら選択して仕事を体験する |
| `novel-ad` | ノベルゲーム型 | 広告代理店社員 | 同上 |
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
src/engine/novel/   ノベル再生エンジン（共通）
src/engine/task/    課題画面・フィードバック表示（共通）
src/components/     共通UI
src/pages/          ホーム、各プロトタイプの入口ページ
src/types/          シナリオ・課題のデータ型（プロトタイプ間の契約）
src/lib/            localStorage などの共通処理
src/theme/          デザイン3案のテーマ定義と、適用するテーマ
src/prototypes.ts   4つのプロトタイプの一覧（公開状態は持たない）
content/<名前>/     各プロトタイプのコンテンツ（シナリオ・課題）
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
- `src/types/`
- `api/`
- `src/prototypes.ts`
- `src/theme/`
- `src/components/`、`src/lib/`、`src/App.tsx`、`src/pages/HomePage.tsx`、共通のCSS

これらに変更が必要になった場合は、**実装せずに必要な変更内容を報告する**（main側で対応する）。
報告には「どのファイルの何を、なぜ変えたいか」「回避策を試したか」を書く。

### 「準備中」の外し方

公開状態を管理するファイルはない。**コンテンツの有無から自動で判定される。**

- `content/novel-*/scenario.ts` の `export const scenario` が `null` 以外になれば公開
- `content/task-*/tasks.ts` の `export const taskSet` が `null` 以外になれば公開

`null` のままなら、ホームでは「準備中」として遷移できない状態で表示される。
**エクスポート名（`scenario` / `taskSet`）と `| null` を含む型注釈は変更しないこと。**
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

## 演出の書き方（シナリオでの指定方法）

演出はすべて `Scene` の**任意フィールド**として書く。書かなければ素の会話場面になる。
実装済みの見本は `content/novel-bank/scenario.ts` にあるので、まずそれを読むこと。

| フィールド | 何ができるか | 書き方 |
| --- | --- | --- |
| `bgAssetId` | 画面全体の背景 | 素材ID（9:16） |
| `characters` | 立ち絵を左・中央・右に置く | `[{ assetId, slot: 'left'\|'center'\|'right', speaking?: true }]` |
| `transition` | 場面に入るときの転換 | `'fade'`（ふわり）／`'blackout'`（暗転を挟む）／`'none'` |
| `telop` | 時刻と場所のテロップ | `{ time: '9:02', place: '港南支店 融資課' }` |
| `interrupt` | チャット・メール・電話の割り込み | `{ kind: 'chat'\|'mail'\|'call', from, subject?, body, dismissLabel? }` |
| `document` | 書類をズームで見せる | `{ title, material, assetId?, autoOpen? }` |
| `timeLimitSec` ＋ `onTimeout` | 制限時間つきの選択肢 | 下の例を参照 |
| `sound` | BGM・効果音 | `{ bgm?, se?, stopBgm? }` |
| `terms` | 難語の解説 | `[{ term, description }]` |

### 書き方の例

```ts
{
  id: 's05',
  kind: 'dialogue',
  speaker: '山田社長',
  text: '3,000万円の機械を入れたい。\n……なんとか、貸してもらえないかな。',
  bgAssetId: 'bg-bank-factory',
  transition: 'blackout',
  telop: { time: '10:30', place: '山田製作所 応接スペース' },
  characters: [
    { assetId: 'char-senior-banker-normal', slot: 'left' },
    { assetId: 'char-factory-owner-worried', slot: 'right', speaking: true },
  ],
  timeLimitSec: 12,
  onTimeout: {
    label: '答えられず、沈黙が流れた',
    nextSceneId: 's06-silence',
    effects: [{ key: 'trust', delta: -1 }],
  },
  choices: [
    { label: '詳しく聞く', nextSceneId: 's06-listen', effects: [{ key: 'risk', delta: 2 }] },
  ],
}
```

### 注意

- **立ち絵の表情差分は素材IDで分ける。** 型は増やさない
  （例：`char-senior-banker-normal` / `char-senior-banker-serious`）
- `speaking: true` は1場面につき1体まで。話している人を手前に出して明るくする
- `timeLimitSec` を書くときは `onTimeout` も必ず書く。時間切れは
  「答えないまま時間が過ぎた」という結果として扱い、その場面へ進める
- `document` の `autoOpen: true` は場面に入った瞬間に開く。
  `false`（既定）なら「資料を見る」ボタンが出て、利用者が自分で開く
- **音は既定でミュート。** 利用者が画面右上のボタンをタップするまで鳴らないので、
  音が鳴ることを前提にした演出（音だけで伝わる情報）は書かない
- 新しい素材・音が必要になったら、実装より先に `docs/asset-list.md` に追記する
- 文字送りの途中でもタップで全文が出る。長すぎる本文は場面を分ける

### 見た目（テーマ）

配色・フォント・テキストボックス・選択肢ボタンの見た目は
`src/theme/` のテーマで決まる。3案の比較は `/style-lab` で見られる。
**テーマとその適用（`ACTIVE_THEME`）は共通基盤なので、worktree側では変更しない。**

## 素材のルール

- 画像・動画は**素材ID**で参照し、実ファイルは `public/assets/<プロトタイプ名>/<素材ID>.<拡張子>` に置く
- 新しい素材が必要になったら `docs/asset-list.md` に、
  **素材ID / 用途 / 推奨サイズ / 画像生成用プロンプト**を追記する
  - 背景は 9:16（目安 1080×1920）
  - 人物は透過PNG（目安 800×1400）
- 素材は開発者が手作業で生成する。**実装はダミー表示（色付き矩形＋素材ID）のまま進める**

## APIのルール

- APIキーをフロントに置かない。環境変数に `VITE_` を付けない
- 出力トークン上限（`AI_MAX_OUTPUT_TOKENS`、既定 1024）と入力文字数上限
  （`FEEDBACK_LIMITS`）を守る。緩めたいときは報告する
- `APP_PASSCODE` による簡易保護を外さない

## 作業の進め方

- こまめにコミットする。コミットメッセージは**日本語**で簡潔に書く
- 区切りごとに `npm run build` が通ることを確認する
- 画面はスマホ縦画面（幅375px）で確認する
