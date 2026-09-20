import type { Ending, PrototypeId, Scenario, Scene } from '../../types';
import { Badge, Button, TermList } from '../../components';
import { Stage } from './Stage';
import { ParamSummary } from './ParamSummary';
import type { TransitionPhase } from './useSceneTransition';

interface EndingViewProps {
  scenario: Scenario;
  ending: Ending;
  endingScene: Scene;
  /** 答え合わせの現在位置。null ならエンディング本文を表示中 */
  debriefPosition: number | null;
  paramValues: Record<string, number>;
  prototypeId: PrototypeId;
  phase: TransitionPhase;
  canAdvance: boolean;
  onAdvance: () => void;
  onRestart: () => void;
}

/**
 * エンディングと、その後の答え合わせ（「実際の仕事ではこう動く」）。
 * 背景は残したまま、読みものとしてスクロールできるパネルを重ねる。
 */
export function EndingView({
  scenario,
  ending,
  endingScene,
  debriefPosition,
  paramValues,
  prototypeId,
  phase,
  canAdvance,
  onAdvance,
  onRestart,
}: EndingViewProps) {
  const debriefIds = ending.debriefSceneIds;
  const isDebrief = debriefPosition !== null;

  const debriefScene = isDebrief
    ? scenario.scenes.find((scene) => scene.id === debriefIds[debriefPosition])
    : undefined;
  if (isDebrief && !debriefScene) {
    throw new Error(`答え合わせの場面が見つかりません: ${debriefIds[debriefPosition]}`);
  }

  return (
    <>
      <Stage scene={endingScene} prototypeId={prototypeId} phase={phase} />
      <div className="absolute inset-0 z-20 bg-black/55" />

      <div
        className="absolute inset-0 z-30 overflow-y-auto px-4"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          fontFamily: 'var(--novel-font-body)',
        }}
      >
        <div className="space-y-4" style={{ animation: 'novel-slide-up 320ms ease-out' }}>
          {isDebrief && debriefScene ? (
            <>
              <div className="flex items-center gap-2">
                <Badge tone="good">答え合わせ</Badge>
                <span className="text-sm text-white/80 tabular-nums">
                  {debriefPosition + 1} / {debriefIds.length}
                </span>
              </div>

              <div
                className="px-4 py-3"
                style={{
                  background: 'var(--novel-card-bg)',
                  color: 'var(--c-text)',
                  borderRadius: 'var(--novel-box-radius)',
                }}
              >
                {debriefScene.speaker && (
                  <p
                    className="mb-1 text-sm font-bold"
                    style={{ color: 'var(--c-accent)', fontFamily: 'var(--novel-font-display)' }}
                  >
                    {debriefScene.speaker}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{debriefScene.text}</p>
              </div>

              <TermList terms={debriefScene.terms} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge tone="accent">エンディング</Badge>
                <span className="text-sm font-bold text-white">{ending.title}</span>
              </div>

              <div
                className="px-4 py-3"
                style={{
                  background: 'var(--novel-card-bg)',
                  color: 'var(--c-text)',
                  borderRadius: 'var(--novel-box-radius)',
                }}
              >
                {endingScene.speaker && (
                  <p
                    className="mb-1 text-sm font-bold"
                    style={{ color: 'var(--c-accent)', fontFamily: 'var(--novel-font-display)' }}
                  >
                    {endingScene.speaker}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{endingScene.text}</p>
                <p className="mt-3 text-sm text-ink-muted">{ending.summary}</p>
              </div>

              <section>
                <h2 className="mb-2 text-sm font-bold text-white">あなたの選択の積み重ね</h2>
                <ParamSummary params={scenario.params} values={paramValues} />
              </section>
            </>
          )}

          {isDebrief ? (
            canAdvance ? (
              <Button block onClick={onAdvance}>
                次へ
              </Button>
            ) : (
              <Button block variant="secondary" onClick={onRestart}>
                もう一度はじめから
              </Button>
            )
          ) : debriefIds.length > 0 ? (
            <Button block onClick={onAdvance}>
              実際の仕事ではどう動く？
            </Button>
          ) : (
            <Button block variant="secondary" onClick={onRestart}>
              もう一度はじめから
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
