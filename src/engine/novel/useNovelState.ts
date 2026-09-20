import { useCallback, useEffect, useMemo } from 'react';
import type {
  Choice,
  ParamEffect,
  PrototypeId,
  Scenario,
  Scene,
  TimeoutOutcome,
} from '../../types';
import { usePersistentState } from '../../lib/usePersistentState';

/** バックログ（これまでの流れ）の1行 */
export interface BacklogEntry {
  sceneId: string;
  /** line = セリフ・地の文 / choice = 自分が選んだこと */
  kind: 'line' | 'choice';
  speaker?: string;
  text: string;
}

/** バックログに残す最大件数（localStorage を膨らませないため） */
const BACKLOG_LIMIT = 80;

/** localStorage に保存する進行状況 */
export interface NovelProgress {
  /** 現在の場面ID */
  sceneId: string;
  /** 通ってきた場面IDの履歴（戻る用） */
  history: string[];
  /** パラメータの現在値 */
  params: Record<string, number>;
  /** 選んだ選択肢（場面ID → 選択肢のラベル） */
  picked: Record<string, string>;
  /**
   * 答え合わせの進行位置。
   * -1: まだエンディング本文を見ている / 0以上: debriefSceneIds のその位置
   */
  debriefIndex: number;
  /** これまでの流れ */
  backlog: BacklogEntry[];
}

function initialProgress(scenario: Scenario): NovelProgress {
  const params: Record<string, number> = {};
  for (const param of scenario.params) params[param.key] = 0;
  return {
    sceneId: scenario.startSceneId,
    history: [],
    params,
    picked: {},
    debriefIndex: -1,
    backlog: [],
  };
}

function applyEffects(
  params: Record<string, number>,
  effects: ParamEffect[] | undefined,
): Record<string, number> {
  if (!effects || effects.length === 0) return params;
  const next = { ...params };
  for (const effect of effects) {
    next[effect.key] = (next[effect.key] ?? 0) + effect.delta;
  }
  return next;
}

function appendBacklog(backlog: BacklogEntry[], entry: BacklogEntry): BacklogEntry[] {
  return [...backlog, entry].slice(-BACKLOG_LIMIT);
}

export interface NovelState {
  scene: Scene;
  progress: NovelProgress;
  /** 現在の場面に対応するエンディング（kind が 'ending' のときだけ） */
  ending: Scenario['endings'][number] | undefined;
  /** 答え合わせの何枚目か（0始まり）。エンディング本文中は null */
  debriefPosition: number | null;
  /** 答え合わせを含めて、まだ先があるか */
  canAdvance: boolean;
  advance: () => void;
  pick: (choice: Choice) => void;
  /** 制限時間切れ。シナリオの onTimeout に従って進む */
  timeout: (outcome: TimeoutOutcome) => void;
  goBack: () => void;
  restart: () => void;
}

/**
 * ノベルの再生状態。場面の遷移・パラメータ加算・答え合わせの進行・バックログを一手に扱う。
 * 進行状況はプロトタイプごとに localStorage へ保存し、再訪時に続きから再開する。
 */
