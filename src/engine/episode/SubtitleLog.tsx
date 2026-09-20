import type { LogEntry } from './useEpisodeState';

/** これまでの字幕と、自分が選んだことを見返せる画面 */
export function SubtitleLog({ entries, onClose }: { entries: LogEntry[]; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black/85">
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <h2
          className="text-base font-bold text-white"
          style={{ fontFamily: 'var(--novel-font-display)' }}
        >
          これまでの字幕
        </h2>
        <button
          onClick={onClose}
          className="min-h-[36px] rounded-full bg-white/20 px-3 text-sm text-white"
        >
          閉じる
        </button>
      </div>

      <div
        className="flex-1 space-y-2 overflow-y-auto px-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {entries.length === 0 ? (
          <p className="text-sm text-white/70">まだ記録がありません。</p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={`${entry.shotId}-${index}`}
              className={
                entry.kind === 'choice'
                  ? 'rounded-xl border border-dashed border-white/40 px-3 py-2 text-white'
                  : 'rounded-xl bg-white/10 px-3 py-2 text-white'
              }
            >
              {entry.kind === 'choice' ? (
                <p className="text-sm">
                  <span className="opacity-70">選んだ：</span>
                  {entry.text}
                </p>
              ) : (
                <>
                  {entry.speaker && (
                    <p className="mb-0.5 text-xs font-bold" style={{ color: 'var(--c-accent)' }}>
                      {entry.speaker}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
