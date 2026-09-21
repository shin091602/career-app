/**
 * 何を作るか（＝いくらかかるか）を先に決める。
 *
 * 生成する前に必ずここを通し、枚数・秒数・推定費用を人に見せる。
 * 採用テイクがあるものは作り直さない（--force で上書きできる）。
 */
import type { ImageSize, Quality, Stage } from './config.mts';
import {
  QUALITY_PRESETS,
  SCENE_ASPECT,
  SHEET_ASPECT,
  VEO_REFERENCE_DURATION,
  imagePrice,
  videoPricePerSec,
} from './config.mts';
import type { MediaSpec, SpecShot } from './spec.mts';
import { characterSheetPrompt, framePrompt, placePrompt, videoPrompt } from './spec.mts';
import { loadPicks, pickOf, type Picks } from './state.mts';

export interface PlanItem {
  stage: Stage;
  itemId: string;
  /** 人が読むための名前 */
  label: string;
  model: string;
  prompt: string;
  /** 推定費用（ドル） */
  costUsd: number;
  /** 切り替えが起きた場合の上限費用（動画のみ。それ以外は costUsd と同じ） */
  maxCostUsd: number;
  /** 画像として作るときの設定 */
  image?: { aspect: string; size: ImageSize };
  /** 動画として作るときの設定 */
  video?: { seconds: number; withAudio: boolean; useReferenceImages: boolean };
  /** 依存するもの（採用テイクが必要）。satisfied でなければ gen は実行しない */
  needs: { stage: Stage; itemId: string }[];
  /** すでに採用テイクがある場合の番号 */
  picked?: number;
  /** 対象のショット（frames / videos のとき） */
  shot?: SpecShot;
  /** 対象の登場人物（characters のとき） */
  characterId?: string;
  expression?: string;
}

export interface Plan {
  spec: MediaSpec;
  quality: Quality;
  picks: Picks;
  /** これから作るもの */
  items: PlanItem[];
  /** 採用テイクがあるので作らないもの */
  skipped: PlanItem[];
}

export interface PlanOptions {
  stages: Stage[];
  /** ショットIDで絞る（指定なしは全部） */
  shotIds?: string[];
  /** 採用テイクがあっても作り直す */
  force?: boolean;
}

function shotsOf(spec: MediaSpec, shotIds?: string[]): SpecShot[] {
  if (!shotIds || shotIds.length === 0) return spec.shots;
  const unknown = shotIds.filter((id) => !spec.shots.some((shot) => shot.id === id));
  if (unknown.length > 0) {
    throw new Error(`知らないショットID：${unknown.join(', ')}`);
  }
  return spec.shots.filter((shot) => shotIds.includes(shot.id));
}

