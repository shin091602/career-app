import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Episode, PrototypeId, ProductionNotes, Shot } from '../src/types/index.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ノベル型プロトタイプ（ショートドラマ）の一覧 */
export const NOVEL_PROTOTYPES: PrototypeId[] = ['novel-bank', 'novel-ad'];

export interface LoadedPrototype {
  prototypeId: PrototypeId;
  episodes: Episode[];
  production: ProductionNotes;
}

/** content/<名前>/ からエピソードと制作メモを読む */
export async function loadPrototype(prototypeId: PrototypeId): Promise<LoadedPrototype> {
  const episodesModule = await import(`../content/${prototypeId}/episodes.ts`);
  const productionModule = await import(`../content/${prototypeId}/production.ts`);
  return {
    prototypeId,
    episodes: episodesModule.episodes as Episode[],
    production: productionModule.production as ProductionNotes,
  };
}

/** 素材ファイルの置き場所 */
export function assetPath(prototypeId: PrototypeId, assetId: string, ext: string): string {
  return path.join(ROOT, 'public', 'assets', prototypeId, `${assetId}.${ext}`);
}

/** その素材がもう生成されているか */
export function assetExists(prototypeId: PrototypeId, assetId: string, ext: string): boolean {
  return existsSync(assetPath(prototypeId, assetId, ext));
}

/** ショットの実効的な音声方式 */
export function audioModeOf(episode: Episode, shot: Shot): string {
  return shot.audioMode ?? episode.audioMode;
}

/** ショットから次に進みうるショットIDを返す */
export function nextIdsOf(shot: Shot): string[] {
  if (shot.branch) {
    return [
      shot.branch.choices[0].nextShotId,
      shot.branch.choices[1].nextShotId,
      shot.branch.onTimeout.nextShotId,
    ];
  }
  return shot.next ? [shot.next] : [];
}
