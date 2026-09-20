import { useEffect, useState } from 'react';
import type { Scene } from '../../types';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';

/** 暗転しきるまでの時間。この間に場面を差し替えるので、切り替わりが見えない */
const BLACKOUT_HALF_MS = 320;
const BLACKOUT_TOTAL_MS = 720;
const FADE_MS = 420;

export type TransitionPhase = 'idle' | 'fade' | 'blackout';

/**
 * 場面転換。
 * - fade     … 新しい場面をふわりと出す
 * - blackout … いったん黒で覆い、覆われている間に場面を差し替える
 *
 * 返す `shown` は「いま描画してよい場面」。暗転中は前の場面を保つ。
 */
export function useSceneTransition(scene: Scene): { shown: Scene; phase: TransitionPhase } {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(scene);
  const [phase, setPhase] = useState<TransitionPhase>('idle');

  useEffect(() => {
    if (scene.id === shown.id) {
      // 同じ場面のデータが差し替わった場合（開発中のリロードなど）は追従する
      if (scene !== shown) setShown(scene);
      return;
    }

    const kind = scene.transition ?? 'none';

    if (reduced || kind === 'none') {
      setShown(scene);
      setPhase('idle');
      return;
    }

    if (kind === 'blackout') {
      setPhase('blackout');
      const swap = setTimeout(() => setShown(scene), BLACKOUT_HALF_MS);
      const clear = setTimeout(() => setPhase('idle'), BLACKOUT_TOTAL_MS);
      return () => {
        clearTimeout(swap);
        clearTimeout(clear);
      };
    }

    setShown(scene);
    setPhase('fade');
    const clear = setTimeout(() => setPhase('idle'), FADE_MS);
    return () => clearTimeout(clear);
  }, [scene, shown, reduced]);

  return { shown, phase };
}
