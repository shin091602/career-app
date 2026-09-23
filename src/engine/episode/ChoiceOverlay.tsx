import { useRef, useState } from 'react';
import type { Branch, Choice } from '../../types';

interface ChoiceOverlayProps {
  branch: Branch;
  onPick: (choice: Choice) => void;
  /** 残り時間の割合（1→0）。制限時間なしなら null */
  remainingRatio: number | null;
  remainingSec: number | null;
}

/** スワイプと判定する最小の移動量（px） */
const SWIPE_THRESHOLD = 48;

/**
 * 分岐の2択。
 * 左右に並べ、タップでも左右スワイプでも選べる。
 * ラベルは10文字以内という前提で、1行に収まる大きさにしている。
 */
export function ChoiceOverlay({
  branch,
  onPick,
  remainingRatio,
  remainingSec,
}: ChoiceOverlayProps) {
  const [left, right] = branch.choices;
  const startXRef = useRef<number | null>(null);
  const [leaning, setLeaning] = useState<'left' | 'right' | null>(null);

  const timed = remainingRatio !== null;
  const urgent = timed && remainingRatio <= 0.34;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent"
      style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      onTouchStart={(event) => {
        startXRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchMove={(event) => {
        const start = startXRef.current;
        const x = event.touches[0]?.clientX;
        if (start === null || x === undefined) return;
        const dx = x - start;
        setLeaning(Math.abs(dx) < SWIPE_THRESHOLD / 2 ? null : dx < 0 ? 'left' : 'right');
      }}
      onTouchEnd={(event) => {
        const start = startXRef.current;
        const x = event.changedTouches[0]?.clientX;
        startXRef.current = null;
        setLeaning(null);
        if (start === null || x === undefined) return;
        const dx = x - start;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        onPick(dx < 0 ? left : right);
      }}
    >
      {timed && (
        <div className="mx-4 mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-white/90">
            <span>返事を待たれている</span>
            <span className="tabular-nums">残り {Math.max(0, remainingSec ?? 0)} 秒</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full transition-[width] duration-100 ease-linear"
              style={{
                width: `${Math.max(0, Math.min(1, remainingRatio)) * 100}%`,
                background: urgent ? 'var(--c-danger)' : 'var(--c-accent)',
              }}
            />
          </div>
        </div>
      )}

      {branch.question && (
        <p
          className="mb-2 px-4 text-center text-sm font-bold text-white"
          style={{ fontFamily: 'var(--novel-font-display)', textShadow: '0 2px 8px rgba(0,0,0,.7)' }}
        >
          {branch.question}
        </p>
      )}

      <div className="flex gap-2 px-4">
        {([
          ['left', left],
          ['right', right],
        ] as const).map(([side, choice]) => (
          <button
            key={side}
            onClick={() => onPick(choice)}
            className="min-h-[64px] flex-1 px-3 py-3 text-base leading-snug font-bold transition-transform active:scale-95"
            style={{
              background: 'var(--novel-choice-bg)',
              color: 'var(--novel-choice-ink)',
              borderRadius: 'var(--novel-choice-radius)',
              borderWidth: 'var(--novel-choice-border-width)',
              borderStyle: 'solid',
              borderColor: leaning === side ? 'var(--c-accent)' : 'var(--novel-choice-border)',
              fontFamily: 'var(--novel-font-body)',
              transform: leaning === side ? 'translateY(-4px)' : undefined,
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] text-white/60">タップ、または左右にスワイプ</p>
    </div>
  );
}
