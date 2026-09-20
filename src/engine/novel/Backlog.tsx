import type { BacklogEntry } from './useNovelState';

interface BacklogProps {
  entries: BacklogEntry[];
  onClose: () => void;
}

/** 過去のセリフと、自分が選んだ選択肢を時系列で見返せる画面 */
export function Backlog({ entries, onClose }: BacklogProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/80">
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <h2
          className="text-base font-bold text-white"
          style={{ fontFamily: 'var(--novel-font-display)' }}
        >
          これまでの流れ
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
              key={`${entry.sceneId}-${index}`}
              className="px-3 py-2"
              style={{
                background: entry.kind === 'choice' ? 'transparent' : 'var(--novel-card-bg)',
                color: entry.kind === 'choice' ? '#ffffff' : 'var(--c-text)',
                borderRadius: 'var(--novel-box-radius)',
                borderWidth: entry.kind === 'choice' ? '1px' : '0',
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.35)',
                fontFamily: 'var(--novel-font-body)',
              }}
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
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.text}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
