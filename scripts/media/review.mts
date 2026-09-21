/**
 * 確認用ページ。
 *
 *   npm run media -- review --episode pilot-01 --serve
 *
 * テイクを並べて見比べ、採用を決めるためのHTMLを media/work/<エピソードID>/review.html に書く。
 * --serve を付けると依存なしの静的サーバを立てるので、**スマホからも開ける**。
 * 動画はその場で再生できる（縦画面のまま並ぶ）。
 */
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { ROOT, assetPath } from '../episodes.mts';
import { STAGES, STAGE_LABEL, formatUsd, type Stage } from './config.mts';
import type { MediaSpec } from './spec.mts';
import { WORK_DIR, extOf, listTakes, loadPicks, pickOf, readTakeMeta, takeName } from './state.mts';

/** 手作業で作った素材の置き場所（inbox/）。配信時は /_inbox/ で見られるようにする */
const INBOX = path.join(ROOT, 'inbox');
const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm']);

/**
 * 手作業版とショットの対応表（media/handmade/<エピソードID>.json）。
 * `{ "p1": "Bank_manager_drops_loan_file.mp4" }` の形。
 * 生成ツールが付けた長いファイル名をそのまま使えるようにするため。
 */
async function handmadeMap(episodeId: string): Promise<Record<string, string>> {
  const file = path.join(ROOT, 'media', 'handmade', `${episodeId}.json`);
  if (!existsSync(file)) return {};
  return JSON.parse(await readFile(file, 'utf8')) as Record<string, string>;
}

/**
 * そのショットの「手作業版」を inbox/ から探す。
 * 対応表にあればそれを使い、無ければファイル名に素材IDかショットIDが
 * 入っているものを拾う。
 */
