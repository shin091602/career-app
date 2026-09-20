import { useEffect, useRef, useState } from 'react';
import type { PrototypeId, Scenario } from '../../types';
import { NovelShell, TermList } from '../../components';
import { useNovelState } from './useNovelState';
import { useTypewriter } from './useTypewriter';
import { useSceneTransition } from './useSceneTransition';
import { useSceneTimer } from './useSceneTimer';
import { useNovelAudio } from './useNovelAudio';
import { Stage } from './Stage';
import { TextBox } from './TextBox';
import { ChoiceList } from './ChoiceList';
import { Telop } from './Telop';
import { InterruptOverlay } from './InterruptOverlay';
import { DocumentOverlay } from './DocumentOverlay';
import { Backlog } from './Backlog';
import { EndingView } from './EndingView';

export interface NovelPlayerProps {
  scenario: Scenario;
  prototypeId: PrototypeId;
}

/** 背景の上に浮かせる小さなボタン */
function OverlayButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className="min-h-[36px] rounded-full bg-black/45 px-3 text-sm text-white backdrop-blur"
    >
      {children}
    </button>
  );
}

/**
 * ノベル再生エンジンの公開コンポーネント。
 * プロトタイプ側のページは、シナリオを渡すだけでよい。
 */
export function NovelPlayer({ scenario, prototypeId }: NovelPlayerProps) {
  const state = useNovelState(scenario, prototypeId);
  const { shown: scene, phase } = useSceneTransition(state.scene);
  const typewriter = useTypewriter(scene.text);
  const audio = useNovelAudio();

  // 割り込みと書類は場面に入るたび出し直す
  const [interruptOpen, setInterruptOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [backlogOpen, setBacklogOpen] = useState(false);

  useEffect(() => {
    setInterruptOpen(Boolean(scene.interrupt));
    setDocumentOpen(Boolean(scene.document?.autoOpen));
    setBacklogOpen(false);
  }, [scene.id, scene.interrupt, scene.document]);

  // 効果音は場面に入った一度だけ鳴らす（ミュート切り替えで鳴り直さないようにする）
  const lastSoundSceneRef = useRef<string | null>(null);
  const { playScene } = audio;
  useEffect(() => {
    if (lastSoundSceneRef.current === scene.id) return;
    lastSoundSceneRef.current = scene.id;
    playScene(scene.sound, `/assets/${prototypeId}`);
  }, [scene.id, scene.sound, prototypeId, playScene]);

  const hasChoices = Boolean(scene.choices?.length);
  const overlayOpen = interruptOpen || documentOpen || backlogOpen;

  // 制限時間は「選択肢が出ていて、割り込みなどで手が止まっていない間」だけ進む
  const timer = useSceneTimer(
    hasChoices ? scene.timeLimitSec : null,
    scene.id,
    hasChoices && typewriter.done && !overlayOpen,
    () => {
      if (scene.onTimeout) state.timeout(scene.onTimeout);
    },
  );

  // タップ1回目で全文表示、2回目で次へ
  const onTapText = () => {
    if (!typewriter.done) {
      typewriter.skip();
      return;
    }
    if (!hasChoices && state.canAdvance) state.advance();
  };

  const actions = (
    <>
      <OverlayButton onClick={() => setBacklogOpen(true)}>ログ</OverlayButton>
      <OverlayButton onClick={audio.toggleMuted}>{audio.muted ? '音 OFF' : '音 ON'}</OverlayButton>
    </>
  );

  if (state.ending) {
    return (
      <NovelShell actions={actions}>
        <EndingView
          scenario={scenario}
          ending={state.ending}
          endingScene={scene}
          debriefPosition={state.debriefPosition}
          paramValues={state.progress.params}
          prototypeId={prototypeId}
          phase={phase}
          canAdvance={state.canAdvance}
          onAdvance={state.advance}
          onRestart={state.restart}
        />
        {backlogOpen && (
          <Backlog entries={state.progress.backlog} onClose={() => setBacklogOpen(false)} />
        )}
      </NovelShell>
    );
  }

  return (
    <NovelShell actions={actions}>
      <Stage scene={scene} prototypeId={prototypeId} phase={phase} />

      {scene.telop && <Telop telop={scene.telop} sceneId={scene.id} />}

      <div className="absolute inset-x-0 bottom-0 z-30">
        {/* 自動で開かない書類は、本文を読んでから自分で開く */}
        {scene.document && !documentOpen && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setDocumentOpen(true)}
              className="min-h-[40px] w-full rounded-full bg-black/45 px-4 text-sm text-white backdrop-blur"
            >
              資料を見る：{scene.document.title}
            </button>
          </div>
        )}

        {hasChoices && typewriter.done ? (
          <ChoiceList
            choices={scene.choices ?? []}
            onPick={state.pick}
            remainingRatio={timer.ratio}
            remainingSec={timer.seconds}
          />
        ) : (
          <TextBox
            speaker={scene.speaker}
            text={typewriter.shown}
            fullText={scene.text}
            done={typewriter.done}
            onTap={onTapText}
          >
            {typewriter.done && scene.terms && scene.terms.length > 0 && (
              <div className="mt-3">
                <TermList terms={scene.terms} />
              </div>
            )}
          </TextBox>
        )}

        {/* 選択肢も次もない終端では、やり直しだけ出す */}
        {!hasChoices && !state.canAdvance && typewriter.done && (
          <div
            className="px-3 pt-2"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={state.restart}
              className="min-h-[44px] w-full rounded-full bg-black/45 px-4 text-sm text-white backdrop-blur"
            >
              もう一度はじめから
            </button>
          </div>
        )}
      </div>

      {scene.interrupt && interruptOpen && (
        <InterruptOverlay interrupt={scene.interrupt} onDismiss={() => setInterruptOpen(false)} />
      )}

      {scene.document && documentOpen && (
        <DocumentOverlay
          document={scene.document}
          prototypeId={prototypeId}
          onClose={() => setDocumentOpen(false)}
        />
      )}

      {backlogOpen && (
        <Backlog entries={state.progress.backlog} onClose={() => setBacklogOpen(false)} />
      )}
    </NovelShell>
  );
}
