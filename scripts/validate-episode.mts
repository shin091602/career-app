import type { Episode, GaugeEffect, PrototypeId, ProductionNotes } from '../src/types/index.ts';
import { SCORE_ENDING, endingForScore, scoreEndings } from '../src/types/index.ts';
import { nextIdsOf } from './episodes.mts';

/** 選択肢のラベルの上限（スマホで1行に収めるため） */
const CHOICE_LABEL_MAX = 10;

/**
 * 1ショットの上限（秒）。
 * 動画は Google Flow（Veo 3.1）で1クリップずつ作る。Flow の1クリップは8秒か10秒なので、
 * それを超えるショットは脚本側で分割する（延長機能は使わない）。
 */
const SHOT_MAX_SEC = 10;

/**
 * 点数で結末が決まるエピソードで、SCORE_ENDING に着いたときに取りうる点数の一覧。
 * SCORE_ENDING を使っていなければ null。
 * 分岐は合流させる前提なので、ショットごとに「ここから先で足されうる点数」を覚えておけば
 * 経路を全部たどらなくても求まる。
 */
export function reachableScores(episode: Episode): number[] | null {
  const keys = new Set(episode.scoreGauges ?? episode.gauges.map((gauge) => gauge.key));
  const deltaOf = (effects: GaugeEffect[] | undefined) =>
    (effects ?? []).reduce((sum, effect) => sum + (keys.has(effect.key) ? effect.delta : 0), 0);

  let usesScore = false;
  const memo = new Map<string, Set<number>>();
  const visiting = new Set<string>();

  const visit = (id: string): Set<number> => {
    if (id === SCORE_ENDING) {
      usesScore = true;
      return new Set([0]);
    }
    const cached = memo.get(id);
    if (cached) return cached;
    // 輪になっている遷移は数えない（別の検査で行き止まり・到達性を見る）
    if (visiting.has(id)) return new Set();
    visiting.add(id);

    const shot = episode.shots.find((candidate) => candidate.id === id);
    const result = new Set<number>();
    if (shot?.branch) {
      for (const option of [...shot.branch.choices, shot.branch.onTimeout]) {
        const delta = deltaOf(option.effects);
        for (const rest of visit(option.nextShotId)) result.add(rest + delta);
      }
    } else if (shot?.next) {
      for (const rest of visit(shot.next)) result.add(rest);
    }

    visiting.delete(id);
    memo.set(id, result);
    return result;
  };

  const scores = [...visit(episode.startShotId)].sort((a, b) => a - b);
  return usesScore ? scores : null;
}

/**
 * 点数ごとの「選び方の数」（時間切れも1つの選び方として数える）。
 * 結末の点数帯を決めるときに、どの結末に何通りで届くかを見るために使う。
 */
