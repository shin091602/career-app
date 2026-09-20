import type { Telop } from '../../types';

/** テロップを出しておく時間（秒） */
export const TELOP_VISIBLE_SEC = 2.6;

/**
 * 時刻と場所のテロップ（例：「9:02 ／ 港南支店 融資課」）。
 * 表示はショットの経過時間で決まるので、一時停止すれば止まる。
 */
export function TelopLayer({ telop }: { telop: Telop }) {
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
          animation: `novel-telop-in ${TELOP_VISIBLE_SEC}s ease-in-out forwards`,
        }}
      >
        {parts.join(' ／ ')}
      </div>
    </div>
  );
}
