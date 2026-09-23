import type { EpisodePrologue } from '../../types';

/**
 * 最初のタップ。
 * タイトル画面は作らないが、**状況が分からないまま選択が来ない**よう、
 * エピソードにプロローグがあればここに重ねる。読み終えてタップすると本編が始まる
 * （iOS は利用者の操作なしに音を出せないので、このタップは必要）。
 */
export function TapToStart({
  prologue,
  onStart,
}: {
  prologue?: EpisodePrologue;
  onStart: () => void;
}) {
  return (
    <button
      onClick={onStart}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/70 px-7 text-white"
      style={{
        paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {prologue && (
        <div
          className="flex flex-col gap-3 text-center"
          style={{ animation: 'novel-fade-in 600ms ease-out' }}
        >
          {prologue.lines.map((line) => (
            <p
              key={line}
              className="text-[1.05rem] leading-relaxed font-medium"
              style={{ fontFamily: 'var(--novel-font-display)' }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      <span className="flex flex-col items-center gap-2">
        <span className="flex size-16 items-center justify-center rounded-full border border-white/70 text-2xl">
          ▶
        </span>
        <span className="text-sm tracking-wide">タップして始める</span>
      </span>

      {prologue?.hint && (
        <span className="max-w-[18rem] text-center text-xs leading-relaxed text-white/70">
          {prologue.hint}
        </span>
      )}
    </button>
  );
}
