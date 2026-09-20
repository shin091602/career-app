import type { PrototypeId, Scenario } from '../../types';
import { Button, SourceNote } from '../../components';
import { useNovelState } from './useNovelState';
import { SceneView } from './SceneView';
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
  const { scene, ending, progress } = state;

  const canGoBack = progress.history.length > 0 || progress.debriefIndex >= 0;

  return (
    <div className="space-y-4">
      {ending ? (
        <EndingView
          scenario={scenario}
          ending={ending}
          endingScene={scene}
          debriefPosition={state.debriefPosition}
          paramValues={progress.params}
          prototypeId={prototypeId}
          canAdvance={state.canAdvance}
          onAdvance={state.advance}
          onRestart={state.restart}
        />
      ) : (
        <>
          <SceneView
            scene={scene}
            prototypeId={prototypeId}
            onTapText={state.canAdvance ? state.advance : undefined}
          />

          {scene.choices && scene.choices.length > 0 ? (
            <ChoiceList choices={scene.choices} onPick={state.pick} />
          ) : state.canAdvance ? (
            <Button block onClick={state.advance}>
              次へ
            </Button>
          ) : (
            <Button block variant="secondary" onClick={state.restart}>
              もう一度はじめから
            </Button>
          )}
        </>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="quiet" onClick={state.goBack} disabled={!canGoBack}>
          ← 一つ戻る
        </Button>
        <Button variant="quiet" onClick={state.restart}>
          最初から
        </Button>
      </div>

      <SourceNote verified={scenario.verified} sources={scenario.sources} />
    </div>
  );
}
