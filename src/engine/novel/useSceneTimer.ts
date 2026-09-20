import { useEffect, useRef, useState } from 'react';

const TICK_MS = 100;

export interface SceneTimer {
  /** 残り時間の割合（1 → 0）。制限時間なしなら null */
  ratio: number | null;
  /** 残り秒数（切り上げ）。制限時間なしなら null */
  seconds: number | null;
}

/**
 * 選択肢の制限時間。
 * 動作は「残り時間を減らし、0になったら onTimeout を一度だけ呼ぶ」だけ。
 * 時間切れのあと何が起きるかはシナリオの onTimeout が決める。
 *
 * @param limitSec 制限時間（秒）。null / undefined なら計測しない
 * @param key      場面が変わったら計測をやり直すためのキー
 * @param active   false の間は止める（文字送り中・割り込み表示中など）
 */
export function useSceneTimer(
  limitSec: number | null | undefined,
  key: string,
  active: boolean,
  onTimeout: () => void,
): SceneTimer {
  const [remainingMs, setRemainingMs] = useState<number | null>(
    limitSec ? limitSec * 1000 : null,
  );
  const firedRef = useRef(false);
  // onTimeout は毎レンダリングで新しくなりうるので、最新のものを ref で持つ
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    firedRef.current = false;
    setRemainingMs(limitSec ? limitSec * 1000 : null);
  }, [key, limitSec]);

  useEffect(() => {
    if (!limitSec || !active) return;

    const id = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev === null) return prev;
        const next = prev - TICK_MS;
        if (next <= 0 && !firedRef.current) {
          firedRef.current = true;
          onTimeoutRef.current();
          return 0;
        }
        return next <= 0 ? 0 : next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [limitSec, active, key]);

  if (!limitSec || remainingMs === null) return { ratio: null, seconds: null };

  return {
    ratio: remainingMs / (limitSec * 1000),
    seconds: Math.ceil(remainingMs / 1000),
  };
}
