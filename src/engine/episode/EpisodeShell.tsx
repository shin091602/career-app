import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EpisodeShellProps {
  /** 右上に浮かせる操作（一時停止・字幕ログなど） */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * ショートドラマ再生画面の外枠。
 * 縦画面いっぱいに映像を出すため、余白付きの AppShell は使わない。
 * セーフエリアはこの中で吸収する。
 */
export function EpisodeShell({ actions, children }: EpisodeShellProps) {
  return (
    <div className="relative mx-auto h-[100dvh] w-full max-w-[420px] overflow-hidden bg-black">
      {children}

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3"
        style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <Link
          to="/"
          aria-label="ホームへ戻る"
          className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-black/45 text-sm text-white backdrop-blur"
        >
          ←
        </Link>
        <div className="pointer-events-auto flex gap-2">{actions}</div>
      </div>
    </div>
  );
}

/** 映像の上に浮かせる小さな丸ボタン */
export function OverlayButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-black/45 text-sm text-white backdrop-blur"
    >
      {children}
    </button>
  );
}
