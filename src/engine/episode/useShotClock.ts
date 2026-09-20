import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * ショット内の経過秒。
 *
 * 動画が再生できているときは動画の再生位置を、
 * 動画が無い（絵コンテ・静止画の）ときは実時間を使う。
 * どちらでも「尺どおりに進む」ので、素材の有無で間が変わらない。
 */
export function useShotClock(
  shotId: string,
  durationSec: number,
  running: boolean,
  videoRef: RefObject<HTMLVideoElement | null>,
): number {
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  // ショットが変わったら0から測り直す
  useEffect(() => {
    accumulatedRef.current = 0;
    setElapsed(0);
  }, [shotId]);

  useEffect(() => {
    if (!running) return;

    startedAtRef.current = performance.now();
    let frame = 0;

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState > 0 && !Number.isNaN(video.currentTime)) {
        setElapsed(video.currentTime);
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

  return elapsed;
}
