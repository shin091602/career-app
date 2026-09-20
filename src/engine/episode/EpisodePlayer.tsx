import { useCallback, useEffect, useRef, useState } from 'react';
import type { Choice, Episode, PrototypeId } from '../../types';
import { audioModeOf } from '../../types';
import { useEpisodeState } from './useEpisodeState';
import { useShotClock } from './useShotClock';
import { useChoiceTimer } from './useChoiceTimer';
import { useEpisodeAudio } from './useEpisodeAudio';
import { currentSubtitle } from './subtitles';
import { EpisodeShell, OverlayButton } from './EpisodeShell';
import { VideoStage } from './VideoStage';
import { SubtitleLayer } from './SubtitleLayer';
import { SubtitleLog } from './SubtitleLog';
import { TapToStart } from './TapToStart';
import { TelopLayer, TELOP_VISIBLE_SEC } from './TelopLayer';
import { InterruptLayer } from './InterruptLayer';
import { ChoiceOverlay } from './ChoiceOverlay';
import { GaugeBar } from './GaugeBar';
import { ResultCard } from './ResultCard';

export interface EpisodePlayerProps {
  episode: Episode;
  prototypeId: PrototypeId;
}

/**
 * 分岐する縦型ショートドラマのプレイヤー。
 * プロトタイプ側のページは、エピソードを渡すだけでよい。
 */
export function EpisodePlayer({ episode, prototypeId }: EpisodePlayerProps) {
  const state = useEpisodeState(episode, prototypeId);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [interruptDone, setInterruptDone] = useState(false);

  const shot = state.shot;
  const audio = useEpisodeAudio(prototypeId, started);

  // ショットが変わったら割り込みの既読状態を戻す
  useEffect(() => {
    setInterruptDone(false);
  }, [shot.id]);

  // 割り込みと分岐が出たら再生を止める。
  // 時計の値からゲートを決め、ゲートが開いているあいだは時計も止める。
  const branchAt = shot.branch ? (shot.branch.atSec ?? shot.durationSec) : null;
  const interruptAt = shot.interrupt ? (shot.interrupt.atSec ?? 0) : null;
  const [gate, setGate] = useState<'none' | 'interrupt' | 'branch'>('none');

  const blocked = paused || logOpen || state.resultOpen || gate !== 'none';
  const running = started && !blocked;

  const elapsed = useShotClock(shot.id, shot.durationSec, running, videoRef);

  useEffect(() => {
    if (interruptAt !== null && !interruptDone && elapsed >= interruptAt) setGate('interrupt');
    else if (branchAt !== null && elapsed >= branchAt) setGate('branch');
    else setGate('none');
  }, [elapsed, interruptAt, interruptDone, branchAt]);

  const interruptOpen = gate === 'interrupt';
  const branchOpen = gate === 'branch';

  const withSound = audioModeOf(episode, shot) === 'embedded' && !audio.muted;

  // 再生・一時停止を動画に反映する
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (running) void video.play().catch(() => undefined);
    else video.pause();
  }, [running, shot.id]);

  // ショットに入ったときの音（audioMode: 'separate' 用）
  const soundedShotRef = useRef<string | null>(null);
  const { playShotSound } = audio;
  useEffect(() => {
    if (!started) return;
    if (soundedShotRef.current === shot.id) return;
    soundedShotRef.current = shot.id;
    playShotSound(shot.sound);
  }, [started, shot.id, shot.sound, playShotSound]);

  // ショットが終わったら次へ（動画が無いときもこの時計で判定する）
  const advancedRef = useRef<string | null>(null);
  useEffect(() => {
    advancedRef.current = null;
  }, [shot.id]);

  const handleEnded = useCallback(() => {
    if (advancedRef.current === shot.id) return;
    advancedRef.current = shot.id;
    state.advance();
  }, [shot.id, state]);

  useEffect(() => {
    if (!running || branchAt !== null) return;
    if (elapsed >= shot.durationSec) handleEnded();
  }, [running, elapsed, shot.durationSec, branchAt, handleEnded]);

  // 制限時間は選択肢が出ているあいだだけ進む
  const timer = useChoiceTimer(
    branchOpen ? shot.branch?.timeLimitSec : null,
    shot.id,
    branchOpen && !logOpen && !paused,
    () => {
      if (shot.branch) state.timeout(shot.branch.onTimeout);
    },
  );

  const onPick = useCallback((choice: Choice) => state.pick(choice), [state]);

  const subtitle = currentSubtitle(shot, elapsed);
  const showTelop = Boolean(shot.telop) && elapsed < TELOP_VISIBLE_SEC;
  // ゲージは選択の直後（反応ショット）にだけ出す
  const showGauge = shot.kind === 'reaction' && episode.gauges.length > 0;

  const { playGaugeCue } = audio;
  const onGaugeChanged = useCallback(() => playGaugeCue(true), [playGaugeCue]);

  return (
    <EpisodeShell
      actions={
        <>
          <OverlayButton onClick={audio.toggleMuted} label={audio.muted ? '音を出す' : '音を消す'}>
            {audio.muted ? '🔇' : '🔊'}
          </OverlayButton>
          <OverlayButton onClick={() => setPaused((prev) => !prev)} label="一時停止">
            {paused ? '▶' : '❙❙'}
          </OverlayButton>
          <OverlayButton onClick={() => setLogOpen(true)} label="字幕ログ">
            ☰
          </OverlayButton>
        </>
      }
    >
      <VideoStage
        shot={shot}
        upcoming={state.upcoming}
        prototypeId={prototypeId}
        videoRef={videoRef}
        withSound={withSound}
        elapsedSec={elapsed}
        onEnded={handleEnded}
      />

      {showTelop && shot.telop && <TelopLayer telop={shot.telop} />}

      {showGauge && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 px-4"
          style={{ top: 'calc(3.25rem + env(safe-area-inset-top, 0px))' }}
        >
          <GaugeBar
            gauges={episode.gauges}
            values={state.progress.gauges}
            onChanged={onGaugeChanged}
          />
        </div>
      )}

      {!branchOpen && <SubtitleLayer subtitle={subtitle} />}

      {branchOpen && shot.branch && (
        <ChoiceOverlay
          branch={shot.branch}
          onPick={onPick}
          remainingRatio={timer.ratio}
          remainingSec={timer.seconds}
        />
      )}

      {interruptOpen && shot.interrupt && (
        <InterruptLayer interrupt={shot.interrupt} onDismiss={() => setInterruptDone(true)} />
      )}

      {state.resultOpen && state.ending && (
        <ResultCard
          episode={episode}
          ending={state.ending}
          gauges={episode.gauges}
          values={state.progress.gauges}
          collectedEndingIds={state.collectedEndingIds}
          onRestart={state.restart}
        />
      )}

      {!started && <TapToStart onStart={() => setStarted(true)} />}

      {logOpen && <SubtitleLog entries={state.progress.log} onClose={() => setLogOpen(false)} />}
    </EpisodeShell>
  );
}
