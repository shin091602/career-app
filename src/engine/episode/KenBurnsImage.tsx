import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';

interface KenBurnsImageProps {
  src: string;
  /** ショットの尺。この時間をかけてゆっくり寄る */
  durationSec: number;
  onError: () => void;
}

/**
 * 動画が無いショットの代替。静止画をゆっくりズームして、止め絵に見えないようにする。
 * 動きを控える設定のときはズームしない。
 */
export function KenBurnsImage({ src, durationSec, onError }: KenBurnsImageProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <img
      src={src}
      alt=""
      onError={onError}
      className="absolute inset-0 size-full object-cover"
      style={
        reduced
          ? undefined
          : { animation: `ken-burns ${Math.max(durationSec, 1)}s ease-out forwards` }
      }
    />
  );
}
