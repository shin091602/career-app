import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';

/** 1文字あたりの表示間隔（ミリ秒） */
const CHAR_INTERVAL_MS = 30;

export interface Typewriter {
  /** いま画面に出ている分 */
  shown: string;
  /** 全文が出きったか */
  done: boolean;
  /** 残りを一気に表示する */
  skip: () => void;
}

/**
 * 文字送り。
 * タップ1回目で skip（全文表示）、2回目で次へ、という操作を呼び出し側で組む。
 * 動きを控える設定のときは最初から全文を出す。
 */
export function useTypewriter(text: string): Typewriter {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduced) {
      setCount(text.length);
      return;
    }

    setCount(0);
    timer.current = setInterval(() => {
      setCount((prev) => {
        if (prev >= text.length) {
          if (timer.current) clearInterval(timer.current);
          return prev;
        }
        return prev + 1;
      });
    }, CHAR_INTERVAL_MS);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [text, reduced]);

  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    skip: () => setCount(text.length),
  };
}
