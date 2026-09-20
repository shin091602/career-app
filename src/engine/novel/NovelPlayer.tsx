import type { PrototypeId, Scenario } from '../../types';
import { NovelShell, TermList } from '../../components';
import { useNovelState } from './useNovelState';
import { useTypewriter } from './useTypewriter';
import { useSceneTransition } from './useSceneTransition';
import { Stage } from './Stage';
import { TextBox } from './TextBox';
import { ChoiceList } from './ChoiceList';
import { EndingView } from './EndingView';

export interface NovelPlayerProps {
  scenario: Scenario;
  prototypeId: PrototypeId;
}

/**
 * ノベル再生エンジンの公開コンポーネント。
 * プロトタイプ側のページは、シナリオを渡すだけでよい。
 */
export function NovelPlayer({ scenario, prototypeId }: NovelPlayerProps) {
  const state = useNovelState(scenario, prototypeId);
  const { shown: scene, phase } = useSceneTransition(state.scene);
  const typewriter = useTypewriter(scene.text);

  const hasChoices = Boolean(scene.choices?.length);

  // タップ1回目で全文表示、2回目で次へ
  const onTapText = () => {
    if (!typewriter.done) {
      typewriter.skip();
      return;
    }
    if (!hasChoices && state.canAdvance) state.advance();
  };

  if (state.ending) {
    return (
      <NovelShell>
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
      </NovelShell>
    );
  }

  return (
    <NovelShell>
      <Stage scene={scene} prototypeId={prototypeId} phase={phase} />

      <div className="absolute inset-x-0 bottom-0 z-30">
        {hasChoices && typewriter.done ? (
          <ChoiceList choices={scene.choices ?? []} onPick={state.pick} />
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
    </NovelShell>
  );
}
