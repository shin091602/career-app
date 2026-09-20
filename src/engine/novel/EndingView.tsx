import type { Ending, PrototypeId, Scenario, Scene } from '../../types';
import { Badge, Button, Card, TermList } from '../../components';
import { SceneView } from './SceneView';
import { ParamSummary } from './ParamSummary';

interface EndingViewProps {
  scenario: Scenario;
  ending: Ending;
  endingScene: Scene;
  /** 答え合わせの現在位置。null ならエンディング本文を表示中 */
  debriefPosition: number | null;
  paramValues: Record<string, number>;
  prototypeId: PrototypeId;
  canAdvance: boolean;
  onAdvance: () => void;
  onRestart: () => void;
}

/**
 * エンディングと、その後の答え合わせ（「実際の仕事ではこう動く」）。
 * 体験の締めなので、選択の結果を振り返ってから現実の業務と突き合わせる流れにする。
 */
export function EndingView({
  scenario,
  ending,
  endingScene,
  debriefPosition,
  paramValues,
  prototypeId,
  canAdvance,
  onAdvance,
  onRestart,
}: EndingViewProps) {
  const debriefIds = ending.debriefSceneIds;

  if (debriefPosition === null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone="accent">エンディング</Badge>
          <span className="text-sm font-bold">{ending.title}</span>
        </div>

        <SceneView scene={endingScene} prototypeId={prototypeId} />

        <Card>
          <p className="text-sm">{ending.summary}</p>
        </Card>

        <section>
          <h2 className="mb-2 text-sm font-bold">あなたの選択の積み重ね</h2>
          <ParamSummary params={scenario.params} values={paramValues} />
        </section>

        {debriefIds.length > 0 ? (
          <Button block onClick={onAdvance}>
            実際の仕事ではどう動く？
          </Button>
        ) : (
          <Button block variant="secondary" onClick={onRestart}>
            もう一度はじめから
          </Button>
        )}
      </div>
    );
  }

  const debriefSceneId = debriefIds[debriefPosition];
  const debriefScene = scenario.scenes.find((scene) => scene.id === debriefSceneId);
  if (!debriefScene) throw new Error(`答え合わせの場面が見つかりません: ${debriefSceneId}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone="good">答え合わせ</Badge>
        <span className="text-sm text-ink-muted">
          {debriefPosition + 1} / {debriefIds.length}
        </span>
      </div>

      <Card>
        {debriefScene.speaker && (
          <p className="mb-1 text-sm font-bold text-accent">{debriefScene.speaker}</p>
        )}
        <p className="whitespace-pre-wrap leading-relaxed">{debriefScene.text}</p>
      </Card>

      <TermList terms={debriefScene.terms} />

      {canAdvance ? (
        <Button block onClick={onAdvance}>
          次へ
        </Button>
      ) : (
        <Button block variant="secondary" onClick={onRestart}>
          もう一度はじめから
        </Button>
      )}
    </div>
  );
}
