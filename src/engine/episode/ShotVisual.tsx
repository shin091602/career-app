import { useEffect, useState, type CSSProperties, type RefObject } from 'react';
import type { PrototypeId, Shot } from '../../types';
import { assetUrl } from './assets';
import { KenBurnsImage } from './KenBurnsImage';
import { Storyboard } from './Storyboard';

/**
 * 画面上での役割
 * - active   … いま再生しているショット
 * - outgoing … 直前のショット。上に重ねたまま短く消える
 * - preload  … 次に再生されうるショット。見えないが読み込みは進める
 */
export type ShotRole = 'active' | 'outgoing' | 'preload';

interface ShotVisualProps {
  shot: Shot;
  prototypeId: PrototypeId;
  role: ShotRole;
  /** 再生中のショットの video 要素を親に渡す（active のときだけ） */
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** 動画の音を出すか（embedded かつ active のときだけ true） */
  withSound: boolean;
  elapsedSec: number;
  onEnded?: () => void;
  /** outgoing が消えるまでの時間 */
  fadeMs: number;
}

function layerStyle(role: ShotRole, fadeMs: number): CSSProperties {
  switch (role) {
    case 'active':
      return { zIndex: 1 };
    case 'outgoing':
      // active の上に重ね、消えていく
      return { zIndex: 2, opacity: 0, transition: `opacity ${fadeMs}ms ease-out`, pointerEvents: 'none' };
    case 'preload':
      // 読み込みは進めたいので display:none にしない
      return { zIndex: 0, opacity: 0, pointerEvents: 'none' };
  }
}

/**
 * 1ショットの絵。
 * 動画 → 静止画（ゆっくりズーム）→ 絵コンテ風、の順に自動で落ちるので、
 * 素材が無くても再生が止まらない。
 */
export function ShotVisual({
  shot,
  prototypeId,
  role,
  videoRef,
  withSound,
  elapsedSec,
  onEnded,
  fadeMs,
}: ShotVisualProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // ショットが変わったら失敗の記録をやり直す
  useEffect(() => {
    setVideoFailed(false);
    setImageFailed(false);
  }, [shot.id]);

  const useVideo = Boolean(shot.videoAssetId) && !videoFailed;
  const useImage = !useVideo && Boolean(shot.imageAssetId) && !imageFailed;

  if (useVideo && shot.videoAssetId) {
    return (
      <video
        ref={videoRef}
        src={assetUrl(prototypeId, shot.videoAssetId, 'mp4')}
        // iOS でインライン再生させるために必須
        playsInline
        preload="auto"
        muted={!withSound}
        onError={() => setVideoFailed(true)}
        onEnded={onEnded}
        className="absolute inset-0 size-full object-cover"
        style={layerStyle(role, fadeMs)}
      />
    );
  }

  // 静止画と絵コンテは先読み・フェードの必要がない
  if (role !== 'active') return null;

  if (useImage && shot.imageAssetId) {
    return (
      <KenBurnsImage
        src={assetUrl(prototypeId, shot.imageAssetId, 'webp')}
        durationSec={shot.durationSec}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <Storyboard shot={shot} elapsedSec={elapsedSec} />;
}
