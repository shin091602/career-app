import { useCallback, useEffect, useMemo } from 'react';
import type {
  Choice,
  EndingCard,
  Episode,
  GaugeEffect,
  PrototypeId,
  Shot,
  TimeoutOutcome,
} from '../../types';
import { usePersistentState } from '../../lib/usePersistentState';

/** 字幕ログの1行 */
export interface LogEntry {
  shotId: string;
  /** line = セリフ / choice = 自分が選んだこと */
  kind: 'line' | 'choice';
  speaker?: string;
  text: string;
}

const LOG_LIMIT = 80;

export interface EpisodeProgress {
  shotId: string;
  history: string[];
  gauges: Record<string, number>;
  log: LogEntry[];
  /**
   * 到達した結末のID。
   * 答え合わせショットは複数の結末で使い回せるので、
   * 「いまどの結末の答え合わせを見ているか」は導出せずここに持つ。
   */
  endingId: string | null;
  /** 結果カードを開いているか */
  resultOpen: boolean;
}

function initialProgress(episode: Episode): EpisodeProgress {
  const gauges: Record<string, number> = {};
  for (const gauge of episode.gauges) gauges[gauge.key] = 0;
  return {
    shotId: episode.startShotId,
    history: [],
    gauges,
    log: [],
    endingId: null,
    resultOpen: false,
  };
}

function applyEffects(
  gauges: Record<string, number>,
  effects: GaugeEffect[] | undefined,
): Record<string, number> {
  if (!effects || effects.length === 0) return gauges;
  const next = { ...gauges };
  for (const effect of effects) next[effect.key] = (next[effect.key] ?? 0) + effect.delta;
  return next;
}

export interface EpisodeState {
  shot: Shot;
  progress: EpisodeProgress;
  /** 次に再生されうるショット（先読み用） */
  upcoming: Shot[];
  /** いま到達している結末（結果カードを出す段階かどうかの判断に使う） */
  ending: EndingCard | undefined;
  /** 結果カードを開いているか */
  resultOpen: boolean;
  /** これまでに見た結末のID（周回をまたいで残る） */
  collectedEndingIds: string[];
  /** ショットが終わったときに進む */
  advance: () => void;
  pick: (choice: Choice) => void;
  timeout: (outcome: TimeoutOutcome) => void;
  restart: () => void;
}

/**
 * エピソードの進行状態。
 * ショットの遷移・分岐・ゲージ・字幕ログ・結末の回収状況をまとめて扱う。
 *
 * 結末のあとは EndingCard の debriefShotIds を順に再生し、
 * 終わったら結果カード（タイプ診断）を出す。
 */
