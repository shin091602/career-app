/**
 * 素材の取り込み。
 *
 *   npm run import-assets            対話で素材IDを決める
 *   npm run import-assets -- --mute  動画の音声を落とす（audioMode: 'separate' 用）
 *   npm run import-assets -- --yes   ファイル名で決まるものだけを黙って取り込む
 *
 * inbox/ に置いたファイルを ffmpeg で変換し、
 * public/assets/<プロトタイプ名>/<素材ID>.<拡張子> へ置く。
 *   画像 → WebP（長辺1080・品質82）
 *   動画 → MP4 / H.264（縦720×1280相当・CRF26・faststart）
 * 元ファイルは削除せず inbox/done/ へ移す。
 */
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { mkdir, readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import type { PrototypeId, Shot } from '../src/types/index.ts';
import { ROOT, NOVEL_PROTOTYPES, assetExists, assetPath, loadPrototype } from './episodes.mts';

const INBOX = path.join(ROOT, 'inbox');
const DONE = path.join(INBOX, 'done');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.heic']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.avi']);

/** 目安を超えたら警告するサイズ */
const WARN_BYTES = { image: 300 * 1024, video: 3 * 1024 * 1024 };

interface Wanted {
  assetId: string;
  kind: 'video' | 'image';
  prototypeId: PrototypeId;
  shotId: string;
  /** そのショットの音声方式（動画のときに参考にする） */
  audioMode: string;
  /** そのショットで想定している尺（取り込んだ動画の長さと比べる） */
  durationSec: number;
  done: boolean;
}

/** 1ショットの上限。Flow の1クリップ（8秒か10秒）に合わせる */
const SHOT_MAX_SEC = 10;

interface Probe {
  width: number;
  height: number;
  duration: number;
}

/** 解像度と長さを調べる（ffprobe） */
function probe(file: string): Probe | null {
  const result = spawnSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      file,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return null;
  try {
    const data = JSON.parse(result.stdout) as {
      streams?: { width?: number; height?: number }[];
      format?: { duration?: string };
    };
    return {
      width: data.streams?.[0]?.width ?? 0,
      height: data.streams?.[0]?.height ?? 0,
      duration: Number(data.format?.duration ?? 0),
    };
  } catch {
    return null;
  }
}

function hasFfmpeg(): boolean {
  return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}

/** シナリオが求めている素材の一覧を作る */
async function collectWanted(): Promise<Wanted[]> {
  const wanted: Wanted[] = [];

  for (const prototypeId of NOVEL_PROTOTYPES) {
    const { episodes } = await loadPrototype(prototypeId);
    for (const episode of episodes) {
      for (const shot of episode.shots as Shot[]) {
        const audioMode = shot.audioMode ?? episode.audioMode;
        if (shot.videoAssetId) {
          wanted.push({
            assetId: shot.videoAssetId,
            kind: 'video',
            prototypeId,
            shotId: shot.id,
            audioMode,
            durationSec: shot.durationSec,
            done: assetExists(prototypeId, shot.videoAssetId, 'mp4'),
          });
        }
        if (shot.imageAssetId) {
          wanted.push({
            assetId: shot.imageAssetId,
            kind: 'image',
            prototypeId,
            shotId: shot.id,
            audioMode,
            durationSec: shot.durationSec,
            done: assetExists(prototypeId, shot.imageAssetId, 'webp'),
          });
        }
      }
    }
  }

  return wanted;
}

function run(args: string[]): boolean {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  return result.status === 0;
}

function convertImage(input: string, output: string): boolean {
  return run([
    '-i', input,
    // 長辺1080に収める（小さい画像は引き伸ばさない）
    '-vf', "scale='min(1080,iw)':-2:flags=lanczos",
    '-c:v', 'libwebp',
    '-quality', '82',
    output,
  ]);
}

