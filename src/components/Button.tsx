import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** 横幅いっぱいに広げる */
  block?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink border-accent',
  secondary: 'bg-surface text-ink border-line',
  quiet: 'bg-transparent text-ink-muted border-transparent',
};

/** タップ領域 44px 以上を満たす基本ボタン */
export function Button({ variant = 'primary', block, className = '', ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={[
        'min-h-[44px] rounded-xl border px-4 py-2 text-base font-medium',
        'transition-opacity active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40',
        VARIANT_CLASS[variant],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