export function scoreDistribution(episode: Episode): Map<number, number> {
  const keys = new Set(episode.scoreGauges ?? episode.gauges.map((gauge) => gauge.key));
  const deltaOf = (effects: GaugeEffect[] | undefined) =>
    (effects ?? []).reduce((sum, effect) => sum + (keys.has(effect.key) ? effect.delta : 0), 0);
  const memo = new Map<string, Map<number, number>>();
  const visiting = new Set<string>();

  const merge = (into: Map<number, number>, from: Map<number, number>, shift: number) => {
    for (const [score, count] of from) into.set(score + shift, (into.get(score + shift) ?? 0) + count);
  };

  const visit = (id: string): Map<number, number> => {
    if (id === SCORE_ENDING) return new Map([[0, 1]]);
    const cached = memo.get(id);
    if (cached) return cached;
    if (visiting.has(id)) return new Map();
    visiting.add(id);
    const shot = episode.shots.find((candidate) => candidate.id === id);
    const result = new Map<number, number>();
    if (shot?.branch) {
      for (const option of [...shot.branch.choices, shot.branch.onTimeout]) {
        merge(result, visit(option.nextShotId), deltaOf(option.effects));
      }
    } else if (shot?.next) {
      merge(result, visit(shot.next), 0);
    }
    visiting.delete(id);
    memo.set(id, result);
    return result;
  };

  return visit(episode.startShotId);
}

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
  const keyframeIds = new Set((production.keyframes ?? []).map((keyframe) => keyframe.id));
  const endingShotSet = new Set(episode.endings.map((ending) => ending.shotId));
  const scoreTiers = scoreEndings(episode);

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
      for (const frameId of [note.startFrame, note.endFrame]) {
        if (frameId && !keyframeIds.has(frameId)) {
          problems.push(`${at}: 知らないキーフレームを指している（${frameId}）`);
        }
      }
      if (!note.imagePrompt && !note.startFrame) {
        problems.push(`${at}: imagePrompt も startFrame も無い（最初のコマが決まらない）`);
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

      const targets = [
        ...branch.choices.map((choice) => choice.nextShotId),
        branch.onTimeout.nextShotId,
      ].filter((id) => id !== SCORE_ENDING);

      // 選択は最後のコマで止めて出すので、分岐した先はそのコマから始める（継ぎ目を消す）
      const pausedFrame = production.shots[shot.id]?.endFrame;
      if (pausedFrame) {
        for (const targetId of new Set(targets)) {
          if (endingShotSet.has(targetId)) continue;
          const start = production.shots[targetId]?.startFrame;
          if (start !== pausedFrame) {
            problems.push(
              `${at}: 分岐先 ${targetId} の始点が選択のコマ（${pausedFrame}）と違う（いまは ${start ?? '未指定'}）`,
            );
          }
        }
      }

      // 分かれた2本は同じショットに合流させる（結末に入る場合を除く）
      const joins = new Set(
        [...new Set(targets)]
          .filter((id) => !endingShotSet.has(id))
          .map((id) => episode.shots.find((candidate) => candidate.id === id))
          .filter((target) => target?.kind === 'reaction')
          .map((target) => target?.next)
          .filter((next): next is string => Boolean(next))
          .filter((next) => next === SCORE_ENDING || !endingShotSet.has(next)),
      );
      if (joins.size > 1) {
        problems.push(
          `${at}: 分岐した反応ショットが別々の場所へ進んでいる（${[...joins].join(' / ')}）。合流させること`,
        );
      }
    }

    for (const nextId of nextIdsOf(shot)) {
      if (nextId === SCORE_ENDING) {
        if (scoreTiers.length === 0) {
          problems.push(`${at}: 点数で結末へ進むのに、minScore を持つ結末が1つもない`);
        }
        continue;
      }
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
    const nexts = nextIdsOf(shot).flatMap((next) =>
      next === SCORE_ENDING ? scoreTiers.map((tier) => tier.shotId) : [next],
    );
    if (nexts.length === 0 && !endingShotIds.has(id)) {
      problems.push(`${where}/${id}: 行き止まり（結末でないのに次がない）`);
    }
    queue.push(...nexts);
  }

  // 点数で選ぶ結末が、どれも実際に届く点数になっているか
  const scores = reachableScores(episode);
  if (scores) {
    if (scores.length === 0) {
      problems.push(`${where}: 点数で結末へ進む経路が1本もない`);
    }
    for (const tier of scoreTiers) {
      const reached = scores.some((score) => endingForScore(episode, score)?.id === tier.id);
      if (!reached) {
        problems.push(
          `${where}: 結末「${tier.type}」（${tier.minScore}点〜）に届く選び方がない。` +
            `取りうる点数は ${scores[0]}〜${scores[scores.length - 1]}`,
        );
      }
    }
  }

  for (const id of ids) {
    if (!seen.has(id) && !debriefShotIds.has(id)) {
      problems.push(`${where}/${id}: どこからも到達できない`);
    }
  }

  return problems;
}
