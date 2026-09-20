import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetId, SceneSound } from '../../types';
import { usePersistentState } from '../../lib/usePersistentState';

/**
 * 音の再生。
 *
 * iOS は利用者の操作なしに音を鳴らせないので、**既定はミュート**にし、
 * 画面上のボタンをタップしたときにだけ有効化する。
 * 音ファイル（public/assets/<プロトタイプ>/<素材ID>.mp3）が無いうちは
 * 読み込みに失敗するだけで、体験は止まらない。
 */
export interface NovelAudio {
  muted: boolean;
  /** 利用者のタップで呼ぶ。ミュート解除と再生解禁を同時に行う */
  toggleMuted: () => void;
  /** 場面に入ったときに呼ぶ */
  playScene: (sound: SceneSound | undefined, basePath: string) => void;
}

export function useNovelAudio(): NovelAudio {
  const [muted, setMuted] = usePersistentState<boolean>('novel:muted', true);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmRef = useRef<AssetId | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      // ミュートを外した瞬間が「利用者の操作」なので、ここで再生解禁とみなす
      if (!next) setUnlocked(true);
      if (next && bgmRef.current) bgmRef.current.pause();
      return next;
    });
  }, [setMuted]);

  const playScene = useCallback(
    (sound: SceneSound | undefined, basePath: string) => {
      if (!sound || muted || !unlocked) return;

      if (sound.stopBgm && bgmRef.current) {
        bgmRef.current.pause();
        currentBgmRef.current = null;
      }

      if (sound.bgm && sound.bgm !== currentBgmRef.current) {
        bgmRef.current?.pause();
        const audio = new Audio(`${basePath}/${sound.bgm}.mp3`);
        audio.loop = true;
        audio.volume = 0.4;
        // 素材が未配置でも体験を止めない
        void audio.play().catch(() => undefined);
        bgmRef.current = audio;
        currentBgmRef.current = sound.bgm;
      }

      if (sound.se) {
        const effect = new Audio(`${basePath}/${sound.se}.mp3`);
        effect.volume = 0.7;
        void effect.play().catch(() => undefined);
      }
    },
    [muted, unlocked],
  );

  // 画面を離れるときにBGMを止める
  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
      bgmRef.current = null;
    };
  }, []);

  return { muted, toggleMuted, playScene };
}
