import type { EndingCard, Episode, GaugeDef } from '../../types';

interface ResultCardProps {
  episode: Episode;
  ending: EndingCard;
  gauges: GaugeDef[];
  values: Record<string, number>;
  /** これまでに見た結末のID */
  collectedEndingIds: string[];
  onRestart: () => void;
}

/**
 * 結果カード（タイプ診断）と、結末の回収状況。
 * 「あと1つ見ていない結末がある」と分かると、もう一周したくなる。
 */
export function ResultCard({
  episode,
  ending,
  gauges,
  values,
  collectedEndingIds,
  onRestart,
}: ResultCardProps) {
  const total = episode.endings.length;
  const collected = episode.endings.filter((item) => collectedEndingIds.includes(item.id)).length;

  return (
    <div
      className="absolute inset-0 z-50 overflow-y-auto bg-black/85 px-5"
      style={{
        paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        fontFamily: 'var(--novel-font-body)',
      }}
    >
      <div className="space-y-4" style={{ animation: 'novel-slide-up 360ms ease-out' }}>
        <p className="text-center text-xs tracking-widest text-white/70">あなたのタイプは</p>

        <div
          className="px-5 py-5 text-center"
          style={{
            background: 'var(--novel-card-bg)',
            color: 'var(--c-text)',
            borderRadius: 'var(--novel-box-radius)',
            borderWidth: 'var(--novel-box-border-width)',
            borderStyle: 'solid',
            borderColor: 'var(--novel-box-border)',
          }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--c-accent)', fontFamily: 'var(--novel-font-display)' }}
          >
            {ending.type}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">{ending.summary}</p>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold text-white/80">選択の積み重ね</h3>
          <div className="space-y-2">
            {gauges.map((gauge) => (
              <div key={gauge.key} className="rounded-xl bg-white/10 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-white">{gauge.label}</span>
                  <span className="text-base font-bold text-white tabular-nums">
                    {values[gauge.key] ?? 0}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/70">{gauge.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white/10 px-3 py-3">
          <p className="text-sm font-bold text-white">
            エンディング {collected} / {total}
          </p>
          <ul className="mt-2 space-y-1">
            {episode.endings.map((item) => {
              const seen = collectedEndingIds.includes(item.id);
              return (
                <li key={item.id} className="text-sm text-white/85">
                  {seen ? `✓ ${item.type}` : '✗ ？？？'}
                </li>
              );
            })}
          </ul>
          {collected < total && (
            <p className="mt-2 text-[11px] text-white/70">
              別の選択をすると、違う結末が見られます。
            </p>
          )}
        </section>

        <button
          onClick={onRestart}
          className="min-h-[48px] w-full text-base font-bold"
          style={{
            background: 'var(--c-accent)',
            color: 'var(--c-accent-text)',
            borderRadius: 'var(--novel-choice-radius)',
          }}
        >
          もう一度はじめから
        </button>
      </div>
    </div>
  );
}
