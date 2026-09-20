# career-app

中高生が銀行員・広告代理店社員の仕事を体験するWebアプリのプロトタイプ。
4つの体験形式をスマホで触り比べて、今後の方針を決めるためのものです。

| プロトタイプ | 形式 | 職業 | 状態 |
| --- | --- | --- | --- |
| `novel-bank` | ショートドラマ型 | 銀行員 | 第1話＋試作エピソード（素材はこれから） |
| `task-bank` | 業務のミニ版に挑戦 | 銀行員 | サンプル入り |
| `novel-ad` | ショートドラマ型 | 広告代理店社員 | 準備中 |
| `task-ad` | 業務のミニ版に挑戦 | 広告代理店社員 | 準備中 |

「準備中」は `content/<名前>/` に中身があるかで自動判定されます。
コンテンツを入れればホームから開けるようになり、共有ファイルを触る必要はありません。

画面はスマホ縦画面（幅375px）を基準に作っています。

## セットアップ

```bash
npm install
cp .env.example .env.local   # 値を埋める
```

## ローカルで動かす

### 画面だけ確認する（AIフィードバックは使えない）

```bash
npm run dev
```

http://localhost:5173 が開きます。`/api/feedback` は動かないため、課題画面の送信はエラーになります。

同じWi-Fi内のスマホから見たいときは `npm run dev -- --host` で起動し、表示された Network のURLを開きます。

### AIフィードバックまで含めて確認する

`api/` は Vercel Functions なので、Vercel CLI 経由で起動します。

```bash
npm i -g vercel      # 初回のみ
vercel link          # 初回のみ（Vercelプロジェクトと紐づけ）
vercel dev
```

http://localhost:3000 が開きます。ホーム画面で `APP_PASSCODE` と同じ値を入力してから、
課題画面で「AIに見てもらう」を押してください。

APIだけを直接叩いて確かめることもできます。

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"passcode":"change-me","prototypeId":"task-bank","taskId":"bank-001",
       "task":{"title":"テスト","jobTitle":"銀行員","situation":"テスト",
               "materialsText":"","criteria":["観点：説明"],
               "modelAnswer":"模範解答","proInsight":"現場の見方"},
       "answer":"返済の見込みと資金の使いみちを確認したいです。"}'
```

## 環境変数

すべて**サーバー側でのみ**使います。`VITE_` を付けるとフロントに埋め込まれるので付けないでください。

| 変数名 | 必須 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `APP_PASSCODE` | ○ | なし | AIフィードバックの簡易パスコード。未設定だとAPIは 503 |
| `AI_PROVIDER` | | `gemini` | `gemini` か `claude` |
| `AI_MAX_OUTPUT_TOKENS` | | `1024` | 出力トークン上限（最大 4096） |
| `GEMINI_API_KEY` | `gemini`のとき○ | なし | Gemini のAPIキー |
| `GEMINI_MODEL` | | `gemini-3.1-flash-lite` | Gemini のモデル名 |
| `ANTHROPIC_API_KEY` | `claude`のとき○ | なし | Claude のAPIキー |
| `ANTHROPIC_MODEL` | | `claude-haiku-4-5-20251001` | Claude のモデル名 |

## ビルド

```bash
npm run typecheck   # 型チェックのみ
npm run build       # 型チェック＋本番ビルド
```

## 動画素材まわり

ショートドラマ型の素材（動画・静止画）は手作業で生成します。

```bash
npm run shotlist        # 脚本から docs/shotlist/<エピソードID>.md を生成
npm run import-assets   # inbox/ に置いた素材を変換して public/assets/ へ
```

`import-assets` は ffmpeg を使います（`brew install ffmpeg`）。
画像は WebP、動画は MP4 / H.264（720×1280・CRF26）に変換されます。
`--mute` を付けると動画の音声を落とします。

**素材が1本も無くても、絵コンテ風の代替表示で最後まで再生できます。**

## ディレクトリ

```
src/engine/episode/ ショートドラマ再生エンジン（共通）
src/engine/task/    課題画面・フィードバック表示（共通）
src/components/     共通UI
src/pages/          ホーム、各プロトタイプの入口
src/types/          シナリオ・課題のデータ型
content/<名前>/     各プロトタイプのコンテンツと制作メモ
api/feedback.ts     AIフィードバックのAPI
public/assets/      画像素材（素材IDで参照）
docs/shotlist/      ショットリスト（自動生成）
docs/asset-list.md  課題型プロトタイプの素材一覧
scripts/            ショットリスト生成・素材取り込み
```

開発ルールは [CLAUDE.md](./CLAUDE.md) を参照してください。

## 注意

登場する会社・人物・数値はすべて架空のものです。
