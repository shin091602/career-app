import type { Shot } from '../../types';

/**
 * 素材が無いショットの代替表示（絵コンテ風）。
 * ショットID・尺・字幕の頭出しを実尺で流すので、
 * 素材が1本も無い段階でも「間」と全体の長さを確かめられる。
 */
export function Storyboard({ shot, elapsedSec }: { shot: Shot; elapsedSec: number }) {
  const remaining = Math.max(0, shot.durationSec - elapsedSec);
  const progress = Math.min(1, shot.durationSec === 0 ? 1 : elapsedSec / shot.durationSec);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#14161c] px-6 text-center">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #ffffff10 0 12px, transparent 12px 24px)',
        }}
      />

      <span className="relative rounded-full bg-white/15 px-3 py-1 text-[11px] tracking-wide text-white/80">
        素材未生成（絵コンテ）
      </span>
      <p className="relative text-lg font-bold break-all text-white">{shot.id}</p>
      <p className="relative text-sm text-white/70">
        {shot.videoAssetId ? `動画: ${shot.videoAssetId}` : '動画の指定なし'}
      </p>
      <p className="relative text-3xl font-bold text-white tabular-nums">
        {remaining.toFixed(1)}
        <span className="ml-1 text-base font-normal">秒</span>
      </p>

      <div className="relative h-1 w-40 overflow-hidden rounded-full bg-white/20">
        <div className="h-full bg-white/80" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