export function useNovelState(scenario: Scenario, prototypeId: PrototypeId): NovelState {
  const fallback = useMemo(() => initialProgress(scenario), [scenario]);
  const [rawProgress, setProgress, reset] = usePersistentState<NovelProgress>(
    `novel:${prototypeId}:progress`,
    fallback,
  );

  // 以前の版で保存された進行状況には backlog が無い
  const progress: NovelProgress = { ...rawProgress, backlog: rawProgress.backlog ?? [] };

  const sceneMap = useMemo(() => {
    const map = new Map<string, Scene>();
    for (const scene of scenario.scenes) map.set(scene.id, scene);
    return map;
  }, [scenario]);

  // 保存済みの場面IDがシナリオ更新で消えていた場合は先頭に戻す
  const currentId = sceneMap.has(progress.sceneId) ? progress.sceneId : scenario.startSceneId;
  const scene = sceneMap.get(currentId);
  if (!scene) throw new Error(`場面が見つかりません: ${currentId}`);

  // 表示した場面をバックログに積む（同じ場面を続けて積まない）
  useEffect(() => {
    setProgress((prev) => {
      const backlog = prev.backlog ?? [];
      const last = backlog[backlog.length - 1];
      if (last && last.kind === 'line' && last.sceneId === currentId) return prev;
      return {
        ...prev,
        backlog: appendBacklog(backlog, {
          sceneId: currentId,
          kind: 'line',
          speaker: scene.speaker,
          text: scene.text,
        }),
      };
    });
  }, [currentId, scene.speaker, scene.text, setProgress]);

  const ending = useMemo(
    () => scenario.endings.find((candidate) => candidate.sceneId === scene.id),
    [scenario, scene.id],
  );

  const debriefIds = ending?.debriefSceneIds ?? [];
  const debriefPosition =
    ending && progress.debriefIndex >= 0
      ? Math.min(progress.debriefIndex, debriefIds.length - 1)
      : null;

  const canAdvance = ending
    ? progress.debriefIndex + 1 < debriefIds.length
    : Boolean(scene.next) && !scene.choices?.length;

  const advance = useCallback(() => {
    setProgress((prev) => {
      const activeScene = sceneMap.get(prev.sceneId) ?? scene;
      const activeEnding = scenario.endings.find(
        (candidate) => candidate.sceneId === activeScene.id,
      );

      // エンディングに到達している間は「答え合わせ」を1枚ずつ進める
      if (activeEnding) {
        const nextIndex = prev.debriefIndex + 1;
        if (nextIndex >= activeEnding.debriefSceneIds.length) return prev;
        return { ...prev, debriefIndex: nextIndex };
      }

      if (!activeScene.next) return prev;
      return {
        ...prev,
        sceneId: activeScene.next,
        history: [...prev.history, activeScene.id],
        debriefIndex: -1,
      };
    });
  }, [scene, sceneMap, scenario.endings, setProgress]);

  const pick = useCallback(
    (choice: Choice) => {
      setProgress((prev) => ({
        ...prev,
        sceneId: choice.nextSceneId,
        history: [...prev.history, prev.sceneId],
        params: applyEffects(prev.params, choice.effects),
        picked: { ...prev.picked, [prev.sceneId]: choice.label },
        debriefIndex: -1,
        backlog: appendBacklog(prev.backlog ?? [], {
          sceneId: prev.sceneId,
          kind: 'choice',
          text: choice.label,
        }),
      }));
    },
    [setProgress],
  );

  const timeout = useCallback(
    (outcome: TimeoutOutcome) => {
      setProgress((prev) => ({
        ...prev,
        sceneId: outcome.nextSceneId,
        history: [...prev.history, prev.sceneId],
        params: applyEffects(prev.params, outcome.effects),
        picked: { ...prev.picked, [prev.sceneId]: outcome.label },
        debriefIndex: -1,
        backlog: appendBacklog(prev.backlog ?? [], {
          sceneId: prev.sceneId,
          kind: 'choice',
          text: outcome.label,
        }),
      }));
    },
    [setProgress],
  );

  const goBack = useCallback(() => {
    setProgress((prev) => {
      // 答え合わせ中は1枚戻す
      if (prev.debriefIndex >= 0) {
        return { ...prev, debriefIndex: prev.debriefIndex - 1 };
      }
      if (prev.history.length === 0) return prev;
      const history = [...prev.history];
      const previousId = history.pop();
      if (!previousId) return prev;

      // 戻り先が選択肢の場面なら、その選択の効果を取り消す
      const previousScene = sceneMap.get(previousId);
      const pickedLabel = prev.picked[previousId];
      let params = prev.params;
      const picked = { ...prev.picked };
      if (previousScene?.choices && pickedLabel) {
        // 時間切れで進んだ場合は onTimeout の効果を取り消す
        const undone =
          previousScene.choices.find((choice) => choice.label === pickedLabel) ??
          (previousScene.onTimeout?.label === pickedLabel ? previousScene.onTimeout : undefined);
        params = applyEffects(
          params,
          undone?.effects?.map((effect) => ({ key: effect.key, delta: -effect.delta })),
        );
        delete picked[previousId];
      }

      return { ...prev, sceneId: previousId, history, params, picked };
    });
  }, [sceneMap, setProgress]);

  return {
    scene,
    progress: { ...progress, sceneId: currentId },
    ending,
    debriefPosition,
    canAdvance,
    advance,
    pick,
    timeout,
    goBack,
    restart: reset,
  };
}
