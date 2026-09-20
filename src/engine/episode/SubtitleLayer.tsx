import type { Subtitle } from '../../types';
import { TermList } from '../../components';

/**
 * 字幕。ショート動画風に大きく短く出す。
 * 背景の映像を邪魔しないよう、box ではなく縁取りで読ませる。
 */
export function SubtitleLayer({ subtitle }: { subtitle: Subtitle | null }) {
  if (!subtitle) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-2">
      <div className="mx-auto max-w-[24rem] text-center">
        {subtitle.speaker && (
          <p
            className="mb-1 text-sm font-bold"
            style={{
              color: 'var(--novel-name-ink)',
              fontFamily: 'var(--novel-font-display)',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            }}
          >
            {subtitle.speaker}
          </p>
        )}

        <p
          className="text-[1.35rem] leading-snug font-bold text-white"
          style={{
            fontFamily: 'var(--novel-font-body)',
            textShadow:
              '0 2px 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.6)',
          }}
        >
          {subtitle.text}
        </p>

        {subtitle.terms && subtitle.terms.length > 0 && (
          <div className="pointer-events-auto mt-2 text-left">
            <TermList terms={subtitle.terms} />
          </div>
        )}
      </div>
    </div>
  );
}
