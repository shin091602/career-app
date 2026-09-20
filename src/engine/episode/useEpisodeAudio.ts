import { useCallback, useEffect, useRef } from 'react';
import type { AssetId, PrototypeId, ShotSound } from '../../types';
import { usePersistentState } from '../../lib/usePersistentState';
import { assetUrl } from './assets';

/**
 * 音の扱い。
 *
 * iOS は利用者の操作なしに音を出せないので、最初のタップまで何も鳴らさない
 * （タップして始める画面がその操作にあたる）。
 *
 * - audioMode: 'embedded' … 動画に入っている音をそのまま使う
 * - audioMode: 'separate' … 無音動画に、ここでBGMと効果音を重ねる
 *
 * ゲージの音だけは素材を必要としないよう、短い電子音をその場で合成している
 * （se 素材を用意したら、ショットの sound で差し替えられる）。
 */
export interface EpisodeAudio {
  muted: boolean;
  toggleMuted: () => void;
  /** ショットに入ったときに呼ぶ */
  playShotSound: (sound: ShotSound | undefined) => void;
  /** ゲージが動いたときに呼ぶ */
  playGaugeCue: (positive: boolean) => void;
}

export function useEpisodeAudio(prototypeId: PrototypeId, enabled: boolean): EpisodeAudio {
  const [muted, setMuted] = usePersistentState<boolean>('episode:muted', false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmRef = useRef<AssetId | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next && bgmRef.current) bgmRef.current.pause();
      return next;
    });
  }, [setMuted]);

  const playShotSound = useCallback(
    (sound: ShotSound | undefined) => {
      if (!sound || muted || !enabled) return;

      if (sound.stopBgm && bgmRef.current) {
        bgmRef.current.pause();
        currentBgmRef.current = null;
      }

      if (sound.bgm && sound.bgm !== currentBgmRef.current) {
        bgmRef.current?.pause();
        const audio = new Audio(assetUrl(prototypeId, sound.bgm, 'mp3'));
        audio.loop = true;
        audio.volume = 0.35;
        // 素材が未配置でも体験を止めない
        void audio.play().catch(() => undefined);
        bgmRef.current = audio;
        currentBgmRef.current = sound.bgm;
      }

      if (sound.se) {
        const effect = new Audio(assetUrl(prototypeId, sound.se, 'mp3'));
        effect.volume = 0.7;
        void effect.play().catch(() => undefined);
      }
    },
    [muted, enabled, prototypeId],
  );

  const playGaugeCue = useCallback(
    (positive: boolean) => {
      if (muted || !enabled) return;
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        const context = (contextRef.current ??= new Ctor());
        void context.resume().catch(() => undefined);

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(positive ? 660 : 320, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          positive ? 990 : 220,
          context.currentTime + 0.12,
        );
        gain.gain.setValueAtTime(0.14, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.24);
      } catch {
        // 音が出せない環境でも体験は続ける
      }
    },
    [muted, enabled],
  );

  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
      bgmRef.current = null;
      void contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    };
  }, []);

  return { muted, toggleMuted, playShotSound, playGaugeCue };
}
