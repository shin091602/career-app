/**
 * 生成物の置き場所・テイク・採用・マニフェストの管理。
 *
 * - media/work/ ：ラフと全テイク（**gitignore**。作り直しの分もここに溜まる）
 * - media/takes/<エピソードID>.json ：採用テイク（コミットする）
 * - media/manifest/<エピソードID>.jsonl ：生成ログ（コミットする。費用の記録）
 */
import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from '../episodes.mts';
import type { Quality, Stage } from './config.mts';

export const WORK_DIR = path.join(ROOT, 'media', 'work');
const TAKES_DIR = path.join(ROOT, 'media', 'takes');
const MANIFEST_DIR = path.join(ROOT, 'media', 'manifest');

/** 段階ごとの拡張子 */
export function extOf(stage: Stage): 'png' | 'mp4' {
  return stage === 'videos' ? 'mp4' : 'png';
}

export function itemDir(episodeId: string, stage: Stage, itemId: string): string {
  return path.join(WORK_DIR, episodeId, stage, itemId);
}

export function takeName(take: number): string {
  return `t${String(take).padStart(2, '0')}`;
}

export function takeFile(episodeId: string, stage: Stage, itemId: string, take: number): string {
  return path.join(itemDir(episodeId, stage, itemId), `${takeName(take)}.${extOf(stage)}`);
}

/** テイクの横に置く、そのテイクの作り方の記録 */
export function takeMetaFile(
  episodeId: string,
  stage: Stage,
  itemId: string,
  take: number,
): string {
  return path.join(itemDir(episodeId, stage, itemId), `${takeName(take)}.json`);
}

export interface TakeMeta {
  createdAt: string;
  stage: Stage;
  itemId: string;
  take: number;
  quality: Quality;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  estimatedCostUsd: number;
  /** Lite が画像入力を受け付けず Fast に切り替えたときに入る */
  fallbackFrom?: string;
}

/** すでにあるテイクの番号（昇順） */
export async function listTakes(
  episodeId: string,
  stage: Stage,
  itemId: string,
): Promise<number[]> {
  const dir = itemDir(episodeId, stage, itemId);
  if (!existsSync(dir)) return [];
  const ext = extOf(stage);
  const files = await readdir(dir);
  return files
    .filter((file) => file.endsWith(`.${ext}`))
    .map((file) => Number(file.replace(/^t/, '').replace(`.${ext}`, '')))
    .filter((take) => Number.isInteger(take))
    .sort((a, b) => a - b);
}

export async function nextTake(
  episodeId: string,
  stage: Stage,
  itemId: string,
): Promise<number> {
  const takes = await listTakes(episodeId, stage, itemId);
  return (takes[takes.length - 1] ?? 0) + 1;
}

export async function readTakeMeta(
  episodeId: string,
  stage: Stage,
  itemId: string,
  take: number,
): Promise<TakeMeta | null> {
  const file = takeMetaFile(episodeId, stage, itemId, take);
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, 'utf8')) as TakeMeta;
}

export async function writeTakeMeta(episodeId: string, meta: TakeMeta): Promise<void> {
  const file = takeMetaFile(episodeId, meta.stage, meta.itemId, meta.take);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

// ===== 採用テイク =====

export type Picks = Partial<Record<Stage, Record<string, number>>>;

function picksFile(episodeId: string): string {
  return path.join(TAKES_DIR, `${episodeId}.json`);
}

export async function loadPicks(episodeId: string): Promise<Picks> {
  const file = picksFile(episodeId);
  if (!existsSync(file)) return {};
  return JSON.parse(await readFile(file, 'utf8')) as Picks;
}

export async function savePicks(episodeId: string, picks: Picks): Promise<void> {
  await mkdir(TAKES_DIR, { recursive: true });
  await writeFile(picksFile(episodeId), `${JSON.stringify(picks, null, 2)}\n`, 'utf8');
}

export function pickOf(picks: Picks, stage: Stage, itemId: string): number | undefined {
  return picks[stage]?.[itemId];
}

export async function setPick(
  episodeId: string,
  stage: Stage,
  itemId: string,
  take: number,
): Promise<void> {
  const picks = await loadPicks(episodeId);
  picks[stage] = { ...(picks[stage] ?? {}), [itemId]: take };
  await savePicks(episodeId, picks);
}

/** 採用テイクのファイル（無ければ null） */
export function pickedFile(
  episodeId: string,
  stage: Stage,
  itemId: string,
  picks: Picks,
): string | null {
  const take = pickOf(picks, stage, itemId);
  if (take === undefined) return null;
  const file = takeFile(episodeId, stage, itemId, take);
  return existsSync(file) ? file : null;
}

// ===== マニフェスト =====

export interface ManifestEntry {
  at: string;
  episodeId: string;
  stage: Stage;
  itemId: string;
  quality: Quality;
  model: string;
  status: 'ok' | 'blocked' | 'error';
  take?: number;
  estimatedCostUsd: number;
  /** 拒否・失敗の理由（安全フィルタなど） */
  reason?: string;
  fallbackFrom?: string;
  prompt: string;
  params?: Record<string, unknown>;
}

export async function appendManifest(entry: ManifestEntry): Promise<void> {
  await mkdir(MANIFEST_DIR, { recursive: true });
  const file = path.join(MANIFEST_DIR, `${entry.episodeId}.jsonl`);
  await appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function readManifest(episodeId: string): Promise<ManifestEntry[]> {
  const file = path.join(MANIFEST_DIR, `${episodeId}.jsonl`);
  if (!existsSync(file)) return [];
  const text = await readFile(file, 'utf8');
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as ManifestEntry);
}

/** これまでに使った推定費用の合計（成功したものだけ） */
export async function spentUsd(episodeId: string): Promise<number> {
  const entries = await readManifest(episodeId);
  return entries
    .filter((entry) => entry.status === 'ok')
    .reduce((sum, entry) => sum + entry.estimatedCostUsd, 0);
}
