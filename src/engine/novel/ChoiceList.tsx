import type { Choice } from '../../types';

interface ChoiceListProps {
  choices: Choice[];
  onPick: (choice: Choice) => void;
  /** 制限時間の残り（0〜1）。制限時間なしの場面では null */
  remainingRatio?: number | null;
  /** 残り秒数（表示用） */
  remainingSec?: number | null;
}

/**
 * 選択肢。見た目はテーマのトークン（--novel-choice-*）で決まる。
 * 制限時間つきの場面では、上にカウントダウンバーを出す。
 */
export function ChoiceList({ choices, onPick, remainingRatio, remainingSec }: ChoiceListProps) {
  const timed = remainingRatio !== null && remainingRatio !== undefined;
  const urgent = timed && remainingRatio <= 0.34;

  return (
    <div
      className="space-y-2 px-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {timed && (
        <div className="rounded-full bg-black/45 px-3 py-2 backdrop-blur">
          <div className="mb-1 flex items-center justify-between text-xs text-white">
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

      {choices.map((choice) => (
        <button
          key={choice.label}
          onClick={() => onPick(choice)}
          className="block min-h-[44px] w-full px-4 py-2.5 text-left text-base transition-opacity active:opacity-70"
          style={{
            background: 'var(--novel-choice-bg)',
            color: 'var(--novel-choice-ink)',
            borderRadius: 'var(--novel-choice-radius)',
            borderWidth: 'var(--novel-choice-border-width)',
            borderStyle: 'solid',
            borderColor: 'var(--novel-choice-border)',
            fontFamily: 'var(--novel-font-body)',
          }}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
