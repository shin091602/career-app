/**
 * 最初のタップ。
 * タイトル画面は作らない。1枚目の絵の上に小さな案内を出すだけで、
 * タップした瞬間に本編が始まる（iOS は利用者の操作なしに音を出せないため必要）。
 */
export function TapToStart({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/45 text-white"
    >
      <span className="flex size-16 items-center justify-center rounded-full border border-white/70 text-2xl">
        ▶
      </span>
      <span className="text-sm tracking-wide">タップして始める</span>
    </button>
  );
}
