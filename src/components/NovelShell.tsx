import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface NovelShellProps {
  /** 背景の上に浮かせるヘッダー右側の操作（バックログ・音声など） */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * ノベル画面の外枠。背景を画面いっぱいに敷くため、余白付きの AppShell は使わない。
 * セーフエリアはこの中で吸収する（戻るボタンがノッチや時刻表示に重ならないように）。
 */
export function NovelShell({ actions, children }: NovelShellProps) {
  return (
    <div className="relative mx-auto h-[100dvh] w-full max-w-[420px] overflow-hidden bg-bg">
      {children}

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3"
        style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <Link
          to="/"
          className="pointer-events-auto flex min-h-[36px] items-center rounded-full bg-black/45 px-3 text-sm text-white backdrop-blur"
        >
          ← ホーム
        </Link>
        <div className="pointer-events-auto flex gap-2">{actions}</div>
      </div>
    </div>
  );
}
