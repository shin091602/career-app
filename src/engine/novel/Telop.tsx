import { useEffect, useState } from 'react';
import type { Telop as TelopData } from '../../types';

/** テロップを出しておく時間 */
const VISIBLE_MS = 2600;

/**
 * 時刻と場所のテロップ（例：「9:02 ／ 港南支店 融資課」）。
 * 場面に入った直後だけ出して、自動で消える。
 */
export function Telop({ telop, sceneId }: { telop: TelopData; sceneId: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [sceneId]);

  if (!visible) return null;

  const parts = [telop.time, telop.place].filter(Boolean);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
      style={{ top: 'calc(3.25rem + env(safe-area-inset-top, 0px))' }}
    >
      <div
        className="px-4 py-1.5 text-sm font-medium tracking-wide"
        style={{
          background: 'var(--novel-telop-bg)',
          color: 'var(--novel-telop-ink)',
          borderRadius: 'var(--novel-telop-radius)',
          fontFamily: 'var(--novel-font-display)',
          animation: 'novel-telop-in 2600ms ease-in-out forwards',
        }}
      >
        {parts.join(' ／ ')}
      </div>
    </div>
  );
}
