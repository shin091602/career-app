import type { ReactNode } from 'react';

interface TextBoxProps {
  /** 話者名。ナレーションのときは出さない */
  speaker?: string;
  /** いま表示する本文（文字送りの途中かもしれない） */
  text: string;
  /** 本文の全文。高さを先に確保して、文字送り中の画面の揺れを防ぐ */
  fullText: string;
  /** 全文が出きったか。出きっていれば送りマークを点滅させる */
  done: boolean;
  /** テキスト部分をタップしたとき */
  onTap?: () => void;
  /** 本文の下に足すもの（用語解説など） */
  children?: ReactNode;
}

/**
 * 下部の名前枠つきテキストボックス。
 * 配色・角丸・枠線・フォントはテーマのトークン（--novel-box-* / --novel-name-*）で決まる。
 */
export function TextBox({ speaker, text, fullText, done, onTap, children }: TextBoxProps) {
  return (
    <div
      className="px-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {speaker && (
        <div
          className="mb-[-1px] inline-block px-3 py-1 text-sm font-bold"
          style={{
            background: 'var(--novel-name-bg)',
            color: 'var(--novel-name-ink)',
            borderRadius: 'var(--novel-name-radius)',
            fontFamily: 'var(--novel-font-display)',
          }}
        >
          {speaker}
        </div>
      )}

      <div
        className="relative w-full px-4 py-3 text-left"
        style={{
          background: 'var(--novel-box-bg)',
          color: 'var(--novel-box-ink)',
          borderRadius: 'var(--novel-box-radius)',
          borderWidth: 'var(--novel-box-border-width)',
          borderStyle: 'solid',
          borderColor: 'var(--novel-box-border)',
          boxShadow: 'var(--novel-box-shadow)',
          fontFamily: 'var(--novel-font-body)',
        }}
        onClick={onTap}
        role={onTap ? 'button' : undefined}
        tabIndex={onTap ? 0 : undefined}
        aria-label={onTap ? (done ? '次へ進む' : '本文をすべて表示する') : undefined}
        onKeyDown={(event) => {
          if (!onTap) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTap();
          }
        }}
      >
        {/* 文字送りで高さが変わって画面が揺れないよう、全文ぶんの領域を先に確保する */}
        <div className="grid">
          <p
            aria-hidden
            className="invisible col-start-1 row-start-1 whitespace-pre-wrap text-base leading-relaxed"
          >
            {fullText}
          </p>
          <p className="col-start-1 row-start-1 whitespace-pre-wrap text-base leading-relaxed">
            {text}
          </p>
        </div>

        {done && onTap && (
          <span
            aria-hidden
            className="absolute right-3 bottom-2 text-xs"
            style={{ animation: 'novel-blink 1.2s ease-in-out infinite' }}
          >
            ▼
          </span>
        )}

        {children}
      </div>
    </div>
  );
}
