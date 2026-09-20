import type { SourceRef } from '../types';

interface SourceNoteProps {
  verified: boolean;
  sources: SourceRef[];
}

/**
 * 事実確認の状態と出典の表示。
 * 開発者・テスターが「どこまで裏取り済みか」をその場で判断できるようにする。
 */
export function SourceNote({ verified, sources }: SourceNoteProps) {
  return (
    <details className="rounded-xl border border-line px-3 py-2 text-xs text-ink-muted">
      <summary className="min-h-[28px] cursor-pointer list-none">
        {verified ? '事実確認済み' : '未確認（推測を含む）'}・出典 {sources.length} 件
      </summary>
      {sources.length === 0 ? (
        <p className="mt-2">出典の登録がありません。</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {sources.map((source, index) => (
            <li key={`${source.title}-${index}`}>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline"
                >
                  {source.title}
                </a>
              ) : (
                source.title
              )}
              {source.note && <span>（{source.note}）</span>}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
