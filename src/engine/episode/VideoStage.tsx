import type { RefObject } from 'react';
import type { PrototypeId, Shot } from '../../types';
import { ShotVisual } from './ShotVisual';

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

/** 縦画面いっぱいの映像。現在のショットの裏で、次の候補を読み込んでおく */
export function VideoStage({
  shot,
  upcoming,
  prototypeId,
  videoRef,
  withSound,
  elapsedSec,
  onEnded,
}: VideoStageProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <ShotVisual
        key={shot.id}
        shot={shot}
        prototypeId={prototypeId}
        active
        videoRef={videoRef}
        withSound={withSound}
        elapsedSec={elapsedSec}
        onEnded={onEnded}
      />

      {upcoming.map((candidate) => (
        <ShotVisual
          key={`preload-${candidate.id}`}
          shot={candidate}
          prototypeId={prototypeId}
          active={false}
          withSound={false}
          elapsedSec={0}
        />
      ))}
    </div>
  );
}
