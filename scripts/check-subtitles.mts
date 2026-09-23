/**
 * 字幕のタイミング合わせ。
 *
 *   npm run subtitles                  すべてのエピソード
 *   npm run subtitles -- --episode pilot-02
 *
 * 取り込んだ動画の音声から「声が出ている区間」を拾い（ffmpeg の silencedetect）、
 * 脚本の字幕（atSec）と突き合わせて、ずれている字幕と直す値を出す。
 *
 * Flow の動画は生成するたびに間の取り方が変わるので、
 * 素材を入れ替えたらこれを実行して字幕の位置を直す。
 */
import { spawnSync } from 'node:child_process';
import type { Episode, PrototypeId, Shot } from '../src/types/index.ts';
import { NOVEL_PROTOTYPES, assetExists, assetPath, loadPrototype } from './episodes.mts';

/** これ以上ずれていたら直したほうがよい（秒） */
const TOLERANCE_SEC = 0.6;

/** 声が途切れたとみなす間隔（秒）。これ以上あいたら次のセリフとして数える */
const GAP_SEC = 0.5;

/** 声と環境音の差がこれ未満なら、声の位置は判定できないとみなす */
const MIN_CONTRAST_DB = 8;

/** 声が続いているとみなす最短の長さ（秒） */
const MIN_SPEECH_SEC = 0.3;

interface SpeechScan {
  /** 声が始まった時刻の一覧 */
  starts: number[];
  /** 声と環境音の差（dB）。小さいと判定できない */
  contrastDb: number;
}

/**
 * 音量の推移から「声が始まった時刻」を拾う。
 *
 * 環境音の上に声が乗るので、静かなところ（下から2割）と大きいところ（上から1割）の
 * 差を見て、その中間を超えた区間を声とみなす。
 * 差が小さい（ずっと音楽や雑音が鳴っている）ときは判定しない。
 */
function scanSpeech(file: string): SpeechScan {
  const result = spawnSync(
    'ffprobe',
    [
      '-v', 'error',
      '-f', 'lavfi',
      '-i', `amovie=${file},astats=metadata=1:reset=1`,
      '-show_entries', 'frame=pts_time:frame_tags=lavfi.astats.Overall.RMS_level',
      '-of', 'csv=p=0',
    ],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );

  // 1行が「時刻,音量」。時刻は実測値を使う（窓の長さを決め打ちしない）
  const samples = result.stdout
    .split('\n')
    .map((line) => line.split(','))
    .filter((parts) => parts.length >= 2)
    .map((parts) => ({ at: Number(parts[0]), db: Number(parts[1]) }))
    .filter((sample) => Number.isFinite(sample.at))
    .map((sample) => ({ at: sample.at, db: Number.isFinite(sample.db) ? sample.db : -90 }));
  if (samples.length < 20) return { starts: [], contrastDb: 0 };

  const levels = samples.map((sample) => sample.db);
  const sorted = [...levels].sort((a, b) => a - b);
  const quiet = sorted[Math.floor(sorted.length * 0.2)];
  const loud = sorted[Math.floor(sorted.length * 0.9)];
  const contrastDb = loud - quiet;
  if (contrastDb < MIN_CONTRAST_DB) return { starts: [], contrastDb };

  const threshold = quiet + contrastDb * 0.5;
  const starts: number[] = [];
  let runStart: number | null = null;
  let lastLoud: number | null = null;

  for (const sample of samples) {
    if (sample.db >= threshold) {
      // 前の声から離れていたら、新しいセリフの始まり
      if (runStart === null || (lastLoud !== null && sample.at - lastLoud > GAP_SEC)) {
        runStart = sample.at;
      }
      lastLoud = sample.at;
      if (runStart !== null && sample.at - runStart >= MIN_SPEECH_SEC) {
        if (starts[starts.length - 1] !== runStart) starts.push(runStart);
      }
    }
  }

  return { starts, contrastDb };
}

function checkShot(prototypeId: PrototypeId, episode: Episode, shot: Shot): string[] {
  if (!shot.videoAssetId || !assetExists(prototypeId, shot.videoAssetId, 'mp4')) return [];
  const spoken = shot.subtitles.filter(
    (subtitle) => subtitle.speaker && !subtitle.speaker.startsWith('（'),
  );
  if (spoken.length === 0) return [];

  const { starts, contrastDb } = scanSpeech(assetPath(prototypeId, shot.videoAssetId, 'mp4'));
  if (starts.length === 0) {
    return [
      `  ${shot.id}`,
      `    声の位置を判定できません（環境音との差が ${contrastDb.toFixed(0)}dB しかない）。耳で確かめてください`,
    ];
  }
  const lines: string[] = [];

  spoken.forEach((subtitle, index) => {
    const heard = starts[index];
    if (heard === undefined) {
      lines.push(
        `    ${subtitle.atSec.toFixed(1)}s「${subtitle.text}」→ 声が見つからない（${index + 1}番目）`,
      );
      return;
    }
    const gap = heard - subtitle.atSec;
    if (Math.abs(gap) < TOLERANCE_SEC) return;
    lines.push(
      `    ${subtitle.atSec.toFixed(1)}s「${subtitle.text}」→ 声は ${heard.toFixed(1)}s（${gap > 0 ? '字幕が早い' : '字幕が遅い'} ${Math.abs(gap).toFixed(1)}秒）。atSec: ${Math.max(0, heard - 0.15).toFixed(1)} を推奨`,
    );
  });

  return lines.length > 0 ? [`  ${shot.id}`, ...lines] : [];
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--episode') ? args[args.indexOf('--episode') + 1] : null;
  let checked = 0;
  const report: string[] = [];

  for (const prototypeId of NOVEL_PROTOTYPES) {
    const { episodes } = await loadPrototype(prototypeId);
    for (const episode of episodes) {
      if (only && episode.id !== only) continue;
      const lines = episode.shots.flatMap((shot) => checkShot(prototypeId, episode, shot));
      checked += episode.shots.filter(
        (shot) => shot.videoAssetId && assetExists(prototypeId, shot.videoAssetId, 'mp4'),
      ).length;
      if (lines.length > 0) report.push(`${prototypeId} / ${episode.id}`, ...lines);
    }
  }

  if (checked === 0) {
    console.log('動画のあるショットがありません。先に npm run import-assets を実行してください。');
    return;
  }
  if (report.length === 0) {
    console.log(`字幕のずれはありません（${checked} ショットを確認）。`);
    return;
  }
  console.log(`ずれている字幕があります（${checked} ショットを確認）：\n`);
  for (const line of report) console.log(line);
  console.log('\n声の位置は ffmpeg の無音検出から求めた目安です。最後は耳で確かめてください。');
}

await main();