function convertVideo(input: string, output: string, mute: boolean): boolean {
  // クリップごとに声の大きさがばらつくので、音量をそろえる（loudnorm）
  const audio = mute
    ? ['-an']
    : ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '96k'];
  return run([
    '-i', input,
    // 縦画面 720×1280 相当に収める。奇数サイズを避けるため -2 を使う
    '-vf', "scale='min(720,iw)':-2:flags=lanczos",
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    ...audio,
    output,
  ]);
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main() {
  const args = process.argv.slice(2);
  const muteFlag = args.includes('--mute');
  const autoYes = args.includes('--yes');

  if (!hasFfmpeg()) {
    console.error('ffmpeg が見つかりません。先に導入してください（例：brew install ffmpeg）。');
    process.exit(1);
  }

  await mkdir(INBOX, { recursive: true });
  const entries = (await readdir(INBOX, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);

  if (entries.length === 0) {
    console.log(`取り込むファイルがありません。${path.relative(ROOT, INBOX)}/ に置いてください。`);
    return;
  }

  const wanted = await collectWanted();
  const pending = wanted.filter((item) => !item.done);

  // 端末から実行されていないとき（パイプ・CI など）は質問せず、
  // ファイル名から素材IDが決まるものだけを取り込む
  const interactive = process.stdin.isTTY === true && !autoYes;
  const rl = interactive
    ? createInterface({ input: process.stdin, output: process.stdout })
    : null;

  /** 質問。非対話のときや入力が閉じたときは空文字を返す */
  async function ask(question: string): Promise<string> {
    if (!rl) return '';
    try {
      return await rl.question(question);
    } catch {
      return '';
    }
  }

  let imported = 0;

  for (const name of entries) {
    const input = path.join(INBOX, name);
    const ext = path.extname(name).toLowerCase();
    const base = path.basename(name, path.extname(name));
    const kind = IMAGE_EXT.has(ext) ? 'image' : VIDEO_EXT.has(ext) ? 'video' : null;

    if (!kind) {
      console.log(`- ${name}：扱えない形式なので飛ばします`);
      continue;
    }

    // ファイル名が素材IDと一致すればそれを使う
    let target = wanted.find((item) => item.assetId === base && item.kind === kind);

    if (!target) {
      const candidates = pending.filter((item) => item.kind === kind);
      if (candidates.length === 0) {
        console.log(`- ${name}：対応する未生成の${kind === 'image' ? '静止画' : '動画'}素材がありません`);
        continue;
      }
      if (!interactive) {
        console.log(
          `- ${name}：素材IDが決まらないので飛ばします（ファイル名を素材IDにするか、端末から実行してください）`,
        );
        continue;
      }

      console.log(`\n${name} はどの素材ですか？`);
      candidates.forEach((item, index) => {
        console.log(`  ${index + 1}) ${item.assetId}  （${item.prototypeId} / ${item.shotId}）`);
      });
      const answer = await ask('番号を入力（空欄で飛ばす）: ');
      const index = Number.parseInt(answer, 10) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
        console.log(`  → 飛ばしました`);
        continue;
      }
      target = candidates[index];
    }

    const outExt = kind === 'image' ? 'webp' : 'mp4';
    const output = assetPath(target.prototypeId, target.assetId, outExt);
    await mkdir(path.dirname(output), { recursive: true });

    // audioMode: 'separate' のショットは、アプリ側で音を付けるので動画は無音にする
    let mute = muteFlag || target.audioMode === 'separate';
    if (kind === 'video' && !muteFlag && interactive && target.audioMode === 'separate') {
      const answer = await ask(
        `  ${target.assetId} は audioMode: 'separate' のショットです。音声を落としますか？ [Y/n] `,
      );
      mute = answer.trim().toLowerCase() !== 'n';
    }

    console.log(`- ${name} → ${path.relative(ROOT, output)}${mute ? '（音声なし）' : ''}`);

    const source = kind === 'video' ? probe(input) : null;
    if (source && source.width > source.height) {
      console.log(
        `  ※横長の動画です（${source.width}×${source.height}）。アプリは縦画面なので左右が切れます。` +
          'Flow で縦 9:16 を選んで作り直すのがおすすめです',
      );
    }
    const ok =
      kind === 'image' ? convertImage(input, output) : convertVideo(input, output, mute);
    if (!ok) {
      console.error(`  → 変換に失敗しました`);
      continue;
    }

    const { size } = await stat(output);
    const limit = kind === 'image' ? WARN_BYTES.image : WARN_BYTES.video;
    // 動画は実際の長さを出す（アプリは実際の長さで進むので、字幕の位置を見直す目安になる）
    const length = source
      ? `／${source.duration.toFixed(1)}秒（脚本の想定 ${target.durationSec} 秒）`
      : '';
    console.log(
      `  → ${formatBytes(size)}${length}${size > limit ? '  ※目安より大きいです' : ''}`,
    );
    if (source && source.duration > SHOT_MAX_SEC + 0.5) {
      console.log(`  ※${SHOT_MAX_SEC}秒を超えています。脚本側でショットを分けてください`);
    }

    await mkdir(DONE, { recursive: true });
    await rename(input, path.join(DONE, name));
    imported += 1;
  }

  rl?.close();

  if (imported === 0) {
    console.log('\n取り込んだファイルはありませんでした。');
    return;
  }

  console.log(`\n${imported} 件を取り込みました。ショットリストを更新します。`);
  spawnSync('npm', ['run', 'shotlist'], { stdio: 'inherit', cwd: ROOT });
}

await main();
