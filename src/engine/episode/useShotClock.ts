import { useEffect, useRef, useState, type RefObject } from 'react';

export interface ShotClock {
  /** ショット内の経過秒 */
  elapsed: number;
  /**
   * このショットの実効的な尺。
   * 動画が読み込めていれば**動画の実際の長さ**、無ければデータの durationSec。
   * Flow の出力は8秒か10秒かが生成してみるまで決まらないので、実物を優先する。
   */
  duration: number;
}

interface ClockState {
  /** どのショットを測っているか。**ショットが変わった瞬間に前の値を返さないために持つ** */
  shotId: string;
  elapsed: number;
  /** 動画から分かった実際の長さ */
  mediaDuration: number | null;
}

/**
 * ショット内の経過秒。
 *
 * 動画が再生できているときは動画の再生位置を、
 * 動画が無い（絵コンテ・静止画の）ときは実時間を使う。
 *
 * 値は**測っているショットIDとセット**で持つ。
 * ショットが切り替わった直後に前のショットの経過秒を返すと、
 * 「もう終わっている」と誤判定して次のクリップを飛ばしてしまうため。
 */
export function useShotClock(
  shotId: string,
  durationSec: number,
  running: boolean,
  videoRef: RefObject<HTMLVideoElement | null>,
): ShotClock {
  const [state, setState] = useState<ClockState>({ shotId, elapsed: 0, mediaDuration: null });
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  // ショットが変わったら0から測り直す
  useEffect(() => {
    accumulatedRef.current = 0;
    setState({ shotId, elapsed: 0, mediaDuration: null });
  }, [shotId]);

  useEffect(() => {
    if (!running) return;

    startedAtRef.current = performance.now();
    let frame = 0;

    const tick = () => {
      const video = videoRef.current;
      setState((prev) => {
        if (video && video.readyState > 0 && !Number.isNaN(video.currentTime)) {
          const mediaDuration =
            Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;
          return { shotId, elapsed: video.currentTime, mediaDuration };
        }
        const wall = (performance.now() - startedAtRef.current) / 1000;
        return {
          shotId,
          elapsed: Math.min(accumulatedRef.current + wall, durationSec),
          mediaDuration: prev.shotId === shotId ? prev.mediaDuration : null,
        };
      });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      // 一時停止した位置を覚えておく（動画が無いときの再開用）
      accumulatedRef.current += (performance.now() - startedAtRef.current) / 1000;
    };
  }, [shotId, durationSec, running, videoRef]);

  // 測っているショットが違うあいだは 0 秒として扱う
  const current = state.shotId === shotId ? state : null;
  return {
    elapsed: current?.elapsed ?? 0,
    duration: current?.mediaDuration ?? durationSec,
  };
}
