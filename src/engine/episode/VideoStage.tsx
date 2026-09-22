import { useEffect, useRef, useState, type RefObject } from 'react';
import type { PrototypeId, Shot } from '../../types';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import { ShotVisual, type ShotRole } from './ShotVisual';

/**
 * ショットの切り替えで、直前の絵を消すまでの時間。
 * Flow の Frames to Video で始点・終点を揃えても完全には一致しないので、
 * わずかなずれをこの時間で溶かす。
 */
const CROSSFADE_MS = 180;

interface VideoStageProps {
  shot: Shot;
  /** 次に再生されうるショット。先に読み込んでおき、切り替えで黒画面を出さない */
  upcoming: Shot[];
  prototypeId: PrototypeId;
  videoRef: RefObject<HTMLVideoElement | null>;
  withSound: boolean;
  elapsedSec: number;
  onEnded: () => void;
}

/**
 * 縦画面いっぱいの映像。
 *
 * 現在・直前・次の候補を**ショットIDをキーにして**並べる。
 * 先読みしていた要素がそのまま再生側に回るので、切り替えで読み込み直しが起きない。
 * 直前のショットは上に重ねたまま短く消し、継ぎ目を目立たせない。
 */
export function VideoStage({
  shot,
  upcoming,
  prototypeId,
  videoRef,
  withSound,
  elapsedSec,
  onEnded,
}: VideoStageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [outgoing, setOutgoing] = useState<Shot | null>(null);
  const previousRef = useRef(shot);

  useEffect(() => {
    const previous = previousRef.current;
    if (previous.id === shot.id) return;
    previousRef.current = shot;
    if (reducedMotion) return;

    setOutgoing(previous);
    const timer = window.setTimeout(() => setOutgoing(null), CROSSFADE_MS + 40);
    return () => window.clearTimeout(timer);
  }, [shot, reducedMotion]);

  const layers: { shot: Shot; role: ShotRole }[] = [];
  const seen = new Set<string>();
  const push = (candidate: Shot, role: ShotRole) => {
    if (seen.has(candidate.id)) return;
    seen.add(candidate.id);
    layers.push({ shot: candidate, role });
  };
  push(shot, 'active');
  if (outgoing) push(outgoing, 'outgoing');
  for (const candidate of upcoming) push(candidate, 'preload');

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {layers.map((layer) => (
        <ShotVisual
          key={layer.shot.id}
          shot={layer.shot}
          prototypeId={prototypeId}
          role={layer.role}
          videoRef={layer.role === 'active' ? videoRef : undefined}
          withSound={layer.role === 'active' && withSound}
          elapsedSec={layer.role === 'active' ? elapsedSec : 0}
          onEnded={layer.role === 'active' ? onEnded : undefined}
          fadeMs={CROSSFADE_MS}
        />
      ))}
    </div>
  );
}