export async function buildPlan(
  spec: MediaSpec,
  quality: Quality,
  options: PlanOptions,
): Promise<Plan> {
  const preset = QUALITY_PRESETS[quality];
  const picks = await loadPicks(spec.episodeId);
  const shots = shotsOf(spec, options.shotIds);
  const all: PlanItem[] = [];

  // ----- 設定画 -----
  if (options.stages.includes('characters')) {
    // そのエピソードに出てこない人物は作らない（制作メモはプロトタイプ全体で共有している）
    const used = new Set(shots.flatMap((shot) => shot.characterIds));
    for (const character of spec.characters) {
      if (!used.has(character.id)) continue;
      for (const expression of character.expressions) {
        all.push({
          stage: 'characters',
          itemId: `${character.id}-${expression}`,
          label: `${character.name} / ${expression}`,
          model: preset.sheet.model.id,
          prompt: characterSheetPrompt(character, expression),
          costUsd: imagePrice(preset.sheet.model, preset.sheet.size),
          maxCostUsd: imagePrice(preset.sheet.model, preset.sheet.size),
          image: { aspect: SHEET_ASPECT, size: preset.sheet.size },
          needs: [],
          characterId: character.id,
          expression,
        });
      }
    }
  }

  // ----- 場所 -----
  if (options.stages.includes('places')) {
    const used = new Set(shots.map((shot) => shot.placeId).filter(Boolean));
    for (const place of spec.places) {
      if (!used.has(place.id)) continue;
      all.push({
        stage: 'places',
        itemId: place.id,
        label: place.name,
        model: preset.sheet.model.id,
        prompt: placePrompt(place),
        costUsd: imagePrice(preset.sheet.model, preset.sheet.size),
        maxCostUsd: imagePrice(preset.sheet.model, preset.sheet.size),
        image: { aspect: SCENE_ASPECT, size: preset.sheet.size },
        needs: [],
      });
    }
  }

  // ----- 最初のフレーム -----
  if (options.stages.includes('frames')) {
    for (const shot of shots) {
      if (!shot.imageAssetId) continue;
      const needs: { stage: Stage; itemId: string }[] = [];
      if (shot.placeId) needs.push({ stage: 'places', itemId: shot.placeId });
      for (const characterId of shot.characterIds) {
        const character = spec.characters.find((candidate) => candidate.id === characterId);
        const expression = character?.expressions[0] ?? 'normal';
        needs.push({ stage: 'characters', itemId: `${characterId}-${expression}` });
      }
      all.push({
        stage: 'frames',
        itemId: shot.id,
        label: `${shot.id}（${shot.durationSec}秒）`,
        model: preset.frame.model.id,
        prompt: framePrompt(shot, spec),
        costUsd: imagePrice(preset.frame.model, preset.frame.size),
        maxCostUsd: imagePrice(preset.frame.model, preset.frame.size),
        image: { aspect: SCENE_ASPECT, size: preset.frame.size },
        needs,
        shot,
      });
    }
  }

  // ----- 動画 -----
  if (options.stages.includes('videos')) {
    for (const shot of shots) {
      if (!shot.videoAssetId) continue;
      const useReferenceImages =
        preset.video.useReferenceImages && preset.video.model.supportsReferenceImages;
      // referenceImages を使うと尺は8秒固定（公式ドキュメント）
      const seconds = useReferenceImages ? VEO_REFERENCE_DURATION : shot.veoSeconds;
      const perSec = videoPricePerSec(preset.video.model, preset.video.resolution);
      const fallbackPerSec = preset.video.fallbackModel
        ? videoPricePerSec(preset.video.fallbackModel, preset.video.resolution)
        : perSec;
      all.push({
        stage: 'videos',
        itemId: shot.id,
        label: `${shot.id}（再生${shot.durationSec}秒／生成${seconds}秒）`,
        model: preset.video.model.id,
        prompt: videoPrompt(shot),
        costUsd: seconds * perSec,
        maxCostUsd: seconds * Math.max(perSec, fallbackPerSec),
        video: {
          seconds,
          withAudio: shot.audioMode === 'embedded',
          useReferenceImages,
        },
        needs: [{ stage: 'frames', itemId: shot.id }],
        shot,
      });
    }
  }

  const items: PlanItem[] = [];
  const skipped: PlanItem[] = [];

  for (const item of all) {
    const picked = pickOf(picks, item.stage, item.itemId);
    if (picked !== undefined && !options.force) {
      skipped.push({ ...item, picked });
    } else {
      items.push({ ...item, picked });
    }
  }

  return { spec, quality, picks, items, skipped };
}

/** 段階ごとの合計 */
export function summarize(items: PlanItem[]) {
  const byStage = new Map<Stage, { count: number; seconds: number; cost: number; max: number }>();
  for (const item of items) {
    const current = byStage.get(item.stage) ?? { count: 0, seconds: 0, cost: 0, max: 0 };
    current.count += 1;
    current.seconds += item.video?.seconds ?? 0;
    current.cost += item.costUsd;
    current.max += item.maxCostUsd;
    byStage.set(item.stage, current);
  }
  const cost = items.reduce((sum, item) => sum + item.costUsd, 0);
  const max = items.reduce((sum, item) => sum + item.maxCostUsd, 0);
  return { byStage, cost, max };
}
