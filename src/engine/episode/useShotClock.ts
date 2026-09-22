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

/**
 * ショット内の経過秒。
 *
 * 動画が再生できているときは動画の再生位置を、
 * 動画が無い（絵コンテ・静止画の）ときは実時間を使う。
 */
export function useShotClock(
  shotId: string,
  durationSec: number,
  running: boolean,
  videoRef: RefObject<HTMLVideoElement | null>,
): ShotClock {
  const [elapsed, setElapsed] = useState(0);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  // ショットが変わったら0から測り直す
  useEffect(() => {
    accumulatedRef.current = 0;
    setElapsed(0);
    setMediaDuration(null);
  }, [shotId]);

  useEffect(() => {
    if (!running) return;

    startedAtRef.current = performance.now();
    let frame = 0;

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState > 0 && !Number.isNaN(video.currentTime)) {
        setElapsed(video.currentTime);
        if (Number.isFinite(video.duration) && video.duration > 0) {
          setMediaDuration((prev) => (prev === video.duration ? prev : video.duration));
        }
      } else {
        const wall = (performance.now() - startedAtRef.current) / 1000;
        setElapsed(Math.min(accumulatedRef.current + wall, durationSec));
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      // 一時停止した位置を覚えておく（動画が無いときの再開用）
      accumulatedRef.current += (performance.now() - startedAtRef.current) / 1000;
    };
  }, [shotId, durationSec, running, videoRef]);

  return { elapsed, duration: mediaDuration ?? durationSec };
}
