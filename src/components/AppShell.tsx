import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AppShellProps {
  title: string;
  /** 「← ホーム」を出すか */
  showBack?: boolean;
  /** タイトル下の補足 */
  subtitle?: string;
  children: ReactNode;
  /** 画面下に固定したい操作（ノベルの「次へ」など） */
  footer?: ReactNode;
}

/**
 * 全画面共通の外枠。幅375pxのスマホ縦画面を基準に、
 * 中央寄せ・左右16pxの余白・safe-area を担保する。
 */
export function AppShell({ title, subtitle, showBack, children, footer }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        {showBack && (
          <Link
            to="/"
            className="mb-1 inline-flex min-h-[32px] items-center text-sm text-ink-muted hover:underline"
          >
            ← ホーム
          </Link>
        )}
        <h1 className="text-lg font-bold leading-snug">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      {footer && (
        <div
          className="sticky bottom-0 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
