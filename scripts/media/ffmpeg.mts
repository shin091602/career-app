/**
 * 仕上げ（ffmpeg）。
 *
 * 生成された動画はそのままだと大きいので、
 * アプリに載せる前に H.264 / 720p / 数MB以内へ圧縮し、
 * 動画が無いときの代替に使うポスター画像（WebP）も書き出す。
 */
import { spawnSync } from 'node:child_process';
import { stat } from 'node:fs/promises';

export function hasFfmpeg(): boolean {
  return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}

function run(args: string[]): boolean {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  return result.status === 0;
}

export interface CompressOptions {
  input: string;
  output: string;
  /** アプリで再生する尺。生成が長めでもここで詰める */
  durationSec: number;
  /** 音声を残すか（audioMode: 'separate' のショットは落とす） */
  keepAudio: boolean;
}

export function compressVideo(options: CompressOptions): boolean {
  const audio = options.keepAudio ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an'];
  return run([
    '-i', options.input,
    '-t', String(options.durationSec),
    '-vf', "scale='min(720,iw)':-2:flags=lanczos",
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    ...audio,
    options.output,
  ]);
}

/** 最初のフレームの静止画を WebP にする（動画が無いときの代替表示に使う） */
export function makePoster(input: string, output: string): boolean {
  return run([
    '-i', input,
    '-vf', "scale='min(1080,iw)':-2:flags=lanczos",
    '-c:v', 'libwebp',
    '-quality', '82',
    output,
  ]);
}

export async function fileSize(file: string): Promise<number> {
  return (await stat(file)).size;
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
