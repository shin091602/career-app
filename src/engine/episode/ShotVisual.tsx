import { useEffect, useState, type RefObject } from 'react';
import type { PrototypeId, Shot } from '../../types';
import { assetUrl } from './assets';
import { KenBurnsImage } from './KenBurnsImage';
import { Storyboard } from './Storyboard';

interface ShotVisualProps {
  shot: Shot;
  prototypeId: PrototypeId;
  /** いま画面に出ているショットか。false のときは先読みのためだけに存在する */
  active: boolean;
  /** 再生中のショットの video 要素を親に渡す（現在のショットのときだけ） */
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** 動画の音を出すか（embedded のときだけ true） */
  withSound: boolean;
  elapsedSec: number;
  onEnded?: () => void;
}

/**
 * 1ショットの絵。
 * 動画 → 静止画（ゆっくりズーム）→ 絵コンテ風、の順に自動で落ちるので、
 * 素材が無くても再生が止まらない。
 */
export function ShotVisual({
  shot,
  prototypeId,
  active,
  videoRef,
  withSound,
  elapsedSec,
  onEnded,
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
        ref={active ? videoRef : undefined}
        src={assetUrl(prototypeId, shot.videoAssetId, 'mp4')}
        // iOS でインライン再生させるために必須
        playsInline
        preload="auto"
        muted={!withSound}
        onError={() => setVideoFailed(true)}
        onEnded={active ? onEnded : undefined}
        className="absolute inset-0 size-full object-cover"
        // 先読み用は画面に出さないが、読み込みは進めたいので display:none にしない
        style={active ? undefined : { opacity: 0, pointerEvents: 'none' }}
      />
    );
  }

  if (!active) return null;

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
