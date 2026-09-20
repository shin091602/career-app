import { useCallback, useMemo } from 'react';
import type { Choice, ParamEffect, PrototypeId, Scenario, Scene } from '../../types';
import { usePersistentState } from '../../lib/usePersistentState';

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
  goBack: () => void;
  restart: () => void;
}

/**
 * ノベルの再生状態。場面の遷移・パラメータ加算・答え合わせの進行を一手に扱う。
 * 進行状況はプロトタイプごとに localStorage へ保存し、再訪時に続きから再開する。
 */
export function useNovelState(scenario: Scenario, prototypeId: PrototypeId): NovelState {
  const fallback = useMemo(() => initialProgress(scenario), [scenario]);
  const [progress, setProgress, reset] = usePersistentState<NovelProgress>(
    `novel:${prototypeId}:progress`,
    fallback,
  );

  const sceneMap = useMemo(() => {
    const map = new Map<string, Scene>();
    for (const scene of scenario.scenes) map.set(scene.id, scene);
    return map;
  }, [scenario]);

  // 保存済みの場面IDがシナリオ更新で消えていた場合は先頭に戻す
  const currentId = sceneMap.has(progress.sceneId) ? progress.sceneId : scenario.startSceneId;
  const scene = sceneMap.get(currentId);
  if (!scene) throw new Error(`場面が見つかりません: ${currentId}`);

  const ending = useMemo(
    () => scenario.endings.find((candidate) => candidate.sceneId === scene.id),
    [scenario, scene.id],
  );

  const debriefIds = ending?.debriefSceneIds ?? [];
  const debriefPosition =
    ending && progress.debriefIndex >= 0 ? Math.min(progress.debriefIndex, debriefIds.length - 1) : null;

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
        const undo = previousScene.choices.find((choice) => choice.label === pickedLabel);
        params = applyEffects(
          params,
          undo?.effects?.map((effect) => ({ key: effect.key, delta: -effect.delta })),
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
    goBack,
    restart: reset,
  };
}