async function handmadeFor(
  episodeId: string,
  shotId: string,
  assetId?: string,
): Promise<string | null> {
  if (!existsSync(INBOX)) return null;
  const mapped = (await handmadeMap(episodeId))[shotId];
  if (mapped && existsSync(path.join(INBOX, mapped))) return mapped;

  const files = await readdir(INBOX);
  const candidates = files.filter((file) => VIDEO_EXT.has(path.extname(file).toLowerCase()));

  const base = (file: string) => path.basename(file, path.extname(file)).toLowerCase();
  const exact = candidates.find(
    (file) => base(file) === shotId.toLowerCase() || (assetId && base(file) === assetId.toLowerCase()),
  );
  if (exact) return exact;

  return (
    candidates.find((file) => {
      const name = base(file);
      return (
        (assetId !== undefined && name.includes(assetId.toLowerCase())) ||
        new RegExp(`(^|[^a-z0-9])${shotId.toLowerCase()}([^a-z0-9]|$)`).test(name)
      );
    }) ?? null
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface ReviewItem {
  stage: Stage;
  itemId: string;
  takes: number[];
  picked?: number;
}

async function collect(spec: MediaSpec): Promise<ReviewItem[]> {
  const picks = await loadPicks(spec.episodeId);
  const items: ReviewItem[] = [];

  const ids: Record<Stage, string[]> = {
    characters: spec.characters.flatMap((character) =>
      character.expressions.map((expression) => `${character.id}-${expression}`),
    ),
    places: spec.places.map((place) => place.id),
    frames: spec.shots.filter((shot) => shot.imageAssetId).map((shot) => shot.id),
    videos: spec.shots.filter((shot) => shot.videoAssetId).map((shot) => shot.id),
  };

  for (const stage of STAGES) {
    for (const itemId of ids[stage]) {
      const takes = await listTakes(spec.episodeId, stage, itemId);
      if (takes.length === 0) continue;
      items.push({ stage, itemId, takes, picked: pickOf(picks, stage, itemId) });
    }
  }
  return items;
}

async function renderTake(
  spec: MediaSpec,
  item: ReviewItem,
  take: number,
): Promise<string> {
  const meta = await readTakeMeta(spec.episodeId, item.stage, item.itemId, take);
  const src = `${item.stage}/${item.itemId}/${takeName(take)}.${extOf(item.stage)}`;
  const media =
    item.stage === 'videos'
      ? `<video src="${src}" controls playsinline preload="metadata"></video>`
      : `<img src="${src}" alt="${escapeHtml(item.itemId)} ${takeName(take)}" loading="lazy">`;

  const isPicked = item.picked === take;
  const command = `npm run media -- pick --episode ${spec.episodeId} --stage ${item.stage} --item ${item.itemId} --take ${take}`;

  return `
      <div class="take${isPicked ? ' picked' : ''}">
        <div class="take-head">
          <strong>${takeName(take)}</strong>
          ${isPicked ? '<span class="badge">採用</span>' : ''}
        </div>
        ${media}
        <dl>
          <dt>モデル</dt><dd>${escapeHtml(meta?.model ?? '—')}</dd>
          <dt>品質</dt><dd>${escapeHtml(meta?.quality ?? '—')}</dd>
          <dt>推定費用</dt><dd>${meta ? formatUsd(meta.estimatedCostUsd) : '—'}</dd>
          ${meta?.fallbackFrom ? `<dt>切替</dt><dd>${escapeHtml(meta.fallbackFrom)} → ${escapeHtml(meta.model)}</dd>` : ''}
        </dl>
        <details>
          <summary>プロンプト</summary>
          <p>${escapeHtml(meta?.prompt ?? '記録なし')}</p>
        </details>
        <button type="button" data-copy="${escapeHtml(command)}">採用コマンドをコピー</button>
      </div>`;
}

export async function writeReview(spec: MediaSpec): Promise<string> {
  const items = await collect(spec);
  const sections: string[] = [];

  for (const stage of STAGES) {
    const stageItems = items.filter((item) => item.stage === stage);
    if (stageItems.length === 0) continue;

    const blocks: string[] = [];
    for (const item of stageItems) {
      const takes = await Promise.all(
        item.takes.map((take) => renderTake(spec, item, take)),
      );
      const shot = spec.shots.find((candidate) => candidate.id === item.itemId);
      const exported =
        stage === 'videos' && shot?.videoAssetId
          ? existsSync(assetPath(spec.prototypeId, shot.videoAssetId, 'mp4'))
          : false;

      // 動画は手作業版（inbox/）を左端に並べて見比べられるようにする
      const handmade =
        stage === 'videos'
          ? await handmadeFor(spec.episodeId, item.itemId, shot?.videoAssetId)
          : null;
      const handmadeCard = handmade
        ? `
          <div class="take handmade">
            <div class="take-head"><strong>手作業版</strong></div>
            <video src="../_inbox/${encodeURIComponent(handmade)}" controls playsinline preload="metadata"></video>
            <dl><dt>作り方</dt><dd>ChatGPT + Google Flow</dd><dt>ファイル</dt><dd>${escapeHtml(handmade)}</dd></dl>
            <p class="sub">見るところ：顔の一貫性／日本語のセリフ／口の動き</p>
          </div>`
        : '';

      blocks.push(`
    <section class="item">
      <h3>${escapeHtml(item.itemId)}${item.picked ? '' : ' <span class="warn">未採用</span>'}</h3>
      ${shot ? `<p class="sub">${escapeHtml(shot.dialogue.map((line) => `${line.speaker}「${line.text}」`).join(' / ') || 'セリフなし')}</p>` : ''}
      ${exported ? '<p class="sub">アプリに配置済みの素材があります（手作業版との差し替えに注意）</p>' : ''}
      ${stage === 'videos' && !handmade ? '<p class="sub">手作業版は inbox/ に <code>' + escapeHtml(item.itemId) + '.mp4</code> の名前で置くか、media/handmade/' + escapeHtml(spec.episodeId) + '.json で対応づけると、ここに並びます</p>' : ''}
      <div class="takes">${handmadeCard}${takes.join('')}</div>
    </section>`);
    }

    sections.push(`
  <h2>${STAGE_LABEL[stage]}</h2>
  ${blocks.join('')}`);
  }

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(spec.title)}｜テイクの確認</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 16px calc(16px + env(safe-area-inset-right)) 48px calc(16px + env(safe-area-inset-left));
         background: #14161a; color: #e9ecf1; font: 15px/1.7 system-ui, sans-serif; }
  h1 { font-size: 1.2rem; }
  h2 { margin-top: 32px; border-bottom: 1px solid #2c3038; padding-bottom: 6px; }
  h3 { font-size: 1rem; margin-bottom: 2px; }
  .sub { margin: 0 0 8px; color: #9aa3b2; font-size: 0.85rem; }
  .warn { color: #ffb86b; font-size: 0.8rem; }
  .item { margin-bottom: 28px; }
  .takes { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
  .take { flex: 0 0 200px; background: #1c1f26; border: 1px solid #2c3038; border-radius: 10px; padding: 10px; }
  .take.picked { border-color: #6fd3a0; }
  .take.handmade { border-color: #7fb2ff; background: #191f2b; }
  .take .sub { font-size: 0.75rem; margin: 6px 0 0; }
  .take-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .badge { background: #6fd3a0; color: #10231a; border-radius: 999px; padding: 1px 8px; font-size: 0.75rem; }
  video, img { width: 100%; aspect-ratio: 9 / 16; object-fit: cover; background: #000; border-radius: 6px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 0 8px; margin: 8px 0; font-size: 0.8rem; }
  dt { color: #9aa3b2; } dd { margin: 0; word-break: break-all; }
  details p { font-size: 0.78rem; color: #c3cad6; }
  button { width: 100%; margin-top: 8px; padding: 6px; border: 1px solid #3a4150; border-radius: 6px;
           background: #242935; color: #e9ecf1; font: inherit; font-size: 0.8rem; }
</style>
</head>
<body>
<h1>${escapeHtml(spec.title)}</h1>
<p class="sub">エピソード <code>${escapeHtml(spec.episodeId)}</code>／このページは npm run media -- review で生成されます</p>
${sections.join('') || '<p>まだテイクがありません。<code>npm run media -- gen</code> で作ってください。</p>'}
<script>
  document.body.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-copy]');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'コピーしました';
    } catch {
      button.textContent = button.dataset.copy;
    }
  });
</script>
</body>
</html>
`;

  const dir = path.join(WORK_DIR, spec.episodeId);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'review.html');
  await writeFile(file, html, 'utf8');
  return file;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
  '.json': 'application/json; charset=utf-8',
};

function lanAddress(): string | null {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return null;
}

/** media/work/ を配信する（スマホから見るため） */
export function serveWork(episodeId: string, port = 5180): void {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');

    // /_inbox/ は手作業版の比較用。それ以外は media/work/ の中だけ
    const inbox = relative.startsWith('_inbox/');
    const root = inbox ? INBOX : WORK_DIR;
    const target = path.join(root, inbox ? relative.slice('_inbox/'.length) : relative);

    if (!target.startsWith(root) || !existsSync(target)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('ありません');
      return;
    }
    try {
      const body = await readFile(target);
      response.writeHead(200, {
        'content-type': MIME[path.extname(target)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      response.end(body);
    } catch {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('読めませんでした');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const lan = lanAddress();
    console.log(`\n確認用ページを配信しています（Ctrl+C で止める）：`);
    console.log(`  PC  ： http://localhost:${port}/${episodeId}/review.html`);
    if (lan) console.log(`  スマホ： http://${lan}:${port}/${episodeId}/review.html`);
    console.log(
      `  （配信しているのは ${path.relative(ROOT, WORK_DIR)} と、比較用の inbox/ だけです）`,
    );
  });
}
