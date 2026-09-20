import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'good' | 'improve' | 'danger';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-ink-muted',
  accent: 'bg-accent text-accent-ink',
  good: 'bg-surface-muted text-good',
  improve: 'bg-surface-muted text-improve',
  danger: 'bg-surface-muted text-danger',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