export function useEpisodeState(episode: Episode, prototypeId: PrototypeId): EpisodeState {
  const fallback = useMemo(() => initialProgress(episode), [episode]);
  const [raw, setProgress, reset] = usePersistentState<EpisodeProgress>(
    `episode:${prototypeId}:${episode.id}:progress`,
    fallback,
  );
  const [collectedEndingIds, setCollected] = usePersistentState<string[]>(
    `episode:${prototypeId}:${episode.id}:endings`,
    [],
  );

  const progress: EpisodeProgress = { ...raw, log: raw.log ?? [], endingId: raw.endingId ?? null };

  const shotMap = useMemo(() => {
    const map = new Map<string, Shot>();
    for (const shot of episode.shots) map.set(shot.id, shot);
    return map;
  }, [episode]);

  const currentId = shotMap.has(progress.shotId) ? progress.shotId : episode.startShotId;
  const shot = shotMap.get(currentId);
  if (!shot) throw new Error(`ショットが見つかりません: ${currentId}`);

  /** 結末そのもののショットか */
  const endingShot = useMemo(
    () => episode.endings.find((candidate) => candidate.shotId === currentId),
    [episode.endings, currentId],
  );

  /** 到達した結末（答え合わせ中・結果カード表示中もこれを使う） */
  const reachedEnding = useMemo(
    () => episode.endings.find((candidate) => candidate.id === progress.endingId),
    [episode.endings, progress.endingId],
  );

  /** 答え合わせの途中なら、その何枚目か */
  const debriefIndex = reachedEnding ? reachedEnding.debriefShotIds.indexOf(currentId) : -1;

  /** いま関わっている結末 */
  const ending = reachedEnding ?? endingShot;

  // 結末のショットに入ったら、到達した結末として記録する
  useEffect(() => {
    if (!endingShot) return;
    setCollected((prev) => (prev.includes(endingShot.id) ? prev : [...prev, endingShot.id]));
    setProgress((prev) =>
      prev.endingId === endingShot.id ? prev : { ...prev, endingId: endingShot.id },
    );
  }, [endingShot, setCollected, setProgress]);

  // 再生したショットを字幕ログに積む（同じショットを続けて積まない）
  useEffect(() => {
    setProgress((prev) => {
      const log = prev.log ?? [];
      const last = log[log.length - 1];
      if (last && last.kind === 'line' && last.shotId === currentId) return prev;
      const first = [...shot.subtitles].sort((a, b) => a.atSec - b.atSec)[0];
      if (!first) return prev;
      return {
        ...prev,
        log: [
          ...log,
          {
            shotId: currentId,
            kind: 'line' as const,
            speaker: first.speaker,
            text: shot.subtitles.map((s) => s.text).join(' '),
          },
        ].slice(-LOG_LIMIT),
      };
    });
  }, [currentId, shot, setProgress]);

  const goTo = useCallback(
    (nextShotId: string, effects?: GaugeEffect[], pickedLabel?: string) => {
      setProgress((prev) => ({
        ...prev,
        shotId: nextShotId,
        history: [...prev.history, prev.shotId],
        gauges: applyEffects(prev.gauges, effects),
        resultOpen: false,
        log: pickedLabel
          ? [
              ...(prev.log ?? []),
              { shotId: prev.shotId, kind: 'choice' as const, text: pickedLabel },
            ].slice(-LOG_LIMIT)
          : (prev.log ?? []),
      }));
    },
    [setProgress],
  );

  const advance = useCallback(() => {
    // 結末のショットが終わった → 答え合わせへ（無ければ結果カードへ）
    if (endingShot) {
      const first = endingShot.debriefShotIds[0];
      if (first) goTo(first);
      else setProgress((prev) => ({ ...prev, resultOpen: true }));
      return;
    }

    // 答え合わせの途中 → 次の答え合わせ、最後まで来たら結果カードへ
    if (reachedEnding && debriefIndex >= 0) {
      const next = reachedEnding.debriefShotIds[debriefIndex + 1];
      if (next) goTo(next);
      else setProgress((prev) => ({ ...prev, resultOpen: true }));
      return;
    }

    if (shot.next) goTo(shot.next);
  }, [endingShot, reachedEnding, debriefIndex, shot.next, goTo, setProgress]);

  const pick = useCallback(
    (choice: Choice) => goTo(choice.nextShotId, choice.effects, choice.label),
    [goTo],
  );

  const timeout = useCallback(
    (outcome: TimeoutOutcome) => goTo(outcome.nextShotId, outcome.effects, outcome.label),
    [goTo],
  );

  /** 次に再生されうるショット（分岐なら両方）を先読みの対象にする */
  const upcoming = useMemo(() => {
    const ids: string[] = [];
    if (shot.branch) {
      ids.push(shot.branch.choices[0].nextShotId, shot.branch.choices[1].nextShotId);
      ids.push(shot.branch.onTimeout.nextShotId);
    } else if (endingShot) {
      if (endingShot.debriefShotIds[0]) ids.push(endingShot.debriefShotIds[0]);
    } else if (reachedEnding && debriefIndex >= 0) {
      const next = reachedEnding.debriefShotIds[debriefIndex + 1];
      if (next) ids.push(next);
    } else if (shot.next) {
      ids.push(shot.next);
    }

    const unique = [...new Set(ids)].filter((id) => id !== currentId);
    return unique.map((id) => shotMap.get(id)).filter((s): s is Shot => Boolean(s));
  }, [shot, endingShot, reachedEnding, debriefIndex, currentId, shotMap]);

  return {
    shot,
    progress: { ...progress, shotId: currentId },
    upcoming,
    ending,
    resultOpen: progress.resultOpen,
    collectedEndingIds,
    advance,
    pick,
    timeout,
    restart: reset,
  };
}
