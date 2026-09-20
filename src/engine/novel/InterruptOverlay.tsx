import type { Interrupt } from '../../types';

interface InterruptOverlayProps {
  interrupt: Interrupt;
  onDismiss: () => void;
}

const KIND_LABEL = {
  chat: 'チャット',
  mail: 'メール',
  call: '着信',
} as const;

const DEFAULT_DISMISS = {
  chat: '読んだ',
  mail: '閉じる',
  call: '出る',
} as const;

/**
 * 上司や顧客からの割り込み（チャット・メール・電話）。
 * 業務中に横から要求が入る感じを出すため、本文より前に前面で表示する。
 */
export function InterruptOverlay({ interrupt, onDismiss }: InterruptOverlayProps) {
  const isCall = interrupt.kind === 'call';

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-[340px] overflow-hidden"
        style={{
          background: 'var(--novel-card-bg)',
          color: 'var(--c-text)',
          borderRadius: 'var(--novel-box-radius)',
          borderWidth: 'var(--novel-box-border-width)',
          borderStyle: 'solid',
          borderColor: 'var(--novel-box-border)',
          fontFamily: 'var(--novel-font-body)',
          animation: 'novel-zoom-in 240ms ease-out',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 text-xs font-bold"
          style={{ background: 'var(--c-accent)', color: 'var(--c-accent-text)' }}
        >
          <span>{KIND_LABEL[interrupt.kind]}</span>
          <span>{interrupt.from}</span>
        </div>

        <div className="px-4 py-3">
          {interrupt.subject && <p className="mb-1 text-sm font-bold">{interrupt.subject}</p>}

          {isCall ? (
            <>
              <p className="text-sm text-ink-muted">着信中…</p>
              <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed">
                {interrupt.body}
              </p>
            </>
          ) : (
            <p className="whitespace-pre-wrap text-base leading-relaxed">{interrupt.body}</p>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onDismiss}
            className="min-h-[44px] w-full text-base font-medium transition-opacity active:opacity-70"
            style={{
              background: 'var(--c-accent)',
              color: 'var(--c-accent-text)',
              borderRadius: 'var(--novel-choice-radius)',
            }}
          >
            {interrupt.dismissLabel ?? DEFAULT_DISMISS[interrupt.kind]}
          </button>
        </div>
      </div>
    </div>
  );
}
