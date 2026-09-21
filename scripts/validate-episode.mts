import type { Episode, PrototypeId, ProductionNotes } from '../src/types/index.ts';
import { nextIdsOf } from './episodes.mts';

/** 選択肢のラベルの上限（スマホで1行に収めるため） */
const CHOICE_LABEL_MAX = 10;

/**
 * 1ショットの上限（秒）。
 * 動画生成（Veo）が一度に作れるのが8秒までで、延長は使わず脚本側で割る方針。
 * ショートドラマはカットが速いほうが合うので、8秒を超えるショットは分割する。
 */
const SHOT_MAX_SEC = 8;

/**
 * エピソードの検査。
 * ここで弾いておけば、素材を作り始めてから構造の作り直しになるのを防げる。
 */
export function validateEpisode(
  prototypeId: PrototypeId,
  episode: Episode,
  production: ProductionNotes,
): string[] {
  const problems: string[] = [];
  const where = `${prototypeId}/${episode.id}`;
  const ids = new Set(episode.shots.map((shot) => shot.id));

  if (!ids.has(episode.startShotId)) {
    problems.push(`${where}: startShotId の宛先がない（${episode.startShotId}）`);
  }
  if (episode.shots.length !== ids.size) {
    problems.push(`${where}: ショットIDが重複している`);
  }
  if (episode.endings.length === 0) {
    problems.push(`${where}: 結末が1つもない`);
  }

  const gaugeKeys = new Set(episode.gauges.map((gauge) => gauge.key));
  const placeIds = new Set(production.places.map((place) => place.id));
  const characterIds = new Set(production.characters.map((character) => character.id));

  for (const shot of episode.shots) {
    const at = `${where}/${shot.id}`;

    const note = production.shots[shot.id];
    if (!note) {
      problems.push(`${at}: production.ts の shots に制作メモがない`);
    } else {
      if (note.placeId && !placeIds.has(note.placeId)) {
        problems.push(`${at}: 知らない場所を指している（${note.placeId}）`);
      }
      for (const characterId of note.characterIds ?? []) {
        if (!characterIds.has(characterId)) {
          problems.push(`${at}: 知らない登場人物を指している（${characterId}）`);
        }
      }
    }
    if (shot.durationSec <= 0) {
      problems.push(`${at}: durationSec が 0 以下`);
    }
    if (shot.durationSec > SHOT_MAX_SEC) {
      problems.push(
        `${at}: durationSec が ${shot.durationSec} 秒。1ショットは ${SHOT_MAX_SEC} 秒以下に分割する`,
      );
    }
    if (!shot.videoAssetId && !shot.imageAssetId) {
      problems.push(`${at}: videoAssetId も imageAssetId も無い（絵コンテのままになる）`);
    }

    for (const subtitle of shot.subtitles) {
      if (subtitle.atSec < 0 || subtitle.atSec >= shot.durationSec) {
        problems.push(`${at}: 字幕の atSec (${subtitle.atSec}) がショットの尺の外`);
      }
      if ([...subtitle.text].length > 26) {
        problems.push(`${at}: 字幕が長い（${[...subtitle.text].length}文字）。分けること`);
      }
    }

    if (shot.branch) {
      const branch = shot.branch;
      if (branch.choices.length !== 2) {
        problems.push(`${at}: 選択肢は2つにする（いまは ${branch.choices.length} つ）`);
      }
      for (const choice of branch.choices) {
        if ([...choice.label].length > CHOICE_LABEL_MAX) {
          problems.push(
            `${at}: 選択肢「${choice.label}」が ${CHOICE_LABEL_MAX} 文字を超えている`,
          );
        }
        for (const effect of choice.effects ?? []) {
          if (!gaugeKeys.has(effect.key)) {
            problems.push(`${at}: 未定義のゲージを触っている（${effect.key}）`);
          }
        }
      }
      if (!branch.onTimeout) {
        problems.push(`${at}: branch に onTimeout が無い`);
      } else {
        for (const effect of branch.onTimeout.effects ?? []) {
          if (!gaugeKeys.has(effect.key)) {
            problems.push(`${at}: onTimeout が未定義のゲージを触っている（${effect.key}）`);
          }
        }
      }
      if (branch.atSec !== undefined && branch.atSec > shot.durationSec) {
        problems.push(`${at}: branch.atSec がショットの尺を超えている`);
      }
      if (shot.next) {
        problems.push(`${at}: branch と next の両方がある（next は無視される）`);
      }
    }

    for (const nextId of nextIdsOf(shot)) {
      if (!ids.has(nextId)) problems.push(`${at}: 遷移先が存在しない（${nextId}）`);
    }
  }

  // 結末と答え合わせ
  for (const ending of episode.endings) {
    const shot = episode.shots.find((candidate) => candidate.id === ending.shotId);
    if (!shot) {
      problems.push(`${where}: 結末 ${ending.id} のショットがない（${ending.shotId}）`);
    } else if (shot.kind !== 'ending') {
      problems.push(`${where}: 結末 ${ending.id} のショットの kind が 'ending' でない`);
    }
    for (const debriefId of ending.debriefShotIds) {
      const debrief = episode.shots.find((candidate) => candidate.id === debriefId);
      if (!debrief) problems.push(`${where}: 答え合わせのショットがない（${debriefId}）`);
      else if (debrief.kind !== 'debrief') {
        problems.push(`${where}: ${debriefId} の kind が 'debrief' でない`);
      }
    }
  }

  // 到達性と行き止まり
  const endingShotIds = new Set(episode.endings.map((ending) => ending.shotId));
  const debriefShotIds = new Set(episode.endings.flatMap((ending) => ending.debriefShotIds));
  const seen = new Set<string>();
  const queue = [episode.startShotId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const shot = episode.shots.find((candidate) => candidate.id === id);
    if (!shot) continue;
    const nexts = nextIdsOf(shot);
    if (nexts.length === 0 && !endingShotIds.has(id)) {
      problems.push(`${where}/${id}: 行き止まり（結末でないのに次がない）`);
    }
    queue.push(...nexts);
  }

  for (const id of ids) {
    if (!seen.has(id) && !debriefShotIds.has(id)) {
      problems.push(`${where}/${id}: どこからも到達できない`);
    }
  }

  return problems;
}
