import { useEffect, useRef, useState } from 'react';

const TICK_MS = 100;

export interface ChoiceTimer {
  /** 残り時間の割合（1 → 0）。制限時間なしなら null */
  ratio: number | null;
  /** 残り秒数（切り上げ）。制限時間なしなら null */
  seconds: number | null;
}

/**
 * 選択肢の制限時間。
 * 0になったら onTimeout を一度だけ呼ぶ。そのあと何が起きるかはシナリオの onTimeout が決める。
 *
 * @param limitSec 制限時間（秒）。null / undefined なら計測しない
 * @param key      ショットが変わったら計測し直すためのキー
 * @param active   false の間は止める（割り込み表示中・一時停止中など）
 */
export function useChoiceTimer(
  limitSec: number | null | undefined,
  key: string,
  active: boolean,
  onTimeout: () => void,
): ChoiceTimer {
  const [remainingMs, setRemainingMs] = useState<number | null>(limitSec ? limitSec * 1000 : null);
  const firedRef = useRef(false);
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
  return { ratio: remainingMs / (limitSec * 1000), seconds: Math.ceil(remainingMs / 1000) };
}
