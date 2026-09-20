import type { ReactNode } from 'react';

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/40 bg-surface-muted p-3 text-sm text-danger"
    >
      {children}
    </div>
  );
}
