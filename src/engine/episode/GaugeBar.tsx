import { useEffect, useRef, useState } from 'react';
import type { GaugeDef } from '../../types';

interface GaugeBarProps {
  gauges: GaugeDef[];
  values: Record<string, number>;
  /** ゲージが動いたときに鳴らす音（ミュート中は何もしない） */
  onChanged?: () => void;
}

/** ゲージの表示範囲。この幅で -MAX〜+MAX を表す */
const MAX = 5;

/**
 * ゲージ（例：信頼、成果）。
 * 選択の直後に動いて、手応えを短く返す。変化がないときは静かなまま。
 */
export function GaugeBar({ gauges, values, onChanged }: GaugeBarProps) {
  const previousRef = useRef(values);
  const [flash, setFlash] = useState<Record<string, number>>({});

  useEffect(() => {
    const changed: Record<string, number> = {};
    for (const gauge of gauges) {
      const before = previousRef.current[gauge.key] ?? 0;
      const after = values[gauge.key] ?? 0;
      if (before !== after) changed[gauge.key] = after - before;
    }
    previousRef.current = values;

    if (Object.keys(changed).length === 0) return;
    setFlash(changed);
    onChanged?.();
    const timer = setTimeout(() => setFlash({}), 1400);
    return () => clearTimeout(timer);
  }, [values, gauges, onChanged]);

  if (gauges.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {gauges.map((gauge) => {
        const value = values[gauge.key] ?? 0;
        const ratio = Math.max(0, Math.min(1, (value + MAX) / (MAX * 2)));
        const delta = flash[gauge.key];

        return (
          <div key={gauge.key} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-[11px] text-white/80">
              {gauge.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${ratio * 100}%`,
                  background: delta === undefined || delta > 0 ? 'var(--c-accent)' : 'var(--c-danger)',
                }}
              />
            </div>
            {delta !== undefined && (
              <span
                className="w-7 text-[11px] font-bold tabular-nums"
                style={{
                  color: delta > 0 ? 'var(--c-accent)' : 'var(--c-danger)',
                  animation: 'novel-slide-up 320ms ease-out',
                }}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
